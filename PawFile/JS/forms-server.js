const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'yosefff1133', // Change as needed
  database: 'prac_schema',     // Change as needed
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to capitalize enum values as needed
function mapEnum(val, type) {
  if (!val) return null;
  if (type === 'yesno') return val.toLowerCase() === 'yes' ? 'Yes' : val.toLowerCase() === 'no' ? 'No' : null;
  if (type === 'color') {
    if (val.toLowerCase() === 'solid') return 'Solid';
    if (val.toLowerCase() === 'bi-color') return 'Bi-color';
    if (val.toLowerCase() === 'multi-color') return 'Multi-color';
  }
  if (type === 'sex') return val.toLowerCase() === 'male' ? 'Male' : val.toLowerCase() === 'female' ? 'Female' : null;
  if (type === 'vaccineType') {
    if (val.toLowerCase() === 'core') return 'Core';
    if (val.toLowerCase() === 'non-core' || val.toLowerCase() === 'noncore') return 'Non-Core';
  }
  return val;
}

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'pawfile-login.html'));
});
app.get('/forms-sponsor-pet.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'forms-sponsor-pet.html'));
});

// ========== /submit-all FORM SUBMISSION ==========
app.post('/submit-all', async (req, res) => {
  const formData = req.body.formData || req.body;
  const password = req.body.password || null;

  if (!formData || !formData.sponsor || !formData.pets || !Array.isArray(formData.pets)) {
    console.error('❌ Invalid data structure:', req.body);
    return res.status(400).json({ success: false, message: 'Invalid data structure.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insert supervisor if provided
    if (formData.sponsor.Supervisor_ID) {
      await connection.execute(
        `INSERT IGNORE INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)`,
        [
          formData.sponsor.Supervisor_ID || null,
          formData.sponsor.Supervisor_Name || null,
          formData.sponsor.Supervisor_Email || null
        ]
      );
    }

    // 2. Insert sponsor (set military fields to NULL if not Active Duty)
    const isActiveDuty = formData.sponsor.Sponsor_Status === 'Active Duty';
    const sponsorValues = [
      formData.sponsor.Sponsor_ID,
      formData.sponsor.Sponsor_LN,
      formData.sponsor.Sponsor_FN,
      formData.sponsor.Sponsor_MI || null,
      formData.sponsor.Spouse_Name || null,
      formData.sponsor.Sponsor_Status,
      isActiveDuty ? formData.sponsor.Grade : null,
      isActiveDuty ? mapEnum(formData.sponsor.is_Dual_Military, 'yesno') : null,
      isActiveDuty ? formData.sponsor.Branch : null,
      isActiveDuty ? formData.sponsor.Unit : null,
      formData.sponsor.Personal_Email,
      formData.sponsor.Mail_Box || null,
      formData.sponsor.Sponsor_Phone_No,
      formData.sponsor.Work_Phone || null,
      formData.sponsor.Spouse_Alt_No || null,
      formData.sponsor.Preferred_Contact,
      formData.sponsor.Supervisor_ID || null,
      password // Temporary_Password
    ];

    await connection.execute(
      `INSERT INTO Sponsor (
        Sponsor_ID, Sponsor_LN, Sponsor_FN, Sponsor_MI, Spouse_Name, Sponsor_Status, 
        Grade, is_Dual_Military, Branch, Unit, Personal_Email, Mail_Box, 
        Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact, Supervisor_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      sponsorValues.slice(0, 17)
    );

    // 3. Insert pets and their vaccines
    for (const pet of formData.pets) {
      if (!pet.Microchip_No) continue;

      await connection.execute(
        `INSERT INTO Pets (
          Microchip_No, Pet_Name, Species, DOB, Age, Breed, 
          Color, Has_Passport, Sex, Is_Spayed_Neutered, 
          Has_Recent_Clinic_History, Clinic_Name, Sponsor_ID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pet.Microchip_No,
          pet.Pet_Name,
          pet.Species,
          pet.DOB,
          pet.Age,
          pet.Breed,
          mapEnum(pet.Color, 'color'),
          mapEnum(pet.Has_Passport, 'yesno'),
          mapEnum(pet.Sex, 'sex'),
          mapEnum(pet.Is_Spayed_Neutered, 'yesno'),
          mapEnum(pet.Has_Recent_Clinic_History, 'yesno'),
          pet.Clinic_Name || null,
          formData.sponsor.Sponsor_ID
        ]
      );

      // Insert vaccines for this pet
      if (Array.isArray(pet.Vaccines)) {
        for (const vaccine of pet.Vaccines) {
          await connection.execute(
            `INSERT IGNORE INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)`,
            [
              vaccine.Vaccine_Lot,
              vaccine.Vaccine_Name,
              mapEnum(vaccine.Vaccine_Type, 'vaccineType'),
              vaccine.Vaccine_Duration
            ]
          );

          await connection.execute(
            `INSERT INTO Vaccine_Reaction (
              Sponsor_ID, Microchip_No, Vaccine_Lot, Date_Vaccination, 
              Vaccination_Effectiveness_Until, Has_Vaccine_Reaction, Vaccine_Reaction_Symptoms
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              formData.sponsor.Sponsor_ID,
              pet.Microchip_No,
              vaccine.Vaccine_Lot,
              vaccine.Date_Vaccination,
              vaccine.Vaccination_Effectiveness_Until,
              mapEnum(vaccine.Has_Vaccine_Reaction, 'yesno'),
              vaccine.Vaccine_Reaction_Symptoms || null
            ]
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({
      success: true,
      sponsorId: formData.sponsor.Sponsor_ID,
      password: password
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Query error:', error);
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ========== API ENDPOINTS ==========

// Helper: cleanup supervisors
async function cleanupSupervisors() {
  const connection = await pool.getConnection();
  try {
    // Step 1: Remove supervisor_id from sponsors who are not on active duty
    await connection.query(`
      UPDATE Sponsor 
      SET Supervisor_ID = NULL 
      WHERE Sponsor_Status != 'ACTIVE DUTY' AND Supervisor_ID IS NOT NULL
    `);

    // Step 2: Find supervisors who are no longer supervising anyone
    const [orphanedSupervisors] = await connection.query(`
      SELECT s.Supervisor_ID 
      FROM Supervisor s
      LEFT JOIN Sponsor sp ON s.Supervisor_ID = sp.Supervisor_ID
      WHERE sp.Supervisor_ID IS NULL
    `);

    if (orphanedSupervisors.length > 0) {
      const supervisorIds = orphanedSupervisors.map(sup => sup.Supervisor_ID);
      await connection.query(
        `DELETE FROM Supervisor WHERE Supervisor_ID IN (${supervisorIds.map(() => '?').join(',')})`,
        supervisorIds
      );
    }
  } finally {
    connection.release();
  }
}

// Get sponsor data along with supervisor info in one call
app.get('/api/sponsor/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [sponsorResults] = await connection.query('SELECT * FROM Sponsor WHERE Sponsor_ID = ?', [id]);
    if (sponsorResults.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    const sponsor = sponsorResults[0];
    if (!sponsor.Supervisor_ID) {
      connection.release();
      return res.json({ ...sponsor, Supervisor_Name: null, Supervisor_Email: null });
    }
    const [supervisorResults] = await connection.query(
      'SELECT Supervisor_Name, Supervisor_Email FROM Supervisor WHERE Supervisor_ID = ?',
      [sponsor.Supervisor_ID]
    );
    connection.release();
    const supervisor = supervisorResults[0] || { Supervisor_Name: null, Supervisor_Email: null };
    res.json({ ...sponsor, ...supervisor });
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching sponsor' });
  }
});

// Check if a supervisor exists
app.get('/api/supervisor/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM Supervisor WHERE Supervisor_ID = ?', [id]);
    connection.release();
    if (results.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }
    return res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching supervisor' });
  }
});

// Update sponsor data (with enhanced supervisor handling and automatic cleanup)
app.put('/api/sponsor/:id', async (req, res) => {
  const { id } = req.params;
  const {
    Sponsor_FN,
    Sponsor_LN,
    Sponsor_MI,
    Spouse_Name,
    Sponsor_Status,
    Grade,
    is_Dual_Military,
    Branch,
    Unit,
    Personal_Email,
    Mail_Box,
    Sponsor_Phone_No,
    Work_Phone,
    Spouse_Alt_No,
    Preferred_Contact,
    Supervisor_ID,
    Supervisor_Name,
    Supervisor_Email
  } = req.body;

  // Determine final values based on sponsor status
  let finalSupervisorId = null;
  let finalGrade = Grade;
  let finalIsDualMilitary = is_Dual_Military;
  let finalBranch = Branch;
  let finalUnit = Unit;

  if (Sponsor_Status === 'ACTIVE DUTY') {
    finalSupervisorId = (!Supervisor_ID || Supervisor_ID.trim() === '') ? null : Supervisor_ID;
  } else {
    finalSupervisorId = null;
    finalGrade = null;
    finalIsDualMilitary = null;
    finalBranch = null;
    finalUnit = null;
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Supervisor logic
    if (!finalSupervisorId) {
      // No supervisor ID provided or sponsor not on active duty - update sponsor with NULL supervisor
      await updateSponsor(connection, id, {
        Sponsor_FN, Sponsor_LN, Sponsor_MI, Spouse_Name, Sponsor_Status,
        Grade: finalGrade, is_Dual_Military: finalIsDualMilitary, Branch: finalBranch, Unit: finalUnit,
        Personal_Email, Mail_Box, Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact,
        Supervisor_ID: null
      });
    } else {
      // Check if Supervisor_ID exists
      const [supResults] = await connection.query('SELECT Supervisor_ID FROM Supervisor WHERE Supervisor_ID = ?', [finalSupervisorId]);
      if (supResults.length > 0) {
        // Supervisor exists - check if user provided name and email to update
        if (Supervisor_Name && Supervisor_Name.trim() !== '' && Supervisor_Email && Supervisor_Email.trim() !== '') {
          await connection.query(
            `UPDATE Supervisor SET Supervisor_Name = ?, Supervisor_Email = ? WHERE Supervisor_ID = ?`,
            [Supervisor_Name, Supervisor_Email, finalSupervisorId]
          );
        }
        await updateSponsor(connection, id, {
          Sponsor_FN, Sponsor_LN, Sponsor_MI, Spouse_Name, Sponsor_Status,
          Grade: finalGrade, is_Dual_Military: finalIsDualMilitary, Branch: finalBranch, Unit: finalUnit,
          Personal_Email, Mail_Box, Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact,
          Supervisor_ID: finalSupervisorId
        });
      } else {
        // Supervisor does not exist - create new supervisor record only if name and email provided
        if (Supervisor_Name && Supervisor_Name.trim() !== '' && Supervisor_Email && Supervisor_Email.trim() !== '') {
          await connection.query(
            `INSERT INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)`,
            [finalSupervisorId, Supervisor_Name, Supervisor_Email]
          );
        } else {
          await connection.query(
            `INSERT INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)`,
            [finalSupervisorId, '', '']
          );
        }
        await updateSponsor(connection, id, {
          Sponsor_FN, Sponsor_LN, Sponsor_MI, Spouse_Name, Sponsor_Status,
          Grade: finalGrade, is_Dual_Military: finalIsDualMilitary, Branch: finalBranch, Unit: finalUnit,
          Personal_Email, Mail_Box, Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact,
          Supervisor_ID: finalSupervisorId
        });
      }
    }

    // After updating the sponsor, run cleanup to remove orphaned supervisors
    await cleanupSupervisors();

    res.json({
      message: 'Sponsor updated successfully',
      supervisorAction: finalSupervisorId ? 'linked' : 'cleared'
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: 'Database update failed' });
  } finally {
    if (connection) connection.release();
  }
});

// Helper for sponsor update
async function updateSponsor(connection, id, data) {
  const query = `
    UPDATE Sponsor SET
      Sponsor_FN = ?,
      Sponsor_LN = ?,
      Sponsor_MI = ?,
      Spouse_Name = ?,
      Sponsor_Status = ?,
      Grade = ?,
      is_Dual_Military = ?,
      Branch = ?,
      Unit = ?,
      Personal_Email = ?,
      Mail_Box = ?,
      Sponsor_Phone_No = ?,
      Work_Phone = ?,
      Spouse_Alt_No = ?,
      Preferred_Contact = ?,
      Supervisor_ID = ?
    WHERE Sponsor_ID = ?
  `;
  const values = [
    data.Sponsor_FN,
    data.Sponsor_LN,
    data.Sponsor_MI,
    data.Spouse_Name,
    data.Sponsor_Status,
    data.Grade,
    data.is_Dual_Military,
    data.Branch,
    data.Unit,
    data.Personal_Email,
    data.Mail_Box,
    data.Sponsor_Phone_No,
    data.Work_Phone,
    data.Spouse_Alt_No,
    data.Preferred_Contact,
    data.Supervisor_ID,
    id
  ];
  await connection.query(query, values);
}

// Get all pets for a sponsor
app.get('/api/sponsor/:id/pets', async (req, res) => {
  const sponsorID = req.params.id.toUpperCase();
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(`SELECT * FROM Pets WHERE UPPER(Sponsor_ID) = ?`, [sponsorID]);
    connection.release();
    const formattedPets = results.map(pet => ({
      id: pet.Microchip_No?.toString(),
      name: pet.Pet_Name,
      sponsor_id: pet.Sponsor_ID
    }));
    res.json(formattedPets);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pets' });
  }
});

// Get pet by microchip
app.get('/api/pet/:microchip', async (req, res) => {
  const microchip = req.params.microchip;
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM Pets WHERE Microchip_No = ?', [microchip]);
    connection.release();
    if (results.length === 0) return res.status(404).json({ error: 'Pet not found' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a pet (minimal)
app.post('/api/pets', async (req, res) => {
  const { Pet_ID, Pet_Name, Sponsor_ID } = req.body;
  if (!Pet_ID || !Pet_Name || !Sponsor_ID) {
    return res.status(400).json({ error: 'Missing pet data' });
  }
  try {
    const connection = await pool.getConnection();
    await connection.query('INSERT INTO Pets (Pet_ID, Pet_Name, Sponsor_ID) VALUES (?, ?, ?)', [Pet_ID, Pet_Name, Sponsor_ID]);
    connection.release();
    res.status(201).json({ message: 'Pet added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error adding pet' });
  }
});

// Get vaccines for a pet
app.get('/api/pet/:microchip/vaccines', async (req, res) => {
  const microchip = req.params.microchip;
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(`
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
    `, [microchip]);
    connection.release();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});