// backend/routes/admin-reseller.js - ERWEITERT mit E-Mail-Benachrichtigungen
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Reseller, DeviceAssignment, Device, InviteToken, Admin } = require('../models');
const emailService = require('../services/emailService');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

// Gerät einem Reseller zuweisen (ERWEITERT mit E-Mail-Benachrichtigung)
router.post('/assign-device', adminAuth, async (req, res) => {
  try {
    const { deviceId, resellerId, minimumPrice } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    if (device.status === 'verkauft') {
      return res.status(400).json({ error: 'Gerät bereits verkauft' });
    }

    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }
    
    if (!reseller.isActive) {
      return res.status(400).json({ error: 'Reseller ist nicht aktiv und kann keine Geräte erhalten' });
    }

    const existingAssignment = await DeviceAssignment.findOne({ 
      deviceId, 
      status: { $ne: 'returned' } 
    });
    if (existingAssignment) {
      return res.status(400).json({ error: 'Gerät bereits einem Reseller zugewiesen' });
    }

    // Assignment erstellen
    const assignment = new DeviceAssignment({
      deviceId,
      resellerId,
      minimumPrice
    });

    await assignment.save();

    // Device Status aktualisieren
    device.status = 'zum_verkauf';
    await device.save();

    // Admin-Informationen für E-Mail abrufen
    const admin = await Admin.findById(req.admin._id).select('name username');
    const adminName = admin ? (admin.name || admin.username) : 'RepairHub Admin';

    // NEU: E-Mail an Reseller senden
    console.log('📧 Sende Gerätezuweisung-E-Mail an Reseller...');
    try {
      const emailResult = await emailService.sendDeviceAssignmentNotification(
        reseller, 
        device, 
        assignment, 
        adminName
      );
      
      if (emailResult.success) {
        console.log('✅ Gerätezuweisung-E-Mail erfolgreich gesendet');
      } else {
        console.error('❌ Fehler beim Senden der Gerätezuweisung-E-Mail:', emailResult.error);
        // E-Mail-Fehler loggen, aber Assignment nicht rückgängig machen
      }
    } catch (emailError) {
      console.error('❌ Unerwarteter Fehler beim E-Mail-Versand:', emailError);
    }

    // Assignment mit populated Daten für Response laden
    const populatedAssignment = await DeviceAssignment.findById(assignment._id)
      .populate('deviceId', 'imei model modelDesc thumbnail')
      .populate('resellerId', 'name username email');

    res.status(201).json({
      ...populatedAssignment.toObject(),
      emailSent: true // Anzeigen dass E-Mail versucht wurde
    });

  } catch (error) {
    console.error('Fehler beim Zuweisen des Geräts:', error);
    res.status(500).json({ error: 'Fehler beim Zuweisen des Geräts' });
  }
});

// NEU: Gerät-Erhalt bestätigen (für Reseller)
router.post('/confirm-receipt/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await DeviceAssignment.findById(assignmentId)
      .populate('deviceId')
      .populate('resellerId');

    if (!assignment) {
      return res.status(404).json({ error: 'Zuweisung nicht gefunden' });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({ 
        error: 'Gerät wurde bereits bestätigt oder ist nicht mehr verfügbar',
        currentStatus: assignment.status
      });
    }

    // Status aktualisieren
    assignment.status = 'received';
    assignment.receivedAt = new Date();
    await assignment.save();

    // NEU: E-Mail an Admin senden
    console.log('📧 Sende Bestätigungs-E-Mail an Admin...');
    try {
      // Admin-E-Mail aus Umgebungsvariable oder Standard
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairhub.ovh';
      
      const emailResult = await emailService.sendAssignmentConfirmationToAdmin(
        adminEmail,
        assignment.resellerId,
        assignment.deviceId,
        assignment
      );
      
      if (emailResult.success) {
        console.log('✅ Bestätigungs-E-Mail an Admin erfolgreich gesendet');
      } else {
        console.error('❌ Fehler beim Senden der Bestätigungs-E-Mail:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Unerwarteter Fehler beim E-Mail-Versand:', emailError);
    }

    res.json({
      message: 'Erhalt erfolgreich bestätigt',
      assignment: {
        id: assignment._id,
        status: assignment.status,
        receivedAt: assignment.receivedAt,
        device: assignment.deviceId,
        reseller: assignment.resellerId
      }
    });

  } catch (error) {
    console.error('Fehler bei der Erhalt-Bestätigung:', error);
    res.status(500).json({ error: 'Fehler bei der Erhalt-Bestätigung' });
  }
});

