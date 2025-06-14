-- Supervisor Table
CREATE TABLE Supervisor (
    Supervisor_ID VARCHAR(10) PRIMARY KEY,
    Supervisor_Name VARCHAR(50),
    Supervisor_Email VARCHAR(50)
);

-- Sponsor Table
CREATE TABLE Sponsor (
    Sponsor_ID VARCHAR(5) PRIMARY KEY,
    Sponsor_LN VARCHAR(30) NOT NULL,
    Sponsor_FN VARCHAR(30) NOT NULL,
    Sponsor_MI VARCHAR(5),
    Spouse_Name VARCHAR(50),
    Sponsor_Status VARCHAR(20) NOT NULL CHECK(Sponsor_Status IN ('Active Duty', 'Civilian', 'Retired')),
    Grade VARCHAR(10) CHECK(Grade IN('E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9',
				     'W-1', 'W-2', 'W-3', 'W-4', 'W-5',
                                     'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10',
                                     'N/A')),
    is_Dual_Military VARCHAR(3) CHECK(is_Dual_Military IN ('Yes', 'No', 'N/A')),
    Branch VARCHAR(30),
    Unit VARCHAR(50),
    Personal_Email VARCHAR(50) NOT NULL,
    Mail_Box INT,
    Sponsor_Phone_No VARCHAR(15) NOT NULL,
    Work_Phone VARCHAR(15),
    Spouse_Alt_No VARCHAR(15),
    Preferred_Contact VARCHAR(10) NOT NULL CHECK(Preferred_Contact IN ('Sponsor', 'Spouse', 'Work', 'Personal')),
    Supervisor_ID VARCHAR(20) NULL,
    FOREIGN KEY (Supervisor_ID) REFERENCES Supervisor(Supervisor_ID)
);

-- Pet Table
CREATE TABLE Pets (
    Microchip_No BIGINT PRIMARY KEY,
    Pet_Name VARCHAR(20) NOT NULL,
    Sponsor_ID VARCHAR(5) NOT NULL,
    Species VARCHAR(15) NOT NULL,
    DOB DATE NOT NULL,
    Age INT NOT NULL,
    Breed VARCHAR(50) NOT NULL,
    Color VARCHAR(15) NOT NULL CHECK (Color IN ('Solid', 'Bi-color', 'Multi-color')),
    Has_Passport VARCHAR(5) NOT NULL CHECK (Has_Passport IN ('Yes', 'No')),
    Sex VARCHAR(10) NOT NULL CHECK (Sex IN ('Male', 'Female')),
    Is_Spayed_Neutered VARCHAR(5) NOT NULL CHECK (Is_Spayed_Neutered IN ('Yes', 'No')),
    Has_Recent_Clinic_History VARCHAR(5) NOT NULL CHECK (Has_Recent_Clinic_History IN ('Yes', 'No')),
    Clinic_Name VARCHAR(50),
    FOREIGN KEY (Sponsor_ID) REFERENCES Sponsor(Sponsor_ID)
);

-- Vaccine Table
CREATE TABLE Vaccine (
    Vaccine_Lot VARCHAR(10) PRIMARY KEY,
    Vaccine_Name VARCHAR(50) NOT NULL,
    Vaccine_Type VARCHAR(15) NOT NULL CHECK (Vaccine_Type IN ('Core', 'Non-Core')),
    Vaccine_Duration INT NOT NULL
);

-- Vaccine_Reaction Table
CREATE TABLE Vaccine_Reaction (
    Sponsor_ID VARCHAR(5) NOT NULL,
    Microchip_No BIGINT NOT NULL,
    Vaccine_Lot VARCHAR(10) NOT NULL,
    Date_Vaccination DATE NOT NULL,
    Vaccination_Effectiveness_Until DATE NOT NULL,
    Has_Vaccine_Reaction VARCHAR(5) NOT NULL CHECK (Has_Vaccine_Reaction IN ('Yes', 'No')),
    Vaccine_Reaction_Symptoms VARCHAR(50),
    PRIMARY KEY (Sponsor_ID, Microchip_No, Vaccine_Lot, Date_Vaccination),
    FOREIGN KEY (Sponsor_ID) REFERENCES Sponsor(Sponsor_ID),
    FOREIGN KEY (Microchip_No) REFERENCES Pets(Microchip_No),
    FOREIGN KEY (Vaccine_Lot) REFERENCES Vaccine(Vaccine_Lot)
);

