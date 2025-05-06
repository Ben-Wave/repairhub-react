// server.js - Hauptdatei für das Backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const cron = require('node-cron');
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
const Part = mongoose.model('Part', partSchema);
const Device = mongoose.model('Device', deviceSchema);
const SyncConfig = mongoose.model('SyncConfig', syncConfigSchema);

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
    
    // IMEI-Format validieren (15-17 Ziffern)
    const imeiRegex = /^\d{15,17}$/;
    if (!imeiRegex.test(imei)) {
      return res.status(400).json({ error: 'Ungültiges IMEI-Format. IMEI sollte 15-17 Ziffern enthalten.' });
    }
    
    // Prüfen, ob das Gerät bereits existiert
    const existingDevice = await Device.findOne({ imei });
    if (existingDevice) {
      return res.status(400).json({ error: 'Gerät mit dieser IMEI existiert bereits' });
    }
    
    // API-Schlüssel aus Umgebungsvariablen
    const apiKey = process.env.IMEI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert' });
    }
    
    // Service ID für die IMEI-Abfrage (3 für den gewünschten Dienst)
    const serviceId = 3;
    
    // IMEI API Abfrage mit Fehlerbehandlung und Timeout
    try {
      // Neue API-URL gemäß der angegebenen Struktur
      const apiResponse = await axios.get(
        `https://alpha.imeicheck.com/api/php-api/create?key=${apiKey}&service=${serviceId}&imei=${imei}`,
        { 
          timeout: 15000, // 15 Sekunden Timeout
          validateStatus: status => status < 500 // Alle Status < 500 akzeptieren, um Fehler selbst zu behandeln
        }
      );
      
      console.log('IMEI-API-Antwort:', JSON.stringify(apiResponse.data, null, 2));
      
      // Prüfen, ob die Anfrage erfolgreich war
      if (apiResponse.status !== 200) {
        console.error('IMEI-API-Fehler:', apiResponse.status, apiResponse.data);
        
        // Fallback-Methode: Basisdaten nur mit IMEI erstellen
        const newDevice = new Device({
          imei,
          status: 'gekauft',
          purchaseDate: new Date()
        });
        
        await newDevice.save();
        return res.status(201).json({ 
          ...newDevice.toObject(), 
          warning: 'IMEI-API nicht verfügbar. Gerät mit Basisdaten erstellt. Bitte manuell aktualisieren.'
        });
      }
      
      // Erfolgs-Antwort überprüfen anhand der tatsächlichen API-Antwortstruktur
      const apiData = apiResponse.data;
      
      // Fehlerprüfung gemäß dem Format der API-Antwort
      if (apiData.status !== "success" || !apiData.object) {
        return res.status(400).json({ 
          error: 'IMEI konnte nicht überprüft werden', 
          details: apiData
        });
      }
      
      // Extrahiere Gerätedaten aus der API-Antwort - exakt gemäß dem zurückgelieferten Format
      const modelData = apiData.object;
      
      // Gerät erstellen mit den korrekten Feldern aus der API-Antwort
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
        // Die vollständige API-Antwort speichern
        apiResponse: apiData
      };
      
      const newDevice = new Device(deviceData);
      await newDevice.save();
      
      res.status(201).json(newDevice);
    } catch (apiError) {
      console.error('IMEI-API-Zugriffsfehler:', apiError.message);
      
      // Wenn die API nicht erreichbar ist, ein Basis-Gerät erstellen
      const newDevice = new Device({
        imei,
        model: 'Manuell hinzuzufügen',
        status: 'gekauft',
        purchaseDate: new Date()
      });
      
      await newDevice.save();
      
      // Gerät erstellt, aber mit Warnung zurückgeben
      res.status(201).json({ 
        ...newDevice.toObject(), 
        warning: 'IMEI-API nicht erreichbar. Gerät mit Basisdaten erstellt. Bitte manuell aktualisieren.'
      });
    }
  } catch (error) {
    console.error('IMEI-Abfrage Fehler:', error);
    res.status(500).json({ 
      error: 'Serverfehler bei der IMEI-Abfrage',
      message: error.message
    });
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
    const { purchasePrice, damageDescription, parts, desiredProfit, status } = req.body;
    
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    // Felder aktualisieren
    if (purchasePrice !== undefined) device.purchasePrice = purchasePrice;
    if (damageDescription !== undefined) device.damageDescription = damageDescription;
    if (parts !== undefined) device.parts = parts;
    if (desiredProfit !== undefined) device.desiredProfit = desiredProfit;
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
    const { partNumber, description, price, forModel, category } = req.body;
    
    const existingPart = await Part.findOne({ partNumber });
    if (existingPart) {
      return res.status(400).json({ error: 'Ersatzteil mit dieser Nummer existiert bereits' });
    }
    
    const newPart = new Part({
      partNumber,
      description,
      price,
      forModel,
      category
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
    const { partNumber, description, price, forModel, category } = req.body;
    
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
    
    const totalProfit = await Device.aggregate([
      { $match: { status: 'verkauft' } },
      { $group: { _id: null, profit: { $sum: '$desiredProfit' } } }
    ]);
    
    const stats = {
      totalDevices,
      availableDevices,
      soldDevices,
      totalProfit: totalProfit.length > 0 ? totalProfit[0].profit : 0
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
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