// NEU: Verkauf melden (für Reseller - erweitert mit E-Mail)
router.post('/report-sale/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { salePrice, notes } = req.body;

    if (!salePrice || salePrice <= 0) {
      return res.status(400).json({ error: 'Gültiger Verkaufspreis erforderlich' });
    }

    const assignment = await DeviceAssignment.findById(assignmentId)
      .populate('deviceId')
      .populate('resellerId');

    if (!assignment) {
      return res.status(404).json({ error: 'Zuweisung nicht gefunden' });
    }

    if (assignment.status === 'sold') {
      return res.status(400).json({ error: 'Gerät bereits als verkauft gemeldet' });
    }

    if (assignment.status !== 'received') {
      return res.status(400).json({ 
        error: 'Gerät muss zuerst bestätigt werden bevor es verkauft werden kann' 
      });
    }

    if (salePrice < assignment.minimumPrice) {
      return res.status(400).json({ 
        error: `Verkaufspreis muss mindestens ${assignment.minimumPrice}€ betragen` 
      });
    }

    // Assignment und Device aktualisieren
    assignment.status = 'sold';
    assignment.soldAt = new Date();
    assignment.actualSalePrice = salePrice;
    if (notes) {
      assignment.notes = notes;
    }
    await assignment.save();

    // Device als verkauft markieren
    await Device.findByIdAndUpdate(assignment.deviceId._id, {
      status: 'verkauft',
      soldDate: new Date(),
      actualSellingPrice: salePrice
    });

    // NEU: E-Mail an Admin senden
    console.log('📧 Sende Verkaufs-E-Mail an Admin...');
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairhub.ovh';
      
      const emailResult = await emailService.sendSaleNotificationToAdmin(
        adminEmail,
        assignment.resellerId,
        assignment.deviceId,
        assignment,
        salePrice
      );
      
      if (emailResult.success) {
        console.log('✅ Verkaufs-E-Mail an Admin erfolgreich gesendet');
      } else {
        console.error('❌ Fehler beim Senden der Verkaufs-E-Mail:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Unerwarteter Fehler beim E-Mail-Versand:', emailError);
    }

    const profit = salePrice - assignment.minimumPrice;

    res.json({
      message: 'Verkauf erfolgreich gemeldet',
      sale: {
        assignmentId: assignment._id,
        salePrice: salePrice,
        minimumPrice: assignment.minimumPrice,
        resellerProfit: profit,
        soldAt: assignment.soldAt,
        device: assignment.deviceId,
        reseller: assignment.resellerId
      }
    });

  } catch (error) {
    console.error('Fehler beim Melden des Verkaufs:', error);
    res.status(500).json({ error: 'Fehler beim Melden des Verkaufs' });
  }
});

// Verkauf zurücknehmen (erweitert mit besserer E-Mail-Info)
router.post('/reverse-sale/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'Grund für Rücknahme erforderlich (mindestens 5 Zeichen)' });
    }

    const assignment = await DeviceAssignment.findById(assignmentId)
      .populate('deviceId')
      .populate('resellerId');

    if (!assignment) {
      return res.status(404).json({ error: 'Zuweisung nicht gefunden' });
    }

    if (assignment.status !== 'sold') {
      return res.status(400).json({ error: 'Nur verkaufte Geräte können zurückgenommen werden' });
    }

    const originalSalePrice = assignment.actualSalePrice;

    // Assignment aktualisieren
    assignment.status = 'received'; // Zurück zu "erhalten"
    assignment.soldAt = null;
    assignment.actualSalePrice = null;
    assignment.notes = `VERKAUF ZURÜCKGENOMMEN: ${reason}\n\nUrsprünglicher Verkaufspreis: ${originalSalePrice}€\nZurückgenommen am: ${new Date().toLocaleString('de-DE')}\n\nVorherige Notizen: ${assignment.notes || 'Keine'}`;
    assignment.updatedAt = new Date();
    await assignment.save();

    // Device Status zurücksetzen
    await Device.findByIdAndUpdate(assignment.deviceId._id, {
      status: 'zum_verkauf', // Zurück zu "zum Verkauf"
      soldDate: null,
      actualSellingPrice: null
    });

    res.json({
      message: 'Verkauf erfolgreich zurückgenommen',
      assignment: {
        id: assignment._id,
        status: assignment.status,
        originalSalePrice: originalSalePrice,
        reason: reason,
        device: assignment.deviceId,
        reseller: assignment.resellerId
      }
    });

  } catch (error) {
    console.error('Fehler beim Zurücknehmen des Verkaufs:', error);
    res.status(500).json({ error: 'Fehler beim Zurücknehmen des Verkaufs' });
  }
});

