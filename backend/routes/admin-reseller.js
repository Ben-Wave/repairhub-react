// backend/routes/admin-reseller.js - ERWEITERT mit E-Mail-Einladungen
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Reseller, DeviceAssignment, Device, InviteToken } = require('../models');
const emailService = require('../services/emailService');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

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
      type: 'reseller', // NEU: Typ unterscheiden
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
      type: 'reseller', // NEU: Typ setzen
      // Reseller-spezifische Daten
      resellerData: {
        company: company || null,
        phone: phone || null
      },
      createdBy: req.admin._id,
      expiresAt: expiresAt
    });

    console.log('📧 Erstelle Reseller-InviteToken mit:', {
      email,
      token: token.substring(0, 8) + '...',
      expiresAt,
      type: 'reseller'
    });

    await inviteToken.save();

    console.log('✅ Reseller-InviteToken erfolgreich erstellt');

    // E-Mail senden
    const emailResult = await emailService.sendResellerInvitation(email, token, name, company);
    
    if (!emailResult.success) {
      console.error('❌ E-Mail-Versand fehlgeschlagen:', emailResult.error);
      // Falls E-Mail fehlschlägt, Einladung löschen
      await InviteToken.findByIdAndDelete(inviteToken._id);
      return res.status(500).json({ 
        error: 'Fehler beim Senden der Einladungs-E-Mail',
        details: emailResult.error 
      });
    }

    console.log('✅ Reseller-E-Mail erfolgreich gesendet');

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

// NEU: Reseller-Einladungen abrufen
router.get('/invites', async (req, res) => {
  try {
    const invites = await InviteToken.find({ 
      type: 'reseller',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })
    .populate('createdBy', 'name username')
    .sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    console.error('Fehler beim Abrufen der Reseller-Einladungen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Reseller-Einladungen' });
  }
});

// NEU: Reseller-Einladung erneut senden
router.post('/resend-invite/:inviteId', async (req, res) => {
  try {
    const invite = await InviteToken.findById(req.params.inviteId);
    
    if (!invite || invite.type !== 'reseller') {
      return res.status(404).json({ error: 'Reseller-Einladung nicht gefunden' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ error: 'Einladung wurde bereits verwendet' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Einladung ist abgelaufen' });
    }

    // E-Mail erneut senden
    const emailResult = await emailService.sendResellerInvitation(
      invite.email, 
      invite.token, 
      invite.name, 
      invite.resellerData?.company
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        error: 'Fehler beim erneuten Senden der E-Mail',
        details: emailResult.error 
      });
    }

    res.json({
      message: 'Reseller-Einladung erfolgreich erneut gesendet',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('Fehler beim erneuten Senden der Reseller-Einladung:', error);
    res.status(500).json({ error: 'Fehler beim erneuten Senden der Reseller-Einladung' });
  }
});

// NEU: Reseller-Einladung widerrufen
router.delete('/invites/:inviteId', async (req, res) => {
  try {
    const invite = await InviteToken.findById(req.params.inviteId);
    
    if (!invite || invite.type !== 'reseller') {
      return res.status(404).json({ error: 'Reseller-Einladung nicht gefunden' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ error: 'Einladung wurde bereits verwendet und kann nicht widerrufen werden' });
    }

    await InviteToken.findByIdAndDelete(req.params.inviteId);

    res.json({ message: 'Reseller-Einladung erfolgreich widerrufen' });
  } catch (error) {
    console.error('Fehler beim Widerrufen der Reseller-Einladung:', error);
    res.status(500).json({ error: 'Fehler beim Widerrufen der Reseller-Einladung' });
  }
});

// Neuen Reseller erstellen (alte Methode - für Kompatibilität)
router.post('/resellers', async (req, res) => {
  try {
    const { username, email, name, company, phone } = req.body;

    // Prüfen ob Username/Email bereits existiert
    const existingReseller = await Reseller.findOne({
      $or: [{ username }, { email }]
    });

    if (existingReseller) {
      return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    }

    // Passwort ist der Username (temporär)
    const tempPassword = username;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newReseller = new Reseller({
      username,
      email,
      password: hashedPassword,
      name,
      company,
      phone,
      mustChangePassword: true,
      firstLogin: true
    });

    await newReseller.save();

    // Passwort aus Response entfernen
    const resellerResponse = newReseller.toObject();
    delete resellerResponse.password;
    resellerResponse.temporaryPassword = tempPassword;

    res.status(201).json(resellerResponse);
  } catch (error) {
    console.error('Fehler beim Erstellen des Resellers:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Resellers' });
  }
});

// NEU: Reseller-Registrierung vervollständigen
router.post('/complete-registration', async (req, res) => {
  try {
    const { token, username, password, name, company, phone } = req.body;

    // Validierung
    if (!token || !username || !password) {
      return res.status(400).json({ error: 'Token, Username und Passwort sind erforderlich' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Token validieren
    const invite = await InviteToken.findOne({ token, type: 'reseller' });

    if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Einladungslink' });
    }

    // Prüfen ob Username bereits existiert
    const existingUsername = await Reseller.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username bereits vergeben' });
    }

    // Prüfen ob E-Mail bereits als Reseller existiert
    const existingEmail = await Reseller.findOne({ email: invite.email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Reseller mit dieser E-Mail existiert bereits' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Reseller erstellen
    const newReseller = new Reseller({
      username,
      email: invite.email,
      password: hashedPassword,
      name: name || invite.name || username,
      company: company || invite.resellerData?.company || '',
      phone: phone || invite.resellerData?.phone || '',
      mustChangePassword: false,
      firstLogin: false,
      lastPasswordChange: new Date(),
      isActive: true
    });

    await newReseller.save();

    // Einladung als verwendet markieren
    invite.isUsed = true;
    invite.usedAt = new Date();
    await invite.save();

    // Antwort ohne Passwort
    const resellerResponse = newReseller.toObject();
    delete resellerResponse.password;

    res.status(201).json({
      message: 'Reseller-Registrierung erfolgreich abgeschlossen',
      reseller: resellerResponse
    });

  } catch (error) {
    console.error('Fehler bei der Reseller-Registrierung:', error);
    res.status(500).json({ error: 'Fehler bei der Reseller-Registrierung' });
  }
});

// NEU: Reseller-Token validieren (für Frontend)
router.get('/validate-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token erforderlich' });
    }

    const invite = await InviteToken.findOne({ token, type: 'reseller' });

    if (!invite) {
      return res.status(404).json({ error: 'Ungültiger Einladungslink' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ 
        error: 'Einladung wurde bereits verwendet',
        usedAt: invite.usedAt
      });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: 'Einladungslink ist abgelaufen',
        expiredAt: invite.expiresAt
      });
    }

    // Prüfen ob bereits ein Reseller mit dieser E-Mail existiert
    const existingReseller = await Reseller.findOne({ email: invite.email });
    if (existingReseller) {
      return res.status(400).json({ error: 'Reseller mit dieser E-Mail existiert bereits' });
    }

    // Token ist gültig - Informationen für Registrierung zurückgeben
    res.json({
      valid: true,
      email: invite.email,
      name: invite.name,
      company: invite.resellerData?.company,
      phone: invite.resellerData?.phone,
      expiresAt: invite.expiresAt,
      timeRemaining: invite.expiresAt - new Date()
    });

  } catch (error) {
    console.error('Fehler bei Reseller-Token-Validierung:', error);
    res.status(500).json({ error: 'Fehler bei der Token-Validierung' });
  }
});

