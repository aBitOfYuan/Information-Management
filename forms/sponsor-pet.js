document.addEventListener("click", function (event) {
  // ====================
  // Handle Add Pet
  // ====================
  if (event.target.classList.contains("add-pet")) {
    // Instead of appending into #pet-form-container directly,
    // we append each new <section class="registration-form"> into #pet-forms-wrapper.
    const wrapper = document.getElementById("pet-forms-wrapper");

    // Clone the very first registration-form inside the wrapper
    const formToClone = wrapper.querySelector(".registration-form");
    const newForm = formToClone.cloneNode(true);

    // 1) Clear all input/select/textarea values in the cloned form
    newForm.querySelectorAll("input, select, textarea").forEach((input) => {
      if (input.type === "radio" || input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    // 2) Reset vaccine sections inside the cloned form
    const vaccineContainer = newForm.querySelector("#vaccine-section");
    const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
    allVaccines.forEach((section, index) => {
      if (index > 0) {
        // Remove every vaccine block except the first
        section.remove();
      } else {
        // Reset fields in Vaccine #1
        section.querySelector("p").textContent = "Vaccine #1";
        section.querySelectorAll("input, select").forEach((inp) => {
          if (inp.type === "radio" || inp.type === "checkbox") {
            inp.checked = false;
          } else {
            inp.value = "";
          }
        });
        // Ensure only “Add Vaccine” is visible on the first vaccine block
        const addBtn = section.querySelector(".add-vaccine");
        const delBtn = section.querySelector(".delete-vaccine");
        if (addBtn) addBtn.style.display = "inline-block";
        if (delBtn) delBtn.style.display = "none";
      }
    });

    // 3) Figure out the new pet’s index (1-based)
    const allPetForms = wrapper.querySelectorAll(".registration-form");
    const newIndex = allPetForms.length + 1;

    // 4) Rename the heading (“Pet Information X”)
    const titleH3 = newForm.querySelector(".form-name");
    if (titleH3) {
      titleH3.textContent = `Pet Information ${newIndex}`;
    }

    // 5) Append an index suffix to every radio name in the cloned form
    newForm.querySelectorAll("input[type=radio]").forEach((radio) => {
      const baseName = radio.name.replace(/-\d+$/, "");
      radio.name = `${baseName}-${newIndex}`;
    });

    // 6) Finally, append the cloned form to WRAPPER (not to pet-form-container directly)
    wrapper.appendChild(newForm);
    newForm.classList.add("fade-slide-in");
  }

  // ====================
  // Handle Delete Pet
  // ====================
  if (event.target.classList.contains("delete-pet")) {
    const wrapper = document.getElementById("pet-forms-wrapper");
    const allPetForms = wrapper.querySelectorAll(".registration-form");

    if (allPetForms.length > 1) {
      const lastForm = allPetForms[allPetForms.length - 1];
      lastForm.classList.add("fade-slide-out");
      lastForm.addEventListener(
        "animationend",
        () => {
          lastForm.remove();

          // Renumber all remaining pet forms
          const updatedForms = wrapper.querySelectorAll(".registration-form");
          updatedForms.forEach((form, idx) => {
            const number = idx + 1;
            // Update heading text
            const titleH3 = form.querySelector(".form-name");
            if (titleH3) {
              titleH3.textContent = `Pet Information ${number}`;
            }
            // Update each radio group’s name suffix
            form.querySelectorAll("input[type=radio]").forEach((radio) => {
              const baseName = radio.name.replace(/-\d+$/, "");
              radio.name = `${baseName}-${number}`;
            });
          });
        },
        { once: true }
      );
    } else {
      alert("At least one pet form is required.");
    }
  }

  // ====================
  // Handle Add Vaccine (unchanged)
  // ====================
  if (event.target.classList.contains("add-vaccine")) {
    const currentForm = event.target.closest(".registration-form");
    const vaccineContainer = currentForm.querySelector("#vaccine-section");

    const vaccineSections = vaccineContainer.querySelectorAll(".vaccine-section");
    const lastVaccine = vaccineSections[vaccineSections.length - 1];
    const newVaccine = lastVaccine.cloneNode(true);

    newVaccine.querySelectorAll("input, select").forEach((input) => {
      if (input.type === "radio" || input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    vaccineContainer.appendChild(newVaccine);
    newVaccine.classList.add("fade-slide-in");

    // Renumber all vaccine blocks and toggle button visibility
    const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
    allVaccines.forEach((section, index) => {
      const label = section.querySelector("p");
      if (label) label.textContent = `Vaccine #${index + 1}`;

      const addBtn = section.querySelector(".add-vaccine");
      const delBtn = section.querySelector(".delete-vaccine");
      if (addBtn && delBtn) {
        if (index === allVaccines.length - 1) {
          addBtn.style.display = "inline-block";
          delBtn.style.display = "inline-block";
        } else {
          addBtn.style.display = "none";
          delBtn.style.display = "none";
        }
      }
    });
  }

  // ====================
  // Handle Delete Vaccine (unchanged)
  // ====================
  if (event.target.classList.contains("delete-vaccine")) {
    const currentForm = event.target.closest(".registration-form");
    const vaccineContainer = currentForm.querySelector("#vaccine-section");
    const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");

    if (allVaccines.length > 1) {
      const lastVaccine = allVaccines[allVaccines.length - 1];
      lastVaccine.classList.add("fade-slide-out");
      lastVaccine.addEventListener(
        "animationend",
        () => {
          lastVaccine.remove();
          // Re-label remaining vaccine blocks
          const updatedVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
          updatedVaccines.forEach((section, index) => {
            const label = section.querySelector("p");
            if (label) label.textContent = `Vaccine #${index + 1}`;

            const addBtn = section.querySelector(".add-vaccine");
            const delBtn = section.querySelector(".delete-vaccine");
            if (addBtn && delBtn) {
              if (index === updatedVaccines.length - 1) {
                addBtn.style.display = "inline-block";
                delBtn.style.display = "inline-block";
              } else {
                addBtn.style.display = "none";
                delBtn.style.display = "none";
              }
            }
          });
        },
        { once: true }
      );
    } else {
      alert("At least one vaccine section is required.");
    }
  }
});

// ====================
// Back / Save Buttons (unchanged except for searching by ID)
// ====================
document.getElementById("save-information")?.addEventListener("click", () => {
  const allForms = document.querySelectorAll(".registration-form");
  const data = [];
  allForms.forEach((form) => {
    const formData = new FormData(form);
    const obj = {};
    formData.forEach((value, key) => {
      obj[key] = value;
    });
    data.push(obj);
  });
  console.log("All Pet Data:", data);
  alert("Data saved to console. Check browser console for details.");
});
