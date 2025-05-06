// backend/routes/sync.js
const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const { SyncConfig } = require('../server'); // Importiere das Model aus server.js

// Synchronisierungsskript importieren
let synchronizeCatalog, setupCronJob, getConfig;
try {
  const syncModule = require('../scripts/foneday-sync');
  synchronizeCatalog = syncModule.synchronizeCatalog;
  setupCronJob = syncModule.setupCronJob;
  getConfig = syncModule.getConfig;
} catch (error) {
  console.error('Fehler beim Importieren des Synchronisierungsskripts:', error);
  // Fallback-Funktionen definieren
  synchronizeCatalog = async () => ({ error: 'Synchronisierungsskript nicht verfügbar' });
  setupCronJob = async () => {};
  getConfig = async () => {
    let config = await SyncConfig.findOne({});
    if (!config) {
      config = new SyncConfig();
      await config.save();
    }
    return config;
  };
}

// Synchronisationseinstellungen abrufen
router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    console.error('Fehler beim Abrufen der Synchronisationseinstellungen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einstellungen' });
  }
});

// Synchronisationseinstellungen aktualisieren
router.put('/config', async (req, res) => {
  try {
    const {
      syncEnabled,
      syncInterval,
      autoUpdatePrices,
      addNewParts,
      categories,
      models
    } = req.body;
    
    let config = await SyncConfig.findOne({});
    
    if (!config) {
      config = new SyncConfig();
    }
    
    // Aktualisiere die Konfiguration
    if (syncEnabled !== undefined) config.syncEnabled = syncEnabled;
    if (syncInterval) config.syncInterval = syncInterval;
    if (autoUpdatePrices !== undefined) config.autoUpdatePrices = autoUpdatePrices;
    if (addNewParts !== undefined) config.addNewParts = addNewParts;
    if (categories) config.categories = categories;
    if (models) config.models = models;
    
    config.updatedAt = new Date();
    await config.save();
    
    // Cron-Job neu einrichten mit den aktualisierten Einstellungen
    try {
      await setupCronJob();
    } catch (cronError) {
      console.error('Fehler beim Neustart des Cron-Jobs:', cronError);
    }
    
    res.json(config);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Synchronisationseinstellungen:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Einstellungen' });
  }
});

// Manuelle Synchronisation starten
router.post('/run', async (req, res) => {
  try {
    // Synchronisation im Hintergrund starten
    synchronizeCatalog()
      .then(stats => {
        console.log('Manuelle Synchronisation abgeschlossen:', stats);
      })
      .catch(err => {
        console.error('Fehler bei manueller Synchronisation:', err);
      });
    
    // Sofort antworten, dass die Synchronisation gestartet wurde
    res.json({ 
      message: 'Synchronisation gestartet',
      startedAt: new Date()
    });
  } catch (error) {
    console.error('Fehler beim Starten der Synchronisation:', error);
    res.status(500).json({ error: 'Fehler beim Starten der Synchronisation' });
  }
});

// Synchronisationsstatus abrufen
router.get('/status', async (req, res) => {
  try {
    const config = await getConfig();
    const status = {
      enabled: config.syncEnabled,
      lastSync: config.lastSyncTime,
      nextSync: calculateNextSyncTime(config.syncInterval, config.lastSyncTime),
      cronExpression: config.syncInterval
    };
    
    res.json(status);
  } catch (error) {
    console.error('Fehler beim Abrufen des Synchronisationsstatus:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Status' });
  }
});

// Hilfsfunktion zur Berechnung der nächsten Synchronisation
function calculateNextSyncTime(cronExpression, lastSync) {
  try {
    const parser = require('cron-parser');
    const interval = parser.parseExpression(cronExpression || '0 0 * * *');
    
    // Wenn noch keine Synchronisation stattgefunden hat, den nächsten geplanten Zeitpunkt zurückgeben
    if (!lastSync) {
      return interval.next().toDate();
    }
    
    // Berechne den nächsten Zeitpunkt basierend auf dem letzten Synchronisationszeitpunkt
    const options = {
      currentDate: new Date(lastSync)
    };
    
    return parser.parseExpression(cronExpression || '0 0 * * *', options).next().toDate();
  } catch (error) {
    console.error('Fehler bei der Berechnung des nächsten Synchronisationszeitpunkts:', error);
    return null;
  }
}

module.exports = router;