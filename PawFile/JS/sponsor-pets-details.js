// This script fetches and displays the details of a sponsored pet
document.addEventListener("DOMContentLoaded", async () => {
  // Get petId from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get("petId") || (document.getElementById("petId") && document.getElementById("petId").innerText);

  if (!petId) {
    // Show a user-friendly message instead of redirecting immediately
    console.warn("Missing pet ID.", { petId });
    const mainContent = document.querySelector("main") || document.body;
    const msg = document.createElement("div");
    msg.style.color = "red";
    msg.style.fontWeight = "bold";
    msg.style.margin = "2em";
    msg.textContent = "No pet detected. Please make sure you have selected a valid pet.";
    mainContent.innerHTML = "";
    mainContent.appendChild(msg);

    // Optionally, provide a button to go back or retry
    const btn = document.createElement("button");
    btn.textContent = "Go to Sponsor Pets";
    btn.onclick = () => window.location.href = "../HTML/sponsor-pets.html";
    btn.style.marginTop = "1em";
    mainContent.appendChild(btn);

    return;
  }

  // Separate edit states for different sections
  let isPetInfoEditing = false;
  let isVaccineHistoryEditing = false;

  try {
    // Use your backend endpoint for pet details
    const response = await fetch(`http://localhost:3000/api/pet/${petId}`);
    if (!response.ok) {
      // If not found, set all fields to N/A
      setAllFieldsToNA();
      throw new Error("Failed to fetch pet details");
    }

    const data = await response.json();
    
    // Get the sponsor_id from the pet data
    const userId = data.Sponsor_ID;
    if (!userId) {
      throw new Error("No sponsor associated with this pet");
    }

    // Set PET ID display
    const petIdElement = document.getElementById("petId");
    if (petIdElement) {
      petIdElement.textContent = data.Microchip_No || data.Pet_ID || petId;
    }

    // Fill in pet information
    const infoGrid = document.querySelector(".info-grid");
    if (infoGrid) {
      // Pet Name
      const petNameInput = document.getElementById('petName');
      if (petNameInput) petNameInput.value = data.Pet_Name || "N/A";

      // Species
      const speciesInput = document.getElementById('species');
      if (speciesInput) speciesInput.value = data.Species || "N/A";

      // Date of Birth (format to YYYY-MM-DD)
      const dobInput = document.getElementById('dob');
      if (dobInput) {
        if (data.DOB) {
          // Format date to YYYY-MM-DD
          const date = new Date(data.DOB);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          dobInput.value = `${yyyy}-${mm}-${dd}`;
          dobInput.dispatchEvent(new Event('input', { bubbles: true }));
          dobInput.classList.add('has-value');
        } else {
          dobInput.value = "";
        }
      }

      // Age
      const ageInput = document.getElementById('age');
      if (ageInput) ageInput.value = data.Age || "N/A";

      // Breed
      const breedInput = document.getElementById('breed');
      if (breedInput) breedInput.value = data.Breed || "N/A";

      // Color select
      const colorSelect = document.getElementById('color');
      if (colorSelect) {
        // Only build options if they don't exist yet
        if (colorSelect.options.length <= 1) { // Assuming just the default option exists
          colorSelect.innerHTML = `
            <option value="">Select Color</option>
            <option value="Solid">Solid Color</option>
            <option value="Bi-color">Bi-color</option>
            <option value="Multi-color">Multi-color</option>
          `;
        }

        // Then set the selected value
        if (data.Color) {
          const dbColor = data.Color.trim();
          for (let i = 0; i < colorSelect.options.length; i++) {
            if (colorSelect.options[i].value === dbColor) {
              colorSelect.selectedIndex = i;
              break;
            }
          }
        }
      }

      // Clinic Name
      const clinicNameInput = document.getElementById('clinicName');
      if (clinicNameInput) clinicNameInput.value = data.Clinic_Name || "N/A";
    }

    // Set radio buttons for pet info
    setRadio("spayNeuter", data.Is_Spayed_Neutered);
    setRadio("hasPassport", data.Has_Passport);
    setRadio("clinicHistory", data.Has_Recent_Clinic_History);
    setRadio("sex", data.Sex);
    

    // --- DYNAMIC VACCINE HISTORY ---
    const vaccineHistoryContainer = document.getElementById('vaccine-history');
    const addBtn = document.querySelector('.add-vaccine');

    function renumberVaccines() {
      const sections = vaccineHistoryContainer.querySelectorAll('.vaccine-section');
      sections.forEach((sec, idx) => {
        const header = sec.querySelector('.vaccine-header h3');
        if (header) header.textContent = `Vaccine #${idx + 1}`;
        
        // Update all field names
        sec.querySelectorAll('[name]').forEach(el => {
          const name = el.getAttribute('name');
          const newName = name.replace(/\d+$/, '') + (idx + 1);
          el.setAttribute('name', newName);
        });
      });
    }

    // Separate toggle functions for different sections
    function togglePetInfoEditMode(editing) {
      console.log('Toggling pet info edit mode:', editing);
      
      // Only target pet info section (main info-grid, not vaccine sections)
      const mainInfoGrid = document.querySelector(".info-grid:not(.vaccine-section .info-grid)");
      if (mainInfoGrid) {
        mainInfoGrid.querySelectorAll('input, select').forEach(el => {
          if (el.type === "text" || el.type === "date" || el.type === "number") {
            el.readOnly = !editing;
            el.style.backgroundColor = editing ? '#fff' : '#f5f5f5';
          }
          if (el.tagName === "SELECT") {
            el.disabled = !editing;
            el.style.backgroundColor = editing ? '#fff' : '#f5f5f5';
          }
        });
      }
      
      // Handle radio buttons in pet info section
      document.querySelectorAll('input[type="radio"][name="spayNeuter"], input[type="radio"][name="hasPassport"], input[type="radio"][name="clinicHistory"], input[type="radio"][name="sex"]').forEach(radio => {
        radio.disabled = !editing;
      });
    }

    function toggleVaccineHistoryEditMode(editing) {
      console.log('Toggling vaccine history edit mode:', editing);
      
      // Only target vaccine sections
      document.querySelectorAll('.vaccine-section .info-grid input, .vaccine-section .info-grid select').forEach(el => {
        if (el.type === "text" || el.type === "date" || el.type === "number") {
          el.readOnly = !editing;
          el.style.backgroundColor = editing ? '#fff' : '#f5f5f5';
        }
        if (el.tagName === "SELECT") {
          el.disabled = !editing;
          el.style.backgroundColor = editing ? '#fff' : '#f5f5f5';
        }
      });
      
      // Handle radio buttons in vaccine sections
      document.querySelectorAll('.vaccine-section input[type="radio"]').forEach(radio => {
        radio.disabled = !editing;
      });
      
      // Enable/disable add vaccine button
      if (addBtn) {
        addBtn.disabled = !editing;
        addBtn.style.opacity = editing ? '1' : '0.5';
        addBtn.style.cursor = editing ? 'pointer' : 'not-allowed';
      }
      
      // Enable/disable delete buttons
      document.querySelectorAll('.delete-vaccine').forEach(btn => {
        btn.disabled = !editing;
        btn.style.opacity = editing ? '1' : '0.5';
        btn.style.cursor = editing ? 'pointer' : 'not-allowed';
      });
    }

    // Updated save functions based on database integration requirements
    async function savePetInfo() {
      try {
        // Get all pet information from the form
        const petData = {
          Microchip_No: document.getElementById("petId")?.textContent || petId,
          Pet_Name: document.getElementById('petName')?.value,
          Sponsor_ID: userId,
          Species: document.getElementById('species')?.value,
          DOB: document.getElementById('dob')?.value,
          Age: document.getElementById('age')?.value,
          Breed: document.getElementById('breed')?.value,
          Color: document.getElementById('color')?.value,
          Has_Passport: getRadioValue('hasPassport'),
          Sex: getRadioValue('sex'),
          Is_Spayed_Neutered: getRadioValue('spayNeuter'),
          Has_Recent_Clinic_History: getRadioValue('clinicHistory'),
          Clinic_Name: document.getElementById('clinicName')?.value
        };

        // Collect vaccine data
        const vaccineSections = document.querySelectorAll('.vaccine-section');
        const vaccinePromises = [];

        // Debug: Log total number of vaccine sections
        console.log('Total vaccine sections:', vaccineSections.length);

        for (const section of vaccineSections) {
          const index = Array.from(vaccineSections).indexOf(section) + 1;
          
          // Debug: Log section elements
          console.log(`Vaccine #${index} section elements:`, {
            lot: section.querySelector(`input[name^="vaccine-lot"]`),
            name: section.querySelector(`input[name^="vaccine-name"]`),
            type: section.querySelector(`select[name^="vaccine-type"]`),
            date: section.querySelector(`input[name^="vaccination_date"]`),
            endDate: section.querySelector(`input[name^="vaccination_end_date"]`)
          });

          const vaccine = {
            Vaccine_Lot: section.querySelector(`input[name^="vaccine-lot"]`)?.value.trim(),
            Vaccine_Name: section.querySelector(`input[name^="vaccine-name"]`)?.value.trim(),
            Vaccine_Type: section.querySelector(`select[name^="vaccine-type"]`)?.value,
            Vaccine_Duration: parseInt(section.querySelector(`input[name^="vaccine_duration"]`)?.value) || 0,
            Date_Vaccination: section.querySelector(`input[name^="vaccination_date"]`)?.value,
            Vaccination_Effectiveness_Until: section.querySelector(`input[name^="vaccination_end_date"]`)?.value,
            Has_Vaccine_Reaction: getRadioValue(`reaction${index}`),
            Vaccine_Reaction_Symptoms: section.querySelector(`input[name^="vaccine_symptom"]`)?.value.trim()
          };

          // Debug: Log vaccine data before validation
          console.log(`Vaccine #${index} data:`, vaccine);

          // Improved validation with detailed error messages
          const missingFields = [];
          if (!vaccine.Vaccine_Lot || vaccine.Vaccine_Lot === '') missingFields.push('Lot');
          if (!vaccine.Vaccine_Name || vaccine.Vaccine_Name === '') missingFields.push('Name');
          if (!vaccine.Vaccine_Type || vaccine.Vaccine_Type === '') missingFields.push('Type');
          if (!vaccine.Date_Vaccination || vaccine.Date_Vaccination === '') missingFields.push('Vaccination Date');
          if (!vaccine.Vaccination_Effectiveness_Until || vaccine.Vaccination_Effectiveness_Until === '') {
            missingFields.push('Effectiveness End Date');
          }

          // Date format validation
          function isValidDate(dateString) {
            if (!dateString) return false;
            const date = new Date(dateString);
            return !isNaN(date.getTime());
          }

          if (!isValidDate(vaccine.Date_Vaccination)) {
            throw new Error(`Vaccine #${index}: Invalid vaccination date format`);
          }

          if (!isValidDate(vaccine.Vaccination_Effectiveness_Until)) {
            throw new Error(`Vaccine #${index}: Invalid effectiveness end date format`);
          }

          // Date range validation
          const vaccinationDate = new Date(vaccine.Date_Vaccination);
          const effectivenessDate = new Date(vaccine.Vaccination_Effectiveness_Until);
          
          if (effectivenessDate < vaccinationDate) {
            throw new Error(`Vaccine #${index}: Effectiveness end date cannot be before vaccination date`);
          }

          if (missingFields.length > 0) {
            throw new Error(`Vaccine #${index} missing required fields: ${missingFields.join(', ')}`);
          }

          // Debug: Log radio button value
          console.log(`Vaccine #${index} reaction:`, getRadioValue(`reaction${index}`));

          vaccinePromises.push(vaccine);
        }

        console.log('Attempting to save:', petData);

        // Validate pet data
        if (!petData.Microchip_No) {
          throw new Error("Missing pet ID");
        }

        // Disable save button and show loading state
        const saveButton = document.querySelector('.edit-btn[data-section="pet-info"]');
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        // Save pet information
        const response = await fetch(`http://localhost:3000/api/pets/${petId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(petData)
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }

        // Save vaccine reactions
        const saveReactionsResponse = await fetch(`http://localhost:3000/api/pets/${petId}/vaccine-reactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Sponsor_ID: userId,
            Microchip_No: petId,
            Vaccines: vaccinePromises.map(v => ({
              Vaccine_Lot: v.Vaccine_Lot,
              Vaccine_Name: v.Vaccine_Name,
              Vaccine_Type: v.Vaccine_Type,
              Vaccine_Duration: v.Vaccine_Duration,
              Date_Vaccination: v.Date_Vaccination,
              Vaccination_Effectiveness_Until: v.Vaccination_Effectiveness_Until,
              Has_Vaccine_Reaction: v.Has_Vaccine_Reaction === 'Yes' ? 'Yes' : 'No',
              Vaccine_Reaction_Symptoms: v.Vaccine_Reaction_Symptoms || null
            }))
          })
        });

        if (!saveReactionsResponse.ok) {
          const errorData = await saveReactionsResponse.json();
          throw new Error(`Failed to save vaccine reactions: ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Save successful:', result);
        
        // Verify the data was actually saved
        const verifyResponse = await fetch(`http://localhost:3000/api/pet/${petId}`);
        if (!verifyResponse.ok) {
          throw new Error("Failed to verify saved data");
        }
        
        const verifiedData = await verifyResponse.json();
        console.log('Verified data:', verifiedData);

        // Re-enable save button and restore original state
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
        }
        
        alert('Pet information saved successfully!');
        return true;
      } catch (error) {
        console.error('Error saving pet information:', error);
        alert(`Failed to save pet information: ${error.message}`);
        
        // Re-enable save button and restore original state on error
        const saveButton = document.querySelector('.edit-btn[data-section="pet-info"]');
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
        }
        
        return false;
      }
    }

    async function saveVaccineHistory() {
      try {
        const vaccines = [];
        const vaccineSections = document.querySelectorAll('.vaccine-section');
        
        console.log('Total vaccine sections:', vaccineSections.length);
        
        // First validate all vaccines
        for (const section of vaccineSections) {
          const index = Array.from(vaccineSections).indexOf(section) + 1;
          
          // Debug: Log section elements
          console.log(`Validating vaccine #${index} section elements:`, {
            lot: section.querySelector(`input[name="vaccine-lot${index}"]`),
            name: section.querySelector(`input[name="vaccine-name${index}"]`),
            type: section.querySelector(`select[name="vaccine-type${index}"]`),
            date: section.querySelector(`input[name="vaccination_date${index}"]`),
            endDate: section.querySelector(`input[name="vaccination_end_date${index}"]`)
          });
          
          const vaccine = {
            Vaccine_Lot: section.querySelector(`input[name="vaccine-lot${index}"]`)?.value.trim(),
            Vaccine_Name: section.querySelector(`input[name="vaccine-name${index}"]`)?.value.trim(),
            Vaccine_Type: section.querySelector(`select[name="vaccine-type${index}"]`)?.value,
            Vaccine_Duration: parseInt(section.querySelector(`input[name="vaccine_duration${index}"]`)?.value) || 0,
            Date_Vaccination: section.querySelector(`input[name="vaccination_date${index}"]`)?.value,
            Vaccination_Effectiveness_Until: section.querySelector(`input[name="vaccination_end_date${index}"]`)?.value,
            Has_Vaccine_Reaction: getRadioValue(`reaction${index}`),
            Vaccine_Reaction_Symptoms: section.querySelector(`input[name="vaccine_symptom${index}"]`)?.value.trim()
          };

          // Debug: Log vaccine data before validation
          console.log(`Validating vaccine #${index}:`, vaccine);

          // Enhanced validation with detailed error messages
          const missingFields = [];
          if (!vaccine.Vaccine_Lot || vaccine.Vaccine_Lot === '') missingFields.push('Lot');
          if (!vaccine.Vaccine_Name || vaccine.Vaccine_Name === '') missingFields.push('Name');
          if (!vaccine.Vaccine_Type || vaccine.Vaccine_Type === '') missingFields.push('Type');
          if (!vaccine.Date_Vaccination || vaccine.Date_Vaccination === '') missingFields.push('Vaccination Date');
          if (!vaccine.Vaccination_Effectiveness_Until || vaccine.Vaccination_Effectiveness_Until === '') {
            missingFields.push('Effectiveness End Date');
          }

          // Date format validation
          function isValidDate(dateString) {
            if (!dateString) return false;
            const date = new Date(dateString);
            return !isNaN(date.getTime());
          }

          if (!isValidDate(vaccine.Date_Vaccination)) {
            throw new Error(`Vaccine #${index}: Invalid vaccination date format`);
          }

          if (!isValidDate(vaccine.Vaccination_Effectiveness_Until)) {
            throw new Error(`Vaccine #${index}: Invalid effectiveness end date format`);
          }

          // Date range validation
          const vaccinationDate = new Date(vaccine.Date_Vaccination);
          const effectivenessDate = new Date(vaccine.Vaccination_Effectiveness_Until);
          
          if (effectivenessDate < vaccinationDate) {
            throw new Error(`Vaccine #${index}: Effectiveness end date cannot be before vaccination date`);
          }

          if (missingFields.length > 0) {
            console.error(`Missing fields for vaccine ${index}:`, {
              lot: vaccine.Vaccine_Lot,
              name: vaccine.Vaccine_Name,
              type: vaccine.Vaccine_Type,
              date: vaccine.Date_Vaccination,
              endDate: vaccine.Vaccination_Effectiveness_Until
            });
            throw new Error(`Vaccine #${index} missing required fields: ${missingFields.join(', ')}`);
          }

          vaccines.push(vaccine);
        }

        // Get the pet ID and sponsor ID
        const petId = document.getElementById("petId")?.textContent;
        if (!petId) {
          throw new Error("Missing pet ID");
        }

        if (!userId) {
          throw new Error("Missing sponsor ID");
        }

        // Disable save button and show loading state
        const saveButton = document.querySelector('.edit-btn[data-section="vaccine-history"]');
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        // Save all vaccine reactions
        const saveResponse = await fetch(`http://localhost:3000/api/pets/${petId}/vaccine-reactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Sponsor_ID: userId,
            Microchip_No: petId,
            Vaccines: vaccines.map(v => ({
              Vaccine_Lot: v.Vaccine_Lot,
              Vaccine_Name: v.Vaccine_Name,
              Vaccine_Type: v.Vaccine_Type,
              Vaccine_Duration: v.Vaccine_Duration,
              Date_Vaccination: v.Date_Vaccination,
              Vaccination_Effectiveness_Until: v.Vaccination_Effectiveness_Until,
              Has_Vaccine_Reaction: v.Has_Vaccine_Reaction === 'Yes' ? 'Yes' : 'No',
              Vaccine_Reaction_Symptoms: v.Vaccine_Reaction_Symptoms || null
            }))
          })
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || `Server responded with status ${saveResponse.status}`);
        }

        const result = await saveResponse.json();
        console.log('Vaccine history saved:', result);

        // Re-enable save button and restore original state
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
        }

        alert('Vaccine history saved successfully!');
        return true;
      } catch (error) {
        console.error('Error saving vaccine history:', error);
        alert(`Failed to save vaccine history: ${error.message}`);
        
        // Re-enable save button and restore original state on error
        const saveButton = document.querySelector('.edit-btn[data-section="vaccine-history"]');
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
        }
        
        return false;
      }
    }

    // Render initial vaccine history
    if (vaccineHistoryContainer) {
      vaccineHistoryContainer.innerHTML = '';
    }
    let vaccines = [];
    try {
      const vaccinesRes = await fetch(`http://localhost:3000/api/pet/${data.Microchip_No || data.Pet_ID || petId}/vaccines`);
      console.log('Vaccine response status:', vaccinesRes.status); // Debug log
      
      if (vaccinesRes.ok) {
        vaccines = await vaccinesRes.json();
        console.log('Fetched vaccines:', vaccines); // Debug log
        
        if (!Array.isArray(vaccines)) {
          console.error('Vaccines data is not an array:', vaccines);
          vaccines = [];
        }
      } else {
        console.error('Failed to fetch vaccines:', await vaccinesRes.text());
      }
    } catch (e) {
      console.error("Could not fetch vaccine history", e);
    }
    
    if (vaccines.length > 0 && vaccineHistoryContainer) {
      console.log('Rendering vaccines...'); // Debug log
      vaccines.forEach((vaccine, idx) => {
        console.log('Processing vaccine:', vaccine); // Debug log
        
        const section = document.createElement("div");
        section.className = "vaccine-section";
        section.innerHTML = `
          <div class="vaccine-header">
            <h3>Vaccine #${idx + 1}</h3>
            <button class="delete-vaccine" type="button"><i class="fas fa-trash"></i></button>
          </div>
          <div class="info-grid">
            <div class="form-field">
              <label>Vaccine Lot</label>
              <input type="text" name="vaccine-lot${idx+1}" placeholder="Vaccine LOT" value="${vaccine.Vaccine_Lot || ''}" />
            </div>
            <div class="form-field">
              <label>Vaccine Name</label>
              <input type="text" name="vaccine-name${idx+1}" placeholder="Vaccine Name" value="${vaccine.Vaccine_Name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Vaccine Type</label>
              <select name="vaccine-type${idx+1}" disabled>
                <option value="" disabled ${!vaccine.Vaccine_Type ? 'selected' : ''}>Vaccine Type</option>
                <option value="Core" ${vaccine.Vaccine_Type === 'Core' ? 'selected' : ''}>Core</option>
                <option value="Non-Core" ${vaccine.Vaccine_Type === 'Non-Core' ? 'selected' : ''}>Non-Core</option>
              </select>
            </div>
            <div class="form-field">
              <label>Vaccine Duration</label>
              <input type="number" name="vaccine_duration${idx+1}" placeholder="Vaccine Duration (years)" value="${vaccine.Vaccine_Duration || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Date of Vaccination</label>
              <input type="date" name="vaccination_date${idx+1}" class="dob-input" value="${vaccine.Date_Vaccination || ''}" />
            </div>
            <div class="form-field">
              <label>End Date of Vaccine Effectiveness</label>
              <input type="date" name="vaccination_end_date${idx+1}" class="dob-input" value="${vaccine.Vaccination_Effectiveness_Until || ''}" />
            </div>
            <div class="form-field">
              <label>Had Vaccine Reaction</label>
              <div class="radio-options" style="display: flex; gap: 1rem; align-items: center;">
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${idx+1}" value="Yes" 
                    ${vaccine.Has_Vaccine_Reaction === 'Yes' ? 'checked' : ''} 
                    style="width: auto; margin: 0;" /> 
                  <span style="font-size: 0.9rem;">YES</span>
                </label>
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${idx+1}" value="No" 
                    ${vaccine.Has_Vaccine_Reaction === 'No' ? 'checked' : ''} 
                    style="width: auto; margin: 0;" /> 
                  <span style="font-size: 0.9rem;">NO</span>
                </label>
              </div>
            </div>
            <div class="form-field" style="flex:5;">
              <label>Vaccine Symptom</label>
              <input type="text" name="vaccine_symptom${idx+1}" value="${vaccine.Vaccine_Reaction_Symptoms || ''}" readonly />
            </div>
          </div>
        `;
        vaccineHistoryContainer.appendChild(section);
        
        // Setup handlers for this section
        setupVaccineLookupForSection(section);
        setupVaccineReactionHandlersForSection(section);
        
        // Attach delete listener
        const delBtn = section.querySelector('.delete-vaccine');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (!isVaccineHistoryEditing) return;
            section.classList.add('fade-slide-out');
            section.addEventListener('animationend', () => {
              section.remove();
              renumberVaccines();
            });
          });
        }
      });
    } else {
      console.log('No vaccines found or container missing');
    }

    // Helper function to set up vaccine lookup for a section
    function setupVaccineLookupForSection(vaccineSection) {
        const lotInput = vaccineSection.querySelector('input[name^="vaccine-lot"]');
        const nameInput = vaccineSection.querySelector('input[name^="vaccine-name"]');
        const typeSelect = vaccineSection.querySelector('select[name^="vaccine-type"]');
        const durationInput = vaccineSection.querySelector('input[name^="vaccine_duration"]');

        if (!lotInput) return;

        let debounceTimeout;
        lotInput.addEventListener('input', function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
                const lot = this.value.trim();
                if (!lot) {
                    clearVaccineFields(vaccineSection);
                    return;
                }

                console.log('Fetching vaccine for lot:', lot);
                this.disabled = true; // Show loading state
                this.style.backgroundColor = '#f0f0f0'; // Visual feedback for loading

                try {
                    const response = await fetch(`http://localhost:3000/api/vaccine/${lot}`);
                    console.log('Response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch vaccine data: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('Vaccine data received:', data);

                    if (data.exists) {
                        // Existing vaccine found - auto-fill and lock the fields
                        if (nameInput) {
                            nameInput.value = data.Vaccine_Name;
                            nameInput.readOnly = true;
                    }
                        if (typeSelect) {
                            typeSelect.value = data.Vaccine_Type;
                            typeSelect.disabled = true;
                    }
                        if (durationInput) {
                            durationInput.value = data.Vaccine_Duration;
                            durationInput.readOnly = true;
                    }

                    // Add success visual feedback
                    this.style.backgroundColor = '#e8f5e9';
                    setTimeout(() => {
                        this.style.backgroundColor = '#fff';
                    }, 1000);
                    } else {
                        // New vaccine - allow editing of fields
                        if (nameInput) {
                            nameInput.value = '';
                            nameInput.readOnly = false;
                            nameInput.placeholder = 'Enter vaccine name';
                        }
                        if (typeSelect) {
                            typeSelect.value = '';
                            typeSelect.disabled = false;
                        }
                        if (durationInput) {
                            durationInput.value = '';
                            durationInput.readOnly = false;
                            durationInput.placeholder = 'Enter duration in years';
                        }
                        
                        // Add visual feedback for new vaccine
                        this.style.backgroundColor = '#fff3e0';
                        setTimeout(() => {
                            this.style.backgroundColor = '#fff';
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Error fetching vaccine data:', error);
                    alert(`Error checking vaccine: ${error.message}`);
                    clearVaccineFields(vaccineSection);
                    this.style.backgroundColor = '#ffebee'; // Error visual feedback
                    setTimeout(() => {
                        this.style.backgroundColor = '#fff';
                    }, 1000);
                } finally {
                    this.disabled = false; // Re-enable input
                }
            }, 500); // Wait 500ms after typing stops
        });
    }

    function clearVaccineFields(section) {
        const nameInput = section.querySelector('input[name^="vaccine-name"]');
        const typeSelect = section.querySelector('select[name^="vaccine-type"]');
        const durationInput = section.querySelector('input[name^="vaccine_duration"]');
        
        if (nameInput) {
            nameInput.value = '';
            nameInput.readOnly = false;
            nameInput.placeholder = 'Enter vaccine name';
        }
        if (typeSelect) {
            typeSelect.value = '';
            typeSelect.disabled = false;
        }
        if (durationInput) {
            durationInput.value = '';
            durationInput.readOnly = false;
            durationInput.placeholder = 'Enter duration in years';
        }
    }

    // Helper function to set up vaccine reaction handlers for a section
    function setupVaccineReactionHandlersForSection(vaccineSection) {
        const reactionRadios = vaccineSection.querySelectorAll('input[type="radio"][name^="reaction"]');
        const symptomInput = vaccineSection.querySelector('input[name^="vaccine_symptom"]');

        if (!symptomInput) return;

        reactionRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'Yes') {
                    symptomInput.value = '';
                    symptomInput.readOnly = false;
                    symptomInput.style.backgroundColor = '#fff';
                    symptomInput.placeholder = 'Enter vaccine symptoms...';
                } else if (this.value === 'No') {
                    symptomInput.value = 'N/A';
                    symptomInput.readOnly = true;
                    symptomInput.style.backgroundColor = '#f5f5f5';
                    symptomInput.placeholder = 'No symptoms';
                }
            });
        });

        // Set initial state based on current selection
        const checkedRadio = vaccineSection.querySelector('input[type="radio"][name^="reaction"]:checked');
        if (checkedRadio) {
            if (checkedRadio.value === 'Yes') {
                symptomInput.readOnly = false;
                symptomInput.style.backgroundColor = '#fff';
                symptomInput.placeholder = 'Enter vaccine symptoms...';
            } else {
                symptomInput.value = 'N/A';
                symptomInput.readOnly = true;
                symptomInput.style.backgroundColor = '#f5f5f5';
                symptomInput.placeholder = 'No symptoms';
            }
        } else {
            // Default to readonly if no selection
            symptomInput.readOnly = true;
            symptomInput.style.backgroundColor = '#f5f5f5';
            symptomInput.placeholder = 'Select reaction first';
        }
    }

    // Helper function to set up vaccine lookup for an entire form
    function setupVaccineLookup(form) {
        const vaccineLotInputs = form.querySelectorAll('input[name^="vaccine-lot"]');
        vaccineLotInputs.forEach(input => {
            const vaccineSection = input.closest('.vaccine-section');
            setupVaccineLookupForSection(vaccineSection);
        });
    }

    // Set up vaccine lookup for existing sections when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        const vaccineHistoryContainer = document.getElementById('vaccine-history');
        if (vaccineHistoryContainer) {
            setupVaccineLookup(vaccineHistoryContainer);
        }
    });

    // Setup edit button handlers
    function setupEditButtons() {
      // Pet Info Edit Button
      const petInfoEditBtn = document.querySelector('.edit-btn[data-section="pet-info"]');
    if (petInfoEditBtn) {
      petInfoEditBtn.addEventListener('click', async function(e) {
        e.preventDefault();
          console.log('Pet info edit button clicked');
        
        if (isPetInfoEditing) {
          // Currently editing, so save
          const saved = await savePetInfo();
          if (saved) {
            isPetInfoEditing = false;
            togglePetInfoEditMode(false);
            this.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
          }
        } else {
          // Currently not editing, so start editing
          isPetInfoEditing = true;
          togglePetInfoEditMode(true);
          this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
        }
      });
    }

      // Vaccine History Edit Button
      const vaccineEditBtn = document.querySelector('.edit-btn[data-section="vaccine-history"]');
    if (vaccineEditBtn) {
      vaccineEditBtn.addEventListener('click', async function(e) {
        e.preventDefault();
          console.log('Vaccine edit button clicked');
        
        if (isVaccineHistoryEditing) {
          // Currently editing, so save
          const saved = await saveVaccineHistory();
          if (saved) {
            isVaccineHistoryEditing = false;
            toggleVaccineHistoryEditMode(false);
            this.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
          }
        } else {
          // Currently not editing, so start editing
          isVaccineHistoryEditing = true;
          toggleVaccineHistoryEditMode(true);
          this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
        }
      });
      }
    }

    // Initialize everything when DOM is loaded
    setupEditButtons();
    
    // Set initial states
    togglePetInfoEditMode(false);
    toggleVaccineHistoryEditMode(false);

    // Add Vaccine
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!isVaccineHistoryEditing) {
          alert('Please enable edit mode to add vaccines');
          return;
        }
        
        const sections = vaccineHistoryContainer.querySelectorAll('.vaccine-section');
        const nextIndex = sections.length + 1;
        const newSection = document.createElement("div");
        newSection.className = "vaccine-section";
        newSection.innerHTML = `
          <div class="vaccine-header">
            <h3>Vaccine #${nextIndex}</h3>
            <button class="delete-vaccine" type="button"><i class="fas fa-trash"></i></button>
          </div>
          <div class="info-grid">
            <div class="form-field">
              <label>Vaccine Lot</label>
              <input type="text" name="vaccine-lot${nextIndex}" placeholder="Vaccine LOT" value="" />
            </div>
            <div class="form-field">
              <label>Vaccine Name</label>
              <input type="text" name="vaccine-name${nextIndex}" placeholder="Vaccine Name" value="" readonly />
            </div>
            <div class="form-field">
              <label>Vaccine Type</label>
              <select name="vaccine-type${nextIndex}" disabled>
                <option value="" disabled selected>Vaccine Type</option>
                <option value="Core">Core</option>
                <option value="Non-Core">Non-Core</option>
              </select>
            </div>
            <div class="form-field">
              <label>Vaccine Duration</label>
              <input type="number" name="vaccine_duration${nextIndex}" placeholder="Vaccine Duration (years)" value="" readonly />
            </div>
            <div class="form-field">
              <label>Date of Vaccination</label>
              <input type="date" name="vaccination_date${nextIndex}" class="dob-input" value="" />
            </div>
            <div class="form-field">
              <label>End Date of Vaccine Effectiveness</label>
              <input type="date" name="vaccination_end_date${nextIndex}" class="dob-input" value="" />
            </div>
            <div class="form-field">
              <label>Had Vaccine Reaction</label>
              <div class="radio-options" style="display: flex; gap: 1rem; align-items: center;">
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${nextIndex}" value="Yes" style="width: auto; margin: 0;" />
                  <span style="font-size: 0.9rem;">YES</span>
                </label>
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${nextIndex}" value="No" style="width: auto; margin: 0;" />
                  <span style="font-size: 0.9rem;">NO</span>
                </label>
              </div>
            </div>
            <div class="form-field" style="flex:2;">
              <label>Vaccine Symptom</label>
              <input type="text" name="vaccine_symptom${nextIndex}" placeholder="Vaccine Symptom" value="" readonly />
            </div>
          </div>
        `;
        vaccineHistoryContainer.appendChild(newSection);
        
        // Set up the new section's functionality
        setupVaccineLookupForSection(newSection);
        setupVaccineReactionHandlersForSection(newSection);
        
        // Attach delete listener with confirmation
        const delBtn = newSection.querySelector('.delete-vaccine');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (!isVaccineHistoryEditing) {
              alert('Please enable edit mode to delete vaccines');
              return;
            }
            
            if (confirm('Are you sure you want to delete this vaccine record?')) {
              newSection.classList.add('fade-slide-out');
              newSection.addEventListener('animationend', () => {
                newSection.remove();
                renumberVaccines();
              });
            }
          });
        }
        
        renumberVaccines();
      });
    }

  } catch (err) {
    setAllFieldsToNA();
    console.error("Error fetching pet details:", err);
  }
});

