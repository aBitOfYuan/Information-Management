const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware
console.log('Full path to login file:', path.join(__dirname, '..', 'pawfile', 'PawFile', 'HTML', 'pawfile-login.html'));
console.log('Full path to sponsor file:', path.join(__dirname, '..', 'pawfile', 'PawFile', 'HTML', 'forms-sponsor-pet.html'));

// Serve static files from "PawFile/HTML"
app.use(express.static(path.join(__dirname, '..')));

// Route for root URL (serves pawfile-login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'HTML', 'pawfile-login.html'));
});

// Route for sponsor form (serves forms-sponsor-pet.html)
app.get('/forms-sponsor-pet.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'HTML', 'forms-sponsor-pet.html'));
});


// Database connection
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root@password1',
    database: 'pawfiledb2',
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

// Handle form submission
app.post('/submit-all', async (req, res) => {
    const { formData, password } = req.body;

    // Basic validation
    if (!formData || !formData.sponsor || !formData.pets || !Array.isArray(formData.pets)) {
        console.error('❌ Invalid data structure:', req.body);
        return res.status(400).json({ success: false, message: 'Invalid data structure.' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insert supervisor if provided
            if (formData.sponsor.Supervisor_ID) {
                console.log('Inserting Supervisor:', formData.sponsor.Supervisor_ID, formData.sponsor.Supervisor_Name, formData.sponsor.Supervisor_Email);
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

            // Debug log
            console.log('Sponsor INSERT:', sponsorValues);

            await connection.execute(
                `INSERT INTO Sponsor (
                    Sponsor_ID, Sponsor_LN, Sponsor_FN, Sponsor_MI, Spouse_Name, Sponsor_Status, 
                    Grade, is_Dual_Military, Branch, Unit, Personal_Email, Mail_Box, 
                    Sponsor_Phone_No, Work_Phone, Spouse_Alt_No, Preferred_Contact, Supervisor_ID
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                sponsorValues.slice(0, 17) // Only the first 17 values
            );

            // 3. Insert pets and their vaccines
            for (const pet of formData.pets) {
                if (!pet.Microchip_No) {
                    console.warn('Skipping pet with missing Microchip_No:', pet);
                    continue;
                }

                const petValues = [
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
                    pet.Clinic_Name || null
                ];

                // Debug log
                console.log('Pet INSERT:', petValues);

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
                        formData.sponsor.Sponsor_ID // <-- Add this!
                    ]
                );

                // Insert vaccines for this pet
                if (Array.isArray(pet.Vaccines)) {
                    for (const vaccine of pet.Vaccines) {
                        // Insert into Vaccine table if not exists
                        console.log('Vaccine INSERT:', [
                            vaccine.Vaccine_Lot,
                            vaccine.Vaccine_Name,
                            mapEnum(vaccine.Vaccine_Type, 'vaccineType'),
                            vaccine.Vaccine_Duration
                        ]);
                        await connection.execute(
                            `INSERT IGNORE INTO Vaccine (Vaccine_Lot, Vaccine_Name, Vaccine_Type, Vaccine_Duration) VALUES (?, ?, ?, ?)`,
                            [
                                vaccine.Vaccine_Lot,
                                vaccine.Vaccine_Name,
                                mapEnum(vaccine.Vaccine_Type, 'vaccineType'),
                                vaccine.Vaccine_Duration
                            ]
                        );

                        // Insert into Vaccine_Reaction table
                        const reactionValues = [
                            formData.sponsor.Sponsor_ID,
                            pet.Microchip_No,
                            vaccine.Vaccine_Lot,
                            vaccine.Date_Vaccination,
                            vaccine.Vaccination_Effectiveness_Until,
                            mapEnum(vaccine.Has_Vaccine_Reaction, 'yesno'),
                            vaccine.Vaccine_Reaction_Symptoms || null
                        ];

                        // Debug log
                        console.log('Vaccine Reaction INSERT:', reactionValues);

                        await connection.execute(
                            `INSERT INTO Vaccine_Reaction (
                                Sponsor_ID, Microchip_No, Vaccine_Lot, Date_Vaccination, 
                                Vaccination_Effectiveness_Until, Has_Vaccine_Reaction, Vaccine_Reaction_Symptoms
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            reactionValues
                        );
                    }
                }
            }

            // Commit transaction
            await connection.commit();
            connection.release();

            res.status(200).json({
                success: true,
                sponsorId: formData.sponsor.Sponsor_ID,
                password: password
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('❌ Query error:', error);
            if (error.sqlMessage) console.error('❌ SQL Message:', error.sqlMessage);
            if (error.stack) console.error('❌ Stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Database operation failed',
                error: error.message,
            });
        }
    } catch (error) {
        console.error('❌ Database error:', error);
        if (error.stack) console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
        });
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});