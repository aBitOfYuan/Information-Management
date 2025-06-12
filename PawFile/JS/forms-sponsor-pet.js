let petCount = 1;
let vaccineCounts = { 1: 1 }; // Track vaccine counts per pet

document.addEventListener('DOMContentLoaded', function() {
    // Initialize status change handler
    document.getElementById('Sponsor_Status').addEventListener('change', function() {
        const isActiveDuty = this.value === 'Active Duty';
        const militarySection = document.querySelector('.military-info');
        militarySection.disabled = !isActiveDuty;
        
        const militaryFields = militarySection.querySelectorAll('input, select');
        militaryFields.forEach(field => {
            field.required = isActiveDuty;
            if (!isActiveDuty) field.value = '';
        });
    });

    // Form submission handler
    document.getElementById('main-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const sponsorId = generateSponsorId();
    const password = generatePassword();
    
    const formData = {
        sponsor: collectSponsorData(sponsorId),
        pets: collectPetsData(sponsorId)
    };
    
    try {
        const response = await fetch('/submit-all', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ formData, password })
        });
        
        // First check if response exists and is OK
        if (!response) {
            throw new Error('No response from server');
        }

        // Check for empty response
        const text = await response.text();
        let result;
        try {
            result = text ? JSON.parse(text) : {};
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error('Invalid server response');
        }

        if (!response.ok) {
            throw new Error(result.message || `Server error: ${response.status}`);
        }
        
        if (result.success) {
            // Set modal message
            document.getElementById('modal-message').innerHTML =
                `Sponsor ID: <b>${sponsorId}</b><br>Password: <b>${password}</b>`;
            // Show modal
            document.getElementById('success-modal').style.display = 'flex';
            document.getElementById('main-form').reset();
        } else {
            throw new Error(result.message || 'Failed to submit form');
        }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error submitting form: ' + handleNetworkError(error));
        }
});
});

// Form validation
function validateForm() {
    const petForms = document.querySelectorAll('.registration-form[data-pet]');
    if (petForms.length === 0) {
        alert("Please add at least one pet");
        return false;
    }
    
    // Check required sponsor fields
    const sponsorRequired = ['Sponsor_FN', 'Sponsor_LN', 'Personal_Email', 'Sponsor_Phone_No'];
    for (const field of sponsorRequired) {
        if (!document.getElementById(field).value.trim()) {
            alert(`Please fill in all required sponsor fields`);
            return false;
        }
    }
    
    // Check each pet has required fields and at least one vaccine
    for (let form of petForms) {
        const petNum = form.getAttribute('data-pet');
        
        const petRequired = [
            `pet-name-${petNum}`, `species-${petNum}`, `dob-${petNum}`,
            `age-${petNum}`, `breed-${petNum}`, `color-pattern-${petNum}`
        ];
        
        for (const field of petRequired) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && !input.value.trim()) {
                alert(`Please fill in all required fields for Pet ${petNum}`);
                return false;
            }
        }
        
        const vaccines = form.querySelectorAll('.vaccine-section');
        if (vaccines.length === 0) {
            alert(`Each pet must have at least one vaccine (Pet ${petNum})`);
            return false;
        }
    }
    
    return true;
}

