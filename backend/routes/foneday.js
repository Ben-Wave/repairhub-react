// backend/routes/foneday.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Modelle importieren
const { Part } = require('../models'); // Ändere dies von '../models/part' zu '../models'

// Axios-Instanz für Foneday API
const fonedayApi = axios.create({
  baseURL: 'https://foneday.shop/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.FONEDAY_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Abrufen aller Produkte von Foneday
router.get('/products', async (req, res) => {
  try {
    const response = await fonedayApi.get('/products');
    res.json(response.data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Foneday-Produkte:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Foneday-Produkte' });
  }
});

// Suche nach Produkten von Foneday
router.get('/products/search', async (req, res) => {
  try {
    const { term, category, model } = req.query;
    
    // Alle Produkte abrufen
    const response = await fonedayApi.get('/products');
    let products = response.data.products || [];
    
    // Filtern nach den Suchkriterien
    if (term || category || model) {
      products = products.filter(product => {
        let matchesTerm = true;
        let matchesCategory = true;
        let matchesModel = true;
        
        if (term) {
          const termLower = term.toLowerCase();
          matchesTerm = 
            product.title?.toLowerCase().includes(termLower) ||
            product.sku?.toLowerCase().includes(termLower) ||
            product.suitable_for?.toLowerCase().includes(termLower);
        }
        
        if (category) {
          matchesCategory = product.category?.toLowerCase() === category.toLowerCase();
        }
        
        if (model) {
          matchesModel = product.suitable_for?.toLowerCase().includes(model.toLowerCase());
        }
        
        return matchesTerm && matchesCategory && matchesModel;
      });
    }
    
    res.json({ products });
  } catch (error) {
    console.error('Fehler bei der Suche nach Foneday-Produkten:', error);
    res.status(500).json({ error: 'Fehler bei der Suche nach Foneday-Produkten' });
  }
});

// Import von Foneday-Produkten in die lokale Datenbank
router.post('/import', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Produkte zum Import bereitgestellt' });
    }
    
    const importResults = {
      total: products.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (const product of products) {
      try {
        // Prüfen, ob das Produkt bereits existiert
        const existingPart = await Part.findOne({ partNumber: product.sku });
        
        if (existingPart) {
          // Existierendes Produkt aktualisieren
          existingPart.description = product.title;
          existingPart.price = parseFloat(product.price) || 0;
          existingPart.forModel = product.suitable_for || '';
          existingPart.category = product.category || 'Sonstiges';
          
          await existingPart.save();
          importResults.imported++;
        } else {
          // Neues Produkt erstellen
          const newPart = new Part({
            partNumber: product.sku,
            description: product.title,
            price: parseFloat(product.price) || 0,
            forModel: product.suitable_for || '',
            category: product.category || 'Sonstiges',
            externalSource: 'foneday',
            inStock: product.instock === 'Y'
          });
          
          await newPart.save();
          importResults.imported++;
        }
      } catch (partError) {
        console.error(`Fehler beim Import von Produkt ${product.sku}:`, partError);
        importResults.errors.push({
          sku: product.sku,
          error: partError.message
        });
        importResults.skipped++;
      }
    }
    
    res.json(importResults);
  } catch (error) {
    console.error('Fehler beim Import von Foneday-Produkten:', error);
    res.status(500).json({ error: 'Fehler beim Import von Foneday-Produkten' });
  }
});

// Einzelnen Artikel importieren
router.post('/import/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    // Alle Produkte abrufen und das gesuchte finden
    const response = await fonedayApi.get('/products');
    const products = response.data.products || [];
    const product = products.find(p => p.sku === sku);
    
    if (!product) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }
    
    // Prüfen, ob das Produkt bereits existiert
    let existingPart = await Part.findOne({ partNumber: sku });
    
    if (existingPart) {
      // Existierendes Produkt aktualisieren
      existingPart.description = product.title;
      existingPart.price = parseFloat(product.price) || 0;
      existingPart.forModel = product.suitable_for || '';
      existingPart.category = product.category || 'Sonstiges';
      existingPart.inStock = product.instock === 'Y';
      
      await existingPart.save();
      res.json({ message: 'Produkt aktualisiert', part: existingPart });
    } else {
      // Neues Produkt erstellen
      const newPart = new Part({
        partNumber: product.sku,
        description: product.title,
        price: parseFloat(product.price) || 0,
        forModel: product.suitable_for || '',
        category: product.category || 'Sonstiges',
        externalSource: 'foneday',
        inStock: product.instock === 'Y'
      });
      
      await newPart.save();
      res.status(201).json({ message: 'Produkt importiert', part: newPart });
    }
  } catch (error) {
    console.error(`Fehler beim Import von Produkt ${req.params.sku}:`, error);
    res.status(500).json({ error: 'Fehler beim Import des Produkts' });
  }
});

module.exports = router;