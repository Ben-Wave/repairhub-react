// backend/routes/auth.js - ERWEITERT mit User-Passwort-Änderung
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const { Reseller, Admin, UserRole } = require('../models');
const router = express.Router();

// Middleware für JWT-Verifizierung mit Rollen-Support
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Token erforderlich' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiger Token' });
    }
    
    // NEU: Wenn es ein Admin-Token ist, lade die Rolle
    if (user.type === 'admin') {
      try {
        const admin = await Admin.findById(user.id).populate('roleId');
        if (admin && admin.roleId) {
          user.permissions = admin.roleId.permissions;
          user.roleName = admin.roleId.name;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Admin-Rolle:', error);
      }
    }
    
    req.user = user;
    next();
  });
};

// NEU: Middleware für spezifische Berechtigungen
const requirePermission = (category, permission) => {
  return (req, res, next) => {
    // Super-Admin hat immer alle Rechte
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Prüfe spezifische Berechtigung
    if (req.user.permissions && 
        req.user.permissions[category] && 
        req.user.permissions[category][permission]) {
      return next();
    }

    return res.status(403).json({ 
      error: `Berechtigung erforderlich: ${category}.${permission}`,
      requiredPermission: `${category}.${permission}`
    });
  };
};

// NEU: Admin Login Route - ERWEITERT für mustChangePassword
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    const admin = await Admin.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    }).populate('roleId');

    if (!admin) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Token erstellen
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
      },
      // NEU: Passwort-Änderung erforderlich?
      mustChangePassword: admin.mustChangePassword || false,
      firstLogin: admin.firstLogin || false
    };

    res.json(responseData);

  } catch (error) {
    console.error('Admin Login Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login' });
  }
});

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

    const responseData = {
      token,
      reseller: {
        id: reseller._id,
        username: reseller.username,
        name: reseller.name,
        email: reseller.email,
        company: reseller.company
      },
      mustChangePassword: reseller.mustChangePassword,
      firstLogin: reseller.firstLogin
    };

    res.json(responseData);

  } catch (error) {
    console.error('Login Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login' });
  }
});

// NEU: Passwort ändern Route für BEIDE (Reseller UND Admin)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
    }

    let user;
    let UserModel;

    // Bestimme ob es Admin oder Reseller ist
    if (req.user.type === 'admin') {
      UserModel = Admin;
      user = await Admin.findById(req.user.id);
    } else {
      UserModel = Reseller;
      user = await Reseller.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Aktuelles Passwort prüfen
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrentPassword) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort hashen und speichern
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedNewPassword;
    user.mustChangePassword = false;
    user.firstLogin = false;
    user.lastPasswordChange = new Date();
    user.updatedAt = new Date();
    
    await user.save();

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
    if (req.user.type === 'admin') {
      const admin = await Admin.findById(req.user.id)
        .populate('roleId')
        .select('-password');
      if (!admin) {
        return res.status(404).json({ error: 'Admin nicht gefunden' });
      }
      res.json(admin);
    } else {
      const reseller = await Reseller.findById(req.user.id).select('-password');
      if (!reseller) {
        return res.status(404).json({ error: 'Reseller nicht gefunden' });
      }
      res.json(reseller);
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des Profils' });
  }
});

// NEU: User Info Route für Frontend
router.get('/user-info', authenticateToken, async (req, res) => {
  try {
    if (req.user.type === 'admin') {
      const admin = await Admin.findById(req.user.id)
        .populate('roleId')
        .select('-password');
      
      if (!admin) {
        return res.status(404).json({ error: 'Admin nicht gefunden' });
      }

      res.json({
        type: 'admin',
        user: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.roleId ? admin.roleId.permissions : null,
          roleName: admin.roleId ? admin.roleId.name : null,
          mustChangePassword: admin.mustChangePassword || false,
          firstLogin: admin.firstLogin || false
        }
      });
    } else {
      const reseller = await Reseller.findById(req.user.id).select('-password');
      if (!reseller) {
        return res.status(404).json({ error: 'Reseller nicht gefunden' });
      }
      
      res.json({
        type: 'reseller',
        user: {
          ...reseller.toObject(),
          mustChangePassword: reseller.mustChangePassword || false,
          firstLogin: reseller.firstLogin || false
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzerinformationen' });
  }
});

// NEU: Password Reset Request für Reseller
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich' });
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Reseller suchen (Admins und Reseller getrennt behandeln)
    const reseller = await Reseller.findOne({ email, isActive: true });
    
    if (!reseller) {
      // Aus Sicherheitsgründen immer "success" zurückgeben
      return res.json({ 
        success: true, 
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde eine Reset-E-Mail gesendet.' 
      });
    }

    // Reset-Token generieren
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 Stunde gültig

    // Token im Reseller speichern
    reseller.resetPasswordToken = resetToken;
    reseller.resetPasswordExpiry = resetTokenExpiry;
    await reseller.save();

    // E-Mail senden
    const emailResult = await emailService.sendPasswordReset(
      reseller.email, 
      resetToken, 
      reseller.name
    );

    if (!emailResult.success) {
      console.error('Fehler beim Senden der Reset-E-Mail:', emailResult.error);
      return res.status(500).json({ 
        error: 'Fehler beim Senden der Reset-E-Mail. Bitte versuchen Sie es später erneut.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Reset-E-Mail wurde gesendet. Überprüfen Sie Ihr Postfach.' 
    });

  } catch (error) {
    console.error('Password Reset Request Fehler:', error);
    res.status(500).json({ error: 'Server-Fehler beim Anfordern des Password-Resets' });
  }
});

// NEU: Password Reset durchführen
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token und neues Passwort sind erforderlich' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Reseller mit gültigem Token finden
    const reseller = await Reseller.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
      isActive: true
    });

    if (!reseller) {
      return res.status(400).json({ 
        error: 'Ungültiger oder abgelaufener Reset-Token. Bitte fordern Sie einen neuen an.' 
      });
    }

    // Neues Passwort hashen und speichern
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    reseller.password = hashedPassword;
    reseller.resetPasswordToken = undefined;
    reseller.resetPasswordExpiry = undefined;
    reseller.mustChangePassword = false;
    reseller.firstLogin = false;
    reseller.lastPasswordChange = new Date();
    reseller.updatedAt = new Date();
    
    await reseller.save();

    res.json({ 
      success: true, 
      message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.' 
    });

  } catch (error) {
    console.error('Password Reset Fehler:', error);
    res.status(500).json({ error: 'Server-Fehler beim Zurücksetzen des Passworts' });
  }
});
module.exports = { router, authenticateToken, requirePermission };