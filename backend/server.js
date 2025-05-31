// server.js - Hauptdatei für das Backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Schemas
const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  forModel: { type: String, required: true },
  category: { type: String, required: true }, // z.B. "Charging Port", "Screen", "Battery", etc.
  externalSource: { type: String, default: null }, // 'foneday' für importierte Ersatzteile
  inStock: { type: Boolean, default: true }, // Verfügbarkeitsstatus
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const deviceSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true },
  imei2: String,
  serial: String,
  model: String,
  modelDesc: String,
  thumbnail: String,
  network: String,
  meid: String,
  warrantyStatus: String,
  technicalSupport: Boolean,
  repairCoverage: Boolean,
  replaced: Boolean,
  replacement: Boolean,
  refurbished: Boolean,
  demoUnit: Boolean,
  fmiOn: Boolean,
  lostMode: Boolean,
  usaBlockStatus: String,
  simLock: Boolean,
  region: String,
  
  // Zusätzliche Felder
  purchasePrice: { type: Number, default: 0 },
  damageDescription: { type: String, default: '' },
  parts: [{
    partNumber: String,
    price: Number
  }],
  desiredProfit: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  // Neues Feld für den tatsächlichen Verkaufspreis
  actualSellingPrice: { type: Number },
  status: { type: String, default: 'gekauft', 
    enum: ['gekauft', 'in_reparatur', 'zum_verkauf', 'verkauft'] },
  purchaseDate: { type: Date, default: Date.now },
  soldDate: Date,
  apiResponse: Object,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Synchronisierungseinstellungen Schema
const syncConfigSchema = new mongoose.Schema({
  lastSyncTime: { type: Date, default: null },
  syncEnabled: { type: Boolean, default: true },
  syncInterval: { type: String, default: '0 0 * * *' }, // Standard: Täglich um Mitternacht
  autoUpdatePrices: { type: Boolean, default: true },
  addNewParts: { type: Boolean, default: true },
  categories: [String], // Zu synchronisierende Kategorien (leer = alle)
  models: [String], // Zu synchronisierende Modelle (leer = alle)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
// Models laden
const { Part, Device, SyncConfig, Reseller, DeviceAssignment } = require('./models');


// Models exportieren, damit sie in anderen Modulen verwendet werden können
module.exports = {
  Part,
  Device,
  SyncConfig
};

// Routes einbinden
// Foneday API Route
const fonedayRoutes = require('./routes/foneday');
app.use('/api/foneday', fonedayRoutes);

// Sync Routes
const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// IMEI-Abfrage und Gerät erstellen
app.post('/api/devices/check-imei', async (req, res) => {
  try {
    const { imei } = req.body;

    if (!imei) {
      return res.status(400).json({ error: 'IMEI ist erforderlich' });
    }

    const imeiRegex = /^\d{15,17}$/;
    if (!imeiRegex.test(imei)) {
      return res.status(400).json({ error: 'Ungültiges IMEI-Format. IMEI sollte 15-17 Ziffern enthalten.' });
    }

    const apiKey = process.env.IMEI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert' });
    }

    try {
      const apiResponse = await axios.get(
        `https://alpha.imeicheck.com/api/php-api/create?key=${apiKey}&service=3&imei=${imei}`,
        { timeout: 15000, validateStatus: status => status < 500 }
      );

      if (apiResponse.status !== 200 || apiResponse.data.status !== "success" || !apiResponse.data.object) {
        console.error('IMEI-API-Fehler:', apiResponse.status, apiResponse.data);
        return res.status(400).json({ error: 'IMEI konnte nicht überprüft werden', details: apiResponse.data });
      }

      const modelData = apiResponse.data.object;
      const deviceData = {
        imei,
        imei2: modelData.imei2 || '',
        serial: modelData.serial || '',
        model: modelData.model || 'Unbekannt',
        modelDesc: modelData.modelDesc || '',
        thumbnail: modelData.thumbnail || '',
        network: modelData.network || '',
        meid: modelData.meid || '',
        warrantyStatus: modelData.warrantyStatus || 'Unbekannt',
        technicalSupport: !!modelData.technicalSupport,
        repairCoverage: !!modelData.repairCoverage,
        replaced: !!modelData.replaced,
        replacement: !!modelData.replacement,
        refurbished: !!modelData.refurbished,
        demoUnit: !!modelData.demoUnit,
        fmiOn: !!modelData.fmiOn,
        lostMode: !!modelData.lostMode,
        usaBlockStatus: modelData.usaBlockStatus || '',
        simLock: !!modelData.simLock,
        region: modelData['apple/region'] || '',
        status: 'gekauft',
        purchaseDate: new Date(),
        apiResponse: apiResponse.data
      };

      const newDevice = new Device(deviceData);
      await newDevice.save();
      res.status(201).json(newDevice);

    } catch (apiError) {
      console.error('IMEI-API-Zugriffsfehler:', apiError.message);
      return res.status(500).json({ error: 'IMEI-API nicht erreichbar. Bitte später erneut versuchen.' });
    }
  } catch (error) {
    console.error('IMEI-Abfrage Fehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der IMEI-Abfrage', message: error.message });
  }
});

