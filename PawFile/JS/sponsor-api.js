const express = require('express');  
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'yosefff1133',
  database: 'prac_schema',
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

// Get sponsor data along with supervisor info in one call
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
    console.error('Error fetching sponsor:', err);
    res.status(500).json({ error: 'Database error fetching sponsor' });
  }
});

// Check if a supervisor exists
app.get('/api/supervisor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query('SELECT * FROM Supervisor WHERE Supervisor_ID = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching supervisor:', err);
    res.status(500).json({ error: 'Database error fetching supervisor' });
  }
});

// Get sponsor's pets
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
    console.error('Error fetching pets:', err);
    res.status(500).json({ error: 'Error fetching pets' });
  }
});

// Get pet by microchip
app.get('/api/pet/:microchip', async (req, res) => {
  try {
    const microchip = req.params.microchip;
    const [results] = await pool.query('SELECT * FROM Pets WHERE Microchip_No = ?', [microchip]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching pet:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get pet's vaccines - Updated endpoint
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

    // Format the results to ensure consistent data types
    const formattedResults = results.map(vaccine => ({
      ...vaccine,
      Has_Vaccine_Reaction: vaccine.Has_Vaccine_Reaction === 'Yes' || vaccine.Has_Vaccine_Reaction === 1 ? 'Yes' : 'No',
      Date_Vaccination: vaccine.Date_Vaccination ? new Date(vaccine.Date_Vaccination).toISOString().split('T')[0] : null,
      Vaccination_Effectiveness_Until: vaccine.Vaccination_Effectiveness_Until ? new Date(vaccine.Vaccination_Effectiveness_Until).toISOString().split('T')[0] : null
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error('Error fetching vaccines:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get vaccine by lot
app.get('/api/vaccine/:lot', async (req, res) => {
  try {
    const lot = req.params.lot;
    const [results] = await pool.query('SELECT * FROM Vaccine WHERE Vaccine_Lot = ?', [lot]);

    if (results.length === 0) {
      // Return empty response instead of error
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
    console.error('Error fetching vaccine:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create new vaccine
app.post('/api/vaccines', async (req, res) => {
  const { Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration } = req.body;
  
  if (!Vaccine_Lot || !Vaccine_Name || !Vaccine_Type || !Vaccine_Duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)',
      [Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration]
    );
    res.status(201).json({ success: true, message: 'Vaccine added successfully' });
  } catch (err) {
    console.error('Error adding vaccine:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Vaccine lot already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update vaccine reactions
app.put('/api/pets/:petId/vaccine-reactions', async (req, res) => {
  const petId = req.params.petId;
  const { Sponsor_ID, Vaccines } = req.body;
  
  if (!Sponsor_ID) return res.status(400).json({ error: 'Sponsor_ID is required' });
  if (!Array.isArray(Vaccines)) return res.status(400).json({ error: 'Vaccines must be an array' });
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing reactions for this pet
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

      // If vaccine doesn't exist, create it
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)',
          [
            vaccine.Vaccine_Lot,
            vaccine.Vaccine_Name,
            vaccine.Vaccine_Type,
            vaccine.Vaccine_Duration || 1 // Default duration if not provided
          ]
        );
      }

      // Add vaccine reaction
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
    console.error('Error saving vaccine reactions:', error);
    res.status(500).json({ error: error.message || 'Failed to save vaccine reactions' });
  } finally {
    connection.release();
  }
});

// Update sponsor data with enhanced supervisor handling
app.put('/api/sponsor/:id', async (req, res) => {
  try {
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

    if (!finalSupervisorId) {
      await updateSponsor(null);
    } else {
      // Check if Supervisor_ID exists
      const [supResults] = await pool.query(
        'SELECT Supervisor_ID FROM Supervisor WHERE Supervisor_ID = ?',
        [finalSupervisorId]
      );

      if (supResults.length > 0) {
        // Supervisor exists - check if user provided name and email to update
        if (Supervisor_Name && Supervisor_Name.trim() !== '' && 
            Supervisor_Email && Supervisor_Email.trim() !== '') {
          await pool.query(
            'UPDATE Supervisor SET Supervisor_Name = ?, Supervisor_Email = ? WHERE Supervisor_ID = ?',
            [Supervisor_Name, Supervisor_Email, finalSupervisorId]
          );
          console.log(`Updated supervisor ${finalSupervisorId} with new info`);
        }
        await updateSponsor(finalSupervisorId);
      } else {
        // Supervisor does not exist - create new supervisor record
        const supervisorData = {
          Supervisor_ID: finalSupervisorId,
          Supervisor_Name: Supervisor_Name && Supervisor_Name.trim() !== '' ? Supervisor_Name : '',
          Supervisor_Email: Supervisor_Email && Supervisor_Email.trim() !== '' ? Supervisor_Email : ''
        };

        await pool.query('INSERT INTO Supervisor SET ?', supervisorData);
        console.log(`Created new supervisor ${finalSupervisorId}`);
        await updateSponsor(finalSupervisorId);
      }
    }

    async function updateSponsor(supervisorId) {
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
        Sponsor_FN,
        Sponsor_LN,
        Sponsor_MI,
        Spouse_Name,
        Sponsor_Status,
        finalGrade,
        finalIsDualMilitary,
        finalBranch,
        finalUnit,
        Personal_Email,
        Mail_Box,
        Sponsor_Phone_No,
        Work_Phone,
        Spouse_Alt_No,
        Preferred_Contact,
        supervisorId,
        id
      ];

      await pool.query(query, values);
      
      // After updating the sponsor, run cleanup to remove orphaned supervisors
      try {
        const cleanupResult = await cleanupSupervisors();
        if (cleanupResult.removedSupervisors > 0) {
          console.log('Cleanup completed:', cleanupResult);
        }
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      
      res.json({ 
        message: 'Sponsor updated successfully',
        supervisorAction: supervisorId ? 'linked' : 'cleared'
      });
    }
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// Cleanup supervisors function
async function cleanupSupervisors() {
  try {
    // Step 1: Remove supervisor_id from sponsors who are not on active duty
    const [updateResult] = await pool.query(
      `UPDATE Sponsor 
       SET Supervisor_ID = NULL 
       WHERE Sponsor_Status != 'ACTIVE DUTY' AND Supervisor_ID IS NOT NULL`
    );
    
    console.log(`Updated ${updateResult.affectedRows} inactive sponsors to remove supervisor_id`);
    
    // Step 2: Find supervisors who are no longer supervising anyone
    const [orphanedSupervisors] = await pool.query(
      `SELECT s.Supervisor_ID 
       FROM Supervisor s
       LEFT JOIN Sponsor sp ON s.Supervisor_ID = sp.Supervisor_ID
       WHERE sp.Supervisor_ID IS NULL`
    );
    
    if (orphanedSupervisors.length === 0) {
      console.log('No orphaned supervisors found');
      return { 
        updatedSponsors: updateResult.affectedRows, 
        removedSupervisors: 0 
      };
    }
    
    // Step 3: Remove orphaned supervisor records
    const supervisorIds = orphanedSupervisors.map(sup => sup.Supervisor_ID);
    const [deleteResult] = await pool.query(
      `DELETE FROM Supervisor 
       WHERE Supervisor_ID IN (${supervisorIds.map(() => '?').join(',')})`,
      supervisorIds
    );
    
    console.log(`Removed ${deleteResult.affectedRows} orphaned supervisor records`);
    console.log('Removed supervisors:', supervisorIds);
    
    return { 
      updatedSponsors: updateResult.affectedRows, 
      removedSupervisors: deleteResult.affectedRows,
      removedSupervisorIds: supervisorIds
    };
  } catch (err) {
    console.error('Error in cleanupSupervisors:', err);
    throw err;
  }
}

// PUT update pet information
app.put('/api/pets/:microchip', async (req, res) => {
  try {
    const microchip = req.params.microchip;
    const petData = req.body;

    // Validate required fields
    if (!petData.Pet_Name || !petData.Species) {
      return res.status(400).json({ error: 'Pet name and species are required' });
    }

    // Validate Has_Passport is either 'Yes' or 'No'
    if (petData.Has_Passport !== 'Yes' && petData.Has_Passport !== 'No') {
      return res.status(400).json({ error: "Has_Passport must be 'Yes' or 'No'" });
    }

    // Validate Is_Spayed_Neutered is either 'Yes' or 'No'
    if (petData.Is_Spayed_Neutered !== 'Yes' && petData.Is_Spayed_Neutered !== 'No') {
      return res.status(400).json({ error: "Is_Spayed_Neutered must be 'Yes' or 'No'" });
    }

    // Validate Has_Recent_Clinic_History is either 'Yes' or 'No'
    if (petData.Has_Recent_Clinic_History !== 'Yes' && petData.Has_Recent_Clinic_History !== 'No') {
      return res.status(400).json({ error: "Has_Recent_Clinic_History must be 'Yes' or 'No'" });
    }

    // Validate Sex is either 'Male' or 'Female'
    if (petData.Sex !== 'Male' && petData.Sex !== 'Female') {
      return res.status(400).json({ error: "Sex must be 'Male' or 'Female'" });
    }

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
    console.error('Error updating pet:', err);
    res.status(500).json({ error: 'Database error updating pet' });
  }
});

// POST create new pet
app.post('/api/pets', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const petData = req.body;
    
    // Validate required fields
    if (!petData.Pet_Name || !petData.Species || !petData.Sponsor_ID) {
      return res.status(400).json({ error: 'Pet name, species, and sponsor ID are required' });
    }

    // Generate a new microchip number (simple implementation - you might want something more robust)
    const microchipNo = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // Insert pet record
    const [petResult] = await connection.query(
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

    // Insert vaccine records if they exist
    if (petData.Vaccines && petData.Vaccines.length > 0) {
      for (const vaccine of petData.Vaccines) {
        // Check if vaccine exists
        const [existingVaccine] = await connection.query(
          'SELECT 1 FROM Vaccine WHERE Vaccine_Lot = ?',
          [vaccine.Vaccine_Lot]
        );

        // Insert vaccine if it doesn't exist
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
    console.error('Error creating pet:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create pet'
    });
  } finally {
    connection.release();
  }
});

// DELETE pet by microchip number
app.delete('/api/pets/:microchip', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const microchip = req.params.microchip;
    
    // First delete vaccine reactions (due to foreign key constraint)
    await connection.query('DELETE FROM Vaccine_Reaction WHERE Microchip_No = ?', [microchip]);
    
    // Then delete the pet
    const [result] = await connection.query('DELETE FROM Pets WHERE Microchip_No = ?', [microchip]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Pet deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting pet:', err);
    res.status(500).json({ error: 'Database error deleting pet' });
  } finally {
    connection.release();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});