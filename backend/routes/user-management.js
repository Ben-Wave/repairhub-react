// Backend Routes - backend/routes/user-management.js - ERWEITERT mit E-Mail-Einladungen
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Admin, UserRole, InviteToken } = require('../models');
const { authenticateAdmin } = require('./admin-auth');
const emailService = require('../services/emailService');
const router = express.Router();

// Middleware für Super-Admin Check
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super-Admin Berechtigung erforderlich' });
  }
  next();
};

// ===== USER MANAGEMENT =====

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

// NEU: Benutzer über E-Mail einladen (moderne Variante)
router.post('/invite-user', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, name, role, roleId } = req.body;

    // Validierung
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich' });
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Prüfen ob E-Mail bereits als User existiert
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer mit dieser E-Mail existiert bereits' });
    }

    // Prüfen ob bereits eine offene Einladung existiert
    const existingInvite = await InviteToken.findOne({ 
      email, 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvite) {
      return res.status(400).json({ 
        error: 'Für diese E-Mail existiert bereits eine offene Einladung',
        expiresAt: existingInvite.expiresAt
      });
    }

    // NEU: Token und Ablaufzeit MANUELL generieren (statt auf pre-save zu vertrauen)
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Stunden

    // Neue Einladung erstellen
    const inviteToken = new InviteToken({
      email,
      token: token, // EXPLIZIT setzen
      name: name || null,
      role: role || 'admin',
      roleId: roleId || null,
      createdBy: req.admin.id,
      expiresAt: expiresAt // EXPLIZIT setzen
    });

    console.log('📧 Erstelle InviteToken mit:', {
      email,
      token: token.substring(0, 8) + '...',
      expiresAt
    });

    await inviteToken.save();

    console.log('✅ InviteToken erfolgreich erstellt');

    // E-Mail senden
    const emailResult = await emailService.sendUserInvitation(email, token, name);
    
    if (!emailResult.success) {
      console.error('❌ E-Mail-Versand fehlgeschlagen:', emailResult.error);
      // Falls E-Mail fehlschlägt, Einladung löschen
      await InviteToken.findByIdAndDelete(inviteToken._id);
      return res.status(500).json({ 
        error: 'Fehler beim Senden der Einladungs-E-Mail',
        details: emailResult.error 
      });
    }

    console.log('✅ E-Mail erfolgreich gesendet');

    res.status(201).json({
      message: 'Einladung erfolgreich gesendet',
      invite: {
        id: inviteToken._id,
        email: inviteToken.email,
        name: inviteToken.name,
        expiresAt: inviteToken.expiresAt,
        createdAt: inviteToken.createdAt
      },
      emailSent: true,
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('❌ Fehler beim Senden der Benutzereinladung:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Benutzereinladung' });
  }
});

// NEU: Einladung erneut senden
router.post('/resend-invite/:inviteId', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const invite = await InviteToken.findById(req.params.inviteId);
    
    if (!invite) {
      return res.status(404).json({ error: 'Einladung nicht gefunden' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ error: 'Einladung wurde bereits verwendet' });
    }

    if (invite.isExpired) {
      return res.status(400).json({ error: 'Einladung ist abgelaufen' });
    }

    // E-Mail erneut senden
    const emailResult = await emailService.sendUserInvitation(invite.email, invite.token, invite.name);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        error: 'Fehler beim erneuten Senden der E-Mail',
        details: emailResult.error 
      });
    }

    res.json({
      message: 'Einladung erfolgreich erneut gesendet',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('Fehler beim erneuten Senden der Einladung:', error);
    res.status(500).json({ error: 'Fehler beim erneuten Senden der Einladung' });
  }
});

// Neuen Benutzer erstellen (alte Methode - für Kompatibilität)
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

    // Temporäres Passwort = Username
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
      mustChangePassword: true,
      firstLogin: true,
      lastPasswordChange: null
    });

    await newUser.save();

    // Passwort aus Response entfernen, aber temporäres Passwort für Admin anzeigen
    const userResponse = newUser.toObject();
    delete userResponse.password;
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

// Passwort zurücksetzen (Admin kann User-Passwort auf Username zurücksetzen)
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

// ===== INVITE MANAGEMENT =====

// Alle offenen Einladungen abrufen
router.get('/invites', authenticateAdmin, async (req, res) => {
  try {
    const invites = await InviteToken.find({ 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })
    .populate('createdBy', 'name username')
    .populate('roleId', 'displayName')
    .sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    console.error('Fehler beim Abrufen der Einladungen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einladungen' });
  }
});