---
## Insert Data
---

-- Insert data into Supervisor Table
INSERT INTO Supervisor VALUES
('CPT-2034', 'William M. Castillo', 'castillo.william@gmail.com'),
('MAJ-1001', 'Sophia L. Ramirez', 'sophia.ramirez@email.com'),
('LTC-5500', 'David P. Cruz', 'david.cruz@email.com'),
('N/A', 'N/A', 'N/A');

-- Insert data into Sponsor Table
INSERT INTO Sponsor VALUES
('A7B9K', 'Diokno', 'Enrico', 'C.', 'Wilma M. Diokno', 'Active Duty', 'E-5', 'No', 'Philippine Army', '1st Infantry Division', 'william.diokno@gmail.com', 1430, '0932 543 7611', '0917 245 6382', '0946 535 4015', 'Spouse', 'CPT-2034'),
('X3D7P', 'Mendoza', 'Josephine', 'R.', 'Miguel T. Mendoza', 'Civilian', NULL, NULL, NULL, NULL, 'mendoza.js@gmail.com', 2355, '9956971340', '0917 245 6382', '0967 234 5561', 'Sponsor', NULL),
('M9Z4Q', 'Brown', 'Michael', 'T.', 'Lisa Brown', 'Retired', 'O-6', 'Yes', 'Philippine Navy', 'Offshore Combat Force', 'mbrown@gmail.com', 4023, '9171234567', '0917 892 4615', '0915 738 2641', 'Spouse', NULL),
('S1L2E', 'Santos', 'Maria', 'G.', 'Pedro Santos', 'Active Duty', 'O-3', 'No', 'Philippine Air Force', '250th Presidential Airlift Wing', 'maria.santos@email.com', 1010, '0918 111 2222', '0917 333 4444', '0908 555 6666', 'Sponsor', 'MAJ-1001'),
('P5R6T', 'Reyes', 'Daniel', 'L.', NULL, 'Civilian', NULL, NULL, NULL, NULL, 'daniel.reyes@email.com', 3050, '0999 777 8888', NULL, NULL, 'Personal', NULL),
('C7A8B', 'Garcia', 'Sofia', 'K.', 'Juan Garcia', 'Active Duty', 'E-7', 'Yes', 'Philippine Marine Corps', 'Marine Battalion Landing Team 1', 'sofia.garcia@email.com', 5001, '0906 999 0000', '0905 123 4567', '0907 890 1234', 'Spouse', 'LTC-5500'),
('V9W0X', 'Lim', 'Kevin', 'S.', 'Sarah Lim', 'Retired', 'W-3', 'No', 'Philippine Army', 'Logistics Command', 'kevin.lim@email.com', 2005, '0939 123 4567', '0949 987 6543', NULL, 'Sponsor', NULL),
('F2G3H', 'Cruz', 'Jessica', 'M.', NULL, 'Civilian', NULL, NULL, NULL, NULL, 'jessica.cruz@email.com', 1122, '0928 345 6789', NULL, '0919 567 8901', 'Personal', NULL);

