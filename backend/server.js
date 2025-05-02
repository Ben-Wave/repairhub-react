// server.js - Hauptdatei für das Backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden',process.env.MONGODB_URI))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Schemas
const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  forModel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
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
  orderId: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Part = mongoose.model('Part', partSchema);
const Device = mongoose.model('Device', deviceSchema);

// Routes

// IMEI-Abfrage und Gerät erstellen
app.post('/api/devices/check-imei', async (req, res) => {
  try {
    const { imei } = req.body;
    
    if (!imei) {
      return res.status(400).json({ error: 'IMEI ist erforderlich' });
    }
    
    // Prüfen, ob das Gerät bereits existiert
    const existingDevice = await Device.findOne({ imei });
    if (existingDevice) {
      return res.status(400).json({ error: 'Gerät mit dieser IMEI existiert bereits' });
    }
    
    // IMEI API Abfrage mit DHRU API (Service ID 3 - Apple FULL INFO [No Carrier])
    const apiKey = process.env.IMEI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert. Bitte IMEI_API_KEY in .env-Datei hinzufügen.' });
    }
    const serviceId = 3; // Apple FULL INFO [No Carrier]
    
    const apiUrl = `https://alpha.imeicheck.com/api/php-api/create?key=${apiKey}&service=${serviceId}&imei=${imei}`;
    const apiResponse = await axios.get(apiUrl);
    
    console.log('API Response:', apiResponse.data);
    
    if (apiResponse.data.status !== 'success') {
      return res.status(400).json({ 
        error: 'IMEI konnte nicht überprüft werden', 
        details: apiResponse.data.message || 'Unbekannter Fehler' 
      });
    }
    
    // Extrahieren der Gerätedaten aus der API-Antwort
    const responseObject = apiResponse.data.object || {};
    
    // Gerät erstellen
    const deviceData = {
      imei,
      imei2: responseObject.imei2,
      serial: responseObject.serial,
      model: responseObject.model,
      modelDesc: responseObject.modelDesc,
      thumbnail: responseObject.thumbnail,
      network: responseObject.network,
      meid: responseObject.meid,
      warrantyStatus: responseObject.warrantyStatus,
      technicalSupport: responseObject.technicalSupport,
      repairCoverage: responseObject.repairCoverage,
      replaced: responseObject.replaced,
      replacement: responseObject.replacement,
      refurbished: responseObject.refurbished,
      demoUnit: responseObject.demoUnit,
      fmiOn: responseObject.fmiOn,
      lostMode: responseObject.lostMode,
      usaBlockStatus: responseObject.usaBlockStatus,
      simLock: responseObject.simLock,
      region: responseObject['apple/region'],
      apiResponse: apiResponse.data,
      orderId: apiResponse.data.orderId
    };
    
    const newDevice = new Device(deviceData);
    await newDevice.save();
    
    res.status(201).json(newDevice);
  } catch (error) {
    console.error('IMEI-Abfrage Fehler:', error);
    res.status(500).json({ 
      error: 'Serverfehler bei der IMEI-Abfrage',
      details: error.message 
    });
  }
});

