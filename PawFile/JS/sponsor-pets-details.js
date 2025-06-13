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
      if (colorSelect && data.Color) {
        console.log('Setting color from data:', data.Color);
        const dbColor = data.Color.trim();
        let colorSet = false;

        // First try exact match
        Array.from(colorSelect.options).forEach(opt => {
          if (opt.value === dbColor) {
            opt.selected = true;
            colorSet = true;
            console.log('Color set by exact match:', opt.value);
          }
        });

        // If no exact match, try case-insensitive match
        if (!colorSet) {
          Array.from(colorSelect.options).forEach(opt => {
            if (opt.value.toLowerCase() === dbColor.toLowerCase()) {
              opt.selected = true;
              colorSet = true;
              console.log('Color set by case-insensitive match:', opt.value);
            }
          });
        }

        // If still no match, log the issue
        if (!colorSet) {
          console.warn('Could not match color from database:', {
            dbColor,
            availableOptions: Array.from(colorSelect.options).map(o => o.value)
          });
        }
      } else if (colorSelect) {
        colorSelect.selectedIndex = 0;
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
        sec.querySelectorAll('[name]').forEach(el => {
          const baseName = el.getAttribute('name').replace(/\d+$/, '');
          el.setAttribute('name', baseName + (idx + 1));
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

        for (const section of vaccineSections) {
          const vaccine = {
            Vaccine_Lot: section.querySelector(`input[name^="vaccine-lot"]`)?.value.trim(),
            Vaccine_Name: section.querySelector(`input[name^="vaccine-name"]`)?.value.trim(),
            Vaccine_Type: section.querySelector(`select[name^="vaccine-type"]`)?.value,
            Vaccine_Duration: parseInt(section.querySelector(`input[name^="vaccine_duration"]`)?.value) || 0,
            Date_Vaccination: section.querySelector(`input[name^="vaccination_date"]`)?.value,
            Vaccination_Effectiveness_Until: section.querySelector(`input[name^="vaccination_end_date"]`)?.value,
            Has_Vaccine_Reaction: getRadioValue(`reaction${Array.from(vaccineSections).indexOf(section) + 1}`),
            Vaccine_Reaction_Symptoms: section.querySelector(`input[name^="vaccine_symptom"]`)?.value.trim()
          };

          // Validate vaccine data
          if (!vaccine.Vaccine_Lot || !vaccine.Vaccine_Name || !vaccine.Vaccine_Type || 
              !vaccine.Date_Vaccination || !vaccine.Vaccination_Effectiveness_Until) {
            throw new Error(`Vaccine #${Array.from(vaccineSections).indexOf(section) + 1} is missing required fields`);
          }

          // Check if vaccine exists in database
          const checkResponse = await fetch(`http://localhost:3000/api/vaccines/${vaccine.Vaccine_Lot}`);
          if (!checkResponse.ok) {
            // Add new vaccine to database
            const addVaccineResponse = await fetch('http://localhost:3000/api/vaccines', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                Vaccine_Lot: vaccine.Vaccine_Lot,
                Vaccine_Name: vaccine.Vaccine_Name,
                Vaccine_Type: vaccine.Vaccine_Type,
                Vaccine_Duration: vaccine.Vaccine_Duration
              })
            });

            if (!addVaccineResponse.ok) {
              throw new Error(`Failed to add new vaccine ${vaccine.Vaccine_Lot}`);
            }
          }

          vaccinePromises.push(vaccine);
        }

        console.log('Attempting to save:', petData);

        // Validate data
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
              Date_Vaccination: v.Date_Vaccination,
              Vaccination_Effectiveness_Until: v.Vaccination_Effectiveness_Until,
              Has_Vaccine_Reaction: v.Has_Vaccine_Reaction === 'Yes' ? 'Yes' : 'No',
              Vaccine_Reaction_Symptoms: v.Vaccine_Reaction_Symptoms || null
            }))
          })
        });

        if (!saveReactionsResponse.ok) {
          throw new Error('Failed to save vaccine reactions');
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
        
        // Collect all vaccine data from the form
        for (const section of vaccineSections) {
          const index = Array.from(vaccineSections).indexOf(section) + 1;
          
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

          // Validate required fields
          if (!vaccine.Vaccine_Lot || !vaccine.Vaccine_Name || !vaccine.Vaccine_Type || 
              !vaccine.Date_Vaccination || !vaccine.Vaccination_Effectiveness_Until) {
            throw new Error(`Vaccine #${index} is missing required fields`);
          }

          vaccines.push(vaccine);
        }

        // First, check if vaccines exist and add them if needed
        for (const vaccine of vaccines) {
          // Check if vaccine exists in the database
          const checkResponse = await fetch(`http://localhost:3000/api/vaccines/${vaccine.Vaccine_Lot}`);
          
          if (!checkResponse.ok) {
            // Vaccine doesn't exist, so add it to the Vaccine table
            const vaccineData = {
              Vaccine_Lot: vaccine.Vaccine_Lot,
              Vaccine_Name: vaccine.Vaccine_Name,
              Vaccine_Type: vaccine.Vaccine_Type,
              Vaccine_Duration: vaccine.Vaccine_Duration
            };

            const addVaccineResponse = await fetch('http://localhost:3000/api/vaccines', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(vaccineData)
            });

            if (!addVaccineResponse.ok) {
              throw new Error(`Failed to add new vaccine ${vaccine.Vaccine_Lot}`);
            }
          }
        }

        // Now save all vaccine reactions
        const saveReactionsResponse = await fetch(`http://localhost:3000/api/pets/${petId}/vaccine-reactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Sponsor_ID: userId,
            Microchip_No: petId,
            Vaccines: vaccines.map(v => ({
              Vaccine_Lot: v.Vaccine_Lot,
              Date_Vaccination: v.Date_Vaccination,
              Vaccination_Effectiveness_Until: v.Vaccination_Effectiveness_Until,
              Has_Vaccine_Reaction: v.Has_Vaccine_Reaction === 'Yes' ? 'Yes' : 'No',
              Vaccine_Reaction_Symptoms: v.Vaccine_Reaction_Symptoms || null
            }))
          })
        });

        if (!saveReactionsResponse.ok) {
          throw new Error('Failed to save vaccine reactions');
        }

        console.log('Vaccine history saved successfully');
        return true;
      } catch (error) {
        console.error('Error saving vaccine history:', error);
        alert(`Failed to save vaccine history: ${error.message}`);
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
      if (vaccinesRes.ok) {
        vaccines = await vaccinesRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch vaccine history", e);
    }
    
    if (Array.isArray(vaccines) && vaccines.length > 0 && vaccineHistoryContainer) {
      vaccines.forEach((vaccine, idx) => {
        console.log('Vaccine reaction data for vaccine', idx, ':', {
          raw: vaccine.Has_Vaccine_Reaction,
          type: typeof vaccine.Has_Vaccine_Reaction,
          value: vaccine.Has_Vaccine_Reaction
        });
        
        // Fixed vaccine section creation to match HTML structure
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
              <input type="date" name="vaccination_date${idx+1}" class="dob-input" value="${vaccine.Date_Vaccination ? vaccine.Date_Vaccination.substring(0,10) : ''}" />
            </div>
            <div class="form-field">
              <label>End Date of Vaccine Effectiveness</label>
              <input type="date" name="vaccination_end_date${idx+1}" class="dob-input" value="${vaccine.Vaccination_Effectiveness_Until ? vaccine.Vaccination_Effectiveness_Until.substring(0,10) : ''}" />
            </div>
            <div class="form-field">
              <label>Had Vaccine Reaction</label>
              <div class="radio-options" style="display: flex; gap: 1rem; align-items: center;">
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${idx+1}" value="Yes" 
                    ${vaccine.Has_Vaccine_Reaction === true || vaccine.Has_Vaccine_Reaction === 1 || vaccine.Has_Vaccine_Reaction === 'Yes' ? 'checked' : ''} 
                    style="width: auto; margin: 0;" /> 
                  <span style="font-size: 0.9rem;">YES</span>
                </label>
                <label class="radio-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <input type="radio" name="reaction${idx+1}" value="No" 
                    ${vaccine.Has_Vaccine_Reaction === false || vaccine.Has_Vaccine_Reaction === 0 || vaccine.Has_Vaccine_Reaction === 'No' ? 'checked' : ''} 
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
        
        // Setup handlers immediately after creating section
        setupVaccineReactionHandlersForSection(section);
        
        // Attach delete listener
        const delBtn = section.querySelector('.delete-vaccine');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (!isVaccineHistoryEditing) return; // Prevent deletion when not editing
            section.classList.add('fade-slide-out');
            section.addEventListener('animationend', () => {
              section.remove();
              renumberVaccines();
              toggleVaccineHistoryEditMode(isVaccineHistoryEditing);
            });
          });
        }
      });
      renumberVaccines();
      toggleVaccineHistoryEditMode(isVaccineHistoryEditing);
    }

    // Helper function to set up vaccine lookup for a section
    function setupVaccineLookupForSection(vaccineSection) {
        const lotInput = vaccineSection.querySelector('input[name^="vaccine-lot"]');
        if (!lotInput) return;

        let debounceTimeout;
        lotInput.addEventListener('input', function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
                const lot = this.value.trim();
                if (!lot) {
                    clearVaccineFields(this);
                    return;
                }

                console.log('Fetching vaccine for lot:', lot);
                this.disabled = true; // Show loading state
                this.style.backgroundColor = '#f0f0f0'; // Visual feedback for loading

                try {
                    const response = await fetch(`http://localhost:3000/api/vaccine/${lot}`);
                    console.log('Response status:', response.status);

                    if (!response.ok) {
                        if (response.status === 404) {
                            console.warn(`Vaccine lot ${lot} not found`);
                            alert(`Vaccine lot ${lot} not found in the database.`);
                            clearVaccineFields(this);
                            return;
                        }
                        throw new Error(`Failed to fetch vaccine data: ${response.statusText}`);
                    }

                    const vaccineData = await response.json();
                    console.log('Vaccine data received:', vaccineData);

                    // Validate response data
                    if (!vaccineData.Vaccine_Name || !vaccineData.Vaccine_Type || !vaccineData.Vaccine_Duration) {
                        console.warn('Incomplete vaccine data:', vaccineData);
                        alert('Vaccine data is incomplete. Please check the database.');
                        clearVaccineFields(this);
                        return;
                    }

                    // Validate vaccine type
                    const allowedTypes = ['Core', 'Non-Core'];
                    if (!allowedTypes.includes(vaccineData.Vaccine_Type)) {
                        console.warn(`Invalid vaccine type: ${vaccineData.Vaccine_Type}`);
                        alert(`Invalid vaccine type: ${vaccineData.Vaccine_Type}`);
                        clearVaccineFields(this);
                        return;
                    }

                    const vaccineNameInput = vaccineSection.querySelector('input[name^="vaccine-name"]');
                    const vaccineTypeSelect = vaccineSection.querySelector('select[name^="vaccine-type"]');
                    const vaccineDurationInput = vaccineSection.querySelector('input[name^="vaccine_duration"]');

                    console.log('Selected elements:', { vaccineNameInput, vaccineTypeSelect, vaccineDurationInput });

                    if (vaccineNameInput) {
                        vaccineNameInput.value = vaccineData.Vaccine_Name;
                        vaccineNameInput.readOnly = true;
                    }
                    if (vaccineTypeSelect) {
                        vaccineTypeSelect.value = vaccineData.Vaccine_Type;
                        vaccineTypeSelect.disabled = true;
                    }
                    if (vaccineDurationInput) {
                        vaccineDurationInput.value = vaccineData.Vaccine_Duration;
                        vaccineDurationInput.readOnly = true;
                    }

                    // Add success visual feedback
                    this.style.backgroundColor = '#e8f5e9';
                    setTimeout(() => {
                        this.style.backgroundColor = '#fff';
                    }, 1000);

                } catch (error) {
                    console.error('Error fetching vaccine data:', error);
                    alert(`Error fetching vaccine data: ${error.message}`);
                    clearVaccineFields(this);
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

    // FIXED: Setup edit button handlers with proper targeting and save functionality
    
    // Pet Info Edit Button - look for button with data-section="pet-info" OR fallback to first edit button
    let petInfoEditBtn = document.querySelector('.edit-btn[data-section="pet-info"]');
    if (!petInfoEditBtn) {
      // Fallback: look for edit button in pet info section
      const petInfoSection = document.querySelector('.pet-info-section, .info-section');
      if (petInfoSection) {
        petInfoEditBtn = petInfoSection.querySelector('.edit-btn');
      }
    }
    
    if (petInfoEditBtn) {
      console.log('Pet info edit button found:', petInfoEditBtn);
      petInfoEditBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Pet info edit button clicked, current state:', isPetInfoEditing);
        
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
    } else {
      console.warn('Pet info edit button not found');
    }

    // Vaccine History Edit Button - look for button with data-section="vaccine-history" OR fallback
    let vaccineEditBtn = document.querySelector('.edit-btn[data-section="vaccine-history"]');
    if (!vaccineEditBtn) {
      // Fallback: look for edit button in vaccine history section
      const vaccineSection = document.querySelector('.vaccine-history-section, .vaccine-section-container');
      if (vaccineSection) {
        vaccineEditBtn = vaccineSection.querySelector('.edit-btn');
      }
      // Alternative fallback: look for the second edit button if there are multiple
      if (!vaccineEditBtn) {
        const allEditBtns = document.querySelectorAll('.edit-btn');
        if (allEditBtns.length > 1) {
          vaccineEditBtn = allEditBtns[1]; // Second edit button
        }
      }
    }
    
    if (vaccineEditBtn) {
      console.log('Vaccine edit button found:', vaccineEditBtn);
      vaccineEditBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Vaccine edit button clicked, current state:', isVaccineHistoryEditing);
        
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
    } else {
      console.warn('Vaccine edit button not found');
    }

    // Set initial states - everything readonly/disabled
    togglePetInfoEditMode(false);
    toggleVaccineHistoryEditMode(false);

    // Add Vaccine
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!isVaccineHistoryEditing) return; // Prevent adding when not editing
        
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
        toggleVaccineHistoryEditMode(isVaccineHistoryEditing);

        // Set up the new section's functionality
        setupVaccineLookupForSection(newSection);
        setupVaccineReactionHandlersForSection(newSection);
        
        // Attach delete listener
        const delBtn = newSection.querySelector('.delete-vaccine');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (!isVaccineHistoryEditing) return; // Prevent deletion when not editing
            newSection.classList.add('fade-slide-out');
            newSection.addEventListener('animationend', () => {
              newSection.remove();
              renumberVaccines();
              toggleVaccineHistoryEditMode(isVaccineHistoryEditing);
            });
          });
        }
        renumberVaccines();
      });
    }

    // Update the color select element in the main form
    const colorSelect = document.getElementById('color');
    if (colorSelect) {
      colorSelect.innerHTML = `
        <option value="">Select Color</option>
        <option value="Solid">Solid Color</option>
        <option value="Bi-color">Bi-color</option>
        <option value="Multi-color">Multi-color</option>
      `;
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

function clearVaccineFields(lotInput) {
  const section = lotInput.closest('.vaccine-section');
  if (!section) return;
  
  const vaccineNameInput = section.querySelector('input[name^="vaccine-name"]');
  const vaccineTypeSelect = section.querySelector('select[name^="vaccine-type"]');
  const vaccineDurationInput = section.querySelector('input[name^="vaccine_duration"]');
  
  if (vaccineNameInput) {
    vaccineNameInput.value = "";
    vaccineNameInput.readOnly = false;
  }
  if (vaccineTypeSelect) {
    vaccineTypeSelect.selectedIndex = 0;
    vaccineTypeSelect.disabled = false;
  }
  if (vaccineDurationInput) {
    vaccineDurationInput.value = "";
    vaccineDurationInput.readOnly = false;
  }
}