-- Insert data into Pet Table
INSERT INTO Pets VALUES
(900085000123456, 'Tiger Commando', 'A7B9K', 'Dog', '2021-03-25', 3, 'German Shepherd', 'Bi-color', 'No', 'Male', 'Yes', 'No', NULL),
(987654321234567, 'Hachiko', 'A7B9K', 'Dog', '2020-07-15', 4, 'Akita', 'Solid', 'Yes', 'Female', 'No', 'Yes', 'Vetopia Animal Clinic'),
(981020000876543, 'Mingming', 'X3D7P', 'Cat', '2019-08-03', 5, 'Persian', 'Multi-color', 'Yes', 'Female', 'No', 'No', NULL),
(956000010234852, 'Bantay', 'X3D7P', 'Dog', '2020-05-12', 4, 'Golden Retriever', 'Solid', 'Yes', 'Female', 'Yes', 'Yes', 'Shepherd Animal Clinic'),
(991001900123478, 'Garfield', 'X3D7P', 'Cat', '2021-10-05', 3, 'Sphynx', 'Solid', 'Yes', 'Male', 'Yes', 'No', NULL),
(985141002374652, 'Tiger Commando', 'M9Z4Q', 'Dog', '2020-08-05', 4, 'German Shepherd', 'Bi-color', 'No', 'Male', 'Yes', 'Yes', 'Serbisyo Beterinaryo'),
(912345678901234, 'Max', 'S1L2E', 'Dog', '2022-01-10', 2, 'Labrador Retriever', 'Solid', 'Yes', 'Male', 'Yes', 'Yes', 'Paw & Order Vet Clinic'),
(909876543210987, 'Whiskers', 'S1L2E', 'Cat', '2023-04-01', 1, 'Siamese', 'Bi-color', 'No', 'Female', 'No', 'No', NULL),
(976543210987654, 'Buddy', 'P5R6T', 'Dog', '2018-11-20', 6, 'Beagle', 'Multi-color', 'Yes', 'Male', 'Yes', 'Yes', 'Central Pet Clinic'),
(965432109876543, 'Luna', 'P5R6T', 'Cat', '2020-02-29', 4, 'Maine Coon', 'Bi-color', 'Yes', 'Female', 'No', 'Yes', 'Cat Lovers Clinic'),
(943210987654321, 'Rocky', 'C7A8B', 'Dog', '2021-06-18', 3, 'Bulldog', 'Solid', 'No', 'Male', 'Yes', 'No', NULL),
(932109876543210, 'Shadow', 'C7A8B', 'Dog', '2022-09-01', 2, 'Dachshund', 'Bi-color', 'Yes', 'Male', 'Yes', 'Yes', 'Vet Med Center'),
(954321098765432, 'Chloe', 'V9W0X', 'Cat', '2019-12-12', 5, 'Ragdoll', 'Multi-color', 'Yes', 'Female', 'No', 'No', NULL),
(987654321012345, 'Simba', 'V9W0X', 'Cat', '2023-01-20', 1, 'Bengal', 'Bi-color', 'No', 'Male', 'Yes', 'No', NULL),
(910111213141516, 'Daisy', 'F2G3H', 'Dog', '2020-10-30', 4, 'Poodle', 'Solid', 'Yes', 'Female', 'Yes', 'Yes', 'Happy Paws Vet Clinic');

-- Insert data into Vaccine Table (Excluding DHPP, FVRCP, LRVC)
INSERT INTO Vaccine VALUES
('RV01', 'Rabvac', 'Core', 3),
('VP01', 'Vanguard Plus 5', 'Core', 1),
('CF04', 'Nobivac Canine Flu H3N8', 'Non-Core', 1),
('RV02', 'Rabvac', 'Core', 3),
('BS01', 'Rabisin', 'Core', 2),
('FA02', 'Felocell 3', 'Core', 3),
('BS03', 'Felocell 3', 'Core', 2),
('IM02', 'Imrab 3', 'Core', 2),
('LK05', 'Leukocell 2', 'Non-Core', 2),
('CV02', 'Canvac R', 'Core', 1),
('CN04', 'Canigen KC', 'Non-Core', 2),
('CV03', 'Canvac R', 'Core', 1),
('NB07', 'Nobivac', 'Core', 2),
('FL04', 'Felligen', 'Core', 1),
('NB09', 'Nobivac', 'Core', 2),
('NL03', 'Nobivac Lyme', 'Non-Core', 2),
('RV04', 'Rabvac', 'Core', 3);