// Aktualisieren eines Geräts durch erneuten API-Check
app.post('/api/devices/:id/refresh', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    // Wenn eine orderId vorhanden ist, den Status der Bestellung überprüfen
    if (device.orderId) {
      const apiKey = process.env.IMEI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert. Bitte IMEI_API_KEY in .env-Datei hinzufügen.' });
      }
      const historyUrl = `https://alpha.imeicheck.com/api/php-api/history?key=${apiKey}&orderId=${device.orderId}`;
      
      const apiResponse = await axios.get(historyUrl);
      
      if (apiResponse.data.status === 'success') {
        // Aktualisieren der Gerätedaten mit den neuesten Informationen
        const responseObject = apiResponse.data.object || {};
        
        // Felder aktualisieren
        device.imei2 = responseObject.imei2 || device.imei2;
        device.serial = responseObject.serial || device.serial;
        device.model = responseObject.model || device.model;
        device.modelDesc = responseObject.modelDesc || device.modelDesc;
        device.thumbnail = responseObject.thumbnail || device.thumbnail;
        device.network = responseObject.network || device.network;
        device.meid = responseObject.meid || device.meid;
        device.warrantyStatus = responseObject.warrantyStatus || device.warrantyStatus;
        device.technicalSupport = responseObject.technicalSupport ?? device.technicalSupport;
        device.repairCoverage = responseObject.repairCoverage ?? device.repairCoverage;
        device.replaced = responseObject.replaced ?? device.replaced;
        device.replacement = responseObject.replacement ?? device.replacement;
        device.refurbished = responseObject.refurbished ?? device.refurbished;
        device.demoUnit = responseObject.demoUnit ?? device.demoUnit;
        device.fmiOn = responseObject.fmiOn ?? device.fmiOn;
        device.lostMode = responseObject.lostMode ?? device.lostMode;
        device.usaBlockStatus = responseObject.usaBlockStatus || device.usaBlockStatus;
        device.simLock = responseObject.simLock ?? device.simLock;
        device.region = responseObject['apple/region'] || device.region;
        
        device.apiResponse = apiResponse.data;
        device.updatedAt = new Date();
        
        await device.save();
        
        return res.json(device);
      } else {
        return res.status(400).json({ 
          error: 'Fehler beim Aktualisieren des Geräts', 
          details: apiResponse.data.message || 'Status ist nicht erfolgreich' 
        });
      }
    } else {
      // Wenn keine orderId vorhanden ist, eine neue Anfrage senden
      const apiKey = process.env.IMEI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert. Bitte IMEI_API_KEY in .env-Datei hinzufügen.' });
      }
      const serviceId = 3; // Apple FULL INFO [No Carrier]
      
      const apiUrl = `https://alpha.imeicheck.com/api/php-api/create?key=${apiKey}&service=${serviceId}&imei=${device.imei}`;
      const apiResponse = await axios.get(apiUrl);
      
      if (apiResponse.data.status === 'success') {
        const responseObject = apiResponse.data.object || {};
        
        // Felder aktualisieren
        device.imei2 = responseObject.imei2 || device.imei2;
        device.serial = responseObject.serial || device.serial;
        device.model = responseObject.model || device.model;
        device.modelDesc = responseObject.modelDesc || device.modelDesc;
        device.thumbnail = responseObject.thumbnail || device.thumbnail;
        device.network = responseObject.network || device.network;
        device.meid = responseObject.meid || device.meid;
        device.warrantyStatus = responseObject.warrantyStatus || device.warrantyStatus;
        device.technicalSupport = responseObject.technicalSupport ?? device.technicalSupport;
        device.repairCoverage = responseObject.repairCoverage ?? device.repairCoverage;
        device.replaced = responseObject.replaced ?? device.replaced;
        device.replacement = responseObject.replacement ?? device.replacement;
        device.refurbished = responseObject.refurbished ?? device.refurbished;
        device.demoUnit = responseObject.demoUnit ?? device.demoUnit;
        device.fmiOn = responseObject.fmiOn ?? device.fmiOn;
        device.lostMode = responseObject.lostMode ?? device.lostMode;
        device.usaBlockStatus = responseObject.usaBlockStatus || device.usaBlockStatus;
        device.simLock = responseObject.simLock ?? device.simLock;
        device.region = responseObject['apple/region'] || device.region;
        
        device.apiResponse = apiResponse.data;
        device.orderId = apiResponse.data.orderId;
        device.updatedAt = new Date();
        
        await device.save();
        
        return res.json(device);
      } else {
        return res.status(400).json({ 
          error: 'Fehler beim Aktualisieren des Geräts', 
          details: apiResponse.data.message || 'Status ist nicht erfolgreich' 
        });
      }
    }
  } catch (error) {
    console.error('Geräteaktualisierung Fehler:', error);
    res.status(500).json({ 
      error: 'Serverfehler bei der Geräteaktualisierung',
      details: error.message 
    });
  }
});

// Route für den Kontostand
app.get('/api/account/balance', async (req, res) => {
  try {
    const apiKey = process.env.IMEI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API-Schlüssel nicht konfiguriert. Bitte IMEI_API_KEY in .env-Datei hinzufügen.' });
    }
    const balanceUrl = `https://alpha.imeicheck.com/api/php-api/balance?key=${apiKey}`;
    
    const apiResponse = await axios.get(balanceUrl);
    
    if (apiResponse.data.status === 'success') {
      return res.json({
        balance: apiResponse.data.balance,
        currency: apiResponse.data.currency
      });
    } else {
      return res.status(400).json({ 
        error: 'Fehler beim Abrufen des Kontostands', 
        details: apiResponse.data.message || 'Status ist nicht erfolgreich' 
      });
    }
  } catch (error) {
    console.error('Kontostand-Abfrage Fehler:', error);
    res.status(500).json({ 
      error: 'Serverfehler bei der Kontostand-Abfrage',
      details: error.message 
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
    const { partNumber, description, price, forModel } = req.body;
    
    const existingPart = await Part.findOne({ partNumber });
    if (existingPart) {
      return res.status(400).json({ error: 'Ersatzteil mit dieser Nummer existiert bereits' });
    }
    
    const newPart = new Part({
      partNumber,
      description,
      price,
      forModel
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
      // Flexiblere Suche mit Teilen des Modellnamens
      query.forModel = { 
        $regex: forModel.split(/[\s,-]+/).join('|'), 
        $options: 'i' 
      };
    }
    
    const parts = await Part.find(query).sort({ partNumber: 1 });
    res.json(parts);
  } catch (error) {
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

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});