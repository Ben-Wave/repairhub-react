// Backend Routes - backend/routes/user-management.js - VOLLSTÄNDIG
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
    console.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer' });
  }
});

// Neuen Benutzer erstellen - ERWEITERT mit automatischem Passwort
router.post('/users', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, name, role, roleId } = req.body;

    // Validierung
    if (!username || !email || !name) {
      return res.status(400).json({ error: 'Username, Email und Name sind erforderlich' });
    }

    // Prüfen ob Username/Email bereits existiert
    const existingUser = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username oder Email bereits vergeben' });
    }

    // NEU: Temporäres Passwort = Username
    const temporaryPassword = username;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const newUser = new Admin({
      username,
      email,
      password: hashedPassword,
      name,
      role: role || 'admin',
      roleId: roleId || null,
      createdBy: req.admin.id,
      // NEU: Muss Passwort beim ersten Login ändern
      mustChangePassword: true,
      firstLogin: true,
      lastPasswordChange: null
    });

    await newUser.save();

    // Passwort aus Response entfernen, aber temporäres Passwort für Admin anzeigen
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    // NEU: Temporäres Passwort in Response für Admin
    userResponse.temporaryPassword = temporaryPassword;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
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
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Benutzers' });
  }
});

// NEU: Passwort zurücksetzen (Admin kann User-Passwort auf Username zurücksetzen)
router.patch('/users/:id/reset-password', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Sich selbst nicht zurücksetzen
    if (req.params.id === req.admin.id) {
      return res.status(400).json({ error: 'Sie können Ihr eigenes Passwort nicht zurücksetzen' });
    }

    // Passwort auf Username zurücksetzen
    const newTemporaryPassword = user.username;
    const hashedPassword = await bcrypt.hash(newTemporaryPassword, 10);

    user.password = hashedPassword;
    user.mustChangePassword = true;
    user.firstLogin = true;
    user.lastPasswordChange = null;
    user.updatedAt = new Date();

    await user.save();

    res.json({ 
      message: 'Passwort erfolgreich zurückgesetzt',
      temporaryPassword: newTemporaryPassword,
      username: user.username
    });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
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
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
  }
});

// Alle Rollen abrufen
router.get('/roles', authenticateAdmin, async (req, res) => {
  try {
    const roles = await UserRole.find({ isActive: true }).sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    console.error('Fehler beim Abrufen der Rollen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Rollen' });
  }
});

// Neue Rolle erstellen
router.post('/roles', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, displayName, permissions } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name und Anzeigename sind erforderlich' });
    }

    const existingRole = await UserRole.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ error: 'Rolle bereits vorhanden' });
    }

    const newRole = new UserRole({
      name,
      displayName,
      permissions: permissions || {},
      isActive: true,
      createdBy: req.admin.id
    });

    await newRole.save();
    res.status(201).json(newRole);
  } catch (error) {
    console.error('Fehler beim Erstellen der Rolle:', error);
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
    console.error('Fehler beim Aktualisieren der Rolle:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Rolle' });
  }
});

// Rolle löschen (deaktivieren)
router.delete('/roles/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const role = await UserRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Rolle nicht gefunden' });
    }

    // Prüfen ob Benutzer diese Rolle verwenden
    const usersWithRole = await Admin.countDocuments({ roleId: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        error: `Rolle kann nicht gelöscht werden. ${usersWithRole} Benutzer verwenden diese Rolle.` 
      });
    }

    // Rolle deaktivieren statt löschen
    role.isActive = false;
    role.updatedAt = new Date();
    await role.save();

    res.json({ message: 'Rolle erfolgreich deaktiviert' });
  } catch (error) {
    console.error('Fehler beim Löschen der Rolle:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Rolle' });
  }
});

// Benutzer-Aktivitäten abrufen (Audit Log)
router.get('/users/:id/activity', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id).select('username name email createdAt updatedAt lastPasswordChange');
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Hier könnten Sie ein Audit-Log implementieren
    const activity = {
      user: user,
      lastLogin: null, // Implementierung depends on your login tracking
      passwordChanges: user.lastPasswordChange ? 1 : 0,
      accountCreated: user.createdAt,
      lastModified: user.updatedAt
    };

    res.json(activity);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzeraktivitäten:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzeraktivitäten' });
  }
});

// System-Statistiken für User Management
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      Admin.countDocuments({ isActive: true }),
      Admin.countDocuments({ isActive: false }),
      Admin.countDocuments({ mustChangePassword: true }),
      UserRole.countDocuments({ isActive: true }),
      Admin.countDocuments({ 
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        } 
      })
    ]);

    res.json({
      activeUsers: stats[0],
      inactiveUsers: stats[1],
      usersNeedingPasswordChange: stats[2],
      activeRoles: stats[3],
      newUsersLast30Days: stats[4]
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});

// Bulk-Operationen für Benutzer
router.patch('/users/bulk', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { userIds, action, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Benutzer-IDs erforderlich' });
    }

    // Verhindere Selbst-Modifikation
    if (userIds.includes(req.admin.id)) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst in Bulk-Operationen einschließen' });
    }

    let updateResult;
    
    switch (action) {
      case 'activate':
        updateResult = await Admin.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: true, updatedAt: new Date() } }
        );
        break;
        
      case 'deactivate':
        updateResult = await Admin.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: false, updatedAt: new Date() } }
        );
        break;
        
      case 'forcePasswordChange':
        updateResult = await Admin.updateMany(
          { _id: { $in: userIds } },
          { $set: { mustChangePassword: true, firstLogin: true, updatedAt: new Date() } }
        );
        break;
        
      case 'updateRole':
        if (!data.roleId) {
          return res.status(400).json({ error: 'Rollen-ID erforderlich' });
        }
        updateResult = await Admin.updateMany(
          { _id: { $in: userIds } },
          { $set: { roleId: data.roleId, updatedAt: new Date() } }
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Unbekannte Aktion' });
    }

    res.json({
      message: `Bulk-Operation erfolgreich ausgeführt`,
      modifiedCount: updateResult.modifiedCount,
      action: action
    });

  } catch (error) {
    console.error('Fehler bei Bulk-Operation:', error);
    res.status(500).json({ error: 'Fehler bei Bulk-Operation' });
  }
});

module.exports = router;