// Alle Geräte abrufen
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Geräte' });
  }
});

// Gerät nach ID abrufen
app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des Geräts' });
  }
});

// Gerät aktualisieren
app.put('/api/devices/:id', async (req, res) => {
  try {
    const { purchasePrice, damageDescription, parts, desiredProfit, status, actualSellingPrice } = req.body;
    
    const device = await Device.findById(req.params.id);
    const prevDevice = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    // Felder aktualisieren
    if (purchasePrice !== undefined) device.purchasePrice = purchasePrice;
    if (damageDescription !== undefined) device.damageDescription = damageDescription;
    if (parts !== undefined) {
      // Vergleiche alte und neue Teile
      const prevParts = prevDevice ? prevDevice.parts || [] : [];
      const prevPartNumbers = prevParts.map(p => p.partNumber);
      const newPartNumbers = parts.map(p => p.partNumber);

      // Finde hinzugefügte Teile
      const addedPartNumbers = newPartNumbers.filter(pn => !prevPartNumbers.includes(pn));
      // Finde entfernte Teile
      const removedPartNumbers = prevPartNumbers.filter(pn => !newPartNumbers.includes(pn));

      // Bestand für hinzugefügte Teile reduzieren
      for (const partNumber of addedPartNumbers) {
        await Part.findOneAndUpdate(
          { partNumber },
          { $inc: { stock: -1 } }
        );
      }
      // Bestand für entfernte Teile wieder erhöhen
      for (const partNumber of removedPartNumbers) {
        await Part.findOneAndUpdate(
          { partNumber },
          { $inc: { stock: 1 } }
        );
      }

      device.parts = parts;
    }
    
    if (desiredProfit !== undefined) device.desiredProfit = desiredProfit;
    
    // Wenn der tatsächliche Verkaufspreis angegeben wird, diesen speichern
    if (actualSellingPrice !== undefined) {
      device.actualSellingPrice = actualSellingPrice;
    }
    
    if (status !== undefined) {
      device.status = status;
      if (status === 'verkauft' && !device.soldDate) {
        device.soldDate = new Date();
      }
    }
    
    // Verkaufspreis berechnen
    const partsTotal = device.parts.reduce((sum, part) => sum + part.price, 0);
    device.sellingPrice = device.purchasePrice + partsTotal + device.desiredProfit;
    
    device.updatedAt = new Date();
    await device.save();
    
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Geräts' });
  }
});

// Gerät löschen
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    res.json({ message: 'Gerät erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen des Geräts' });
  }
});

// Ersatzteile-Routen
app.post('/api/parts', async (req, res) => {
  try {
    const { partNumber, description, price, forModel, category, stock } = req.body;
    
    const existingPart = await Part.findOne({ partNumber });
    if (existingPart) {
      return res.status(400).json({ error: 'Ersatzteil mit dieser Nummer existiert bereits' });
    }
    
    const newPart = new Part({
      partNumber,
      description,
      price,
      forModel,
      category,
      stock: stock || 0 // <--- NEU
    });
    
    await newPart.save();
    res.status(201).json(newPart);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Ersatzteils' });
  }
});

