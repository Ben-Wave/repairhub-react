// backend/scripts/foneday-sync.js
const axios = require('axios');
const cron = require('node-cron');
const { Part, SyncConfig } = require('../models'); // Korrekter Import

// Axios-Instanz für Foneday API
let fonedayApi;

// Funktion zum Initialisieren der API
function initializeApi() {
  const token = process.env.FONEDAY_API_TOKEN;
  if (!token) {
    console.error('FONEDAY_API_TOKEN nicht in Umgebungsvariablen gefunden');
    return false;
  }

  fonedayApi = axios.create({
    baseURL: 'https://foneday.shop/api/v1',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return true;
}

// Funktion zum Abrufen der aktuellen Konfiguration
async function getConfig() {
  let config = await SyncConfig.findOne({});
  
  if (!config) {
    // Erstelle Standardkonfiguration, wenn keine existiert
    config = new SyncConfig();
    await config.save();
  }
  
  return config;
}

// Hauptsynchronisierungsfunktion
async function synchronizeCatalog() {
  console.log('Starte Foneday Katalog-Synchronisierung...');
  
  if (!fonedayApi && !initializeApi()) {
    return { error: 'API konnte nicht initialisiert werden' };
  }
  
  const startTime = new Date();
  const config = await getConfig();
  
  if (!config.syncEnabled) {
    console.log('Synchronisierung ist deaktiviert. Vorgang abgebrochen.');
    return { error: 'Synchronisierung deaktiviert' };
  }
  
  try {
    // Alle Produkte von Foneday abrufen
    const response = await fonedayApi.get('/products');
    const products = response.data.products || [];
    
    console.log(`${products.length} Produkte vom Foneday API abgerufen.`);
    
    let filteredProducts = products;
    
    // Nach Kategorien filtern, falls konfiguriert
    if (config.categories && config.categories.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        config.categories.includes(product.category)
      );
      console.log(`Nach Kategorien gefiltert: ${filteredProducts.length} Produkte übrig.`);
    }
    
    // Nach Modellen filtern, falls konfiguriert
    if (config.models && config.models.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product.suitable_for) return false;
        
        return config.models.some(model => 
          product.suitable_for.toLowerCase().includes(model.toLowerCase())
        );
      });
      console.log(`Nach Modellen gefiltert: ${filteredProducts.length} Produkte übrig.`);
    }
    
    // Synchronisierungsstatistiken
    const stats = {
      total: filteredProducts.length,
      updated: 0,
      added: 0,
      skipped: 0,
      errors: []
    };
    
    // Produkte verarbeiten
    for (const product of filteredProducts) {
      try {
        if (!product.sku) {
          stats.skipped++;
          continue;
        }
        
        // Prüfen, ob das Produkt bereits existiert
        const existingPart = await Part.findOne({ partNumber: product.sku });
        
        if (existingPart) {
          // Nur aktualisieren, wenn Preisänderungen übernommen werden sollen
          if (config.autoUpdatePrices) {
            existingPart.description = product.title || existingPart.description;
            existingPart.price = parseFloat(product.price) || existingPart.price;
            existingPart.forModel = product.suitable_for || existingPart.forModel;
            existingPart.category = product.category || existingPart.category;
            existingPart.inStock = product.instock === 'Y';
            existingPart.updatedAt = new Date();
            
            await existingPart.save();
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } else if (config.addNewParts) {
          // Neues Produkt erstellen
          const newPart = new Part({
            partNumber: product.sku,
            description: product.title || '',
            price: parseFloat(product.price) || 0,
            forModel: product.suitable_for || '',
            category: product.category || 'Sonstiges',
            externalSource: 'foneday',
            inStock: product.instock === 'Y',
            createdAt: new Date()
          });
          
          await newPart.save();
          stats.added++;
        } else {
          stats.skipped++;
        }
      } catch (partError) {
        console.error(`Fehler bei Produkt ${product.sku}:`, partError);
        stats.errors.push({
          sku: product.sku,
          error: partError.message
        });
        stats.skipped++;
      }
    }
    
    // Aktualisiere die Konfiguration mit dem letzten Synchronisierungszeitpunkt
    config.lastSyncTime = startTime;
    await config.save();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in Sekunden
    
    console.log(`Synchronisierung abgeschlossen in ${duration.toFixed(2)} Sekunden.`);
    console.log(`Statistik: ${stats.updated} aktualisiert, ${stats.added} hinzugefügt, ${stats.skipped} übersprungen, ${stats.errors.length} Fehler.`);
    
    return stats;
  } catch (error) {
    console.error('Fehler bei der Synchronisierung:', error);
    return { error: error.message };
  }
}

// Globaler Cron-Job für Synchronisierung
let syncJob = null;

// Funktion zum Starten des Cron-Jobs
async function setupCronJob() {
  try {
    const config = await getConfig();
    
    // Bestehenden Job stoppen, falls vorhanden
    if (syncJob) {
      syncJob.stop();
      syncJob = null;
    }
    
    if (!config.syncEnabled) {
      console.log('Automatische Synchronisierung ist deaktiviert.');
      return;
    }
    
    // Neuen Cron-Job mit konfiguriertem Intervall starten
    const cronExpression = config.syncInterval || '0 0 * * *'; // Standard: Täglich um Mitternacht
    
    // Prüfen, ob der Cron-Ausdruck gültig ist
    try {
      cron.validate(cronExpression);
    } catch (cronError) {
      console.error('Ungültiger Cron-Ausdruck:', cronError);
      return;
    }
    
    syncJob = cron.schedule(cronExpression, async () => {
      console.log(`Geplante Synchronisierung gestartet: ${new Date().toISOString()}`);
      try {
        await synchronizeCatalog();
      } catch (error) {
        console.error('Fehler bei geplanter Synchronisierung:', error);
      }
    });
    
    console.log(`Cron-Job für Foneday-Synchronisierung eingerichtet: ${cronExpression}`);
  } catch (error) {
    console.error('Fehler beim Einrichten des Cron-Jobs:', error);
  }
}

// API initialisieren
initializeApi();

// Exportiere Funktionen für die externe Verwendung
module.exports = {
  synchronizeCatalog,
  setupCronJob,
  getConfig
};