// Pet Form Functions
function addPetForm() {
    if (petCount >= 5) {
        alert("Maximum of 5 pets allowed");
        return;
    }
    
    petCount++;
    vaccineCounts[petCount] = 1;
    const container = document.getElementById('pet-forms-wrapper');

    const petForm = document.createElement('section');
    petForm.className = 'registration-form';
    petForm.setAttribute('data-pet', petCount);
    petForm.innerHTML = `
        <legend class="form-name">Pet Information ${petCount}</legend>
        <div class="form-row">
            <div class="form-group">
                <label for="pet-name-${petCount}">Pet Name</label>
                <input type="text" id="pet-name-${petCount}" name="pet-name-${petCount}" required />
            </div>
            <div class="form-group">
                <label for="species-${petCount}">Species</label>
                <input type="text" id="species-${petCount}" name="species-${petCount}" required />
            </div>
            <div class="form-group">
                <label for="dob-${petCount}">Date of Birth</label>
                <input type="date" id="dob-${petCount}" name="dob-${petCount}" required />
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="age-${petCount}">Age</label>
                <input type="text" id="age-${petCount}" name="age-${petCount}" required />
            </div>
            <div class="form-group">
                <label for="breed-${petCount}">Breed</label>
                <input type="text" id="breed-${petCount}" name="breed-${petCount}" required />
            </div>
            <div class="form-group">
                <label for="color-pattern-${petCount}">Color Pattern</label>
                <select id="color-pattern-${petCount}" name="color-pattern-${petCount}" required>
                    <option value="" disabled selected>Select Color Pattern</option>
                    <option value="solid">SOLID-COLOR</option>
                    <option value="bi-color">BI-COLOR</option>
                    <option value="multi-color">MULTI-COLOR</option>
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="field-container">
                <label class="field-label">Spayed/Neutered</label>
                <div class="radio-options">
                    <label class="radio-wrapper">
                        <input type="radio" id="spayed-yes-${petCount}" name="spayed-${petCount}" value="yes" required />
                        <span class="custom-radio small_text"></span> YES
                    </label>
                    <label class="radio-wrapper">
                        <input type="radio" id="spayed-no-${petCount}" name="spayed-${petCount}" value="no" required />
                        <span class="custom-radio small_text"></span> NO
                    </label>
                </div>
            </div>

            <div class="field-container">
                <label class="field-label">Has Passport</label>
                <div class="radio-options">
                    <label class="radio-wrapper">
                        <input type="radio" id="passport-yes-${petCount}" name="passport-${petCount}" value="yes" required />
                        <span class="custom-radio"></span> YES
                    </label>
                    <label class="radio-wrapper">
                        <input type="radio" id="passport-no-${petCount}" name="passport-${petCount}" value="no" required />
                        <span class="custom-radio"></span> NO
                    </label>
                </div>
            </div>

            <div class="field-container">
                <label class="field-label">Has Clinic History</label>
                <div class="radio-options">
                    <label class="radio-wrapper">
                        <input type="radio" id="clinic-history-yes-${petCount}" name="clinic-history-${petCount}" value="yes" required />
                        <span class="custom-radio"></span> YES
                    </label>
                    <label class="radio-wrapper">
                        <input type="radio" id="clinic-history-no-${petCount}" name="clinic-history-${petCount}" value="no" required />
                        <span class="custom-radio"></span> NO
                    </label>
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="clinic-name-${petCount}">Clinic Name</label>
                <input type="text" id="clinic-name-${petCount}" name="clinic-name-${petCount}" required />
            </div>
            <div class="field-container">
                <label class="field-label">Sex</label>
                <div class="radio-options">
                    <label class="radio-wrapper">
                        <input type="radio" id="sex-male-${petCount}" name="sex-${petCount}" value="male" required />
                        <span class="custom-radio"></span> Male
                    </label>
                    <label class="radio-wrapper">
                        <input type="radio" id="sex-female-${petCount}" name="sex-${petCount}" value="female" required />
                        <span class="custom-radio"></span> Female
                    </label>
                </div>
            </div>
        </div>

        <h4 class="form-name">Vaccine History</h4>
        <div id="vaccine-section-${petCount}">
            <div class="vaccine-section" data-vaccine="1">
                <p>Vaccine #1</p>
                <div class="form-row">
                    <div class="form-group">
                        <label for="vaccine-lot-${petCount}-1">Vaccine Lot</label>
                        <input type="text" id="vaccine-lot-${petCount}-1" name="vaccine-lot-${petCount}-1" required />
                    </div>
                    <div class="form-group">
                        <label for="vaccine-name-${petCount}-1">Vaccine Name</label>
                        <input type="text" id="vaccine-name-${petCount}-1" name="vaccine-name-${petCount}-1" required />
                    </div>
                    <div class="form-group">
                        <label for="vaccine-type-${petCount}-1">Vaccine Type</label>
                        <select id="vaccine-type-${petCount}-1" name="vaccine-type-${petCount}-1" required>
                            <option value="" disabled selected>Vaccine Type</option>
                            <option value="Core">Core</option>
                            <option value="Non-core">Non-core</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="vaccine_duration-${petCount}-1">Vaccine Duration</label>
                        <input type="text" id="vaccine_duration-${petCount}-1" name="vaccine_duration-${petCount}-1" required />
                    </div>
                    <div class="form-group">
                        <label for="vaccination_date-${petCount}-1">Date of Vaccination</label>
                        <input type="date" id="vaccination_date-${petCount}-1" name="vaccination_date-${petCount}-1" required />
                    </div>
                    <div class="form-group">
                        <label for="vaccination_end_date-${petCount}-1">End Date of Vaccination</label>
                        <input type="date" id="vaccination_end_date-${petCount}-1" name="vaccination_end_date-${petCount}-1" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="field-container">
                        <label class="field-label">Has Vaccine Reaction</label>
                        <div class="radio-options">
                            <label class="radio-wrapper">
                                <input type="radio" id="vaccine-reaction-yes-${petCount}-1" name="vaccine-reaction-${petCount}-1" value="yes" />
                                <span class="custom-radio"></span> Yes
                            </label>
                            <label class="radio-wrapper">
                                <input type="radio" id="vaccine-reaction-no-${petCount}-1" name="vaccine-reaction-${petCount}-1" value="no" />
                                <span class="custom-radio"></span> No
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="vaccine-symptoms-${petCount}-1">Vaccine Symptoms</label>
                        <input type="text" id="vaccine-symptoms-${petCount}-1" name="vaccine-symptoms-${petCount}-1" />
                    </div>
                </div>

                <div class="form-actions">
                    <div class="left-buttons">
                        <button class="add-vaccine" type="button" data-pet="${petCount}">Add Vaccine</button>
                        <button class="delete-vaccine" type="button" data-pet="${petCount}">Delete Vaccine</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(petForm);
}

// Event Delegation for Dynamic Elements
document.addEventListener("click", function(event) {
    // Add Pet
    if (event.target.classList.contains("add-pet")) {
        addPetForm();
    }

    // Delete Pet
    if (event.target.classList.contains("delete-pet")) {
        const wrapper = document.getElementById("pet-forms-wrapper");
        const petForms = wrapper.querySelectorAll('.registration-form[data-pet]');
        
        if (petForms.length > 1) {
            const lastPet = petForms[petForms.length - 1];
            const petNum = lastPet.getAttribute('data-pet');
            delete vaccineCounts[petNum];
            lastPet.remove();
            petCount--;
        } else {
            alert("At least one pet is required");
        }
    }

    // Add Vaccine
    if (event.target.classList.contains("add-vaccine")) {
        const petNum = event.target.getAttribute('data-pet');
        const vaccineContainer = document.getElementById(`vaccine-section-${petNum}`);
        
        if (vaccineCounts[petNum] >= 5) {
            alert("Maximum of 5 vaccines per pet");
            return;
        }
        
        vaccineCounts[petNum]++;
        const newVaccineNum = vaccineCounts[petNum];
        
        const newVaccine = vaccineContainer.querySelector('.vaccine-section').cloneNode(true);
        newVaccine.setAttribute('data-vaccine', newVaccineNum);
        newVaccine.querySelector('p').textContent = `Vaccine #${newVaccineNum}`;
        
        // Update all inputs in the new vaccine section
        newVaccine.querySelectorAll('input, select').forEach(input => {
            if (input.name) {
                input.name = input.name.replace(/-(\d+)$/, `-${newVaccineNum}`);
                if (input.id) {
                    input.id = input.id.replace(/-(\d+)$/, `-${newVaccineNum}`);
                }
                if (input.type !== 'radio' && input.type !== 'checkbox') {
                    input.value = '';
                } else {
                    input.checked = false;
                }
            }
        });
        
        // Update labels to match new IDs
        newVaccine.querySelectorAll('label').forEach(label => {
            if (label.htmlFor) {
                label.htmlFor = label.htmlFor.replace(/-(\d+)$/, `-${newVaccineNum}`);
            }
        });
        
        // Remove buttons from previous vaccine
        vaccineContainer.querySelector('.vaccine-section:last-child .form-actions').remove();
        
        // Add the new vaccine
        vaccineContainer.appendChild(newVaccine);
    }

    // Delete Vaccine
    if (event.target.classList.contains("delete-vaccine")) {
        const petNum = event.target.getAttribute('data-pet');
        const vaccineContainer = document.getElementById(`vaccine-section-${petNum}`);
        const vaccines = vaccineContainer.querySelectorAll('.vaccine-section');
        
        if (vaccines.length > 1) {
            vaccines[vaccines.length - 1].remove();
            vaccineCounts[petNum]--;
            
            // Update the numbering
            vaccineContainer.querySelectorAll('.vaccine-section').forEach((v, i) => {
                v.setAttribute('data-vaccine', i + 1);
                v.querySelector('p').textContent = `Vaccine #${i + 1}`;
            });
        } else {
            alert("At least one vaccine is required");
        }
    }
});

