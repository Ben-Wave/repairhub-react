// server.js - Hauptdatei für das Backend mit Rollensystem
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

// Models laden
const { Part, Device, SyncConfig, Reseller, DeviceAssignment, Admin, UserRole } = require('./models');

// Auth Middleware laden
const { authenticateToken, requirePermission } = require('./routes/auth');

// Routes einbinden
// Foneday API Route
const fonedayRoutes = require('./routes/foneday');
app.use('/api/foneday', fonedayRoutes);

// Sync Routes
const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// User Management Routes
const userManagementRoutes = require('./routes/user-management');
app.use('/api/user-management', userManagementRoutes);

// Auth Routes (Reseller)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes.router);

// Admin Auth Routes
const { router: adminAuthRoutes } = require('./routes/admin-auth');
app.use('/api/admin-auth', adminAuthRoutes);

// Reseller Routes
const resellerRoutes = require('./routes/reseller');
app.use('/api/reseller', resellerRoutes);

// Admin Reseller Routes
const adminResellerRoutes = require('./routes/admin-reseller');
app.use('/api/admin', adminResellerRoutes);

// ===== GESCHÜTZTE GERÄTE-ROUTES =====

// IMEI-Abfrage und Gerät erstellen - benötigt devices.create
app.post('/api/devices/check-imei', authenticateToken, requirePermission('devices', 'create'), async (req, res) => {
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

// NEU: Vollständiges Gerät erstellen (für PurchaseGuide) - benötigt devices.create
app.post('/api/devices', authenticateToken, requirePermission('devices', 'create'), async (req, res) => {
  try {
    const deviceData = req.body;

    // Validierung der erweiterten Daten
    if (!deviceData.imei) {
      return res.status(400).json({ error: 'IMEI ist erforderlich' });
    }

    // Prüfen ob IMEI bereits existiert
    const existingDevice = await Device.findOne({ imei: deviceData.imei });
    if (existingDevice) {
      return res.status(400).json({ error: 'Gerät mit dieser IMEI existiert bereits' });
    }

    // Erweiterte Validierung für PurchaseGuide-Daten
    if (deviceData.batteryInfo?.health !== undefined) {
      if (deviceData.batteryInfo.health < 0 || deviceData.batteryInfo.health > 100) {
        return res.status(400).json({ error: 'Akkugesundheit muss zwischen 0 und 100% liegen' });
      }
    }

    if (deviceData.physicalCondition?.overallGrade) {
      const validGrades = ['A+', 'A', 'B', 'C', 'D'];
      if (!validGrades.includes(deviceData.physicalCondition.overallGrade)) {
        return res.status(400).json({ error: 'Ungültige Gesamtnote' });
      }
    }

    // Automatische Verkaufspreisberechnung
    if (deviceData.parts && deviceData.purchasePrice !== undefined && deviceData.desiredProfit !== undefined) {
      const partsTotal = deviceData.parts.reduce((sum, part) => sum + (part.price || 0), 0);
      deviceData.sellingPrice = deviceData.purchasePrice + partsTotal + deviceData.desiredProfit;
    }

    // Automatische Marktbewertung (vereinfacht)
    if (deviceData.marketValuation && deviceData.model) {
      if (!deviceData.marketValuation.estimatedMarketValue) {
        // Basis-Preise nach Modell (vereinfacht - könnte aus externer API kommen)
        const basePrices = {
          'iPhone 15': 800,
          'iPhone 14': 650,
          'iPhone 13': 500,
          'iPhone 12': 350,
          'iPhone 11': 250
        };
        
        const modelKey = Object.keys(basePrices).find(key => 
          deviceData.model.includes(key)
        );
        
        if (modelKey) {
          let basePrice = basePrices[modelKey];
          
          // Speicher-Adjustierung
          if (deviceData.model.includes('256GB')) basePrice *= 1.15;
          if (deviceData.model.includes('512GB')) basePrice *= 1.3;
          if (deviceData.model.includes('1TB')) basePrice *= 1.5;
          
          deviceData.marketValuation.estimatedMarketValue = basePrice;
        }
      }
    }

    // Standard-Status und Datum setzen falls nicht vorhanden
    if (!deviceData.status) {
      deviceData.status = 'gekauft';
    }
    
    if (!deviceData.purchaseDate) {
      deviceData.purchaseDate = new Date();
    }

    // Gerät erstellen
    const newDevice = new Device(deviceData);
    await newDevice.save();

    // Teile-Bestand aktualisieren falls Teile verwendet wurden
    if (deviceData.parts && deviceData.parts.length > 0) {
      for (const part of deviceData.parts) {
        await Part.findOneAndUpdate(
          { partNumber: part.partNumber },
          { $inc: { stock: -1 } }
        );
      }
    }

    res.status(201).json(newDevice);

  } catch (error) {
    console.error('Fehler beim Erstellen des Geräts:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Gerät mit dieser IMEI existiert bereits' });
    }
    
    res.status(500).json({ 
      error: 'Serverfehler beim Erstellen des Geräts', 
      message: error.message 
    });
  }
});

