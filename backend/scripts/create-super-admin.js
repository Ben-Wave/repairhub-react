// backend/scripts/create-super-admin.js - Script zum Erstellen des ersten Admin-Benutzers
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Schema Definition (vereinfacht)
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'manager', 'viewer'], default: 'admin' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createSuperAdmin() {
  try {
    console.log('🔄 Verbinde mit Datenbank...');
    
    // Verbindung zur Datenbank
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartphone-manager');
    console.log('✅ Datenbankverbindung hergestellt');

    // Prüfe ob bereits ein Super-Admin existiert
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('ℹ️  Super-Admin bereits vorhanden:');
      console.log(`   Username: ${existingSuperAdmin.username}`);
      console.log(`   E-Mail: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      return;
    }

    // Standard Super-Admin Daten
    const superAdminData = {
      username: 'admin',
      email: 'admin@repairhub.com',
      password: 'admin123', // WICHTIG: Nach dem ersten Login ändern!
      name: 'System Administrator',
      role: 'super_admin',
      isActive: true
    };

    console.log('🔐 Verschlüssele Passwort...');
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
    superAdminData.password = hashedPassword;

    console.log('👤 Erstelle Super-Admin...');
    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();

    console.log('✅ Super-Admin erfolgreich erstellt!');
    console.log('\n📋 Login-Daten:');
    console.log(`   Username: admin`);
    console.log(`   Passwort: admin123`);
    console.log(`   E-Mail: admin@repairhub.com`);
    console.log('\n⚠️  WICHTIG: Bitte ändere das Passwort nach dem ersten Login!');

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Super-Admin:', error);
    
    if (error.code === 11000) {
      console.log('ℹ️  Username oder E-Mail bereits vergeben. Prüfe bestehende Admins:');
      try {
        const existingAdmins = await Admin.find({}).select('username email name role');
        existingAdmins.forEach(admin => {
          console.log(`   - ${admin.name} (${admin.username}) - ${admin.role}`);
        });
      } catch (listError) {
        console.error('Fehler beim Auflisten bestehender Admins:', listError);
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Datenbankverbindung getrennt');
  }
}

// Script direkt ausführen
if (require.main === module) {
  createSuperAdmin().then(() => {
    console.log('🏁 Script beendet');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script fehlgeschlagen:', error);
    process.exit(1);
  });
}

module.exports = { createSuperAdmin };