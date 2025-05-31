// backend/routes/reseller.js
const express = require('express');
const mongoose = require('mongoose');
const { DeviceAssignment, Device } = require('../models');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Alle dem Reseller zugewiesenen Geräte abrufen
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const assignments = await DeviceAssignment.find({ 
      resellerId: req.user.id 
    })
    .populate({
      path: 'deviceId',
      select: 'imei model modelDesc thumbnail purchasePrice parts damageDescription status createdAt'
    })
    .sort({ assignedAt: -1 });

    const devicesWithDetails = assignments.map(assignment => ({
      assignmentId: assignment._id,
      device: assignment.deviceId,
      minimumPrice: assignment.minimumPrice,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      receivedAt: assignment.receivedAt,
      soldAt: assignment.soldAt,
      actualSalePrice: assignment.actualSalePrice,
      notes: assignment.notes,
      // Berechnete Felder
      totalPartsCost: assignment.deviceId.parts.reduce((sum, part) => sum + part.price, 0),
      repairDetails: assignment.deviceId.parts.map(part => ({
        partNumber: part.partNumber,
        price: part.price
      }))
    }));

    res.json(devicesWithDetails);
  } catch (error) {
    console.error('Fehler beim Abrufen der Geräte:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Geräte' });
  }
});

// Einzelnes Gerät Details abrufen
router.get('/devices/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const assignment = await DeviceAssignment.findOne({
      _id: req.params.assignmentId,
      resellerId: req.user.id
    })
    .populate('deviceId')
    .populate('resellerId', 'name company');

    if (!assignment) {
      return res.status(404).json({ error: 'Gerätezuweisung nicht gefunden' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Gerätedetails' });
  }
});

// Geräteerhalt bestätigen
router.patch('/devices/:assignmentId/confirm-receipt', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const assignment = await DeviceAssignment.findOneAndUpdate(
      {
        _id: req.params.assignmentId,
        resellerId: req.user.id,
        status: 'assigned'
      },
      {
        status: 'received',
        receivedAt: new Date(),
        notes: notes || '',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('deviceId');

    if (!assignment) {
      return res.status(404).json({ error: 'Gerätezuweisung nicht gefunden oder bereits bestätigt' });
    }

    res.json({ message: 'Geräteerhalt erfolgreich bestätigt', assignment });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Bestätigen des Geräteerhalts' });
  }
});

// Verkauf bestätigen (ERWEITERT für Gewinnberechnung)
router.patch('/devices/:assignmentId/confirm-sale', authenticateToken, async (req, res) => {
  try {
    const { actualSalePrice, notes } = req.body;

    if (!actualSalePrice || actualSalePrice < 0) {
      return res.status(400).json({ error: 'Gültiger Verkaufspreis erforderlich' });
    }

    const assignment = await DeviceAssignment.findOne({
      _id: req.params.assignmentId,
      resellerId: req.user.id,
      status: 'received'
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Gerätezuweisung nicht gefunden oder nicht im korrekten Status' });
    }

    // Prüfen ob Verkaufspreis über Mindestpreis liegt
    if (actualSalePrice < assignment.minimumPrice) {
      return res.status(400).json({ 
        error: `Verkaufspreis muss mindestens ${assignment.minimumPrice}€ betragen` 
      });
    }

    // Assignment aktualisieren
    assignment.status = 'sold';
    assignment.soldAt = new Date();
    assignment.actualSalePrice = actualSalePrice;
    assignment.notes = notes || assignment.notes;
    assignment.updatedAt = new Date();
    await assignment.save();

    // Auch das Original-Gerät als verkauft markieren
    // WICHTIG: Repairhub-Gewinn = minimumPrice (nicht actualSellingPrice!)
    await Device.findByIdAndUpdate(assignment.deviceId, {
      status: 'verkauft',
      soldDate: new Date(),
      actualSellingPrice: assignment.minimumPrice // Repairhub bekommt nur den Mindestpreis
    });

    res.json({ 
      message: 'Verkauf erfolgreich bestätigt', 
      assignment,
      repairhubProfit: assignment.minimumPrice,
      resellerProfit: actualSalePrice - assignment.minimumPrice
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Bestätigen des Verkaufs' });
  }
});

// Statistiken für Reseller
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Verwende mongoose.Types.ObjectId für korrekte Abfrage
    const resellerId = new mongoose.Types.ObjectId(req.user.id);
    
    const stats = await DeviceAssignment.aggregate([
      { $match: { resellerId: resellerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { 
            $sum: { 
              $cond: [
                { $ne: ['$actualSalePrice', null] },
                '$actualSalePrice',
                0
              ]
            }
          }
        }
      }
    ]);

    // Initialisiere alle Status-Werte
    const formattedStats = {
      assigned: 0,
      received: 0,
      sold: 0,
      returned: 0,
      totalSales: 0,
      totalRevenue: 0
    };
// Debug-Logging
    console.log('Reseller Stats for user:', req.user.id);
    console.log('Raw stats:', stats);
    console.log('Formatted stats:', formattedStats);
    // Fülle die tatsächlichen Werte
    stats.forEach(stat => {
      if (formattedStats.hasOwnProperty(stat._id)) {
        formattedStats[stat._id] = stat.count;
        if (stat._id === 'sold') {
          formattedStats.totalSales = stat.count;
          formattedStats.totalRevenue = stat.totalValue || 0;
        }
      }
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});


// Verkauf zurücknehmen
router.patch('/devices/:assignmentId/reverse-sale', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Grund für Rücknahme erforderlich (min. 10 Zeichen)' });
    }

    const assignment = await DeviceAssignment.findOne({
      _id: req.params.assignmentId,
      resellerId: req.user.id,
      status: 'sold'
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Verkaufte Gerätezuweisung nicht gefunden' });
    }

    // Assignment zurücksetzen
    assignment.status = 'received';
    assignment.soldAt = null;
    assignment.actualSalePrice = null;
    assignment.notes = `VERKAUF ZURÜCKGENOMMEN: ${reason}\n\nVorherige Notizen: ${assignment.notes || 'Keine'}`;
    assignment.updatedAt = new Date();
    await assignment.save();

    // Auch das Original-Gerät zurücksetzen
    await Device.findByIdAndUpdate(assignment.deviceId, {
      status: 'zum_verkauf',
      soldDate: null,
      actualSellingPrice: null
    });

    res.json({ message: 'Verkauf erfolgreich zurückgenommen', assignment });
  } catch (error) {
    console.error('Fehler beim Zurücknehmen des Verkaufs:', error);
    res.status(500).json({ error: 'Fehler beim Zurücknehmen des Verkaufs' });
  }
});

module.exports = router;