// Data Collection Functions
function collectSponsorData(sponsorId) {
    const status = document.getElementById('Sponsor_Status').value;
    const isActiveDuty = status === 'Active Duty';
    
    return {
        Sponsor_ID: sponsorId,
        Sponsor_LN: document.getElementById('Sponsor_LN').value,
        Sponsor_FN: document.getElementById('Sponsor_FN').value,
        Sponsor_MI: document.getElementById('Sponsor_MI').value,
        Spouse_Name: document.getElementById('Spouse-Name').value,
        Sponsor_Status: status,
        Grade: isActiveDuty ? document.getElementById('Grade').value : null,
        is_Dual_Military: isActiveDuty ? document.querySelector('input[name="is-dual-military"]:checked')?.value || null: null,
        Branch: isActiveDuty ? document.getElementById('Branch').value : null,
        Unit: isActiveDuty ? document.getElementById('Unit').value : null,
        Personal_Email: document.getElementById('Personal_Email').value,
        Mail_Box: document.getElementById('Mail_Box').value,
        Sponsor_Phone_No: document.getElementById('Sponsor_Phone_No').value,
        Work_Phone: document.getElementById('Work_Phone').value,
        Spouse_Alt_No: document.getElementById('Spouse_Alt_No').value,
        Preferred_Contact: document.getElementById('Preferred_Contact').value,
        Supervisor_ID: isActiveDuty ? document.getElementById('Supervisor_ID').value : null,
        Supervisor_Name: isActiveDuty ? document.getElementById('supervisor-name').value : null,
        Supervisor_Email: isActiveDuty ? document.getElementById('supervisor-email').value : null
    };
}

