const express = require('express');  
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'porksisig',
  database: 'pawfile_db'
});

// Connect to database
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// ================= AUTHENTICATION ENDPOINTS =================

// Login endpoint
app.post('/api/login', (req, res) => {
  const { sponsorId, password, userRole } = req.body;

  // Validate input
  if (!sponsorId || !password || !userRole) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Determine query based on user role
  const query = userRole === 'admin' 
    ? 'SELECT * FROM Admin WHERE Admin_ID = ? AND Password = ?'
    : `SELECT s.* FROM Sponsor s 
       JOIN Account a ON s.Sponsor_ID = a.Sponsor_ID 
       WHERE s.Sponsor_ID = ? AND a.Passcode = ?`;

  db.query(query, [sponsorId, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Successful login
    res.json({
      success: true,
      userRole: userRole,
      userData: results[0],
      redirect: userRole === 'admin' ? '/admin-dashboard.html' : '/sponsor-profile.html'
    });
  });
});

// ================= SPONSOR ENDPOINTS =================

// Get sponsor with supervisor info
app.get('/api/sponsor/:id', (req, res) => {
  const query = `
    SELECT s.*, sup.Supervisor_Name, sup.Supervisor_Email 
    FROM Sponsor s
    LEFT JOIN Supervisor sup ON s.Supervisor_ID = sup.Supervisor_ID
    WHERE s.Sponsor_ID = ?
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results[0] || {});
  });
});

// Update sponsor
app.put('/api/sponsor/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  db.query(
    'UPDATE Sponsor SET ? WHERE Sponsor_ID = ?',
    [data, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ success: true });
    }
  );
});

// ================= PET ENDPOINTS =================

// Get pets for sponsor
app.get('/api/sponsor/:id/pets', (req, res) => {
  db.query(
    'SELECT * FROM Pets WHERE Sponsor_ID = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// Get pet by microchip
app.get('/api/pet/:microchip', (req, res) => {
  db.query(
    'SELECT * FROM Pets WHERE Microchip_No = ?',
    [req.params.microchip],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || {});
    }
  );
});

// Create/update pet
app.post('/api/pets', async (req, res) => {
  try {
    const petData = req.body;
    
    // Validate required fields
    if (!petData.Microchip_No || !petData.Pet_Name || !petData.Sponsor_ID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Start transaction
    await db.promise().beginTransaction();
    
    // Insert/update pet
    await db.promise().query(
      'INSERT INTO Pets SET ? ON DUPLICATE KEY UPDATE ?',
      [petData, petData]
    );
    
    // Process vaccines if any
    if (petData.Vaccines && petData.Vaccines.length > 0) {
      for (const vaccine of petData.Vaccines) {
        // Insert/update vaccine
        await db.promise().query(
          'INSERT INTO Vaccine SET ? ON DUPLICATE KEY UPDATE ?',
          [vaccine, vaccine]
        );
        
        // Insert vaccine reaction
        await db.promise().query(
          'INSERT INTO Vaccine_Reaction SET ? ON DUPLICATE KEY UPDATE ?',
          [{
            Microchip_No: petData.Microchip_No,
            ...vaccine
          }, {
            Date_Vaccination: vaccine.Date_Vaccination,
            Vaccination_Effectiveness_Until: vaccine.Vaccination_Effectiveness_Until,
            Has_Vaccine_Reaction: vaccine.Has_Vaccine_Reaction,
            Vaccine_Reaction_Symptoms: vaccine.Vaccine_Reaction_Symptoms
          }]
        );
      }
    }
    
    await db.promise().commit();
    res.json({ success: true });
    
  } catch (error) {
    await db.promise().rollback();
    console.error('Error saving pet:', error);
    res.status(500).json({ error: 'Failed to save pet data' });
  }
});

// ================= VACCINE ENDPOINTS =================

// Get vaccines for pet
app.get('/api/pet/:microchip/vaccines', (req, res) => {
  const query = `
    SELECT vr.*, v.Vaccine_Name, v.Vaccine_Type, v.Vaccine_Duration
    FROM Vaccine_Reaction vr
    JOIN Vaccine v ON vr.Vaccine_Lot = v.Vaccine_Lot
    WHERE vr.Microchip_No = ?
    ORDER BY vr.Date_Vaccination DESC
  `;
  
  db.query(query, [req.params.microchip], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get vaccine details
app.get('/api/vaccine/:lot', (req, res) => {
  db.query(
    'SELECT * FROM Vaccine WHERE Vaccine_Lot = ?',
    [req.params.lot],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || {});
    }
  );
});

// ================= SUPERVISOR ENDPOINTS =================

// Get supervisor
app.get('/api/supervisor/:id', (req, res) => {
  db.query(
    'SELECT * FROM Supervisor WHERE Supervisor_ID = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results[0] || {});
    }
  );
});

// Cleanup orphaned supervisors
function cleanupSupervisors(callback) {
  // Step 1: Clear supervisor IDs from inactive sponsors
  db.query(
    `UPDATE Sponsor SET Supervisor_ID = NULL 
     WHERE Sponsor_Status != 'ACTIVE DUTY' AND Supervisor_ID IS NOT NULL`,
    (err) => {
      if (err) return callback(err);
      
      // Step 2: Delete orphaned supervisors
      db.query(
        `DELETE FROM Supervisor 
         WHERE Supervisor_ID IN (
           SELECT s.Supervisor_ID FROM Supervisor s
           LEFT JOIN Sponsor sp ON s.Supervisor_ID = sp.Supervisor_ID
           WHERE sp.Sponsor_ID IS NULL
         )`,
        (err, result) => {
          callback(err, result);
        }
      );
    }
  );
}

// Start server
app.listen(PORT, () => {
  console.log(`Sponsor API running on http://localhost:${PORT}`);
});