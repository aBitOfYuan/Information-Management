// Get all sponsors
app.get('/api/sponsors', (req, res) => {
    const query = 'SELECT * FROM Sponsor';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get all supervisors
app.get('/api/supervisors', (req, res) => {
    const query = 'SELECT * FROM Supervisor';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get all pets
app.get('/api/pets', (req, res) => {
    const query = 'SELECT * FROM Pets';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get all vaccines
app.get('/api/vaccines', (req, res) => {
    const query = 'SELECT * FROM Vaccine';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get all vaccine reactions
app.get('/api/reactions', (req, res) => {
    const query = 'SELECT * FROM Vaccine_Reaction';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});
