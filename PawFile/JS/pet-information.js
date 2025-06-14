document.addEventListener("click", function (event) {
    // event.stopPropagation(); // Removed to avoid interfering with other events
    
    // Handle Add Pet
    if (event.target.classList.contains("add-pet")) {
        const container = document.getElementById("pet-form-container");
        const formToClone = document.querySelector(".registration-form");

        const newForm = formToClone.cloneNode(true);

        // Clear all inputs and radios
        const inputs = newForm.querySelectorAll("input, select");
        inputs.forEach((input) => {
            if (input.type === "radio" || input.type === "checkbox") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });

        // Reset vaccine sections inside new form to only 1 vaccine section
        const vaccineContainer = newForm.querySelector("#vaccine-section");
        const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
        allVaccines.forEach((section, index) => {
            if (index > 0) section.remove(); // remove all but first
            else {
                // Reset first vaccine section's label and inputs
                const label = section.querySelector("p");
                if (label) label.textContent = "Vaccine #1";

                const inputs = section.querySelectorAll("input, select");
                inputs.forEach((input) => {
                    if (input.type === "radio" || input.type === "checkbox") {
                        input.checked = false;
                    } else {
                        input.value = "";
                        // Keep certain fields always editable
                        if (input.name === "vaccine-end-date" || input.name === "vaccine-date" || input.name === "vaccine-symptom") {
                            input.readOnly = false;
                            input.disabled = false;
                        } else if (input.name && !input.name.includes("reaction")) {
                            input.readOnly = false;
                            input.disabled = false;
                        }
                    }
                });
                
                // Initialize reaction state properly
                setupSymptomFieldForSection(section);
            }
        });

        // Update pet number in title
        const allForms = container.querySelectorAll(".registration-form");
        const newFormNumber = allForms.length + 1;
        const title = newForm.querySelector(".form-name");
        if (title) title.textContent = `Pet Information ${newFormNumber}`;

        // Update radio input names for new form (so they don't clash)
        newForm.querySelectorAll("input[type=radio]").forEach((radio) => {
            let baseName = radio.name.replace(/-\d+$/, "");
            radio.name = baseName + "-" + newFormNumber;
        });

        container.appendChild(newForm);
        newForm.classList.add("fade-slide-in");

        // Add vaccine lookup functionality to the new form
        setupVaccineLookup(newForm);
        // Setup vaccine reaction handlers
        setupVaccineReactionHandlers(newForm);
    }

    // Handle Add Vaccine - Ensure we're targeting the exact button clicked
    if (event.target.classList.contains("add-vaccine") || event.target.closest('.add-vaccine')) {
        // Prevent multiple triggers
        event.preventDefault();
        event.stopImmediatePropagation();
        
        const addButton = event.target.classList.contains("add-vaccine") 
            ? event.target 
            : event.target.closest('.add-vaccine');
            
        const currentForm = addButton.closest(".registration-form");
        const vaccineContainer = currentForm.querySelector("#vaccine-section");
        const vaccineSections = vaccineContainer.querySelectorAll(".vaccine-section");
        const lastVaccine = vaccineSections[vaccineSections.length - 1];
        const newVaccine = lastVaccine.cloneNode(true);

        // Clear all input values in the new section
        newVaccine.querySelectorAll('input, select').forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
                input.readOnly = false;
                input.disabled = false;
            }
        });

        // Update vaccine number
        const newVaccineNumber = vaccineSections.length + 1;
        const label = newVaccine.querySelector('p');
        if (label) label.textContent = `Vaccine #${newVaccineNumber}`;

        // Update radio button names
        const radioButtons = newVaccine.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.name = `reaction${newVaccineNumber}`;
        });

        // Remove any existing delete buttons
        newVaccine.querySelectorAll('.delete-vaccine').forEach(btn => btn.remove());

        // Add single delete button to the new section
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-vaccine';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = function() {
            if (vaccineContainer.querySelectorAll('.vaccine-section').length > 1) {
                newVaccine.classList.add('fade-slide-out');
                newVaccine.addEventListener('animationend', () => {
                    newVaccine.remove();
                    // Update vaccine numbers after removal
                    const updatedVaccines = vaccineContainer.querySelectorAll('.vaccine-section');
                    updatedVaccines.forEach((section, idx) => {
                        const label = section.querySelector('p');
                        if (label) label.textContent = `Vaccine #${idx + 1}`;
                    });
                }, { once: true });
            } else {
                alert('At least one vaccine section is required.');
            }
        };
        newVaccine.querySelector('.vaccine-header').appendChild(deleteBtn);

        vaccineContainer.appendChild(newVaccine);
        newVaccine.classList.add('fade-slide-in');

        // Add event listener for the new vaccine lot input
        const newLotInput = newVaccine.querySelector('input[name="vaccine-lot"]');
        if (newLotInput) {
            newLotInput.addEventListener('input', async function() {
                const lot = this.value.trim();
                if (!lot) return;
                try {
                    const response = await fetch(`http://localhost:3000/api/vaccine/${lot}`);
                    if (!response.ok) {
                        if (response.status === 404) {
                            clearVaccineFields(this);
                            return;
                        }
                        throw new Error('Failed to fetch vaccine data');
                    }
                    const vaccineData = await response.json();
                    const section = this.closest('.vaccine-section');
                    const vaccineNameInput = section.querySelector('input[name="vaccine-name"]');
                    const vaccineTypeSelect = section.querySelector('select[name="vaccine-type"]');
                    const vaccineDurationInput = section.querySelector('input[name="vaccine_duration"]');
                    if (vaccineNameInput) vaccineNameInput.value = vaccineData.Vaccine_Name;
                    if (vaccineTypeSelect) {
                        vaccineTypeSelect.value = vaccineData.Vaccine_Type;
                        vaccineTypeSelect.disabled = true;
                    }
                    if (vaccineDurationInput) {
                        vaccineDurationInput.value = vaccineData.Vaccine_Duration;
                        vaccineDurationInput.readOnly = true;
                    }
                    if (vaccineNameInput) vaccineNameInput.readOnly = true;
                } catch (error) {
                    console.error('Error:', error);
                    clearVaccineFields(this);
                }
            });
        }
        // Setup symptom field and reaction handlers for the new section
        setupSymptomFieldForSection(newVaccine);
        setupVaccineReactionHandlersForSection(newVaccine);
    }

    // Handle Delete Vaccine - Ensure precise targeting
    if (event.target.classList.contains("delete-vaccine") || event.target.closest('.delete-vaccine')) {
        // Prevent multiple triggers
        event.preventDefault();
        event.stopImmediatePropagation();
        
        const deleteBtn = event.target.classList.contains("delete-vaccine") 
            ? event.target 
            : event.target.closest('.delete-vaccine');
        const currentForm = deleteBtn.closest(".registration-form");
        const vaccineContainer = currentForm.querySelector("#vaccine-section");
        const vaccineSection = deleteBtn.closest('.vaccine-section');
        const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
        
        if (allVaccines.length > 1) {
            vaccineSection.classList.add("fade-slide-out");
            vaccineSection.addEventListener("animationend", () => {
                vaccineSection.remove();
                // Update vaccine numbers after removal
                updateVaccineNumbers(vaccineContainer);
            }, { once: true });
        } else {
            alert("At least one vaccine section is required.");
        }
    }

    // Handle Delete Pet
    if (event.target.classList.contains("delete-pet")) {
        // Prevent multiple triggers
        event.preventDefault();
        event.stopImmediatePropagation();
        const container = document.getElementById("pet-form-container");
        const allForms = container.querySelectorAll(".registration-form");

        if (allForms.length > 1) {
            const lastForm = allForms[allForms.length - 1];
            lastForm.classList.add("fade-slide-out");

            lastForm.addEventListener("animationend", () => {
                lastForm.remove();

                // Update pet form numbers and radio names
                const updatedForms = container.querySelectorAll(".registration-form");
                updatedForms.forEach((form, index) => {
                    const formNumber = index + 1;
                    const title = form.querySelector(".form-name");
                    if (title) title.textContent = `Pet Information ${formNumber}`;

                    form.querySelectorAll("input[type=radio]").forEach((radio) => {
                        let baseName = radio.name.replace(/-\d+$/, "");
                        radio.name = baseName + "-" + formNumber;
                    });
                });
            }, { once: true });
        } else {
            alert("At least one pet form is required.");
        }
    }
});

