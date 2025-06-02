// backend/routes/admin-auth.js - NEUE DATEI erstellen
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, UserRole } = require('../models');
const router = express.Router();

// Middleware für JWT-Verifizierung (Admin)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Token erforderlich' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiger Token' });
    }
    
    // Nur Admin-Tokens akzeptieren
    if (user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    // Admin-Daten mit Rolle laden
    try {
      const admin = await Admin.findById(user.id).populate('roleId');
      if (!admin || !admin.isActive) {
        return res.status(403).json({ error: 'Admin-Account nicht gefunden oder deaktiviert' });
      }

      req.admin = {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.roleId ? admin.roleId.permissions : null,
        roleName: admin.roleId ? admin.roleId.name : null
      };
      next();
    } catch (error) {
      console.error('Fehler beim Laden der Admin-Daten:', error);
      return res.status(500).json({ error: 'Serverfehler' });
    }
  });
};

// Admin Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    // Admin in der Datenbank suchen
    const admin = await Admin.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    }).populate('roleId');

    if (!admin) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Passwort prüfen
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Response mit Admin-Daten und Berechtigungen
    const responseData = {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.roleId ? admin.roleId.permissions : null,
        roleName: admin.roleId ? admin.roleId.name : null
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Admin Login Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login' });
  }
});

// Admin Profil abrufen
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    res.json(req.admin);
  } catch (error) {
    console.error('Fehler beim Abrufen des Admin-Profils:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Profils' });
  }
});

// Admin Logout (optional - Token wird clientseitig gelöscht)
router.post('/logout', authenticateAdmin, (req, res) => {
  res.json({ message: 'Erfolgreich abgemeldet' });
});

module.exports = { router, authenticateAdmin };