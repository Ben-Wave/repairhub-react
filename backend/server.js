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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartphone-manager')
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Schemas
const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  forModel: { type: String, required: true },
  category: { type: String, required: true }, // z.B. "Charging Port", "Screen", "Battery", etc.
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
    
    // IMEI API Abfrage
    const apiKey = process.env.IMEI_API_KEY;
    const apiResponse = await axios.get(`https://api.imeicheck.com/imei?key=${apiKey}&imei=${imei}`);
    
    if (apiResponse.data.status !== 'success') {
      return res.status(400).json({ error: 'IMEI konnte nicht überprüft werden' });
    }
    
    // Gerät erstellen
    const deviceData = {
      imei,
      imei2: apiResponse.data.object.imei2,
      serial: apiResponse.data.object.serial,
      model: apiResponse.data.object.model,
      modelDesc: apiResponse.data.object.modelDesc,
      thumbnail: apiResponse.data.object.thumbnail,
      network: apiResponse.data.object.network,
      meid: apiResponse.data.object.meid,
      warrantyStatus: apiResponse.data.object.warrantyStatus,
      technicalSupport: apiResponse.data.object.technicalSupport,
      repairCoverage: apiResponse.data.object.repairCoverage,
      replaced: apiResponse.data.object.replaced,
      replacement: apiResponse.data.object.replacement,
      refurbished: apiResponse.data.object.refurbished,
      demoUnit: apiResponse.data.object.demoUnit,
      fmiOn: apiResponse.data.object.fmiOn,
      lostMode: apiResponse.data.object.lostMode,
      usaBlockStatus: apiResponse.data.object.usaBlockStatus,
      simLock: apiResponse.data.object.simLock,
      region: apiResponse.data.object['apple/region'],
      apiResponse: apiResponse.data
    };
    
    const newDevice = new Device(deviceData);
    await newDevice.save();
    
    res.status(201).json(newDevice);
  } catch (error) {
    console.error('IMEI-Abfrage Fehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der IMEI-Abfrage' });
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
      query.forModel = { $regex: forModel, $options: 'i' };
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

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});