// Einladung löschen/widerrufen
router.delete('/invites/:inviteId', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const invite = await InviteToken.findById(req.params.inviteId);
    
    if (!invite) {
      return res.status(404).json({ error: 'Einladung nicht gefunden' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ error: 'Einladung wurde bereits verwendet und kann nicht widerrufen werden' });
    }

    await InviteToken.findByIdAndDelete(req.params.inviteId);

    res.json({ message: 'Einladung erfolgreich widerrufen' });
  } catch (error) {
    console.error('Fehler beim Widerrufen der Einladung:', error);
    res.status(500).json({ error: 'Fehler beim Widerrufen der Einladung' });
  }
});

// ===== REGISTRATION FLOW =====

// NEU: Token validieren (für Frontend-Registrierungsseite)
router.get('/validate-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token erforderlich' });
    }

    const invite = await InviteToken.findOne({ token })
      .populate('roleId', 'displayName');

    if (!invite) {
      return res.status(404).json({ error: 'Ungültiger Einladungslink' });
    }

    if (invite.isUsed) {
      return res.status(400).json({ 
        error: 'Einladung wurde bereits verwendet',
        usedAt: invite.usedAt
      });
    }

    if (invite.isExpired) {
      return res.status(400).json({ 
        error: 'Einladungslink ist abgelaufen',
        expiredAt: invite.expiresAt
      });
    }

    // Prüfen ob bereits ein User mit dieser E-Mail existiert
    const existingUser = await Admin.findOne({ email: invite.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer mit dieser E-Mail existiert bereits' });
    }

    // Token ist gültig - Informationen für Registrierung zurückgeben
    res.json({
      valid: true,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      roleName: invite.roleId ? invite.roleId.displayName : invite.role,
      expiresAt: invite.expiresAt,
      timeRemaining: invite.timeRemaining
    });

  } catch (error) {
    console.error('Fehler bei Token-Validierung:', error);
    res.status(500).json({ error: 'Fehler bei der Token-Validierung' });
  }
});

// NEU: Registrierung vervollständigen
router.post('/complete-registration', async (req, res) => {
  try {
    const { token, username, password, name } = req.body;

    // Validierung
    if (!token || !username || !password) {
      return res.status(400).json({ error: 'Token, Username und Passwort sind erforderlich' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Token validieren
    const invite = await InviteToken.findOne({ token });

    if (!invite || invite.isUsed || invite.isExpired) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Einladungslink' });
    }

    // Prüfen ob Username bereits existiert
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username bereits vergeben' });
    }

    // Prüfen ob E-Mail bereits als User existiert
    const existingEmail = await Admin.findOne({ email: invite.email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Benutzer mit dieser E-Mail existiert bereits' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Benutzer erstellen
    const newUser = new Admin({
      username,
      email: invite.email,
      password: hashedPassword,
      name: name || invite.name || username,
      role: invite.role,
      roleId: invite.roleId,
      createdBy: invite.createdBy,
      mustChangePassword: false,
      firstLogin: false,
      lastPasswordChange: new Date(),
      isActive: true
    });

    await newUser.save();

    // Einladung als verwendet markieren
    invite.isUsed = true;
    invite.usedAt = new Date();
    await invite.save();

    // Antwort ohne Passwort
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Registrierung erfolgreich abgeschlossen',
      user: userResponse
    });

  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
});

// ===== ROLE MANAGEMENT =====

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

// ===== STATISTICS & UTILITIES =====

// Benutzer-Aktivitäten abrufen (Audit Log)
router.get('/users/:id/activity', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id).select('username name email createdAt updatedAt lastPasswordChange');
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const activity = {
      user: user,
      lastLogin: null,
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
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      }),
      InviteToken.countDocuments({ 
        isUsed: false,
        expiresAt: { $gt: new Date() }
      })
    ]);

    res.json({
      activeUsers: stats[0],
      inactiveUsers: stats[1],
      usersNeedingPasswordChange: stats[2],
      activeRoles: stats[3],
      newUsersLast30Days: stats[4],
      pendingInvites: stats[5]
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

// NEU: Test-E-Mail senden (für Setup-Prüfung)
router.post('/test-email', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse erforderlich' });
    }

    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      res.json({
        message: 'Test-E-Mail erfolgreich gesendet',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        error: 'Fehler beim Senden der Test-E-Mail',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Fehler beim Senden der Test-E-Mail:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Test-E-Mail' });
  }
});

module.exports = router;