app.get('/api/parts', async (req, res) => {
  try {
    const { forModel } = req.query;
    let query = {};
    
    if (forModel) {
      // Entferne Farbangaben und nicht wesentliche Details aus dem Modellnamen
      const simplifiedModel = forModel
        .replace(/\s+(Black|White|Red|Blue|Green|Yellow|Purple|Pink|Starlight|Midnight|Silver|Gold|Graphite|Sierra Blue|Alpine Green|Product RED|Pacific Blue)\s+/, ' ')
        .replace(/\s+\d+GB\s+/, ' ')
        .trim();
      
      console.log('Original model query:', forModel);
      console.log('Simplified model query:', simplifiedModel);
      
      // Verwende regulären Ausdruck mit erweiterten Optionen
      query.forModel = { 
        $regex: simplifiedModel, 
        $options: 'i' // i für case-insensitive
      };
    }
    
    console.log('MongoDB query:', query);
    const parts = await Part.find(query).sort({ partNumber: 1 });
    console.log(`Found ${parts.length} parts for query:`, query);
    res.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Ersatzteile' });
  }
});

app.get('/api/parts/:id', async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Ersatzteil nicht gefunden' });
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des Ersatzteils' });
  }
});

app.put('/api/parts/:id', async (req, res) => {
  try {
    const { partNumber, description, price, forModel, category, stock } = req.body;
    
    const part = await Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Ersatzteil nicht gefunden' });
    }
    
    // Prüfen, ob die Teilenummer geändert wird und bereits existiert
    if (partNumber !== part.partNumber) {
      const existingPart = await Part.findOne({ partNumber });
      if (existingPart) {
        return res.status(400).json({ error: 'Teilenummer existiert bereits' });
      }
    }
    
    part.partNumber = partNumber;
    part.description = description;
    part.price = price;
    part.forModel = forModel;
    if (category) part.category = category;
    if (typeof stock !== 'undefined') part.stock = Number(stock) || 0;
    part.updatedAt = new Date();
    
    await part.save();
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Ersatzteils' });
  }
});

app.delete('/api/parts/:id', async (req, res) => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Ersatzteil nicht gefunden' });
    }
    res.json({ message: 'Ersatzteil erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen des Ersatzteils' });
  }
});

// Statistik-Routen
app.get('/api/stats', async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const availableDevices = await Device.countDocuments({ status: { $ne: 'verkauft' } });
    const soldDevices = await Device.countDocuments({ status: 'verkauft' });
    
    // Aktualisiert, um den tatsächlichen Verkaufspreis zu berücksichtigen
    const totalProfit = await Device.aggregate([
      { $match: { status: 'verkauft' } },
      { 
        $group: { 
          _id: null, 
          plannedProfit: { $sum: '$desiredProfit' },
          // Wenn actualSellingPrice vorhanden, berechnen wir den tatsächlichen Gewinn
          actualProfit: { 
            $sum: { 
              $cond: [
                { $ne: ['$actualSellingPrice', null] },
                { $subtract: ['$actualSellingPrice', { $add: ['$purchasePrice', { $sum: '$parts.price' }] }] },
                '$desiredProfit'
              ]
            }
          }
        } 
      }
    ]);
    
    const stats = {
      totalDevices,
      availableDevices,
      soldDevices,
      plannedProfit: totalProfit.length > 0 ? totalProfit[0].plannedProfit : 0,
      actualProfit: totalProfit.length > 0 ? totalProfit[0].actualProfit : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});


const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes.router);

const resellerRoutes = require('./routes/reseller');
app.use('/api/reseller', resellerRoutes);

const adminResellerRoutes = require('./routes/admin-reseller');
app.use('/api/admin', adminResellerRoutes);

const { router: adminAuthRoutes } = require('./routes/admin-auth');
app.use('/api/admin-auth', adminAuthRoutes);

// Vor dem 404 Fallback hinzufügen:
app.get('/reseller*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});


// Fallback für alle anderen Routen
app.use((req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// Funktion zum Einrichten des Cron-Jobs für die Synchronisierung
const setupSyncJob = async () => {
  try {
    // Synchronisierungsskript importieren
    const { setupCronJob } = require('./scripts/foneday-sync');
    
    // Cron-Job einrichten
    await setupCronJob();
    console.log('Foneday Synchronisations-Job eingerichtet');
  } catch (error) {
    console.error('Fehler beim Einrichten des Synchronisations-Jobs:', error);
  }
};

// MongoDB verbinden und Server starten
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartphone-manager')
  .then(() => {
    console.log('MongoDB verbunden');
    
    // Synchronisations-Job einrichten
    setupSyncJob();
    
    // Server starten
    app.listen(PORT, () => {
      console.log(`Server läuft auf Port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));