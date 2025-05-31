const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const router = express.Router();

// Admin Auth Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin Access Token erforderlich' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err || user.type !== 'admin') {
      return res.status(403).json({ error: 'Ungültiger Admin Token' });
    }
    req.admin = user;
    next();
  });
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    const admin = await Admin.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    });

    if (!admin) {
      return res.status(401).json({ error: 'Ungültige Admin-Anmeldedaten' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Admin-Anmeldedaten' });
    }

    // Last Login aktualisieren
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        type: 'admin',
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin Login Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Admin Login' });
  }
});

// Admin Profil
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin nicht gefunden' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des Admin-Profils' });
  }
});

// Admin erstellen (nur für Setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Prüfen ob bereits ein Admin existiert
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin-Account bereits vorhanden' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      name,
      role: 'super_admin'
    });

    await admin.save();

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json(adminResponse);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Admin-Accounts' });
  }
});

module.exports = { router, authenticateAdmin };