// Reseller deaktivieren/aktivieren (bestehend)
router.patch('/resellers/:resellerId/toggle-active', async (req, res) => {
  try {
    const { resellerId } = req.params;
    const { reason } = req.body;

    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }

    const newStatus = !reseller.isActive;
    
    if (!newStatus) {
      const activeAssignments = await DeviceAssignment.find({
        resellerId: resellerId,
        status: { $in: ['assigned', 'received'] }
      }).populate('deviceId', 'imei model');

      if (activeAssignments.length > 0) {
        return res.status(400).json({ 
          error: 'Reseller hat noch aktive Gerätezuweisungen',
          activeAssignments: activeAssignments.map(a => ({
            deviceModel: a.deviceId.model,
            deviceImei: a.deviceId.imei,
            status: a.status
          }))
        });
      }
    }

    reseller.isActive = newStatus;
    reseller.updatedAt = new Date();
    await reseller.save();

    console.log(`Reseller ${reseller.username} wurde ${newStatus ? 'aktiviert' : 'deaktiviert'}. Grund: ${reason || 'Kein Grund angegeben'}`);

    const resellerResponse = reseller.toObject();
    delete resellerResponse.password;

    res.json({
      message: `Reseller erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}`,
      reseller: resellerResponse
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Reseller-Status:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Reseller-Status' });
  }
});

// Reseller löschen (bestehend)
router.delete('/resellers/:resellerId', async (req, res) => {
  try {
    const { resellerId } = req.params;
    const { confirmDeletion, reason } = req.body;

    if (!confirmDeletion) {
      return res.status(400).json({ error: 'Löschung muss explizit bestätigt werden' });
    }

    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }

    const allAssignments = await DeviceAssignment.find({ resellerId }).populate('deviceId', 'imei model status');
    
    const activeAssignments = allAssignments.filter(a => a.status === 'assigned' || a.status === 'received');
    if (activeAssignments.length > 0) {
      return res.status(400).json({ 
        error: 'Reseller kann nicht gelöscht werden - hat noch aktive Gerätezuweisungen',
        activeAssignments: activeAssignments.map(a => ({
          assignmentId: a._id,
          deviceModel: a.deviceId.model,
          deviceImei: a.deviceId.imei,
          status: a.status
        }))
      });
    }

    const soldAssignments = allAssignments.filter(a => a.status === 'sold');
    
    await DeviceAssignment.updateMany(
      { resellerId },
      { 
        $set: { 
          notes: `${reason ? `RESELLER GELÖSCHT: ${reason}\n\n` : 'RESELLER GELÖSCHT\n\n'}Vorherige Notizen: ${soldAssignments[0]?.notes || 'Keine'}`,
          updatedAt: new Date()
        }
      }
    );

    for (const assignment of activeAssignments) {
      await Device.findByIdAndUpdate(assignment.deviceId._id, {
        status: 'verkaufsbereit'
      });
    }

    await Reseller.findByIdAndDelete(resellerId);

    console.log(`Reseller ${reseller.username} (${reseller.name}) wurde gelöscht. Grund: ${reason || 'Kein Grund angegeben'}. Betroffene Zuweisungen: ${allAssignments.length}`);

    res.json({
      message: 'Reseller erfolgreich gelöscht',
      deletedReseller: {
        id: reseller._id,
        username: reseller.username,
        name: reseller.name
      },
      affectedAssignments: allAssignments.length,
      soldAssignments: soldAssignments.length
    });

  } catch (error) {
    console.error('Fehler beim Löschen des Resellers:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Resellers' });
  }
});

// Gerät einem Reseller zuweisen (bestehend)
router.post('/assign-device', async (req, res) => {
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

    const assignment = new DeviceAssignment({
      deviceId,
      resellerId,
      minimumPrice
    });

    await assignment.save();

    device.status = 'zum_verkauf';
    await device.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Zuweisen des Geräts' });
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