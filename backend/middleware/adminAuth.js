// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Kein Token, Zugriff verweigert' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ error: 'Admin nicht gefunden' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ error: 'Admin-Account ist deaktiviert' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin Auth Fehler:', error);
    res.status(401).json({ error: 'Token ungültig' });
  }
};

module.exports = adminAuth;