// Alle Geräte abrufen - benötigt devices.view
app.get('/api/devices', authenticateToken, requirePermission('devices', 'view'), async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Geräte' });
  }
});

// Gerät nach ID abrufen - benötigt devices.view
app.get('/api/devices/:id', authenticateToken, requirePermission('devices', 'view'), async (req, res) => {
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

// NEU: Erweiterte Geräteinformationen abrufen - benötigt devices.view
app.get('/api/devices/:id/extended', authenticateToken, requirePermission('devices', 'view'), async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Erweiterte Informationen zusammenstellen
    const extendedInfo = {
      basic: {
        imei: device.imei,
        model: device.model,
        status: device.status,
        purchasePrice: device.purchasePrice,
        sellingPrice: device.sellingPrice
      },
      battery: device.batteryInfo || {},
      functional: device.functionalStatus || {},
      physical: device.physicalCondition || {},
      software: device.softwareInfo || {},
      quality: device.qualityAssessment || {},
      market: device.marketValuation || {},
      purchase: device.purchaseInfo || {}
    };

    res.json(extendedInfo);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der erweiterten Geräteinformationen' });
  }
});

// Gerät aktualisieren - benötigt devices.edit
app.put('/api/devices/:id', authenticateToken, requirePermission('devices', 'edit'), async (req, res) => {
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

// NEU: Marktpreis-Update für Gerät - benötigt devices.edit
app.patch('/api/devices/:id/update-market-value', authenticateToken, requirePermission('devices', 'edit'), async (req, res) => {
  try {
    const { estimatedMarketValue, source } = req.body;
    
    if (!estimatedMarketValue || estimatedMarketValue <= 0) {
      return res.status(400).json({ error: 'Gültiger Marktwert erforderlich' });
    }

    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Marktbewertung aktualisieren
    if (!device.marketValuation) {
      device.marketValuation = {};
    }

    // Preishistorie speichern
    if (!device.marketValuation.priceHistory) {
      device.marketValuation.priceHistory = [];
    }

    device.marketValuation.priceHistory.push({
      date: new Date(),
      price: estimatedMarketValue,
      source: source || 'manual'
    });

    device.marketValuation.estimatedMarketValue = estimatedMarketValue;
    device.marketValuation.valuationDate = new Date();
    device.marketValuation.marketSource = source || 'manual';

    await device.save();

    res.json({
      message: 'Marktwert erfolgreich aktualisiert',
      newMarketValue: estimatedMarketValue,
      device: {
        id: device._id,
        model: device.model,
        marketValuation: device.marketValuation
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Marktwerts:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Marktwerts' });
  }
});

// NEU: Akku-Austausch Empfehlungen - benötigt devices.view
app.get('/api/devices/battery-replacement-needed', authenticateToken, requirePermission('devices', 'view'), async (req, res) => {
  try {
    const devicesNeedingBatteryReplacement = await Device.find({
      $or: [
        { 'batteryInfo.health': { $lt: 80 } },
        { 'batteryInfo.needsReplacement': true }
      ],
      status: { $ne: 'verkauft' }
    }).select('imei model batteryInfo.health physicalCondition.overallGrade purchasePrice sellingPrice');

    const recommendations = devicesNeedingBatteryReplacement.map(device => {
      // Geschätzte Kosten für Akkutausch (könnte aus Parts-Datenbank kommen)
      const batteryReplacementCost = 35; // Standardwert
      const potentialValueIncrease = 50; // Geschätzter Wertzuwachs
      
      return {
        deviceId: device._id,
        imei: device.imei,
        model: device.model,
        currentBatteryHealth: device.batteryInfo?.health || 0,
        overallGrade: device.physicalCondition?.overallGrade || 'Unknown',
        estimatedReplacementCost: batteryReplacementCost,
        potentialValueIncrease: potentialValueIncrease,
        profitPotential: potentialValueIncrease - batteryReplacementCost,
        priority: device.batteryInfo?.health < 70 ? 'high' : 'medium'
      };
    });

    // Sortiere nach Profit-Potenzial
    recommendations.sort((a, b) => b.profitPotential - a.profitPotential);

    res.json({
      total: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      totalPotentialProfit: recommendations.reduce((sum, r) => sum + r.profitPotential, 0),
      recommendations: recommendations.slice(0, 20) // Top 20
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Akku-Austausch Empfehlungen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Akku-Austausch Empfehlungen' });
  }
});

// Gerät löschen - benötigt devices.delete
app.delete('/api/devices/:id', authenticateToken, requirePermission('devices', 'delete'), async (req, res) => {
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

// ===== GESCHÜTZTE ERSATZTEILE-ROUTES =====

// Ersatzteile abrufen - benötigt parts.view
app.get('/api/parts', authenticateToken, requirePermission('parts', 'view'), async (req, res) => {
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

// NEU: Spezielle Route für Preisrechner-Daten (benötigt nur tools.priceCalculator)
app.get('/api/calculator/parts', authenticateToken, requirePermission('tools', 'priceCalculator'), async (req, res) => {
  try {
    const { forModel } = req.query;
    let query = {};
    
    if (forModel) {
      const simplifiedModel = forModel
        .replace(/\s+(Black|White|Red|Blue|Green|Yellow|Purple|Pink|Starlight|Midnight|Silver|Gold|Graphite|Sierra Blue|Alpine Green|Product RED|Pacific Blue)\s+/, ' ')
        .replace(/\s+\d+GB\s+/, ' ')
        .trim();
      
      query.forModel = { 
        $regex: simplifiedModel, 
        $options: 'i'
      };
    }
    
    const parts = await Part.find(query).sort({ partNumber: 1 });
    res.json(parts);
  } catch (error) {
    console.error('Error fetching calculator parts:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Ersatzteile für Preisrechner' });
  }
});

// Ersatzteil nach ID abrufen - benötigt parts.view
app.get('/api/parts/:id', authenticateToken, requirePermission('parts', 'view'), async (req, res) => {
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

// Ersatzteil erstellen - benötigt parts.create
app.post('/api/parts', authenticateToken, requirePermission('parts', 'create'), async (req, res) => {
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
      stock: stock || 0
    });
    
    await newPart.save();
    res.status(201).json(newPart);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Ersatzteils' });
  }
});

// Ersatzteil aktualisieren - benötigt parts.edit
app.put('/api/parts/:id', authenticateToken, requirePermission('parts', 'edit'), async (req, res) => {
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

// Ersatzteil löschen - benötigt parts.delete
app.delete('/api/parts/:id', authenticateToken, requirePermission('parts', 'delete'), async (req, res) => {
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

// ===== GESCHÜTZTE STATISTIK-ROUTES =====

// Statistik-Route - benötigt system.statistics
app.get('/api/stats', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
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
// NEU: Detaillierte Analytics für Admin Dashboard - benötigt system.statistics
app.get('/api/analytics/detailed', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
  try {
    const { dateFilter } = req.query;
    
    // Date filter logic
    let dateQuery = {};
    if (dateFilter && dateFilter !== 'all') {
      const daysAgo = {
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[dateFilter];
      
      if (daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        dateQuery.purchaseDate = { $gte: cutoffDate };
      }
    }

    // Get devices with date filter
    const devices = await Device.find(dateQuery).sort({ createdAt: -1 });
    
    // Model Analysis with aggregation
    const modelAnalysis = await Device.aggregate([
      { $match: dateQuery },
      {
        $addFields: {
          baseModel: {
            $trim: {
              input: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: { $ifNull: ["$modelDesc", "$model"] },
                          find: { $regex: "\\s+(Black|White|Red|Blue|Green|Yellow|Purple|Pink|Starlight|Midnight|Silver|Gold|Graphite|Sierra Blue|Alpine Green|Product RED|Pacific Blue)\\s+", options: "i" },
                          replacement: " "
                        }
                      },
                      find: { $regex: "\\s+\\d+GB\\s+", options: "i" },
                      replacement: " "
                    }
                  },
                  find: { $regex: "\\s+\\[.*?\\]", options: "i" },
                  replacement: ""
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$baseModel",
          totalCount: { $sum: 1 },
          soldCount: {
            $sum: { $cond: [{ $eq: ["$status", "verkauft"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                0
              ]
            }
          },
          totalProfit: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                {
                  $subtract: [
                    { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                    {
                      $add: [
                        { $ifNull: ["$purchasePrice", 0] },
                        {
                          $reduce: {
                            input: { $ifNull: ["$parts", []] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.price", 0] }] }
                          }
                        }
                      ]
                    }
                  ]
                },
                0
              ]
            }
          },
          avgPurchasePrice: { $avg: "$purchasePrice" },
          avgSellingPrice: {
            $avg: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                null
              ]
            }
          },
          avgBatteryHealth: { $avg: "$batteryInfo.health" }
        }
      },
      {
        $addFields: {
          sellRate: {
            $cond: [
              { $gt: ["$totalCount", 0] },
              { $multiply: [{ $divide: ["$soldCount", "$totalCount"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Battery Health Analysis
    const batteryAnalysis = await Device.aggregate([
      { $match: { ...dateQuery, "batteryInfo.health": { $exists: true } } },
      {
        $bucket: {
          groupBy: "$batteryInfo.health",
          boundaries: [0, 70, 80, 90, 100],
          default: "unknown",
          output: {
            count: { $sum: 1 },
            avgPurchasePrice: { $avg: "$purchasePrice" },
            models: { $addToSet: { $ifNull: ["$modelDesc", "$model"] } }
          }
        }
      }
    ]);

    // Quality Grade Analysis
    const qualityAnalysis = await Device.aggregate([
      { $match: { ...dateQuery, "physicalCondition.overallGrade": { $exists: true } } },
      {
        $group: {
          _id: "$physicalCondition.overallGrade",
          count: { $sum: 1 },
          avgSellingPrice: {
            $avg: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                null
              ]
            }
          },
          avgBatteryHealth: { $avg: "$batteryInfo.health" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Time Analysis - Sales duration
    const timeAnalysis = await Device.aggregate([
      {
        $match: {
          ...dateQuery,
          status: "verkauft",
          soldDate: { $exists: true },
          purchaseDate: { $exists: true }
        }
      },
      {
        $addFields: {
          salesDuration: {
            $divide: [
              { $subtract: ["$soldDate", "$purchaseDate"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgSalesDuration: { $avg: "$salesDuration" },
          minSalesDuration: { $min: "$salesDuration" },
          maxSalesDuration: { $max: "$salesDuration" },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    // Purchase Method Analysis
    const purchaseMethodAnalysis = await Device.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $ifNull: ["$purchaseInfo.method", "manual"] },
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                0
              ]
            }
          },
          totalProfit: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                {
                  $subtract: [
                    { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                    {
                      $add: [
                        { $ifNull: ["$purchasePrice", 0] },
                        {
                          $reduce: {
                            input: { $ifNull: ["$parts", []] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.price", 0] }] }
                          }
                        }
                      ]
                    }
                  ]
                },
                0
              ]
            }
          },
          avgBatteryHealth: { $avg: "$batteryInfo.health" }
        }
      }
    ]);

    // Overall Statistics
    const overallStats = await Device.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          soldDevices: {
            $sum: { $cond: [{ $eq: ["$status", "verkauft"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                0
              ]
            }
          },
          totalProfit: {
            $sum: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                {
                  $subtract: [
                    { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                    {
                      $add: [
                        { $ifNull: ["$purchasePrice", 0] },
                        {
                          $reduce: {
                            input: { $ifNull: ["$parts", []] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.price", 0] }] }
                          }
                        }
                      ]
                    }
                  ]
                },
                0
              ]
            }
          },
          avgPurchasePrice: { $avg: "$purchasePrice" },
          avgSellingPrice: {
            $avg: {
              $cond: [
                { $eq: ["$status", "verkauft"] },
                { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
                null
              ]
            }
          },
          avgBatteryHealth: { $avg: "$batteryInfo.health" }
        }
      }
    ]);

    const response = {
      overview: overallStats[0] || {},
      modelAnalysis: modelAnalysis,
      batteryAnalysis: batteryAnalysis,
      qualityAnalysis: qualityAnalysis,
      timeAnalysis: timeAnalysis[0] || {},
      purchaseMethodAnalysis: purchaseMethodAnalysis,
      metadata: {
        dateFilter,
        totalDevicesInFilter: devices.length,
        generatedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Fehler beim Abrufen der detaillierten Analytics:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Analytics-Daten' });
  }
});

// NEU: Profit-Trends über Zeit - benötigt system.statistics
app.get('/api/analytics/profit-trends', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'week', 'month', 'quarter'
    
    let groupBy = {};
    switch (period) {
      case 'week':
        groupBy = {
          year: { $year: "$soldDate" },
          week: { $week: "$soldDate" }
        };
        break;
      case 'quarter':
        groupBy = {
          year: { $year: "$soldDate" },
          quarter: {
            $ceil: { $divide: [{ $month: "$soldDate" }, 3] }
          }
        };
        break;
      default: // month
        groupBy = {
          year: { $year: "$soldDate" },
          month: { $month: "$soldDate" }
        };
    }

    const profitTrends = await Device.aggregate([
      {
        $match: {
          status: "verkauft",
          soldDate: { $exists: true },
          soldDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      {
        $addFields: {
          profit: {
            $subtract: [
              { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
              {
                $add: [
                  { $ifNull: ["$purchasePrice", 0] },
                  {
                    $reduce: {
                      input: { $ifNull: ["$parts", []] },
                      initialValue: 0,
                      in: { $add: ["$$value", { $ifNull: ["$$this.price", 0] }] }
                    }
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalProfit: { $sum: "$profit" },
          totalRevenue: { $sum: { $ifNull: ["$actualSellingPrice", "$sellingPrice"] } },
          devicesSold: { $sum: 1 },
          avgProfit: { $avg: "$profit" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.quarter": 1 } }
    ]);

    res.json(profitTrends);
  } catch (error) {
    console.error('Fehler beim Abrufen der Profit-Trends:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Profit-Trends' });
  }
});

// NEU: Top/Bottom Performer Geräte - benötigt system.statistics
app.get('/api/analytics/top-performers', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
  try {
    const { type = 'profit', limit = 10 } = req.query;
    
    let sortField = {};
    let addFields = {};
    
    switch (type) {
      case 'profit':
        addFields.performance = {
          $subtract: [
            { $ifNull: ["$actualSellingPrice", "$sellingPrice"] },
            {
              $add: [
                { $ifNull: ["$purchasePrice", 0] },
                {
                  $reduce: {
                    input: { $ifNull: ["$parts", []] },
                    initialValue: 0,
                    in: { $add: ["$$value", { $ifNull: ["$$this.price", 0] }] }
                  }
                }
              ]
            }
          ]
        };
        sortField.performance = -1;
        break;
      case 'revenue':
        addFields.performance = { $ifNull: ["$actualSellingPrice", "$sellingPrice"] };
        sortField.performance = -1;
        break;
      case 'speed':
        addFields.performance = {
          $divide: [
            { $subtract: ["$soldDate", "$purchaseDate"] },
            1000 * 60 * 60 * 24 // Days
          ]
        };
        sortField.performance = 1; // Ascending for fastest sales
        break;
    }

    const performers = await Device.aggregate([
      {
        $match: {
          status: "verkauft",
          soldDate: { $exists: true }
        }
      },
      { $addFields: addFields },
      { $sort: sortField },
      { $limit: parseInt(limit) },
      {
        $project: {
          imei: 1,
          model: 1,
          modelDesc: 1,
          purchasePrice: 1,
          sellingPrice: 1,
          actualSellingPrice: 1,
          soldDate: 1,
          purchaseDate: 1,
          performance: 1,
          batteryInfo: 1,
          physicalCondition: 1
        }
      }
    ]);

    res.json({
      type,
      limit: parseInt(limit),
      performers
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Top Performer:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Top Performer' });
  }
});
// NEU: Geräte-Statistiken nach Ankaufsmethode - benötigt system.statistics
app.get('/api/stats/purchase-methods', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
  try {
    const stats = await Device.aggregate([
      {
        $group: {
          _id: '$purchaseInfo.method',
          count: { $sum: 1 },
          avgPurchasePrice: { $avg: '$purchasePrice' },
          avgSellingPrice: { $avg: '$sellingPrice' },
          avgBatteryHealth: { $avg: '$batteryInfo.health' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Zusätzliche Statistiken
    const guidedPurchases = await Device.countDocuments({ 'purchaseInfo.method': 'guided' });
    const manualPurchases = await Device.countDocuments({ 'purchaseInfo.method': 'manual' });
    const totalDevices = await Device.countDocuments();

    const summary = {
      byMethod: stats,
      summary: {
        totalDevices,
        guidedPurchases,
        manualPurchases,
        guidedPercentage: totalDevices > 0 ? (guidedPurchases / totalDevices * 100).toFixed(1) : 0
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Fehler beim Abrufen der Ankaufs-Statistiken:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Ankaufs-Statistiken' });
  }
});

// NEU: Qualitäts-Trends abrufen - benötigt system.statistics
app.get('/api/stats/quality-trends', authenticateToken, requirePermission('system', 'statistics'), async (req, res) => {
  try {
    const qualityStats = await Device.aggregate([
      {
        $match: {
          'physicalCondition.overallGrade': { $exists: true },
          'batteryInfo.health': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$physicalCondition.overallGrade',
          count: { $sum: 1 },
          avgBatteryHealth: { $avg: '$batteryInfo.health' },
          avgPurchasePrice: { $avg: '$purchasePrice' },
          avgSellingPrice: { $avg: '$sellingPrice' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Akkugesundheits-Verteilung
    const batteryDistribution = await Device.aggregate([
      {
        $match: { 'batteryInfo.health': { $exists: true } }
      },
      {
        $bucket: {
          groupBy: '$batteryInfo.health',
          boundaries: [0, 70, 80, 85, 90, 95, 100],
          default: 'unknown',
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: '$purchasePrice' }
          }
        }
      }
    ]);

    res.json({
      qualityGrades: qualityStats,
      batteryDistribution,
      insights: {
        totalWithQualityData: qualityStats.reduce((sum, item) => sum + item.count, 0),
        mostCommonGrade: qualityStats.length > 0 ? qualityStats.reduce((prev, current) => 
          current.count > prev.count ? current : prev
        ) : null
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Qualitäts-Trends:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Qualitäts-Trends' });
  }
});

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