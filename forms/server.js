const express = require('express')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '010123',
  database: 'pawfile_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});


// Sponsor form submission

// Add new endpoint for vaccine lot lookup
app.get('/api/vaccine/:lot', (req, res) => {
  const lot = req.params.lot;
  const query = 'SELECT * FROM Vaccine WHERE Vaccine_Lot = ?';
  
  db.query(query, [lot], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Vaccine not found' });
    res.json(results[0]);
  });
});