document.getElementById("back-button").addEventListener("click", () => {
    alert("Back button clicked!");
});

document.getElementById("save-information").addEventListener("click", async (e) => {
    e.preventDefault();
    
    try {
        // Disable save button during operation
        const saveBtn = e.target;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        // Process all pet forms
        const allForms = document.querySelectorAll(".registration-form");
        const savePromises = [];
        
        for (const form of allForms) {
            // Collect basic pet info
            const petData = {
                Pet_Name: form.querySelector('[name="pet-name"]')?.value || '',
                Species: form.querySelector('[name="species"]')?.value || '',
                DOB: form.querySelector('[name="dob"]')?.value || '',
                Age: form.querySelector('[name="age"]')?.value || '',
                Breed: form.querySelector('[name="breed"]')?.value || '',
                Color: form.querySelector('[name="color-pattern"]')?.value || '',
                Sex: form.querySelector('[name^="sex-"]:checked')?.value || '',
                Is_Spayed_Neutered: form.querySelector('[name^="spayed-"]:checked')?.value || '',
                Has_Passport: form.querySelector('[name^="passport-"]:checked')?.value || '',
                Has_Recent_Clinic_History: form.querySelector('[name^="clinic-history-"]:checked')?.value || '',
                Clinic_Name: form.querySelector('[name="clinic-name"]')?.value || '',
                Sponsor_ID: sessionStorage.getItem('userId') || ''
            };
            
            // Collect vaccine data
            const vaccineSections = form.querySelectorAll('.vaccine-section');
            petData.Vaccines = [];
            
            for (const section of vaccineSections) {
                const vaccine = {
                    Vaccine_Lot: section.querySelector('[name="vaccine-lot"]')?.value || '',
                    Vaccine_Name: section.querySelector('[name="vaccine-name"]')?.value || '',
                    Vaccine_Type: section.querySelector('[name="vaccine-type"]')?.value || '',
                    Vaccine_Duration: section.querySelector('[name="vaccine_duration"]')?.value || '',
                    Date_Vaccination: section.querySelector('[name="vaccination_date"]')?.value || '',
                    Vaccination_Effectiveness_Until: section.querySelector('[name="vaccination_end_date"]')?.value || '',
                    Has_Vaccine_Reaction: section.querySelector('[name^="reaction"]:checked')?.value || 'No',
                    Vaccine_Reaction_Symptoms: section.querySelector('[name="vaccine-symptom"]')?.value || ''
                };
                
                // Only add vaccine if required fields are present
                if (vaccine.Vaccine_Lot && vaccine.Vaccine_Name && vaccine.Vaccine_Type) {
                    petData.Vaccines.push(vaccine);
                }
            }
            
            // Validate required fields
            if (!petData.Pet_Name || !petData.Species) {
                throw new Error('Pet name and species are required');
            }

            // Send the data to the server
            const response = await fetch('http://localhost:3000/api/pets', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(petData)
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save pet');
            }

            savePromises.push(result);
        }
        
        // Check for errors
        const errors = savePromises.filter(result => !result.success);
        if (errors.length > 0) {
            throw new Error(`${errors.length} pet(s) failed to save`);
        }
        
        alert('All pets saved successfully!');
        window.location.reload();
        
    } catch (error) {
        console.error('Save failed:', error);
        alert(`Error saving pets: ${error.message}`);
    } finally {
        // Re-enable save button
        const saveBtn = document.getElementById("save-information");
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Information';
    }
}); 
// Helper function to set up vaccine lookup for a specific section
function setupVaccineLookupForSection(vaccineSection) {
    const lotInput = vaccineSection.querySelector('input[name="vaccine-lot"]');
    if (!lotInput) {
        console.error("No vaccine-lot input found in section!");
        return;
    }

    // Remove old listener (if any) to avoid duplicates
    lotInput.replaceWith(lotInput.cloneNode(true));
    const freshLotInput = vaccineSection.querySelector('input[name="vaccine-lot"]');

    freshLotInput.addEventListener('input', async function() {
        const lot = this.value.trim();
        console.log("Detected lot input:", lot); // Debug log

        if (!lot) {
            console.log("Lot empty, clearing fields");
            clearVaccineFields(this);
            return;
        }

        try {
            console.log("Calling API for lot:", lot);
            const response = await fetch(`http://localhost:3000/api/vaccine/${lot}`);
            
            if (!response.ok) {
                console.error("API error:", response.status);
                clearVaccineFields(this);
                return;
            }

            const vaccineData = await response.json();
            console.log("API response:", vaccineData); // Debug log

            const vaccineNameInput = vaccineSection.querySelector('input[name="vaccine-name"]');
            const vaccineTypeSelect = vaccineSection.querySelector('select[name="vaccine-type"]');
            const vaccineDurationInput = vaccineSection.querySelector('input[name="vaccine_duration"]');

            if (vaccineNameInput) {
                vaccineNameInput.value = vaccineData.Vaccine_Name || '';
                vaccineNameInput.readOnly = true;
                console.log("Updated vaccine name:", vaccineNameInput.value);
            }

            if (vaccineTypeSelect) {
                vaccineTypeSelect.value = vaccineData.Vaccine_Type || '';
                vaccineTypeSelect.disabled = true;
                console.log("Updated vaccine type:", vaccineTypeSelect.value);
            }

            if (vaccineDurationInput) {
                vaccineDurationInput.value = vaccineData.Vaccine_Duration || '';
                vaccineDurationInput.readOnly = true;
                console.log("Updated vaccine duration:", vaccineDurationInput.value);
            }

        } catch (error) {
            console.error("Fetch error:", error);
            clearVaccineFields(this);
        }
    });
}

