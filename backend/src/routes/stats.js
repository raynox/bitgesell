const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let statsCache = null;
let lastModified = null;

function calculateStats(items) {
  return {
    total: items.length,
    averagePrice: items.reduce((acc, cur) => acc + cur.price, 0) / items.length
  };
}

async function isCacheValid() {
  try {
    const stats = await fs.stat(DATA_PATH);
    return lastModified && stats.mtime.getTime() === lastModified.getTime();
  } catch (err) {
    return false;
  }
}

async function updateCache() {
  try {
    const raw = await fs.readFile(DATA_PATH);
    const items = JSON.parse(raw);
    statsCache = calculateStats(items);
    const stats = await fs.stat(DATA_PATH);
    lastModified = stats.mtime.getTime();
  } catch (err) {
    console.error('Error updating stats cache:', err);
    statsCache = null;
  }
}

updateCache().catch(err => {
  console.error('Error initializing cache:', err);
});

fsSync.watchFile(DATA_PATH, async (curr, prev) => {
  console.log("File changed!")
  if (curr.mtime.getTime() !== prev.mtime.getTime()) {
    console.log('Data file changed, updating stats cache...');
    await updateCache();
  }
});

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    if (!(await isCacheValid())) {
      await updateCache();
    }
    
    if (!statsCache) {
      return res.status(500).json({ error: 'Unable to calculate stats' });
    }
    
    res.json(statsCache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;