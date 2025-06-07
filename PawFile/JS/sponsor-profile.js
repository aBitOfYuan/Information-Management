document.addEventListener('DOMContentLoaded', function() {
  const editBtn = document.querySelector('.edit-btn');
  const signOutBtn = document.querySelector('.sign-out-btn');

  const toggleFields = [
    { id: 'status', options: ['ACTIVE DUTY', 'CIVILIAN', 'RETIRED'] },
    { id: 'dualMilitary', options: ['YES', 'NO', 'N/A'] },
    { id: 'preferredContact', options: ['SPONSOR', 'SPOUSE', 'WORK', 'PERSONAL'] },
    { id: 'spayedNeutered', options: ['YES', 'NO', 'N/A'] }, // Added
    { id: 'clinicName', options: ['Clinic A', 'Clinic B', 'Clinic C'] } // Added
  ];

  function createDropdown(fieldId, options, selectedValue) {
    const select = document.createElement('select');
    select.id = fieldId + '-select';
    select.className = 'dropdown-select';
    options.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      if (optionValue === selectedValue) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  function toggleEditMode(isEditing) {
    document.querySelectorAll('input').forEach(input => {
      if (!toggleFields.some(f => f.id === input.id)) {
        if (isEditing) {
          input.removeAttribute('readonly');
          input.style.backgroundColor = '#fff';
          input.style.borderColor = '#0F5AA6';
        } else {
          input.setAttribute('readonly', true);
          input.style.backgroundColor = '#e9ecef';
          input.style.borderColor = '#e0e0e0';
        }
      }
    });

    toggleFields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return; // Skip if input doesn't exist
      if (isEditing) {
        const currentValue = input.value;
        const dropdown = createDropdown(field.id, field.options, currentValue);
        dropdown.style.backgroundColor = '#fff';
        dropdown.style.borderColor = '#0F5AA6';
        input.style.display = 'none';
        input.parentNode.appendChild(dropdown);
      } else {
        const dropdown = document.getElementById(field.id + '-select');
        if (dropdown) {
          input.value = dropdown.value;
          dropdown.remove();
          input.style.display = '';
        }
      }
    });
  }

  editBtn.addEventListener('click', function() {
    const isEditing = this.classList.toggle('editing-mode');
    if (isEditing) {
      this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
      toggleEditMode(true);
    } else {
      this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
      toggleEditMode(false);

      // Gather sponsor data from form fields
      const sponsorData = {
        Sponsor_FN: document.getElementById("firstName").value,
        Sponsor_LN: document.getElementById("lastName").value,
        Sponsor_MI: document.getElementById("middleInitial").value,
        Spouse_Name: document.getElementById("spouseName").value,
        Sponsor_Status: document.getElementById("status").value,
        Grade: document.getElementById("militaryGrade").value,
        is_Dual_Military: document.getElementById("dualMilitary").value,
        Branch: document.getElementById("militaryBranch").value,
        Unit: document.getElementById("militaryUnit").value,
        Personal_Email: document.getElementById("personalEmail").value,
        Mail_Box: document.getElementById("mailBox").value,
        Sponsor_Phone_No: document.getElementById("personalContact").value,
        Work_Phone: document.getElementById("workContact").value,
        Spouse_Alt_No: document.getElementById("spouseContact").value,
        Preferred_Contact: document.getElementById("preferredContact").value,
        Supervisor_ID: document.getElementById("supervisorId").value
      };

      const userId = sessionStorage.getItem('userId');
      fetch(`http://localhost:3000/api/sponsor/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsorData)
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update sponsor profile');
        alert('Changes saved successfully!');
      })
      .catch(err => {
        alert('Failed to save changes.');
        console.error(err);
      });
    }
  });

  signOutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to sign out?')) {
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '../HTML/pawfile-login.html';
      }, 250);
    }
  });

  // Use userId for authentication
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    alert('No user detected. Redirecting to login page.');
    window.location.href = '../HTML/pawfile-login.html';
    return;
  }

  // Fetch sponsor profile details
  fetch(`http://localhost:3000/api/sponsor/${userId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("firstName").value = data.Sponsor_FN || "";
      document.getElementById("lastName").value = data.Sponsor_LN || "";
      document.getElementById("middleInitial").value = data.Sponsor_MI || "";
      document.getElementById("spouseName").value = data.Spouse_Name || "";
      document.getElementById("status").value = data.Sponsor_Status || "";
      document.getElementById("militaryGrade").value = data.Grade || "";
      document.getElementById("dualMilitary").value = data.is_Dual_Military || "";
      document.getElementById("militaryBranch").value = data.Branch || "";
      document.getElementById("militaryUnit").value = data.Unit || "";
      document.getElementById("personalEmail").value = data.Personal_Email || "";
      document.getElementById("mailBox").value = data.Mail_Box || "";
      document.getElementById("personalContact").value = data.Sponsor_Phone_No || "";
      document.getElementById("workContact").value = data.Work_Phone || "";
      document.getElementById("spouseContact").value = data.Spouse_Alt_No || "";
      document.getElementById("preferredContact").value = data.Preferred_Contact || "";
      document.getElementById("supervisorId").value = data.Supervisor_ID || "";
      // The following fields are pet-specific and should not be filled here:
      // document.getElementById("spayedNeutered").value = data.Is_Spayed_Neutered || "";
      // document.getElementById("dateOfBirth").value = data.DOB || "";
      // document.getElementById("clinicHistory").value = data.Has_Recent_Clinic_History || "";
      // document.getElementById("clinicName").value = data.Clinic_Name || "";
    })
    .catch(err => {
      alert('Error fetching sponsor profile.');
      console.error("Fetch error:", err);
    });

  // Fetch pets for this sponsor (to check if sponsor has pets and store petId)
  fetch(`http://localhost:3000/api/sponsor/${userId}/pets`)
    .then(res => res.json())
    .then(pets => {
      if (!pets.length) {
        alert('No pet profile detected for your account. Please add a pet.');
        // Optionally, redirect to pet registration or pets page
        // window.location.href = '../HTML/sponsor-pets.html';
        return;
      }
      // Store petId in sessionStorage for other pages if needed
      const data = pets[0];
      sessionStorage.setItem('petId', data.id || data.Pet_ID || data.Microchip_No);
    })
    .catch(err => {
      alert('Error fetching pet profile.');
      console.error("Fetch error:", err);
    });
});