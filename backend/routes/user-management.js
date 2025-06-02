// 2. Backend Routes - backend/routes/user-management.js (NEUE DATEI)
const express = require('express');
const bcrypt = require('bcryptjs');
const { Admin, UserRole } = require('../models');
const { authenticateAdmin } = require('./admin-auth');
const router = express.Router();

// Middleware für Super-Admin Check
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super-Admin Berechtigung erforderlich' });
  }
  next();
};

// Alle Benutzer abrufen
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await Admin.find({ _id: { $ne: req.admin.id } })
      .populate('roleId', 'displayName permissions')
      .populate('createdBy', 'name username')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer' });
  }
});

// Neuen Benutzer erstellen
router.post('/users', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, name, role, roleId } = req.body;

    // Prüfen ob Username/Email bereits existiert
    const existingUser = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      username,
      email,
      password: hashedPassword,
      name,
      role: role || 'admin',
      roleId: roleId || null,
      createdBy: req.admin.id
    });

    await newUser.save();

    // Passwort aus Response entfernen
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Benutzers' });
  }
});

// Benutzer aktualisieren
router.put('/users/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, role, roleId, isActive } = req.body;
    
    const user = await Admin.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Sich selbst nicht deaktivieren
    if (req.params.id === req.admin.id && isActive === false) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst deaktivieren' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.roleId = roleId || user.roleId;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.updatedAt = new Date();

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Benutzers' });
  }
});

// Benutzer löschen
router.delete('/users/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.admin.id) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
    }

    const user = await Admin.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({ message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
  }
});

// Alle Rollen abrufen
router.get('/roles', authenticateAdmin, async (req, res) => {
  try {
    const roles = await UserRole.find({ isActive: true }).sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Rollen' });
  }
});

// Neue Rolle erstellen
router.post('/roles', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, displayName, permissions } = req.body;

    const existingRole = await UserRole.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ error: 'Rolle bereits vorhanden' });
    }

    const newRole = new UserRole({
      name,
      displayName,
      permissions
    });

    await newRole.save();
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen der Rolle' });
  }
});

// Rolle aktualisieren
router.put('/roles/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { displayName, permissions, isActive } = req.body;
    
    const role = await UserRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Rolle nicht gefunden' });
    }

    role.displayName = displayName || role.displayName;
    role.permissions = permissions || role.permissions;
    role.isActive = isActive !== undefined ? isActive : role.isActive;
    role.updatedAt = new Date();

    await role.save();
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Rolle' });
  }
});

module.exports = router;