const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const POIS_FILE = path.join(__dirname, 'data', 'pois.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Ensure pois.json exists
if (!fs.existsSync(POIS_FILE)) {
    fs.writeFileSync(POIS_FILE, JSON.stringify([], null, 2));
}

// API Routes

// GET all POIs
app.get('/api/pois', (req, res) => {
    try {
        const data = fs.readFileSync(POIS_FILE, 'utf8');
        const pois = JSON.parse(data);
        res.json(pois);
    } catch (error) {
        console.error('Error reading POIs:', error);
        res.status(500).json({ error: 'Failed to read POIs' });
    }
});

// POST new POI
app.post('/api/pois', (req, res) => {
    try {
        const newPOI = req.body;

        // Read existing POIs
        const data = fs.readFileSync(POIS_FILE, 'utf8');
        const pois = JSON.parse(data);

        // Add new POI
        pois.push(newPOI);

        // Write back to file
        fs.writeFileSync(POIS_FILE, JSON.stringify(pois, null, 2));

        console.log('POI saved:', newPOI);
        res.json({ success: true, poi: newPOI });
    } catch (error) {
        console.error('Error saving POI:', error);
        res.status(500).json({ error: 'Failed to save POI' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`POIs stored in: ${POIS_FILE}`);
});
