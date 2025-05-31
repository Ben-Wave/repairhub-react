// backend/routes/admin-reseller.js
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

    // Prüfen ob Reseller existiert
    const reseller = await Reseller.findById(resellerId);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
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

// Alle Reseller abrufen
router.get('/resellers', async (req, res) => {
  try {
    const resellers = await Reseller.find({ isActive: true }).select('-password');
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