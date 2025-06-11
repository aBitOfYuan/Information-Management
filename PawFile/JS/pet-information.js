document.addEventListener("click", function (event) {
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
            }
            });
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
    }

    // Handle Add Vaccine
    if (event.target.classList.contains("add-vaccine")) {
        const currentForm = event.target.closest(".registration-form");
        const vaccineContainer = currentForm.querySelector("#vaccine-section");

        // Clone the last vaccine section only (not buttons)
        const vaccineSections = vaccineContainer.querySelectorAll(".vaccine-section");
        const lastVaccine = vaccineSections[vaccineSections.length - 1];
        const newVaccine = lastVaccine.cloneNode(true);

        // Clear inputs in the cloned vaccine section
        const inputs = newVaccine.querySelectorAll("input, select");
        inputs.forEach((input) => {
            if (input.type === "radio" || input.type === "checkbox") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });

        vaccineContainer.appendChild(newVaccine);
        newVaccine.classList.add("fade-slide-in");

        // Update vaccine labels
        const allVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
        allVaccines.forEach((section, index) => {
            const label = section.querySelector("p");
            if (label) label.textContent = `Vaccine #${index + 1}`;
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

        lastVaccine.addEventListener("animationend", () => {
            lastVaccine.remove();

            // Update labels after removal
            const updatedVaccines = vaccineContainer.querySelectorAll(".vaccine-section");
            updatedVaccines.forEach((section, index) => {
            const label = section.querySelector("p");
            if (label) label.textContent = `Vaccine #${index + 1}`;
            });
        }, { once: true });

        } else {
        alert("At least one vaccine section is required.");
        }
    }

        // Handle Delete Pet
        if (event.target.classList.contains("delete-pet")) {
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

    document.getElementById("save-information").addEventListener("click", (e) => {
        e.preventDefault();
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
