// This script fetches and displays the details of a sponsored pet
document.addEventListener("DOMContentLoaded", async () => {
  // Use sessionStorage for userId
  const userId = sessionStorage.getItem("userId");
  // Get petId from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get("petId") || (document.getElementById("petId") && document.getElementById("petId").innerText);

  if (!userId || !petId) {
    // Show a user-friendly message instead of redirecting immediately
    console.warn("Missing user or pet ID.", { userId, petId });
    const mainContent = document.querySelector("main") || document.body;
    const msg = document.createElement("div");
    msg.style.color = "red";
    msg.style.fontWeight = "bold";
    msg.style.margin = "2em";
    msg.textContent = "No pet detected for your profile. Please make sure you are logged in and have a pet assigned to your account.";
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

  try {
    // Use your backend endpoint for pet details
    const response = await fetch(`http://localhost:3000/api/pet/${petId}`);
    if (!response.ok) {
      // If not found, set all fields to N/A
      setAllFieldsToNA();
      throw new Error("Failed to fetch pet details");
    }

    const data = await response.json();

    // Set PET ID display
    document.getElementById("petId").textContent = data.Microchip_No || data.Pet_ID || petId;

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
          dobInput.value = "N/A";
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
        Array.from(colorSelect.options).forEach(opt => {
          if (
            opt.textContent.trim().toLowerCase() === data.Color.trim().toLowerCase() ||
            opt.value.trim().toLowerCase() === data.Color.trim().toLowerCase()
          ) {
            opt.selected = true;
          }
        });
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
    // Remove existing vaccine sections (if any)
    const vaccineHistoryContainer = document.getElementById("vaccine-history");
    if (vaccineHistoryContainer) vaccineHistoryContainer.innerHTML = "";

    // Fetch all vaccines for this pet
    let vaccines = [];
    try {
      const vaccinesRes = await fetch(`http://localhost:3000/api/pet/${data.Microchip_No || data.Pet_ID || petId}/vaccines`);
      if (vaccinesRes.ok) {
        vaccines = await vaccinesRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch vaccine history", e);
    }

    if (Array.isArray(vaccines) && vaccines.length > 0) {
      vaccines.forEach((vaccine, idx) => {
        // Create a new vaccine section
        const section = document.createElement("div");
        section.className = "vaccine-section";
        section.innerHTML = `
          <h3>Vaccine #${idx + 1}</h3>
          <div class="info-grid">
            <div class="form-field">
              <label>Vaccine Lot</label>
              <input type="text" placeholder="Vaccine LOT" value="${vaccine.Vaccine_Lot || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Vaccine Name</label>
              <input type="text" placeholder="Vaccine Name" value="${vaccine.Vaccine_Name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Vaccine Type</label>
              <input type="text" placeholder="Vaccine Type" value="${vaccine.Vaccine_Type || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Vaccine Duration</label>
              <input type="text" placeholder="Vaccine Duration" value="${vaccine.Vaccine_Duration || ''}" readonly />
            </div>
            <div class="form-field">
              <label>Date of Vaccination</label>
              <input type="text" class="dob-input" placeholder="Date of Vaccination" value="${vaccine.Date_Vaccination ? vaccine.Date_Vaccination.substring(0,10) : ''}" readonly />
            </div>
            <div class="form-field">
              <label>End Date of Vaccine Effectiveness</label>
              <input type="text" class="dob-input" placeholder="End Date of Vaccine Effectiveness" value="${vaccine.Vaccination_Effectiveness_Until ? vaccine.Vaccination_Effectiveness_Until.substring(0,10) : ''}" readonly />
            </div>
            <div class="form-field">
              <label>Had Vaccine Reaction</label>
              <div class="checkbox-yesno-container">
                <label><input type="radio" name="reaction${idx+1}" ${vaccine.Has_Vaccine_Reaction === 1 ? "checked" : ""} disabled /> YES</label>
                <label><input type="radio" name="reaction${idx+1}" ${vaccine.Has_Vaccine_Reaction === 0 ? "checked" : ""} disabled /> NO</label>
              </div>
            </div>
            <div class="form-field">
              <label>Vaccine Symptom</label>
              <input type="text" placeholder="Vaccine Symptom" value="${vaccine.Vaccine_Reaction_Symptoms || ''}" readonly />
            </div>
          </div>
        `;
        vaccineHistoryContainer.appendChild(section);
      });
    } else if (vaccineHistoryContainer) {
      vaccineHistoryContainer.innerHTML = '<div style="color:#888;">No vaccine history found for this pet.</div>';
    }

  } catch (err) {
    setAllFieldsToNA();
    console.error("Error fetching pet details:", err);
  }

  // Add edit mode toggle
  let isEditing = false;
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      isEditing = !isEditing;
      toggleEditMode(isEditing);
      this.innerHTML = isEditing
        ? '<i class="fa-solid fa-save"></i> Save'
        : '<i class="fa-solid fa-pen-to-square"></i> Edit';
    });
  });

  function toggleEditMode(editing) {
    // Pet info fields
    ["petName", "species", "dob", "age", "breed", "clinicName"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.readOnly = !editing;
    });
    // Color select
    const colorSelect = document.getElementById("color");
    if (colorSelect) colorSelect.disabled = !editing;
    // Vaccine sections
    document.querySelectorAll('.vaccine-section .info-grid input, .vaccine-section .info-grid select').forEach(el => {
      if (el.type === "text") el.readOnly = !editing;
      if (el.tagName === "SELECT") el.disabled = !editing;
    });
    // Optionally, enable/disable radio buttons
    document.querySelectorAll('.info-grid input[type="radio"], .vaccine-section input[type="radio"]').forEach(radio => {
      radio.disabled = !editing;
    });
  }

  // Set all fields to readonly/disabled on load
  toggleEditMode(false);
});

function setRadio(name, value) {
  if (!value) return;
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach(radio => {
    // Compare lowercased value, allow for "yes"/"no", "male"/"female", etc.
    if (
      radio.value.toLowerCase() === value.toString().toLowerCase() ||
      radio.parentElement.textContent.trim().toLowerCase() === value.toString().toLowerCase()
    ) {
      radio.checked = true;
    }
  });
}

// Helper to set all fields to N/A if no data found
function setAllFieldsToNA() {
  const infoGrid = document.querySelector(".info-grid");
  if (infoGrid) {
    infoGrid.querySelectorAll('input, select').forEach(el => {
      if (el.type === "radio" || el.type === "checkbox") {
        el.checked = false;
      } else {
        el.value = "N/A";
      }
    });
  }
  // Vaccine sections
  document.querySelectorAll(".vaccine-section").forEach(section => {
    section.querySelectorAll('input, select').forEach(el => {
      if (el.type === "radio" || el.type === "checkbox") {
        el.checked = false;
      } else {
        el.value = "N/A";
      }
    });
  });
}
