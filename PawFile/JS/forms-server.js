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
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Database configuration
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '010123', // Default password
  database: 'pawfiledb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Helper to capitalize enum values
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

// HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'pawfile-login.html'));
});

app.get('/forms-sponsor-pet.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'forms-sponsor-pet.html'));
});

// ========== FORM SUBMISSION ENDPOINT ==========
app.post('/submit-all', async (req, res) => {
  const formData = req.body.formData || req.body;
  const password = req.body.password || null;

  if (!formData || !formData.sponsor || !formData.pets || !Array.isArray(formData.pets)) {
    return res.status(400).json({ success: false, message: 'Invalid data structure.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert supervisor if provided
    if (formData.sponsor.Supervisor_ID) {
      await connection.execute(
        `INSERT IGNORE INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)`,
        [formData.sponsor.Supervisor_ID, formData.sponsor.Supervisor_Name, formData.sponsor.Supervisor_Email]
      );
    }

    // Insert sponsor
    const isActiveDuty = formData.sponsor.Sponsor_Status === 'Active Duty';
    await connection.execute(
      `INSERT INTO Sponsor (
        Sponsor_ID, Sponsor_LN, Sponsor_FN, Sponsor_MI, Spouse_Name, Sponsor_Status, 
        Grade, is_Dual_Military, Branch, Unit, Personal_Email, Mail_Box, 
        Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact, Supervisor_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        formData.sponsor.Supervisor_ID || null
      ]
    );

    // Insert pets and vaccines
    for (const pet of formData.pets) {
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

      // Insert vaccines
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
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ========== SPONSOR ENDPOINTS ==========
app.get('/api/sponsor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [sponsorResults] = await pool.query('SELECT * FROM Sponsor WHERE Sponsor_ID = ?', [id]);
    
    if (sponsorResults.length === 0) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    const sponsor = sponsorResults[0];

    if (!sponsor.Supervisor_ID) {
      return res.json({ ...sponsor, Supervisor_Name: null, Supervisor_Email: null });
    }

    const [supervisorResults] = await pool.query(
      'SELECT Supervisor_Name, Supervisor_Email FROM Supervisor WHERE Supervisor_ID = ?',
      [sponsor.Supervisor_ID]
    );

    const supervisor = supervisorResults[0] || { Supervisor_Name: null, Supervisor_Email: null };
    res.json({ ...sponsor, ...supervisor });
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching sponsor' });
  }
});

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

  // Normalize the status (handle both "ACTIVE DUTY" and "Active Duty")
  const normalizedStatus = Sponsor_Status 
    ? Sponsor_Status.trim().toUpperCase() === 'ACTIVE DUTY' 
      ? 'Active Duty' 
      : Sponsor_Status.charAt(0).toUpperCase() + Sponsor_Status.slice(1).toLowerCase()
    : null;

  // Determine if sponsor is active duty (case-insensitive check)
  const isActiveDuty = normalizedStatus === 'Active Duty';

  // Prepare military fields
  let finalSupervisorId = null;
  let finalGrade = null;
  let finalIsDualMilitary = null;
  let finalBranch = null;
  let finalUnit = null;

  if (isActiveDuty) {
    // Only validate military fields if switching TO Active Duty
    finalSupervisorId = Supervisor_ID || null;
    finalGrade = Grade;
    finalIsDualMilitary = mapEnum(is_Dual_Military, 'yesno');
    finalBranch = Branch;
    finalUnit = Unit;

    // For new Active Duty sponsors, ensure required fields are present
    const missingFields = [];
    if (!finalGrade) missingFields.push('Grade');
    if (!finalIsDualMilitary) missingFields.push('Dual Military Status');
    if (!finalBranch) missingFields.push('Branch');
    if (!finalUnit) missingFields.push('Unit');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Active Duty sponsors require: ${missingFields.join(', ')}`
      });
    }

    // Validate Grade format (military format: E-1 to E-9, O-1 to O-10, etc.)
    if (!/^[A-Za-z]-\d{1,2}$/.test(finalGrade)) {
      return res.status(400).json({
        error: "Grade must be in military format (e.g., E-4, O-3)"
      });
    }

    // Validate Branch format (should be a valid military branch)
    const validBranches = ['ARMY', 'NAVY', 'AIR FORCE', 'MARINE CORPS', 'COAST GUARD', 'SPACE FORCE'];
    if (!validBranches.includes(finalBranch.toUpperCase())) {
      return res.status(400).json({
        error: `Branch must be one of: ${validBranches.join(', ')}`
      });
    }

    // Normalize branch to uppercase
    finalBranch = finalBranch.toUpperCase();
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Handle supervisor (only for Active Duty)
    if (isActiveDuty && finalSupervisorId) {
      const [supResults] = await connection.query(
        'SELECT Supervisor_ID FROM Supervisor WHERE Supervisor_ID = ?', 
        [finalSupervisorId]
      );

      if (supResults.length > 0) {
        // Update existing supervisor if info provided
        if (Supervisor_Name && Supervisor_Email) {
          await connection.query(
            `UPDATE Supervisor SET Supervisor_Name = ?, Supervisor_Email = ? WHERE Supervisor_ID = ?`,
            [Supervisor_Name, Supervisor_Email, finalSupervisorId]
          );
        }
      } else {
        // Create new supervisor if doesn't exist
        await connection.query(
          `INSERT INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)`,
          [
            finalSupervisorId, 
            Supervisor_Name || '', 
            Supervisor_Email || ''
          ]
        );
      }
    }

    // Update sponsor record
    await connection.query(
      `UPDATE Sponsor SET
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
      WHERE Sponsor_ID = ?`,
      [
        Sponsor_FN,
        Sponsor_LN,
        Sponsor_MI,
        Spouse_Name,
        normalizedStatus,
        isActiveDuty ? finalGrade : null,
        isActiveDuty ? finalIsDualMilitary : null,
        isActiveDuty ? finalBranch : null,
        isActiveDuty ? finalUnit : null,
        Personal_Email,
        Mail_Box,
        Sponsor_Phone_No,
        Work_Phone,
        Spouse_Alt_No,
        Preferred_Contact,
        isActiveDuty ? finalSupervisorId : null,
        id
      ]
    );

    await connection.commit();
    
    res.json({
      message: 'Sponsor updated successfully',
      status: normalizedStatus,
      isActiveDuty: isActiveDuty
    });
    
  } catch (err) {
    await connection.rollback();
    console.error("Update error:", {
      error: err.message,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      status: {
        received: Sponsor_Status,
        normalized: normalizedStatus,
        isActiveDuty: isActiveDuty
      }
    });
    res.status(500).json({ 
      error: 'Database update failed',
      details: err.message
    });
  } finally {
    connection.release();
  }
});

