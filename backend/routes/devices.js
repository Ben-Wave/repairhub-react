const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Modelle importieren
const { Device } = require('../models');

// @route   GET /api/devices
// @desc    Alle Geräte abrufen
// @access  Public
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (err) {
    console.error('Fehler beim Abrufen der Geräte:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Geräte' });
  }
});

// @route   GET /api/devices/:id
// @desc    Einzelnes Gerät abrufen
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    res.json(device);
  } catch (err) {
    console.error(`Fehler beim Abrufen des Geräts mit ID ${req.params.id}:`, err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    res.status(500).json({ error: 'Fehler beim Abrufen des Geräts' });
  }
});

// @route   POST /api/devices
// @desc    Neues Gerät erstellen
// @access  Public
router.post('/', [
  check('imei', 'IMEI ist erforderlich').not().isEmpty(),
  check('model', 'Modell ist erforderlich').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      imei, imei2, serial, model, modelDesc, thumbnail, network, meid,
      warrantyStatus, technicalSupport, repairCoverage, replaced, replacement,
      refurbished, demoUnit, fmiOn, lostMode, usaBlockStatus, simLock, region,
      purchasePrice, damageDescription, parts, desiredProfit, sellingPrice,
      status, purchaseDate, soldDate, apiResponse
    } = req.body;
    
    // Neues Gerät erstellen
    const newDevice = new Device({
      imei,
      imei2,
      serial,
      model,
      modelDesc,
      thumbnail,
      network,
      meid,
      warrantyStatus,
      technicalSupport,
      repairCoverage,
      replaced,
      replacement,
      refurbished,
      demoUnit,
      fmiOn,
      lostMode,
      usaBlockStatus,
      simLock,
      region,
      purchasePrice: purchasePrice || 0,
      damageDescription: damageDescription || '',
      parts: parts || [],
      desiredProfit: desiredProfit || 0,
      sellingPrice: sellingPrice || 0,
      status: status || 'gekauft',
      purchaseDate: purchaseDate || Date.now(),
      soldDate,
      apiResponse,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    const device = await newDevice.save();
    res.status(201).json(device);
  } catch (err) {
    console.error('Fehler beim Erstellen des Geräts:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Geräts' });
  }
});

// @route   PUT /api/devices/:id
// @desc    Gerät aktualisieren
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // Prüfen, ob das Gerät existiert
    let device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    // Wenn der Status auf "verkauft" geändert wird und actualSellingPrice vorhanden ist
    if (req.body.status === 'verkauft' && req.body.actualSellingPrice) {
      req.body.soldDate = req.body.soldDate || Date.now();
    }
    
    // Füge ein updatedAt-Feld hinzu
    req.body.updatedAt = Date.now();
    
    // Aktualisiere das Gerät
    device = await Device.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(device);
  } catch (err) {
    console.error(`Fehler beim Aktualisieren des Geräts mit ID ${req.params.id}:`, err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Geräts' });
  }
});

// @route   DELETE /api/devices/:id
// @desc    Gerät löschen
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    await device.remove();
    
    res.json({ message: 'Gerät erfolgreich gelöscht' });
  } catch (err) {
    console.error(`Fehler beim Löschen des Geräts mit ID ${req.params.id}:`, err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }
    
    res.status(500).json({ error: 'Fehler beim Löschen des Geräts' });
  }
});

module.exports = router;