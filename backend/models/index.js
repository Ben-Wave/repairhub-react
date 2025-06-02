// backend/models/index.js - ERWEITERT basierend auf deiner bestehenden Datei
const mongoose = require('mongoose');

// Device Schema (bestehend, nur erweitert für Reseller-System)
const deviceSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true },
  imei2: String,
  serial: String,
  model: String,
  modelDesc: String,
  thumbnail: String,
  network: String,
  meid: String,
  warrantyStatus: String,
  technicalSupport: Boolean,
  repairCoverage: Boolean,
  replaced: Boolean,
  replacement: Boolean,
  refurbished: Boolean,
  demoUnit: Boolean,
  fmiOn: Boolean,
  lostMode: Boolean,
  usaBlockStatus: String,
  simLock: Boolean,
  region: String,
  purchasePrice: { type: Number, default: 0 },
  damageDescription: { type: String, default: '' },
  parts: [{
    partNumber: String,
    price: Number
  }],
  desiredProfit: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  actualSellingPrice: { type: Number },
  status: { 
    type: String, 
    default: 'gekauft', 
    enum: ['gekauft', 'in_reparatur', 'verkaufsbereit', 'zum_verkauf', 'verkauft']
  },
  purchaseDate: { type: Date, default: Date.now },
  soldDate: Date,
  apiResponse: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Part Schema (bestehend)
const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  forModel: { type: String, required: true },
  category: { type: String, required: true },
  externalSource: { type: String, default: null },
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// SyncConfig Schema (bestehend)
const syncConfigSchema = new mongoose.Schema({
  lastSyncTime: { type: Date, default: null },
  syncEnabled: { type: Boolean, default: true },
  syncInterval: { type: String, default: '0 0 * * *' },
  autoUpdatePrices: { type: Boolean, default: true },
  addNewParts: { type: Boolean, default: true },
  categories: [String],
  models: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Neue Schemas für Reseller-System
const resellerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  // NEU: Felder für Passwort-Reset
  mustChangePassword: { type: Boolean, default: true }, // Muss Passwort bei erstem Login ändern
  firstLogin: { type: Boolean, default: true }, // Ist das der erste Login?
  lastPasswordChange: { type: Date }, // Wann wurde Passwort zuletzt geändert
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const deviceAssignmentSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reseller', required: true },
  assignedAt: { type: Date, default: Date.now },
  minimumPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['assigned', 'received', 'sold', 'returned'], 
    default: 'assigned' 
  },
  receivedAt: { type: Date },
  soldAt: { type: Date },
  actualSalePrice: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['super_admin', 'admin', 'manager', 'viewer'] },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' }, // Verweis auf detaillierte Rolle
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ERWEITERT: UserRole Schema mit tools.priceCalculator
const userRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // z.B. "admin", "manager", "viewer", "calculator_user"
  displayName: { type: String, required: true }, // z.B. "Administrator", "Manager", "Nur Ansicht", "Preisrechner Benutzer"
  permissions: {
    // Geräte-Berechtigung
    devices: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    // Ersatzteile-Berechtigung
    parts: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    // Reseller-Berechtigung
    resellers: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false } // Geräte zuweisen
    },
    // System-Berechtigung
    system: {
      userManagement: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
      statistics: { type: Boolean, default: false }
    },
    // NEU: Tools-Berechtigung
    tools: {
      priceCalculator: { type: Boolean, default: false }
    }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Export models (mit Schutz gegen OverwriteModelError)
module.exports = {
  Device: mongoose.models.Device || mongoose.model('Device', deviceSchema),
  Part: mongoose.models.Part || mongoose.model('Part', partSchema),
  SyncConfig: mongoose.models.SyncConfig || mongoose.model('SyncConfig', syncConfigSchema),
  Reseller: mongoose.models.Reseller || mongoose.model('Reseller', resellerSchema),
  DeviceAssignment: mongoose.models.DeviceAssignment || mongoose.model('DeviceAssignment', deviceAssignmentSchema),
  Admin: mongoose.models.Admin || mongoose.model('Admin', adminSchema),
  UserRole: mongoose.models.UserRole || mongoose.model('UserRole', userRoleSchema),
};