app.delete('/api/sponsor/:id', async (req, res) => {
  const sponsorId = req.params.id;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get all pets for sponsor
    const [pets] = await connection.query('SELECT Microchip_No FROM Pets WHERE Sponsor_ID = ?', [sponsorId]);
    const petMicrochips = pets.map(pet => pet.Microchip_No);

    // Delete vaccine reactions
    if (petMicrochips.length > 0) {
      await connection.query(
        `DELETE FROM Vaccine_Reaction WHERE Microchip_No IN (${petMicrochips.map(() => '?').join(',')})`,
        petMicrochips
      );
    }

    // Delete pets
    await connection.query('DELETE FROM Pets WHERE Sponsor_ID = ?', [sponsorId]);
    
    // Delete sponsor
    const [result] = await connection.query('DELETE FROM Sponsor WHERE Sponsor_ID = ?', [sponsorId]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    await connection.commit();
    
    // Cleanup supervisors
    try {
      await cleanupSupervisors();
    } catch (cleanupErr) {
      console.error('Cleanup error after deletion:', cleanupErr);
    }
    
    res.json({ 
      message: 'Account deleted successfully',
      deletedPets: petMicrochips.length
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Database error deleting account' });
  } finally {
    connection.release();
  }
});

// ========== PET ENDPOINTS ==========
app.get('/api/sponsor/:id/pets', async (req, res) => {
  try {
    const sponsorID = req.params.id.toUpperCase();
    const [results] = await pool.query('SELECT * FROM Pets WHERE UPPER(Sponsor_ID) = ?', [sponsorID]);

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

app.get('/api/pet/:microchip', async (req, res) => {
  try {
    const microchip = req.params.microchip;
    const [results] = await pool.query('SELECT * FROM Pets WHERE Microchip_No = ?', [microchip]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pets', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const petData = req.body;
    
    // Generate microchip number
    const microchipNo = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // Insert pet
    await connection.query(
      `INSERT INTO Pets (
        Microchip_No, Pet_Name, Species, DOB, Age, Breed, Color, 
        Has_Passport, Sex, Is_Spayed_Neutered, Has_Recent_Clinic_History, 
        Clinic_Name, Sponsor_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        microchipNo,
        petData.Pet_Name,
        petData.Species,
        petData.DOB || null,
        petData.Age || null,
        petData.Breed || null,
        petData.Color || null,
        petData.Has_Passport || 'No',
        petData.Sex || 'Male',
        petData.Is_Spayed_Neutered || 'No',
        petData.Has_Recent_Clinic_History || 'No',
        petData.Clinic_Name || null,
        petData.Sponsor_ID
      ]
    );

    // Insert vaccines
    if (petData.Vaccines && petData.Vaccines.length > 0) {
      for (const vaccine of petData.Vaccines) {
        // Check if vaccine exists
        const [existingVaccine] = await connection.query(
          'SELECT 1 FROM Vaccine WHERE Vaccine_Lot = ?',
          [vaccine.Vaccine_Lot]
        );

        // Insert new vaccine if needed
        if (existingVaccine.length === 0) {
          await connection.query(
            'INSERT INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)',
            [
              vaccine.Vaccine_Lot,
              vaccine.Vaccine_Name,
              vaccine.Vaccine_Type,
              vaccine.Vaccine_Duration || 1
            ]
          );
        }

        // Insert vaccine reaction
        await connection.query(
          `INSERT INTO Vaccine_Reaction (
            Microchip_No, Sponsor_ID, Vaccine_Lot, Date_Vaccination,
            Vaccination_Effectiveness_Until, Has_Vaccine_Reaction, Vaccine_Reaction_Symptoms
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            microchipNo,
            petData.Sponsor_ID,
            vaccine.Vaccine_Lot,
            vaccine.Date_Vaccination,
            vaccine.Vaccination_Effectiveness_Until,
            vaccine.Has_Vaccine_Reaction || 'No',
            vaccine.Vaccine_Reaction_Symptoms || null
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ 
      success: true,
      microchipNo,
      message: 'Pet created successfully'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      error: error.message || 'Failed to create pet'
    });
  } finally {
    connection.release();
  }
});

app.put('/api/pets/:microchip', async (req, res) => {
  try {
    const microchip = req.params.microchip;
    const petData = req.body;

    const query = `
      UPDATE Pets SET
        Pet_Name = ?,
        Species = ?,
        DOB = ?,
        Age = ?,
        Breed = ?,
        Color = ?,
        Has_Passport = ?,
        Sex = ?,
        Is_Spayed_Neutered = ?,
        Has_Recent_Clinic_History = ?,
        Clinic_Name = ?
      WHERE Microchip_No = ?
    `;

    const values = [
      petData.Pet_Name,
      petData.Species,
      petData.DOB || null,
      petData.Age || null,
      petData.Breed || null,
      petData.Color || null,
      petData.Has_Passport,
      petData.Sex,
      petData.Is_Spayed_Neutered,
      petData.Has_Recent_Clinic_History,
      petData.Clinic_Name || null,
      microchip
    ];

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json({ success: true, message: 'Pet information updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error updating pet' });
  }
});

app.delete('/api/pets/:microchip', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const microchip = req.params.microchip;
    
    await connection.query('DELETE FROM Vaccine_Reaction WHERE Microchip_No = ?', [microchip]);
    const [result] = await connection.query('DELETE FROM Pets WHERE Microchip_No = ?', [microchip]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Pet deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Database error deleting pet' });
  } finally {
    connection.release();
  }
});

// ========== VACCINE ENDPOINTS ==========
app.get('/api/pet/:microchip/vaccines', async (req, res) => {
  try {
    const microchip = req.params.microchip;
    const [results] = await pool.query(`
      SELECT 
        vr.Vaccine_Lot,
        v.Vaccine_Name,
        v.Vaccine_Type,
        v.Vaccine_Duration,
        vr.Date_Vaccination,
        vr.Vaccination_Effectiveness_Until,
        vr.Has_Vaccine_Reaction,
        vr.Vaccine_Reaction_Symptoms,
        vr.Sponsor_ID
      FROM Vaccine_Reaction vr
      JOIN Vaccine v ON vr.Vaccine_Lot = v.Vaccine_Lot
      WHERE vr.Microchip_No = ?
      ORDER BY vr.Date_Vaccination DESC
    `, [microchip]);

    // Format results
    const formattedResults = results.map(vaccine => ({
      ...vaccine,
      Has_Vaccine_Reaction: vaccine.Has_Vaccine_Reaction === 'Yes' || vaccine.Has_Vaccine_Reaction === 1 ? 'Yes' : 'No',
      Date_Vaccination: vaccine.Date_Vaccination ? new Date(vaccine.Date_Vaccination).toISOString().split('T')[0] : null,
      Vaccination_Effectiveness_Until: vaccine.Vaccination_Effectiveness_Until ? new Date(vaccine.Vaccination_Effectiveness_Until).toISOString().split('T')[0] : null
    }));

    res.json(formattedResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vaccine/:lot', async (req, res) => {
  try {
    const lot = req.params.lot;
    const [results] = await pool.query('SELECT * FROM Vaccine WHERE Vaccine_Lot = ?', [lot]);

    if (results.length === 0) {
      return res.status(200).json({ 
        exists: false,
        message: 'Vaccine not found - you can add it as a new vaccine'
      });
    }

    res.json({
      exists: true,
      ...results[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vaccines', async (req, res) => {
  const { Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration } = req.body;
  
  if (!Vaccine_Lot || !Vaccine_Name || !Vaccine_Type || !Vaccine_Duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      'INSERT INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)',
      [Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration]
    );
    res.status(201).json({ success: true, message: 'Vaccine added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Vaccine lot already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/pets/:petId/vaccine-reactions', async (req, res) => {
  const petId = req.params.petId;
  const { Sponsor_ID, Vaccines } = req.body;
  
  if (!Sponsor_ID) return res.status(400).json({ error: 'Sponsor_ID is required' });
  if (!Array.isArray(Vaccines)) return res.status(400).json({ error: 'Vaccines must be an array' });
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing reactions
    await connection.query('DELETE FROM Vaccine_Reaction WHERE Microchip_No = ?', [petId]);
    
    // Process each vaccine
    for (const vaccine of Vaccines) {
      // Validate required fields
      if (!vaccine.Vaccine_Lot || !vaccine.Vaccine_Name || !vaccine.Vaccine_Type || 
          !vaccine.Date_Vaccination || !vaccine.Vaccination_Effectiveness_Until) {
        throw new Error('Missing required vaccine fields');
      }

      // Check if vaccine exists
      const [existing] = await connection.query(
        'SELECT 1 FROM Vaccine WHERE Vaccine_Lot = ?', 
        [vaccine.Vaccine_Lot]
      );

      // Insert if new vaccine
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)',
          [vaccine.Vaccine_Lot, vaccine.Vaccine_Name, vaccine.Vaccine_Type, vaccine.Vaccine_Duration || 1]
        );
      }

      // Insert vaccine reaction
      await connection.query(
        `INSERT INTO Vaccine_Reaction 
         (Microchip_No, Sponsor_ID, Vaccine_Lot, Date_Vaccination, 
          Vaccination_Effectiveness_Until, Has_Vaccine_Reaction, Vaccine_Reaction_Symptoms) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          petId,
          Sponsor_ID,
          vaccine.Vaccine_Lot,
          vaccine.Date_Vaccination,
          vaccine.Vaccination_Effectiveness_Until,
          vaccine.Has_Vaccine_Reaction || 'No',
          vaccine.Vaccine_Reaction_Symptoms || null
        ]
      );
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Vaccine reactions updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message || 'Failed to save vaccine reactions' });
  } finally {
    connection.release();
  }
});

// ========== HELPER FUNCTIONS ==========
async function cleanupSupervisors() {
  try {
    // Update inactive sponsors
    const [updateResult] = await pool.query(
      `UPDATE Sponsor 
       SET Supervisor_ID = NULL 
       WHERE Sponsor_Status != 'ACTIVE DUTY' AND Supervisor_ID IS NOT NULL`
    );
    
    // Find orphaned supervisors
    const [orphanedSupervisors] = await pool.query(
      `SELECT s.Supervisor_ID 
       FROM Supervisor s
       LEFT JOIN Sponsor sp ON s.Supervisor_ID = sp.Supervisor_ID
       WHERE sp.Supervisor_ID IS NULL`
    );
    
    if (orphanedSupervisors.length === 0) {
      return { 
        updatedSponsors: updateResult.affectedRows, 
        removedSupervisors: 0 
      };
    }
    
    // Remove orphaned supervisors
    const supervisorIds = orphanedSupervisors.map(sup => sup.Supervisor_ID);
    const [deleteResult] = await pool.query(
      `DELETE FROM Supervisor 
       WHERE Supervisor_ID IN (?)`,
      [supervisorIds]
    );
    
    return { 
      updatedSponsors: updateResult.affectedRows, 
      removedSupervisors: deleteResult.affectedRows,
      removedSupervisorIds: supervisorIds
    };
  } catch (err) {
    throw err;
  }
}

// ========== SUPERVISOR ENDPOINT ==========
app.get('/api/supervisor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query('SELECT * FROM Supervisor WHERE Supervisor_ID = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching supervisor' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});