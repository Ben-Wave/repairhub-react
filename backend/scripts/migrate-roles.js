// backend/scripts/migrate-roles.js - Migrationsskript für Tools-Berechtigung
const mongoose = require('mongoose');
require('dotenv').config();

// Schema Definitionen (vereinfacht)
const userRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  permissions: {
    devices: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    parts: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    resellers: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false }
    },
    system: {
      userManagement: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
      statistics: { type: Boolean, default: false }
    },
    tools: {
      priceCalculator: { type: Boolean, default: false }
    }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserRole = mongoose.model('UserRole', userRoleSchema);

async function migrateRoles() {
  try {
    console.log('🔄 Starte Rollen-Migration...');
    
    // Verbindung zur Datenbank
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartphone-manager');
    console.log('✅ Datenbankverbindung hergestellt');

    // 1. Bestehende Rollen um tools.priceCalculator erweitern
    const existingRoles = await UserRole.find({});
    console.log(`📋 ${existingRoles.length} bestehende Rollen gefunden`);

    for (const role of existingRoles) {
      if (!role.permissions.tools) {
        role.permissions.tools = { priceCalculator: false };
        role.updatedAt = new Date();
        await role.save();
        console.log(`✅ Tools-Berechtigung zu Rolle "${role.name}" hinzugefügt`);
      }
    }

    // 2. Standard-Rollen erstellen/aktualisieren
    const standardRoles = [
      {
        name: 'calculator_user',
        displayName: 'Preisrechner Benutzer',
        permissions: {
          devices: { view: false, create: false, edit: false, delete: false },
          parts: { view: true, create: false, edit: false, delete: false }, // Braucht parts.view für Preisrechner
          resellers: { view: false, create: false, edit: false, delete: false, assign: false },
          system: { userManagement: false, settings: false, statistics: false },
          tools: { priceCalculator: true }
        }
      },
      {
        name: 'viewer',
        displayName: 'Betrachter',
        permissions: {
          devices: { view: true, create: false, edit: false, delete: false },
          parts: { view: true, create: false, edit: false, delete: false },
          resellers: { view: false, create: false, edit: false, delete: false, assign: false },
          system: { userManagement: false, settings: false, statistics: true },
          tools: { priceCalculator: true }
        }
      },
      {
        name: 'manager',
        displayName: 'Manager',
        permissions: {
          devices: { view: true, create: true, edit: true, delete: false },
          parts: { view: true, create: true, edit: true, delete: false },
          resellers: { view: true, create: false, edit: false, delete: false, assign: true },
          system: { userManagement: false, settings: false, statistics: true },
          tools: { priceCalculator: true }
        }
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        permissions: {
          devices: { view: true, create: true, edit: true, delete: true },
          parts: { view: true, create: true, edit: true, delete: true },
          resellers: { view: true, create: true, edit: true, delete: true, assign: true },
          system: { userManagement: true, settings: true, statistics: true },
          tools: { priceCalculator: true }
        }
      }
    ];

    for (const roleData of standardRoles) {
      const existingRole = await UserRole.findOne({ name: roleData.name });
      
      if (existingRole) {
        // Aktualisiere bestehende Rolle
        existingRole.permissions = roleData.permissions;
        existingRole.updatedAt = new Date();
        await existingRole.save();
        console.log(`✅ Rolle "${roleData.name}" aktualisiert`);
      } else {
        // Erstelle neue Rolle
        const newRole = new UserRole(roleData);
        await newRole.save();
        console.log(`✅ Neue Rolle "${roleData.name}" erstellt`);
      }
    }

    console.log('✅ Migration erfolgreich abgeschlossen!');
    
    // Übersicht anzeigen
    console.log('\n📊 Rollen-Übersicht:');
    const allRoles = await UserRole.find({}).sort({ name: 1 });
    for (const role of allRoles) {
      console.log(`  - ${role.displayName} (${role.name})`);
      console.log(`    Preisrechner: ${role.permissions.tools?.priceCalculator ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Datenbankverbindung getrennt');
  }
}

// Script direkt ausführen
if (require.main === module) {
  migrateRoles().then(() => {
    console.log('🏁 Migration beendet');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration fehlgeschlagen:', error);
    process.exit(1);
  });
}

module.exports = { migrateRoles };