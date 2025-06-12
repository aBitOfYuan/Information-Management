const express = require('express');  
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'yosefff1133',
  database: 'prac_schema'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Function to clean up supervisor records
function cleanupSupervisors(callback) {
  // Step 1: Remove supervisor_id from sponsors who are not on active duty
  const updateInactiveSponsorsQuery = `
    UPDATE Sponsor 
    SET Supervisor_ID = NULL 
    WHERE Sponsor_Status != 'ACTIVE DUTY' AND Supervisor_ID IS NOT NULL
  `;
  
  db.query(updateInactiveSponsorsQuery, (err, updateResult) => {
    if (err) {
      console.error('Error updating inactive sponsors:', err);
      return callback(err);
    }
    
    console.log(`Updated ${updateResult.affectedRows} inactive sponsors to remove supervisor_id`);
    
    // Step 2: Find supervisors who are no longer supervising anyone
    const findOrphanedSupervisorsQuery = `
      SELECT s.Supervisor_ID 
      FROM Supervisor s
      LEFT JOIN Sponsor sp ON s.Supervisor_ID = sp.Supervisor_ID
      WHERE sp.Supervisor_ID IS NULL
    `;
    
    db.query(findOrphanedSupervisorsQuery, (err, orphanedSupervisors) => {
      if (err) {
        console.error('Error finding orphaned supervisors:', err);
        return callback(err);
      }
      
      if (orphanedSupervisors.length === 0) {
        console.log('No orphaned supervisors found');
        return callback(null, { 
          updatedSponsors: updateResult.affectedRows, 
          removedSupervisors: 0 
        });
      }
      
      // Step 3: Remove orphaned supervisor records
      const supervisorIds = orphanedSupervisors.map(sup => sup.Supervisor_ID);
      const deleteOrphanedSupervisorsQuery = `
        DELETE FROM Supervisor 
        WHERE Supervisor_ID IN (${supervisorIds.map(() => '?').join(',')})
      `;
      
      db.query(deleteOrphanedSupervisorsQuery, supervisorIds, (err, deleteResult) => {
        if (err) {
          console.error('Error deleting orphaned supervisors:', err);
          return callback(err);
        }
        
        console.log(`Removed ${deleteResult.affectedRows} orphaned supervisor records`);
        console.log('Removed supervisors:', supervisorIds);
        
        callback(null, { 
          updatedSponsors: updateResult.affectedRows, 
          removedSupervisors: deleteResult.affectedRows,
          removedSupervisorIds: supervisorIds
        });
      });
    });
  });
}

// Get sponsor data along with supervisor info in one call
app.get('/api/sponsor/:id', (req, res) => {
  const { id } = req.params;

  const sponsorQuery = 'SELECT * FROM Sponsor WHERE Sponsor_ID = ?';
  db.query(sponsorQuery, [id], (err, sponsorResults) => {
    if (err) return res.status(500).json({ error: 'Database error fetching sponsor' });
    if (sponsorResults.length === 0) return res.status(404).json({ error: 'Sponsor not found' });

    const sponsor = sponsorResults[0];

    if (!sponsor.Supervisor_ID) {
      return res.json({ ...sponsor, Supervisor_Name: null, Supervisor_Email: null });
    }

    const supervisorQuery = 'SELECT Supervisor_Name, Supervisor_Email FROM Supervisor WHERE Supervisor_ID = ?';
    db.query(supervisorQuery, [sponsor.Supervisor_ID], (err, supervisorResults) => {
      if (err) return res.status(500).json({ error: 'Database error fetching supervisor' });

      const supervisor = supervisorResults[0] || { Supervisor_Name: null, Supervisor_Email: null };
      res.json({ ...sponsor, ...supervisor });
    });
  });
});

// Check if a supervisor exists
app.get('/api/supervisor/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM Supervisor WHERE Supervisor_ID = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching supervisor:', err);
      return res.status(500).json({ error: 'Database error fetching supervisor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    return res.status(200).json(results[0]);
  });
});

