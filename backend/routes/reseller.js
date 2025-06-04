// backend/routes/reseller.js
const express = require('express');
const mongoose = require('mongoose');
const { DeviceAssignment, Device, Part } = require('../models'); // Part hinzugefügt
const { authenticateToken } = require('./auth');
const router = express.Router();

// Hilfsfunktion um Part-Details zu laden
const enrichPartsWithDetails = async (deviceParts) => {
  if (!deviceParts || !deviceParts.length) return [];
  
  try {
    // Alle Part-Nummern sammeln
    const partNumbers = deviceParts.map(part => part.partNumber);
    
    // Part-Details aus der Parts-Collection laden
    const partDetails = await Part.find({
      partNumber: { $in: partNumbers }
    }).select('partNumber description category forModel');
    
    // Create a map for quick lookup
    const partDetailsMap = {};
    partDetails.forEach(part => {
      partDetailsMap[part.partNumber] = part;
    });
    
    // Enriche die device parts mit den Details
    return deviceParts.map(devicePart => {
      const details = partDetailsMap[devicePart.partNumber];
      return {
        partNumber: devicePart.partNumber,
        price: devicePart.price,
        // Zusätzliche Details aus der Parts-Collection
        description: details?.description || 'Unbekannt',
        category: details?.category || 'Unbekannt',
        forModel: details?.forModel || 'Unbekannt'
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der Part-Details:', error);
    // Fallback: Originale Parts zurückgeben ohne Details
    return deviceParts.map(part => ({
      partNumber: part.partNumber,
      price: part.price,
      description: 'Unbekannt',
      category: 'Unbekannt',
      forModel: 'Unbekannt'
    }));
  }
};

// Alle dem Reseller zugewiesenen Geräte abrufen - BEREINIGT ohne entzogene Geräte
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const assignments = await DeviceAssignment.find({ 
      resellerId: req.user.id,
      // WICHTIG: Entzogene Geräte werden ausgeblendet
      status: { $ne: 'returned' }
    })
    .populate({
      path: 'deviceId',
      select: 'imei model modelDesc thumbnail purchasePrice parts damageDescription status createdAt'
    })
    .sort({ assignedAt: -1 });

    // Für jedes Gerät die Part-Details anreichern
    const devicesWithDetails = await Promise.all(
      assignments.map(async assignment => {
        const enrichedParts = await enrichPartsWithDetails(assignment.deviceId.parts);
        
        return {
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
          totalPartsCost: enrichedParts.reduce((sum, part) => sum + part.price, 0),
          repairDetails: enrichedParts // Jetzt mit Kategorie-Informationen
        };
      })
    );

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

    // Part-Details für das einzelne Gerät anreichern
    if (assignment.deviceId && assignment.deviceId.parts) {
      assignment.deviceId.parts = await enrichPartsWithDetails(assignment.deviceId.parts);
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

// Statistiken für Reseller - BEREINIGT um entzogene Geräte auszublenden
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Verwende mongoose.Types.ObjectId für korrekte Abfrage
    const resellerId = new mongoose.Types.ObjectId(req.user.id);
    
    const stats = await DeviceAssignment.aggregate([
      { 
        $match: { 
          resellerId: resellerId,
          // WICHTIG: Schließe entzogene Geräte aus den Statistiken aus
          status: { $ne: 'returned' }
        } 
      },
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

    // Initialisiere alle Status-Werte (ohne 'returned')
    const formattedStats = {
      assigned: 0,
      received: 0,
      sold: 0,
      // returned: 0, // Entfernt - wird nicht mehr angezeigt
      totalSales: 0,
      totalRevenue: 0
    };

    // Debug-Logging
    console.log('Reseller Stats for user:', req.user.id);
    console.log('Raw stats (excluding returned):', stats);
    
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

    console.log('Formatted stats (excluding returned):', formattedStats);

    res.json(formattedStats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
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