function collectPetsData(sponsorId) {
    const pets = [];
    const petForms = document.querySelectorAll('#pet-forms-wrapper .registration-form');
    
    petForms.forEach((form, index) => {
        try {
            const petNum = form.getAttribute('data-pet') || (index + 1);
            const microchipNo = generateMicrochipNo();
            
            const pet = {
                Microchip_No: microchipNo,
                Pet_Name: form.querySelector(`input[name="pet-name-${petNum}"]`).value,
                Sponsor_ID: sponsorId,
                Species: form.querySelector(`input[name="species-${petNum}"]`).value,
                DOB: form.querySelector(`input[name="dob-${petNum}"]`).value,
                Age: form.querySelector(`input[name="age-${petNum}"]`).value,
                Breed: form.querySelector(`input[name="breed-${petNum}"]`).value,
                Color: form.querySelector(`select[name="color-pattern-${petNum}"]`).value,
                Has_Passport: form.querySelector(`input[name="passport-${petNum}"]:checked`)?.value || 'no',
                Sex: form.querySelector(`input[name="sex-${petNum}"]:checked`)?.value || '',
                Is_Spayed_Neutered: form.querySelector(`input[name="spayed-${petNum}"]:checked`)?.value || 'no',
                Has_Recent_Clinic_History: form.querySelector(`input[name="clinic-history-${petNum}"]:checked`)?.value || 'no',
                Clinic_Name: form.querySelector(`input[name="clinic-name-${petNum}"]`)?.value || '',
                Vaccines: collectVaccinesData(form, sponsorId, microchipNo, petNum)
            };
            
            pets.push(pet);
        } catch (error) {
            console.error(`Error collecting data for pet ${index + 1}:`, error);
        }
    });
    
    return pets;
}

