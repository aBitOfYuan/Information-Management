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
    Sponsor_ID VARCHAR(10) NOT NULL,
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
    Vaccine_Reaction_Symptoms VARCHAR(50) NOT NULL,
    PRIMARY KEY (Sponsor_ID, Microchip_No, Vaccine_Lot, Date_Vaccination),
    FOREIGN KEY (Sponsor_ID) REFERENCES Sponsor(Sponsor_ID),
    FOREIGN KEY (Microchip_No) REFERENCES Pets(Microchip_No),
    FOREIGN KEY (Vaccine_Lot) REFERENCES Vaccine(Vaccine_Lot)
);