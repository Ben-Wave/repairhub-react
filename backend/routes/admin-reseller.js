// backend/routes/admin-reseller.js - ERWEITERT mit Löschen/Deaktivieren
const express = require('express');
const bcrypt = require('bcryptjs');
const { Reseller, DeviceAssignment, Device } = require('../models');
const router = express.Router();

// TODO: Hier könnten Sie ein Admin-Auth Middleware hinzufügen
// const adminAuth = require('../middleware/adminAuth');

// Neuen Reseller erstellen (ERWEITERT)
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

    // NEU: Passwort ist der Username (temporär)
    const tempPassword = username;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newReseller = new Reseller({
      username,
      email,
      password: hashedPassword,
      name,
      company,
      phone,
      // NEU: Muss Passwort bei erstem Login ändern
      mustChangePassword: true,
      firstLogin: true
    });

    await newReseller.save();

    // Passwort aus Response entfernen
    const resellerResponse = newReseller.toObject();
    delete resellerResponse.password;

    // NEU: Temporäres Passwort in Response für Admin
    resellerResponse.temporaryPassword = tempPassword;

    res.status(201).json(resellerResponse);
  } catch (error) {
    console.error('Fehler beim Erstellen des Resellers:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Resellers' });
  }
});

// NEU: Reseller deaktivieren/aktivieren
router.patch('/resellers/:resellerId/toggle-active', async (req, res) => {
  try {
    const { resellerId } = req.params;
    const { reason } = req.body;

    // Reseller finden
    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }

    // Status umschalten
    const newStatus = !reseller.isActive;
    
    // Bei Deaktivierung prüfen ob aktive Zuweisungen existieren
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

    // Status aktualisieren
    reseller.isActive = newStatus;
    reseller.updatedAt = new Date();
    await reseller.save();

    // Log-Eintrag (optional - könnte in separater Audit-Tabelle gespeichert werden)
    console.log(`Reseller ${reseller.username} wurde ${newStatus ? 'aktiviert' : 'deaktiviert'}. Grund: ${reason || 'Kein Grund angegeben'}`);

    // Antwort ohne Passwort
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

// NEU: Reseller löschen (mit Sicherheitsprüfungen)
router.delete('/resellers/:resellerId', async (req, res) => {
  try {
    const { resellerId } = req.params;
    const { confirmDeletion, reason } = req.body;

    // Bestätigung prüfen
    if (!confirmDeletion) {
      return res.status(400).json({ error: 'Löschung muss explizit bestätigt werden' });
    }

    // Reseller finden
    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }

    // Alle Zuweisungen des Resellers abrufen
    const allAssignments = await DeviceAssignment.find({ resellerId }).populate('deviceId', 'imei model status');
    
    // Aktive Zuweisungen prüfen
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

    // Verkaufte Geräte prüfen (Warnung, aber nicht blockierend)
    const soldAssignments = allAssignments.filter(a => a.status === 'sold');
    
    // WICHTIG: Alle Zuweisungen des Resellers als "deleted_reseller" markieren
    // statt sie zu löschen, um Datenintegrität zu wahren
    await DeviceAssignment.updateMany(
      { resellerId },
      { 
        $set: { 
          notes: `${reason ? `RESELLER GELÖSCHT: ${reason}\n\n` : 'RESELLER GELÖSCHT\n\n'}Vorherige Notizen: ${soldAssignments[0]?.notes || 'Keine'}`,
          updatedAt: new Date()
        }
      }
    );

    // Geräte von gelöschten aktiven Zuweisungen zurücksetzen (falls welche übersehen wurden)
    for (const assignment of activeAssignments) {
      await Device.findByIdAndUpdate(assignment.deviceId._id, {
        status: 'verkaufsbereit'
      });
    }

    // Reseller löschen
    await Reseller.findByIdAndDelete(resellerId);

    // Log-Eintrag
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

// Gerät einem Reseller zuweisen (ERWEITERT)
router.post('/assign-device', async (req, res) => {
  try {
    const { deviceId, resellerId, minimumPrice } = req.body;

    // Prüfen ob Gerät existiert und verfügbar ist
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    if (device.status === 'verkauft') {
      return res.status(400).json({ error: 'Gerät bereits verkauft' });
    }

    // Prüfen ob Reseller existiert UND aktiv ist
    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }
    
    if (!reseller.isActive) {
      return res.status(400).json({ error: 'Reseller ist nicht aktiv und kann keine Geräte erhalten' });
    }

    // Prüfen ob bereits zugewiesen
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
      minimumPrice // Das ist jetzt der Mindestverkaufspreis = Repairhub-Gewinn
    });

    await assignment.save();

    // Gerätestatus aktualisieren
    device.status = 'zum_verkauf';
    await device.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Zuweisen des Geräts' });
  }
});

// Alle Reseller abrufen (ERWEITERT - auch inaktive anzeigen)
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

// Alle Zuweisungen abrufen (Admin-Übersicht)
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

// Verfügbare Geräte für Zuweisung abrufen
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

// Gerät von Reseller entziehen
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

    // Assignment als zurückgegeben markieren
    assignment.status = 'returned';
    assignment.notes = `GERÄT ENTZOGEN: ${reason}\n\nVorherige Notizen: ${assignment.notes || 'Keine'}`;
    assignment.updatedAt = new Date();
    await assignment.save();

    // Gerätestatus zurücksetzen
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