// Update sponsor data (with enhanced supervisor handling and automatic cleanup)
app.put('/api/sponsor/:id', (req, res) => {
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
    // For active duty, use provided supervisor ID (if any)
    finalSupervisorId = (!Supervisor_ID || Supervisor_ID.trim() === '') ? null : Supervisor_ID;
  } else {
    // For civilian/retired, set all military fields to null
    finalSupervisorId = null;
    finalGrade = null;
    finalIsDualMilitary = null;
    finalBranch = null;
    finalUnit = null;
  }

  if (!finalSupervisorId) {
    // No supervisor ID provided or sponsor not on active duty - update sponsor with NULL supervisor
    updateSponsor(null);
  } else {
    // Check if Supervisor_ID exists
    db.query('SELECT Supervisor_ID FROM Supervisor WHERE Supervisor_ID = ?', [finalSupervisorId], (err, supResults) => {
      if (err) return res.status(500).json({ error: 'Database error checking supervisor' });

      if (supResults.length > 0) {
        // Supervisor exists - check if user provided name and email to update
        if (Supervisor_Name && Supervisor_Name.trim() !== '' && 
            Supervisor_Email && Supervisor_Email.trim() !== '') {
          // User provided supervisor info - update supervisor record
          const updateSupervisorQuery = `
            UPDATE Supervisor SET Supervisor_Name = ?, Supervisor_Email = ? WHERE Supervisor_ID = ?
          `;
          db.query(updateSupervisorQuery, [Supervisor_Name, Supervisor_Email, finalSupervisorId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error updating supervisor' });
            console.log(`Updated supervisor ${finalSupervisorId} with new info`);
            updateSponsor(finalSupervisorId);
          });
        } else {
          // User didn't provide supervisor info - just link to existing supervisor
          console.log(`Linking sponsor to existing supervisor ${finalSupervisorId}`);
          updateSponsor(finalSupervisorId);
        }
      } else {
        // Supervisor does not exist - create new supervisor record only if name and email provided
        if (Supervisor_Name && Supervisor_Name.trim() !== '' && 
            Supervisor_Email && Supervisor_Email.trim() !== '') {
          const insertSupervisorQuery = `
            INSERT INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)
          `;
          db.query(insertSupervisorQuery, [finalSupervisorId, Supervisor_Name, Supervisor_Email], (err) => {
            if (err) return res.status(500).json({ error: 'Database error inserting supervisor' });
            console.log(`Created new supervisor ${finalSupervisorId}`);
            updateSponsor(finalSupervisorId);
          });
        } else {
          // Supervisor ID provided but no name/email - create with minimal info
          const insertSupervisorQuery = `
            INSERT INTO Supervisor (Supervisor_ID, Supervisor_Name, Supervisor_Email) VALUES (?, ?, ?)
          `;
          db.query(insertSupervisorQuery, [finalSupervisorId, '', ''], (err) => {
            if (err) return res.status(500).json({ error: 'Database error inserting supervisor' });
            console.log(`Created new supervisor ${finalSupervisorId} with minimal info`);
            updateSponsor(finalSupervisorId);
          });
        }
      }
    });
  }

  function updateSponsor(supervisorId) {
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
    db.query(query, values, (err) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      // After updating the sponsor, run cleanup to remove orphaned supervisors
      cleanupSupervisors((cleanupErr, cleanupResult) => {
        if (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
          // Still return success for the main update, but log the cleanup error
        } else if (cleanupResult && cleanupResult.removedSupervisors > 0) {
          console.log('Cleanup completed:', cleanupResult);
        }
        
        res.json({ 
          message: 'Sponsor updated successfully',
          supervisorAction: supervisorId ? 'linked' : 'cleared'
        });
      });
    });
  }
});

app.get('/api/sponsor/:id/pets', (req, res) => {
  const sponsorID = req.params.id.toUpperCase();
  const sql = `SELECT * FROM Pets WHERE UPPER(Sponsor_ID) = ?`;

  db.query(sql, [sponsorID], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching pets' });

    const formattedPets = results.map(pet => ({
      id: pet.Microchip_No?.toString(),
      name: pet.Pet_Name,
      sponsor_id: pet.Sponsor_ID
    }));

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

app.post('/api/pets', (req, res) => {
  const { Pet_ID, Pet_Name, Sponsor_ID } = req.body;

  if (!Pet_ID || !Pet_Name || !Sponsor_ID) {
    return res.status(400).json({ error: 'Missing pet data' });
  }

  const query = 'INSERT INTO Pets (Pet_ID, Pet_Name, Sponsor_ID) VALUES (?, ?, ?)';
  db.query(query, [Pet_ID, Pet_Name, Sponsor_ID], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error adding pet' });
    res.status(201).json({ message: 'Pet added successfully' });
  });
});

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