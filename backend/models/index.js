// backend/models/index.js
const mongoose = require('mongoose');

// Device Schema
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
  // Neues Feld für den tatsächlichen Verkaufspreis
  actualSellingPrice: { type: Number },
  status: { 
    type: String, 
    default: 'gekauft', 
    enum: ['gekauft', 'in_reparatur', 'verkaufsbereit', 'zum_verkauf', 'verkauft'] // NEU: 'verkaufsbereit'
  },
  purchaseDate: { type: Date, default: Date.now },
  soldDate: Date,
  apiResponse: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Part 
const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  forModel: { type: String, required: true },
  category: { type: String, required: true },
  externalSource: { type: String, default: null },
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 0 }, // <--- NEU: Lagerbestand
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// SyncConfig Schema
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

// Export models (mit Schutz gegen OverwriteModelError)
module.exports = {
  Device: mongoose.models.Device || mongoose.model('Device', deviceSchema),
  Part: mongoose.models.Part || mongoose.model('Part', partSchema),
  SyncConfig: mongoose.models.SyncConfig || mongoose.model('SyncConfig', syncConfigSchema)
};