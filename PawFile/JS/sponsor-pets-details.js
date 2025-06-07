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

    // Vaccine sections
    const vaccineSections = document.querySelectorAll(".vaccine-section");
    // Vaccine #1
    if (vaccineSections[0]) {
      const v1Inputs = vaccineSections[0].querySelectorAll("input, select");
      // 0: Vaccine1_Lot, 1: Vaccine1_Name, 2: Vaccine1_Type (select), 3: Vaccine1_Duration, 4: Vaccine1_Date, 5: Vaccine1_End_Date, 6: Vaccine1_Symptom
      if (v1Inputs[0] && data.Vaccine1_Lot) v1Inputs[0].value = data.Vaccine1_Lot;
      if (v1Inputs[1] && data.Vaccine1_Name) v1Inputs[1].value = data.Vaccine1_Name;
      if (v1Inputs[2] && data.Vaccine1_Type) {
        Array.from(v1Inputs[2].options).forEach(opt => {
          if (opt.textContent.trim().toLowerCase() === data.Vaccine1_Type.trim().toLowerCase() ||
              opt.value.trim().toLowerCase() === data.Vaccine1_Type.trim().toLowerCase()) {
            opt.selected = true;
          }
        });
      }
      if (v1Inputs[3] && data.Vaccine1_Duration) v1Inputs[3].value = data.Vaccine1_Duration;
      if (v1Inputs[4] && data.Vaccine1_Date) v1Inputs[4].value = data.Vaccine1_Date;
      if (v1Inputs[5] && data.Vaccine1_End_Date) v1Inputs[5].value = data.Vaccine1_End_Date;
      if (v1Inputs[6] && data.Vaccine1_Symptom) v1Inputs[6].value = data.Vaccine1_Symptom;
      setRadio("reaction1", data.Vaccine1_Reaction);
    }
    // Vaccine #2
    if (vaccineSections[1]) {
      const v2Inputs = vaccineSections[1].querySelectorAll("input, select");
      if (v2Inputs[0] && data.Vaccine2_Lot) v2Inputs[0].value = data.Vaccine2_Lot;
      if (v2Inputs[1] && data.Vaccine2_Name) v2Inputs[1].value = data.Vaccine2_Name;
      if (v2Inputs[2] && data.Vaccine2_Type) {
        Array.from(v2Inputs[2].options).forEach(opt => {
          if (opt.textContent.trim().toLowerCase() === data.Vaccine2_Type.trim().toLowerCase() ||
              opt.value.trim().toLowerCase() === data.Vaccine2_Type.trim().toLowerCase()) {
            opt.selected = true;
          }
        });
      }
      if (v2Inputs[3] && data.Vaccine2_Duration) v2Inputs[3].value = data.Vaccine2_Duration;
      if (v2Inputs[4] && data.Vaccine2_Date) v2Inputs[4].value = data.Vaccine2_Date;
      if (v2Inputs[5] && data.Vaccine2_End_Date) v2Inputs[5].value = data.Vaccine2_End_Date;
      if (v2Inputs[6] && data.Vaccine2_Symptom) v2Inputs[6].value = data.Vaccine2_Symptom;
      setRadio("reaction2", data.Vaccine2_Reaction);
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