// Helper function to set up vaccine lookup for an entire form
function setupVaccineLookup(form) {
    const vaccineLotInputs = form.querySelectorAll('input[name="vaccine-lot"]');
    vaccineLotInputs.forEach(input => {
        const vaccineSection = input.closest('.vaccine-section');
        setupVaccineLookupForSection(vaccineSection);
    });
}

// FIXED: Properly handle vaccine reaction changes
function setupVaccineReactionHandlersForSection(vaccineSection) {
    const reactionRadios = vaccineSection.querySelectorAll('input[type="radio"][name*="reaction"]');
    const symptomInput = vaccineSection.querySelector('input[name="vaccine-symptom"]');
    
    reactionRadios.forEach(radio => {
        // Remove any existing event listeners to prevent duplicates
        radio.replaceWith(radio.cloneNode(true));
    });

    // Get fresh references after cloning
    const freshRadios = vaccineSection.querySelectorAll('input[type="radio"][name*="reaction"]');
    const freshSymptomInput = vaccineSection.querySelector('input[name="vaccine-symptom"]');
    
    freshRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Yes') {
                freshSymptomInput.value = '';
                freshSymptomInput.readOnly = false;
            } else if (this.value === 'No') {
                freshSymptomInput.value = 'N/A';
                freshSymptomInput.readOnly = true;
            }
        });
    });
}

