document.addEventListener('DOMContentLoaded', function () {
  const editBtn = document.querySelector('.edit-btn');
  const signOutBtn = document.querySelector('.sign-out-btn');

  const militarySection = document.querySelector(".profile-section:nth-of-type(2)");
  const statusField = document.getElementById("status");
  const militaryPlaceholder = document.createElement("div");
  militaryPlaceholder.textContent = "SPONSOR IS CURRENTLY NOT IN MILITARY SERVICE OR IS NOT ON ACTIVE DUTY.";
  militaryPlaceholder.classList.add("military-placeholder");
  militarySection.appendChild(militaryPlaceholder);

  const toggleFields = [
    { id: 'status', options: ['ACTIVE DUTY', 'CIVILIAN', 'RETIRED'] },
    { id: 'dualMilitary', options: ['YES', 'NO'] },
    { id: 'preferredContact', options: ['SPONSOR', 'SPOUSE', 'WORK', 'PERSONAL'] },
    { id: 'spayedNeutered', options: ['YES', 'NO'] },
    { id: 'clinicName', options: ['Clinic A', 'Clinic B', 'Clinic C'] }
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

  function handleMilitaryVisibility(currentStatus) {
    const isActive = currentStatus === 'ACTIVE DUTY';
    const militaryInputs = militarySection.querySelectorAll('input');
    militaryInputs.forEach(input => {
      input.parentElement.style.display = isActive ? '' : 'none';
    });
    militaryPlaceholder.style.display = isActive ? 'none' : 'block';
  }

  function clearMilitaryFields() {
    // Clear military-related fields when switching to civilian/retired
    document.getElementById("militaryGrade").value = "";
    document.getElementById("dualMilitary").value = "";
    document.getElementById("militaryBranch").value = "";
    document.getElementById("militaryUnit").value = "";
    document.getElementById("supervisorId").value = "";
    document.getElementById("supervisorName").value = "";
    document.getElementById("supervisorEmail").value = "";
    
    // Clear dropdown values too if they exist
    const dualMilitarySelect = document.getElementById("dualMilitary-select");
    if (dualMilitarySelect) {
      dualMilitarySelect.value = "";
    }
  }

  // Function to handle supervisor ID changes and offer load/edit options
  function handleSupervisorIdChange(supervisorIdField) {
    const supervisorId = supervisorIdField.value.trim();
    
    if (!supervisorId) {
      // Clear supervisor fields if ID is empty
      document.getElementById("supervisorName").value = "";
      document.getElementById("supervisorEmail").value = "";
      return;
    }

    // Check if supervisor exists
    fetch(`http://localhost:3000/api/supervisor/${supervisorId}`)
      .then(res => {
        if (res.status === 404) {
          // Supervisor doesn't exist - clear fields and let user enter new info
          document.getElementById("supervisorName").value = "";
          document.getElementById("supervisorEmail").value = "";
          return null;
        }
        if (!res.ok) {
          throw new Error("Error checking supervisor.");
        }
        return res.json();
      })
      .then(supervisorData => {
        if (supervisorData) {
          // Supervisor exists - show options
          const currentName = document.getElementById("supervisorName").value;
          const currentEmail = document.getElementById("supervisorEmail").value;
          
          const message = `Supervisor ID ${supervisorId} already exists with:\nName: ${supervisorData.Supervisor_Name}\nEmail: ${supervisorData.Supervisor_Email}\n\nWhat would you like to do?`;
          
          // Create custom modal for better UX
          showSupervisorOptionsModal(supervisorData, currentName, currentEmail);
        }
      })
      .catch(err => {
        console.error("Error checking supervisor:", err);
        alert("Error checking supervisor: " + err.message);
      });
  }

  function showSupervisorOptionsModal(supervisorData, currentName, currentEmail) {
    const modal = document.getElementById('supervisorModal');
    
    // Populate modal with data
    document.getElementById('modalSupervisorId').textContent = supervisorData.Supervisor_ID;
    document.getElementById('modalSupervisorName').textContent = supervisorData.Supervisor_Name || 'Not specified';
    document.getElementById('modalSupervisorEmail').textContent = supervisorData.Supervisor_Email || 'Not specified';
    
    // Show modal
    modal.style.display = 'flex';

    // Handle button clicks
    document.getElementById('loadExisting').onclick = () => {
      // Load existing supervisor info
      document.getElementById("supervisorName").value = supervisorData.Supervisor_Name || "";
      document.getElementById("supervisorEmail").value = supervisorData.Supervisor_Email || "";
      modal.style.display = 'none';
    };

    document.getElementById('editInfo').onclick = () => {
      // Keep current values (user wants to edit existing supervisor)
      modal.style.display = 'none';
    };

    document.getElementById('cancelAction').onclick = () => {
      // Clear supervisor ID and related fields
      document.getElementById("supervisorId").value = "";
      document.getElementById("supervisorName").value = currentName;
      document.getElementById("supervisorEmail").value = currentEmail;
      modal.style.display = 'none';
    };

    // Close modal when clicking overlay
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.getElementById('cancelAction').click();
      }
    };
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
      if (!input) return;
      if (isEditing) {
        const currentValue = input.value;
        const dropdown = createDropdown(field.id, field.options, currentValue);
        dropdown.style.backgroundColor = '#fff';
        dropdown.style.borderColor = '#0F5AA6';
        input.style.display = 'none';
        input.parentNode.appendChild(dropdown);

        if (field.id === 'status') {
          dropdown.addEventListener('change', () => {
            handleMilitaryVisibility(dropdown.value);
            // Clear military fields when switching to civilian/retired
            if (dropdown.value !== 'ACTIVE DUTY') {
              clearMilitaryFields();
            }
          });
        }
      } else {
        const dropdown = document.getElementById(field.id + '-select');
        if (dropdown) {
          input.value = dropdown.value;
          dropdown.remove();
          input.style.display = '';
          if (field.id === 'status') {
            handleMilitaryVisibility(input.value);
          }
        }
      }
    });

    // Add event listener for supervisor ID changes during edit mode
    if (isEditing) {
      const supervisorIdField = document.getElementById("supervisorId");
      if (supervisorIdField) {
        supervisorIdField.addEventListener('blur', () => handleSupervisorIdChange(supervisorIdField));
      }
    }
  }

  editBtn.addEventListener('click', function () {
    const isEditing = this.classList.toggle('editing-mode');
    if (isEditing) {
      this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
      toggleEditMode(true);
    } else {
      this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
      toggleEditMode(false);

      const currentStatus = document.getElementById("status-select")?.value || document.getElementById("status").value;
      
      // Prepare sponsor data - set military fields to empty strings if not active duty
      const sponsorData = {
        Sponsor_FN: document.getElementById("firstName").value,
        Sponsor_LN: document.getElementById("lastName").value,
        Sponsor_MI: document.getElementById("middleInitial").value,
        Spouse_Name: document.getElementById("spouseName").value,
        Sponsor_Status: currentStatus,
        Grade: currentStatus === 'ACTIVE DUTY' ? document.getElementById("militaryGrade").value : "",
        is_Dual_Military: currentStatus === 'ACTIVE DUTY' ? (document.getElementById("dualMilitary-select")?.value || document.getElementById("dualMilitary").value) : "",
        Branch: currentStatus === 'ACTIVE DUTY' ? document.getElementById("militaryBranch").value : "",
        Unit: currentStatus === 'ACTIVE DUTY' ? document.getElementById("militaryUnit").value : "",
        Personal_Email: document.getElementById("personalEmail").value,
        Mail_Box: document.getElementById("mailBox").value,
        Sponsor_Phone_No: document.getElementById("personalContact").value,
        Work_Phone: document.getElementById("workContact").value,
        Spouse_Alt_No: document.getElementById("spouseContact").value,
        Preferred_Contact: document.getElementById("preferredContact-select")?.value || document.getElementById("preferredContact").value,
        Supervisor_ID: currentStatus === 'ACTIVE DUTY' ? document.getElementById("supervisorId").value : "",
        Supervisor_Name: currentStatus === 'ACTIVE DUTY' ? document.getElementById("supervisorName").value : "",
        Supervisor_Email: currentStatus === 'ACTIVE DUTY' ? document.getElementById("supervisorEmail").value : ""
      };

      const userId = sessionStorage.getItem('userId');

      // If sponsor is not active duty, skip supervisor validation
      if (currentStatus !== 'ACTIVE DUTY') {
        updateSponsorProfile(userId, sponsorData);
        return;
      }

      // Always update the sponsor profile - the backend will handle supervisor logic
      updateSponsorProfile(userId, sponsorData);
    }
  });

  function updateSponsorProfile(userId, sponsorData) {
    fetch(`http://localhost:3000/api/sponsor/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sponsorData)
    })
    .then(updateRes => {
      if (!updateRes.ok) throw new Error("Failed to update sponsor profile.");
      return updateRes.json();
    })
    .then(result => {
      alert("Changes saved successfully!");
    })
    .catch(err => {
      alert("Error: " + err.message);
      console.error(err);
    });
  }

  signOutBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to sign out?')) {
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '../HTML/pawfile-login.html';
      }, 250);
    }
  });

  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    alert('No user detected. Redirecting to login page.');
    window.location.href = '../HTML/pawfile-login.html';
    return;
  }

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
      document.getElementById("supervisorName").value = data.Supervisor_Name || "";
      document.getElementById("supervisorEmail").value = data.Supervisor_Email || "";

      handleMilitaryVisibility(data.Sponsor_Status);
    })
    .catch(err => {
      alert('Error fetching sponsor profile.');
      console.error("Fetch error:", err);
    });
});