// ====================
// sponsor-pet.js (UPDATED)
// ====================

function generateRandomAlphaNum(length) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    } else {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
  }
  return result;
}

document.addEventListener("click", function (event) {
  // Handle Add Pet
  if (event.target.classList.contains("add-pet")) {
    const wrapper = document.getElementById("pet-forms-wrapper");
    const formToClone = wrapper.querySelector(".registration-form");
    const newForm = formToClone.cloneNode(true);

    newForm.querySelectorAll("input, select, textarea").forEach((input) => {
      if (input.type === "radio" || input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    const vaccineContainer = newForm.querySelector("#vaccine-section");
    const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
    allVaccines.forEach((section, index) => {
      if (index > 0) {
        section.remove();
      } else {
        section.querySelector("p").textContent = "Vaccine #1";
        section.querySelectorAll("input, select").forEach((inp) => {
          if (inp.type === "radio" || inp.type === "checkbox") {
            inp.checked = false;
          } else {
            inp.value = "";
          }
        });
        const addBtn = section.querySelector(".add-vaccine");
        const delBtn = section.querySelector(".delete-vaccine");
        if (addBtn) addBtn.style.display = "inline-block";
        if (delBtn) delBtn.style.display = "none";
      }
    });

    const allPetForms = wrapper.querySelectorAll(".registration-form");
    const newIndex = allPetForms.length + 1;

    const titleH3 = newForm.querySelector(".form-name");
    if (titleH3) {
      titleH3.textContent = `Pet Information ${newIndex}`;
    }

    newForm.querySelectorAll("input[type=radio]").forEach((radio) => {
      const baseName = radio.name.replace(/-\d+$/, "");
      radio.name = `${baseName}-${newIndex}`;
    });

    wrapper.appendChild(newForm);
    newForm.classList.add("fade-slide-in");
  }

  // Handle Delete Pet
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

          const updatedForms = wrapper.querySelectorAll(".registration-form");
          updatedForms.forEach((form, idx) => {
            const number = idx + 1;
            const titleH3 = form.querySelector(".form-name");
            if (titleH3) {
              titleH3.textContent = `Pet Information ${number}`;
            }
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

  // Handle Add Vaccine
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

  // Handle Delete Vaccine
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
// Save Button Logic
// ====================
document.getElementById("save-information")?.addEventListener("click", (e) => {
  e.preventDefault();

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let sponsorID = '';
  let password = '';

  for (let i = 0; i < 5; i++) {
    if (i % 2 === 0) {
      sponsorID += letters.charAt(Math.floor(Math.random() * letters.length));
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    } else {
      sponsorID += numbers.charAt(Math.floor(Math.random() * numbers.length));
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
  }

  // Store in localStorage if needed
  localStorage.setItem('sponsorCredentials', JSON.stringify({
    sponsorID,
    password
  }));

  // Show popup (alert-style for now)
  alert(`Account Created!\n\nSponsor ID: ${sponsorID}\nPassword: ${password}`);

  // Redirect after user clicks OK
  window.location.href = 'client-details.html';
});
