// backend/debug-reseller-stats.js (NEUE DATEI)

const mongoose = require('mongoose');
const { DeviceAssignment, Reseller } = require('./models');
require('dotenv').config();

async function debugResellerStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/smartphone-manager');
    
    // Alle Reseller auflisten
    const resellers = await Reseller.find({});
    console.log('Alle Reseller:');
    resellers.forEach(r => {
      console.log(`- ${r.name} (${r.username}) - ID: ${r._id}`);
    });
    
    // Alle Assignments auflisten
    const assignments = await DeviceAssignment.find({})
      .populate('resellerId', 'name username')
      .populate('deviceId', 'model imei');
    
    console.log('\nAlle Device Assignments:');
    assignments.forEach(a => {
      console.log(`- ${a.deviceId?.model} → ${a.resellerId?.name} (Status: ${a.status})`);
    });
    
    // Stats für ersten Reseller testen
    if (resellers.length > 0) {
      const testReseller = resellers[0];
      console.log(`\nStats für ${testReseller.name}:`);
      
      const stats = await DeviceAssignment.aggregate([
        { $match: { resellerId: testReseller._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$actualSalePrice' }
          }
        }
      ]);
      
      console.log('Raw Aggregation Result:', stats);
    }
    
  } catch (error) {
    console.error('Debug Fehler:', error);
  } finally {
    process.exit(0);
  }
}

debugResellerStats();