// Bestehende Routen bleiben unverändert...

// NEU: Reseller über E-Mail einladen (moderne Variante)
router.post('/invite-reseller', adminAuth, async (req, res) => {
  try {
    const { email, name, company, phone } = req.body;

    // Validierung
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich' });
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Prüfen ob E-Mail bereits als Reseller existiert
    const existingReseller = await Reseller.findOne({ email });
    if (existingReseller) {
      return res.status(400).json({ error: 'Reseller mit dieser E-Mail existiert bereits' });
    }

    // Prüfen ob bereits eine offene Einladung existiert
    const existingInvite = await InviteToken.findOne({ 
      email, 
      type: 'reseller',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvite) {
      return res.status(400).json({ 
        error: 'Für diese E-Mail existiert bereits eine offene Reseller-Einladung',
        expiresAt: existingInvite.expiresAt
      });
    }

    // Token und Ablaufzeit generieren
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Stunden

    // Neue Einladung erstellen
    const inviteToken = new InviteToken({
      email,
      token: token,
      name: name || null,
      type: 'reseller',
      resellerData: {
        company: company || null,
        phone: phone || null
      },
      createdBy: req.admin._id,
      expiresAt: expiresAt
    });

    await inviteToken.save();

    // E-Mail senden
    const emailResult = await emailService.sendResellerInvitation(email, token, name, company);
    
    if (!emailResult.success) {
      await InviteToken.findByIdAndDelete(inviteToken._id);
      return res.status(500).json({ 
        error: 'Fehler beim Senden der Einladungs-E-Mail',
        details: emailResult.error 
      });
    }

    res.status(201).json({
      message: 'Reseller-Einladung erfolgreich gesendet',
      invite: {
        id: inviteToken._id,
        email: inviteToken.email,
        name: inviteToken.name,
        company: inviteToken.resellerData?.company,
        expiresAt: inviteToken.expiresAt,
        createdAt: inviteToken.createdAt
      },
      emailSent: true,
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('❌ Fehler beim Senden der Reseller-Einladung:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Reseller-Einladung' });
  }
});

// Alle Reseller abrufen (bestehend)
router.get('/resellers', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const resellers = await Reseller.find(filter).select('-password').sort({ createdAt: -1 });
    
    res.json(resellers);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Reseller' });
  }
});

// Alle Zuweisungen abrufen (bestehend)
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await DeviceAssignment.find()
      .populate('deviceId', 'imei model modelDesc thumbnail')
      .populate('resellerId', 'name username company')
      .sort({ assignedAt: -1 });
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Zuweisungen' });
  }
});

// Verfügbare Geräte für Zuweisung abrufen (bestehend)
router.get('/available-devices', async (req, res) => {
  try {
    const assignedDeviceIds = await DeviceAssignment.distinct('deviceId', {
      status: { $ne: 'returned' }
    });
    
    const availableDevices = await Device.find({
      _id: { $nin: assignedDeviceIds },
      status: { $in: ['verkaufsbereit', 'in_reparatur'] }
    }).sort({ updatedAt: -1 });
    
    res.json(availableDevices);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen verfügbarer Geräte' });
  }
});

// Gerät von Reseller entziehen (bestehend)
router.patch('/assignments/:assignmentId/revoke', async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'Grund für Entziehung erforderlich' });
    }

    const assignment = await DeviceAssignment.findById(req.params.assignmentId)
      .populate('deviceId')
      .populate('resellerId');

    if (!assignment) {
      return res.status(404).json({ error: 'Zuweisung nicht gefunden' });
    }

    if (assignment.status === 'sold') {
      return res.status(400).json({ error: 'Verkaufte Geräte können nicht entzogen werden' });
    }

    assignment.status = 'returned';
    assignment.notes = `GERÄT ENTZOGEN: ${reason}\n\nVorherige Notizen: ${assignment.notes || 'Keine'}`;
    assignment.updatedAt = new Date();
    await assignment.save();

    await Device.findByIdAndUpdate(assignment.deviceId._id, {
      status: 'verkaufsbereit'
    });

    res.json({ 
      message: 'Gerät erfolgreich entzogen',
      assignment,
      device: assignment.deviceId
    });
  } catch (error) {
    console.error('Fehler beim Entziehen des Geräts:', error);
    res.status(500).json({ error: 'Fehler beim Entziehen des Geräts' });
  }
});

module.exports = router;