function setRadio(name, value) {
  if (value === null || value === undefined) return;
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach(radio => {
    const radioValue = radio.value.toLowerCase();
    const valueStr = value.toString().toLowerCase();
    const parentText = radio.parentElement.textContent.trim().toLowerCase();
    
    // Handle numeric/boolean values for Yes/No radios
    if (name.startsWith('reaction')) {
      if ((value === true || value == 1) && radioValue === 'yes') {
        radio.checked = true;
      } else if ((value === false || value == 0) && radioValue === 'no') {
        radio.checked = true;
      }
    } else if (radioValue === valueStr || parentText === valueStr) {
      radio.checked = true;
    }
  });
}

function getRadioValue(name) {
  const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
  return checkedRadio ? checkedRadio.value : null;
}

function setAllFieldsToNA() {
  // Set all text inputs to N/A
  const textInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
  textInputs.forEach(input => {
    input.value = "N/A";
  });
  
  // Set all select elements to first option or N/A
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    if (select.options.length > 0) {
      select.selectedIndex = 0;
    }
  });
  
  // Clear all date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.value = "";
  });
  
  // Uncheck all radio buttons
  const radioInputs = document.querySelectorAll('input[type="radio"]');
  radioInputs.forEach(input => {
    input.checked = false;
  });
  
  // Set pet ID to N/A
  const petIdElement = document.getElementById("petId");
  if (petIdElement) {
    petIdElement.textContent = "N/A";
  }
}