// FIXED: Initialize symptom field state properly
function setupSymptomFieldForSection(vaccineSection) {
    const radios = vaccineSection.querySelectorAll('input[type="radio"][name*="reaction"]');
    const symptomInput = vaccineSection.querySelector('input[name="vaccine-symptom"]');
    if (!symptomInput) return;

    // Find if any radio is checked
    let checkedRadio = null;
    for (const radio of radios) {
        if (radio.checked) {
            checkedRadio = radio;
            break;
        }
    }

    // If no radio is checked, default to "No"
    if (!checkedRadio) {
        const noRadio = Array.from(radios).find(r => r.value === 'No');
        if (noRadio) {
            noRadio.checked = true;
            checkedRadio = noRadio;
        }
    }

    // Set symptom field based on selection
    if (checkedRadio && checkedRadio.value === 'No') {
        symptomInput.value = 'N/A';
        symptomInput.readOnly = true;
    } else if (checkedRadio && checkedRadio.value === 'Yes') {
        symptomInput.readOnly = false;
        symptomInput.value = symptomInput.value || '';
    }
}

// Helper function to set up vaccine reaction handlers for an entire form
function setupVaccineReactionHandlers(form) {
    const vaccineSections = form.querySelectorAll('.vaccine-section');
    vaccineSections.forEach(section => {
        setupVaccineReactionHandlersForSection(section);
    });
}

// Initialize forms on page load
document.addEventListener('DOMContentLoaded', function() {
    const allForms = document.querySelectorAll('.registration-form');
    allForms.forEach(form => {
        setupVaccineLookup(form);
        
        const vaccineSections = form.querySelectorAll('.vaccine-section');
        vaccineSections.forEach(section => {
            setupSymptomFieldForSection(section);
            setupVaccineReactionHandlersForSection(section);
        });
    });
});

function updateVaccineNumbers(vaccineContainer) {
    const vaccineSections = vaccineContainer.querySelectorAll('.vaccine-section');
    vaccineSections.forEach((section, index) => {
        const label = section.querySelector('p');
        if (label) label.textContent = `Vaccine #${index + 1}`;
    });
}

function clearVaccineFields(lotInput) {
    const vaccineSection = lotInput.closest('.vaccine-section');
    
    // Define critical fields that should remain editable
    const editableFields = [
        'vaccine-end-date',
        'vaccine-date',
        'vaccine-symptom'
    ];
    
    // Reset lookup-dependent fields
    const fieldsToReset = [
        {name: 'vaccine-name', type: 'input'},
        {name: 'vaccine-type', type: 'select'},
        {name: 'vaccine_duration', type: 'input'}
    ];
    
    fieldsToReset.forEach(field => {
        const el = vaccineSection.querySelector(`${field.type}[name="${field.name}"]`);
        if (el) {
            el.value = '';
            if (field.type === 'select') {
                el.disabled = false;
            } else {
                el.readOnly = false;
            }
        }
    });
    
    // Ensure critical fields remain in proper state
    editableFields.forEach(fieldName => {
        const el = vaccineSection.querySelector(`input[name="${fieldName}"]`);
        if (el && fieldName !== 'vaccine_symptom') {
            el.readOnly = false;
            el.disabled = false;
        }
    });
    
    // Reset symptom field based on current reaction state
    setupSymptomFieldForSection(vaccineSection);
}