function collectVaccinesData(petForm, sponsorId, microchipNo, petNum) {
    const vaccines = [];
    const vaccineSections = petForm.querySelectorAll('.vaccine-section');
    
    vaccineSections.forEach((section, index) => {
        const vaccineNum = section.getAttribute('data-vaccine') || (index + 1);
        try {
            vaccines.push({
                Vaccine_Lot: section.querySelector(`input[name="vaccine-lot-${petNum}-${vaccineNum}"]`).value,
                Vaccine_Name: section.querySelector(`input[name="vaccine-name-${petNum}-${vaccineNum}"]`).value,
                Vaccine_Type: section.querySelector(`select[name="vaccine-type-${petNum}-${vaccineNum}"]`).value,
                Vaccine_Duration: section.querySelector(`input[name="vaccine_duration-${petNum}-${vaccineNum}"]`)?.value || '',
                Date_Vaccination: section.querySelector(`input[name="vaccination_date-${petNum}-${vaccineNum}"]`)?.value || '',
                Vaccination_Effectiveness_Until: section.querySelector(`input[name="vaccination_end_date-${petNum}-${vaccineNum}"]`)?.value || '',
                Has_Vaccine_Reaction: section.querySelector(`input[name="vaccine-reaction-${petNum}-${vaccineNum}"]:checked`)?.value || 'no',
                Vaccine_Reaction_Symptoms: section.querySelector(`input[name="vaccine-symptoms-${petNum}-${vaccineNum}"]`)?.value || '',
                Sponsor_ID: sponsorId,
                Microchip_No: microchipNo
            });
        } catch (error) {
            console.error(`Error collecting vaccine data for pet ${petNum}, vaccine ${vaccineNum}:`, error);
        }
    });
    
    return vaccines;
}


function handleNetworkError(error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return 'Network error - please check your connection';
    }
    return error.message;
}


// Utility Functions
function generateSponsorId() {
    const letters = Array.from({length: 3}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const numbers = Math.floor(10 + Math.random() * 90); // 2 digits, 10-99
    return letters + numbers;
}

function generatePassword() {
    return Math.random().toString(36).substr(2, 8);
}

function generateMicrochipNo() {
    // Start with a non-zero digit (e.g., 9), then add 14 random digits
    let first = Math.floor(Math.random() * 9) + 1; // 1-9
    let rest = Array.from({length: 14}, () => Math.floor(Math.random() * 10)).join('');
    return Number(first + rest); // Returns as a number (BIGINT safe for 15 digits)
}

// Modal close logic
document.getElementById('close-modal').onclick = closeModal;
document.getElementById('modal-ok-btn').onclick = closeModal;
window.onclick = function(event) {
    const modal = document.getElementById('success-modal');
    if (event.target === modal) closeModal();
};
function closeModal() {
    document.getElementById('success-modal').style.display = 'none';
    // Redirect to login page
    window.location.href = '../HTML/pawfile-login.html';
}