-- Insert data into Vaccine Reaction Table (using only the allowed vaccine lots)
INSERT INTO Vaccine_Reaction VALUES
('A7B9K', 900085000123456, 'RV01', '2021-03-15', '2024-03-15', 'Yes', 'Swelling'),
('A7B9K', 900085000123456, 'VP01', '2024-03-18', '2025-03-18', 'Yes', 'Fever'),
('A7B9K', 900085000123456, 'CF04', '2024-03-20', '2025-03-20', 'No', 'N/A'),
('A7B9K', 900085000123456, 'RV02', '2024-03-22', '2027-03-22', 'No', 'N/A'),
('A7B9K', 987654321234567, 'BS01', '2022-05-16', '2024-05-16', 'Yes', 'Appetite Loss'),
('A7B9K', 987654321234567, 'FA02', '2023-03-23', '2026-03-23', 'Yes', 'Diarrhea'),
('A7B9K', 987654321234567, 'BS03', '2024-09-11', '2026-09-11', 'Yes', 'Vomiting'),
('X3D7P', 981020000876543, 'IM02', '2021-07-26', '2023-07-26', 'No', 'N/A'),
('X3D7P', 981020000876543, 'LK05', '2022-08-27', '2024-08-27', 'Yes', 'Sneezing'),
('X3D7P', 956000010234852, 'CV02', '2022-04-23', '2023-04-23', 'No', 'N/A'),
('X3D7P', 956000010234852, 'CN04', '2023-07-24', '2025-07-24', 'Yes', 'Kennel Cough'),
('X3D7P', 956000010234852, 'CV03', '2024-01-19', '2025-01-19', 'Yes', 'Fever'),
('X3D7P', 991001900123478, 'NB07', '2021-12-25', '2025-12-25', 'Yes', 'Appetite Loss'),
('X3D7P', 991001900123478, 'FL04', '2024-11-16', '2025-11-16', 'No', 'N/A'),
('X3D7P', 991001900123478, 'NB09', '2023-12-19', '2026-12-19', 'Yes', 'Fever'),
('M9Z4Q', 985141002374652, 'RV02', '2021-04-01', '2027-04-01', 'No', 'N/A'),
('M9Z4Q', 985141002374652, 'NL03', '2023-07-24', '2025-07-24', 'Yes', 'Vomiting'),
('M9Z4Q', 985141002374652, 'RV04', '2024-11-16', '2027-11-16', 'No', 'N/A'),
('S1L2E', 912345678901234, 'RV01', '2024-05-10', '2027-05-10', 'No', 'N/A'),
('S1L2E', 909876543210987, 'FA02', '2023-06-05', '2026-06-05', 'No', 'N/A'),
('P5R6T', 976543210987654, 'CV02', '2020-01-15', '2021-01-15', 'Yes', 'Lethargy'),
('P5R6T', 976543210987654, 'RV01', '2024-02-20', '2027-02-20', 'No', 'N/A'),
('P5R6T', 965432109876543, 'BS01', '2021-03-10', '2024-03-10', 'No', 'N/A'),
('C7A8B', 943210987654321, 'VP01', '2021-08-01', '2024-08-01', 'No', 'N/A'),
('C7A8B', 943210987654321, 'RV01', '2024-04-05', '2027-04-05', 'Yes', 'Swelling'),
('C7A8B', 932109876543210, 'CV02', '2023-10-15', '2024-10-15', 'No', 'N/A'),
('V9W0X', 954321098765432, 'FA02', '2020-02-01', '2023-02-01', 'No', 'N/A'),
('V9W0X', 954321098765432, 'BS01', '2024-01-25', '2026-01-25', 'No', 'N/A'),
('V9W0X', 987654321012345, 'IM02', '2023-03-01', '2025-03-01', 'No', 'N/A'),
('F2G3H', 910111213141516, 'VP01', '2021-11-01', '2024-11-01', 'No', 'N/A');
