const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '010123',
  database: 'pawfile_db'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
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

// PUT sponsor by ID (update sponsor info)
app.put('/api/sponsor/:id', (req, res) => {
  const sponsorID = req.params.id;
  const data = req.body;
  const fields = [
    "Sponsor_FN", "Sponsor_LN", "Sponsor_MI", "Spouse_Name", "Sponsor_Status",
    "Grade", "is_Dual_Military", "Branch", "Unit", "Personal_Email", "Mail_Box",
    "Sponsor_Phone_No", "Work_Phone", "Spouse_Alt_No", "Preferred_Contact", "Supervisor_ID"
  ];
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f]);
  values.push(sponsorID);

  const query = `UPDATE Sponsor SET ${setClause} WHERE Sponsor_ID = ?`;
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Sponsor updated successfully' });
  });
});

// ✅ Fetch pets for a sponsor
app.get('/api/sponsor/:id/pets', (req, res) => {
  const sponsorID = req.params.id.toUpperCase();
  console.log('Fetching pets for sponsor:', sponsorID);

  const sql = `SELECT * FROM Pets WHERE UPPER(Sponsor_ID) = ?`;

  db.query(sql, [sponsorID], (err, results) => {
    if (err) {
      console.error('Pet fetch error:', err);
      return res.status(500).json({ error: 'Error fetching pets' });
    }

    const formattedPets = results.map(pet => ({
      id: pet.Microchip_No?.toString(), // use Microchip_No as id
      name: pet.Pet_Name,
      sponsor_id: pet.Sponsor_ID
    }));

    console.log('Pet results:', formattedPets);
    res.json(formattedPets);
  });
});

app.get('/api/pet/:microchip', (req, res) => {
    const microchip = req.params.microchip;
    const query = 'SELECT * FROM Pets WHERE Microchip_No = ?';

    db.query(query, [microchip], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Pet not found' });

        res.json(results[0]);
    });
});

// ✅ Add pet (based on your request #4)
app.post('/api/pets', (req, res) => {
  const { Pet_ID, Pet_Name, Sponsor_ID } = req.body;

  if (!Pet_ID || !Pet_Name || !Sponsor_ID) {
    return res.status(400).json({ error: 'Missing pet data' });
  }

  const query = 'INSERT INTO Pets (Pet_ID, Pet_Name, Sponsor_ID) VALUES (?, ?, ?)';
  db.query(query, [Pet_ID, Pet_Name, Sponsor_ID], (err, result) => {
    if (err) {
      console.error('Add pet error:', err);
      res.status(500).json({ error: 'Error adding pet' });
      return;
    }
    res.status(201).json({ message: 'Pet added successfully' });
  });
});

// Get all vaccine records for a pet (with reaction info)
app.get('/api/pet/:microchip/vaccines', (req, res) => {
  const microchip = req.params.microchip;
  const sql = `
    SELECT 
      vr.Vaccine_Lot,
      v.Vaccine_Name,
      v.Vaccine_Type,
      v.Vaccine_Duration,
      vr.Date_Vaccination,
      vr.Vaccination_Effectiveness_Until,
      vr.Has_Vaccine_Reaction,
      vr.Vaccine_Reaction_Symptoms
    FROM Vaccine_Reaction vr
    JOIN Vaccine v ON vr.Vaccine_Lot = v.Vaccine_Lot
    WHERE vr.Microchip_No = ?
    ORDER BY vr.Date_Vaccination DESC
  `;
  db.query(sql, [microchip], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
