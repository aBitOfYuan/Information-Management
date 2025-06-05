// server.js or api route file
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// SQL connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,               // Optional, only if using a custom port
    user: 'root',             // Replace with your actual username
    password: 'root@password1', // Replace with your actual password
    database: 'pawfiledb2'    // Replace with your actual DB name
});


// GET sponsor by ID
app.get('/api/sponsor/:id', (req, res) => {
    const sponsorID = req.params.id;
    const query = 'SELECT * FROM Sponsor WHERE Sponsor_ID = ?';
    
    db.query(query, [sponsorID], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Sponsor not found' });

        res.json(results[0]); // Return the sponsor data as JSON
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
