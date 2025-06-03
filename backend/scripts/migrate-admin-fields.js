// backend/scripts/migrate-admin-fields.js
const mongoose = require('mongoose');
const { Admin } = require('../models');
require('dotenv').config();

const migrateAdminFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartphone-manager');
    console.log('MongoDB verbunden für Migration');

    // Alle Admins ohne die neuen Felder finden und aktualisieren
    const result = await Admin.updateMany(
      {
        $or: [
          { mustChangePassword: { $exists: false } },
          { firstLogin: { $exists: false } }
        ]
      },
      {
        $set: {
          mustChangePassword: false, // Bestehende Admins müssen nicht ihr Passwort ändern
          firstLogin: false,         // Bestehende Admins sind nicht mehr "first login"
          lastPasswordChange: null   // Setze auf null für bestehende Accounts
        }
      }
    );

    console.log(`${result.modifiedCount} Admin-Accounts wurden aktualisiert`);

    // Super-Admin check - falls noch kein super_admin existiert
    const superAdminExists = await Admin.findOne({ role: 'super_admin' });
    
    if (!superAdminExists) {
      console.log('Kein Super-Admin gefunden. Erstelle Standard Super-Admin...');
      
      // Finde den ersten Admin und mache ihn zum Super-Admin
      const firstAdmin = await Admin.findOne({ role: 'admin' });
      
      if (firstAdmin) {
        firstAdmin.role = 'super_admin';
        await firstAdmin.save();
        console.log(`Admin "${firstAdmin.username}" wurde zum Super-Admin gemacht`);
      } else {
        console.log('Kein Admin-Account gefunden. Bitte erstelle manuell einen Super-Admin.');
      }
    } else {
      console.log(`Super-Admin existiert bereits: ${superAdminExists.username}`);
    }

    console.log('Migration abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    process.exit(1);
  }
};

// Script ausführen
migrateAdminFields();