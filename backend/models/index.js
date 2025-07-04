// backend/models/index.js - ERWEITERT für PurchaseGuide + InviteToken (User & Reseller)
const mongoose = require('mongoose');

// Erweiterte Device Schema mit umfassenden Ankaufsinformationen
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
  
  // NEU: Erweiterte Ankaufsinformationen
  purchaseInfo: {
    seller: { type: String, default: '' },
    location: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    method: { 
      type: String, 
      default: 'manual',
      enum: ['manual', 'guided', 'bulk', 'import']
    }
  },
  
  // NEU: Detaillierte Akkuinformationen
  batteryInfo: {
    health: { type: Number, min: 0, max: 100 }, // Akkugesundheit in %
    maxCapacity: { type: Number }, // Maximale Kapazität in mAh
    cycleCount: { type: Number }, // Ladezyklen (falls bekannt)
    needsReplacement: { type: Boolean, default: false },
    lastTestedDate: { type: Date, default: Date.now },
    chargingSpeed: { 
      type: String, 
      enum: ['fast', 'normal', 'slow', 'defective'],
      default: 'normal'
    }
  },
  
  // NEU: Funktionsstatus aus Ankaufsprüfung
  functionalStatus: {
    allButtonsWork: { type: Boolean, default: true },
    touchscreenFunctional: { type: Boolean, default: true },
    camerasWork: { type: Boolean, default: true },
    speakersWork: { type: Boolean, default: true },
    microphoneWorks: { type: Boolean, default: true },
    wifiWorks: { type: Boolean, default: true },
    cellularWorks: { type: Boolean, default: true },
    bluetoothWorks: { type: Boolean, default: true },
    authenticationWorks: { type: Boolean, default: true }, // Face ID/Touch ID
    chargingWorks: { type: Boolean, default: true },
    fastCharging: { type: Boolean, default: true },
    lastTestedDate: { type: Date, default: Date.now },
    overallFunctional: { type: Boolean, default: true }
  },
  
  // NEU: Physischer Zustand aus Ankaufsprüfung
  physicalCondition: {
    overallGrade: { 
      type: String, 
      enum: ['A+', 'A', 'B', 'C', 'D'],
      default: 'A'
    },
    displayCondition: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    displayDamage: [{ 
      type: String,
      enum: ['cracked', 'deadPixels', 'screenBurn', 'scratches', 'yellowTint', 'touchIssues']
    }],
    bodyCondition: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    bodyDamage: [{
      type: String,
      enum: ['dents', 'scratches', 'backGlass', 'cameraBump', 'buttons', 'ports']
    }],
    hasWaterDamage: { type: Boolean, default: false },
    previousRepairs: { type: Boolean, default: false },
    repairHistory: { type: String, default: '' },
    portsCondition: { 
      type: String, 
      enum: ['clean', 'dusty', 'damaged'],
      default: 'clean'
    }
  },
  
  // NEU: Software-Informationen
  softwareInfo: {
    iosVersion: { type: String, default: '' },
    availableStorage: { type: Number, default: 0 }, // GB
    totalStorage: { type: Number, default: 0 }, // GB (aus Modell abgeleitet)
    icloudStatus: { 
      type: String, 
      enum: ['clean', 'locked', 'unknown'],
      default: 'clean'
    },
    carrierStatus: { 
      type: String, 
      enum: ['unlocked', 'locked', 'unknown'],
      default: 'unlocked'
    },
    lastBackupDate: { type: Date },
    resetToFactory: { type: Boolean, default: false },
    jailbroken: { type: Boolean, default: false }
  },
  
  // NEU: Qualitätsbewertungen
  qualityAssessment: {
    displayBrightness: { type: Number, min: 1, max: 10, default: 8 },
    touchSensitivity: { type: Number, min: 1, max: 10, default: 8 },
    cameraQuality: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    audioQuality: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    overallPerformance: { type: Number, min: 1, max: 10, default: 8 },
    functionalIssues: [{ type: String }], // Array von erkannten Problemen
    testDate: { type: Date, default: Date.now }
  },
  
  // NEU: Marktbewertung
  marketValuation: {
    estimatedMarketValue: { type: Number, default: 0 },
    conditionMultiplier: { type: Number, default: 1.0 },
    estimatedRepairCosts: { type: Number, default: 0 },
    profitMarginExpected: { type: Number, default: 0 },
    valuationDate: { type: Date, default: Date.now },
    marketSource: { 
      type: String, 
      default: 'internal',
      enum: ['internal', 'external_api', 'manual', 'automated']
    },
    priceHistory: [{
      date: { type: Date, default: Date.now },
      price: { type: Number },
      source: { type: String }
    }]
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index für bessere Performance
deviceSchema.index({ imei: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ purchaseDate: -1 });
deviceSchema.index({ 'batteryInfo.health': 1 });
deviceSchema.index({ 'physicalCondition.overallGrade': 1 });
deviceSchema.index({ 'purchaseInfo.method': 1 });

// Virtual für kalkulierten Verkaufspreis
deviceSchema.virtual('calculatedSellingPrice').get(function() {
  const partsTotal = this.parts.reduce((sum, part) => sum + (part.price || 0), 0);
  return (this.purchasePrice || 0) + partsTotal + (this.desiredProfit || 0);
});

// Virtual für Akkustatus
deviceSchema.virtual('batteryStatus').get(function() {
  if (!this.batteryInfo || !this.batteryInfo.health) return 'unknown';
  if (this.batteryInfo.health >= 90) return 'excellent';
  if (this.batteryInfo.health >= 80) return 'good';
  if (this.batteryInfo.health >= 70) return 'fair';
  return 'poor';
});

// Virtual für Gesamtzustand
deviceSchema.virtual('overallCondition').get(function() {
  if (!this.physicalCondition || !this.functionalStatus) return 'unknown';
  
  const gradeMap = { 'A+': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
  const physicalScore = gradeMap[this.physicalCondition.overallGrade] || 3;
  const functionalScore = this.functionalStatus.overallFunctional ? 5 : 2;
  const batteryScore = this.batteryInfo?.health ? Math.floor(this.batteryInfo.health / 20) : 3;
  
  const avgScore = (physicalScore + functionalScore + batteryScore) / 3;
  
  if (avgScore >= 4.5) return 'excellent';
  if (avgScore >= 3.5) return 'good';
  if (avgScore >= 2.5) return 'fair';
  return 'poor';
});

// Middleware für automatisches updatedAt
deviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Automatische Berechnung des Verkaufspreises
  if (this.parts && this.purchasePrice !== undefined && this.desiredProfit !== undefined) {
    const partsTotal = this.parts.reduce((sum, part) => sum + (part.price || 0), 0);
    this.sellingPrice = this.purchasePrice + partsTotal + this.desiredProfit;
  }
  
  // Automatische Bestimmung ob Akku ersetzt werden muss
  if (this.batteryInfo && this.batteryInfo.health !== undefined) {
    this.batteryInfo.needsReplacement = this.batteryInfo.health < 80;
  }
  
  next();
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

// Reseller Schema mit Passwort-Feldern
const resellerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  firstLogin: { type: Boolean, default: true },
  lastPasswordChange: { type: Date },
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

// ERWEITERT: Admin Schema mit Passwort-Feldern
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['super_admin', 'admin', 'manager', 'viewer'] },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  mustChangePassword: { type: Boolean, default: false },
  firstLogin: { type: Boolean, default: false },
  lastPasswordChange: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// UserRole Schema mit erweiterten Tools-Berechtigungen
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
      priceCalculator: { type: Boolean, default: false },
      purchaseGuide: { type: Boolean, default: false }
    }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// NEU: InviteToken Schema für E-Mail-basierte Benutzer- UND Reseller-Einladungen
const inviteTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  name: { type: String }, // Optional - falls Admin schon Name einträgt
  
  // NEU: Typ unterscheiden (user oder reseller)
  type: { 
    type: String, 
    required: true,
    enum: ['user', 'reseller'],
    default: 'user'
  },
  
  // Für User-Einladungen
  role: { type: String, default: 'admin' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' },
  
  // NEU: Für Reseller-Einladungen
  resellerData: {
    company: { type: String },
    phone: { type: String }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Compound Index für E-Mail + Typ (ein User kann nicht gleichzeitig User und Reseller sein)
inviteTokenSchema.index({ email: 1, type: 1 }, { unique: true });
inviteTokenSchema.index({ token: 1 });
inviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Automatisches Löschen abgelaufener Tokens

// Virtual für Token-Status
inviteTokenSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual für verbleibende Zeit
inviteTokenSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return remaining > 0 ? remaining : 0;
});

// Middleware für automatische Token-Generierung
inviteTokenSchema.pre('save', function(next) {
  if (!this.token) {
    const crypto = require('crypto');
    this.token = crypto.randomBytes(32).toString('hex');
  }
  
  if (!this.expiresAt) {
    // Standard: 48 Stunden Gültigkeit
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
  
  next();
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
  InviteToken: mongoose.models.InviteToken || mongoose.model('InviteToken', inviteTokenSchema)
};