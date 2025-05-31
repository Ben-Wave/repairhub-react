// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Reseller } = require('../models');
const router = express.Router();

// Middleware für JWT-Verifizierung
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Token erforderlich' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiger Token' });
    }
    req.user = user;
    next();
  });
};

// Login Route (ERWEITERT)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    const reseller = await Reseller.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    });

    if (!reseller) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const validPassword = await bcrypt.compare(password, reseller.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Token erstellen
    const token = jwt.sign(
      { 
        id: reseller._id, 
        username: reseller.username,
        type: 'reseller'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // NEU: Prüfen ob Passwort geändert werden muss
    const responseData = {
      token,
      reseller: {
        id: reseller._id,
        username: reseller.username,
        name: reseller.name,
        email: reseller.email,
        company: reseller.company
      },
      // NEU: Passwort-Status
      mustChangePassword: reseller.mustChangePassword,
      firstLogin: reseller.firstLogin
    };

    res.json(responseData);

  } catch (error) {
    console.error('Login Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login' });
  }
});

// NEU: Passwort ändern Route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
    }

    const reseller = await Reseller.findById(req.user.id);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }

    // Aktuelles Passwort prüfen
    const validCurrentPassword = await bcrypt.compare(currentPassword, reseller.password);
    if (!validCurrentPassword) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort hashen und speichern
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    reseller.password = hashedNewPassword;
    reseller.mustChangePassword = false;
    reseller.firstLogin = false;
    reseller.lastPasswordChange = new Date();
    reseller.updatedAt = new Date();
    
    await reseller.save();

    res.json({ 
      message: 'Passwort erfolgreich geändert',
      mustChangePassword: false,
      firstLogin: false
    });

  } catch (error) {
    console.error('Passwort-Änderung Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Ändern des Passworts' });
  }
});

// Profil abrufen
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.user.id).select('-password');
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller nicht gefunden' });
    }
    res.json(reseller);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des Profils' });
  }
});

module.exports = { router, authenticateToken };