document.addEventListener('DOMContentLoaded', function () {
  const editBtn = document.querySelector('.edit-btn');
  const signOutBtn = document.querySelector('.sign-out-btn');
  const deleteAccountBtn = document.querySelector('.delete-account-btn');

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
    
    // FIXED: Add required attribute if original input has it
    const originalInput = document.getElementById(fieldId);
    if (originalInput && originalInput.hasAttribute('required')) {
      select.setAttribute('required', 'required');
    }
    
    // Add empty option for required dropdowns
    if (select.hasAttribute('required')) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Select...';
      select.appendChild(emptyOption);
    }
    
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
    console.log('handleMilitaryVisibility called with status:', currentStatus);
    
    if (!currentStatus) {
      console.log('No status provided, defaulting to non-military view');
      currentStatus = 'CIVILIAN';
    }
    
    const isActive = currentStatus === 'ACTIVE DUTY';
    console.log('Is active duty:', isActive);
    
    const militaryInputs = militarySection.querySelectorAll('input');
    militaryInputs.forEach(input => {
      const parentElement = input.parentElement;
      if (parentElement) {
        parentElement.style.display = isActive ? '' : 'none';
      }
      
      // FIXED: Toggle required attribute based on visibility
      if (input.id === 'militaryGrade' || input.id === 'militaryBranch' || 
          input.id === 'militaryUnit' || input.id === 'supervisorId' || 
          input.id === 'supervisorName' || input.id === 'supervisorEmail') {
        if (isActive) {
          input.setAttribute('required', 'required');
        } else {
          input.removeAttribute('required');
        }
      }
    });
    
    // Also handle dropdowns if they exist
    const militarySelects = militarySection.querySelectorAll('select');
    militarySelects.forEach(select => {
      if (select.id.includes('militaryGrade') || select.id.includes('militaryBranch') || 
          select.id.includes('militaryUnit') || select.id.includes('supervisorId') || 
          select.id.includes('supervisorName') || select.id.includes('supervisorEmail')) {
        if (isActive) {
          select.setAttribute('required', 'required');
        } else {
          select.removeAttribute('required');
        }
      }
    });
    
    if (militaryPlaceholder) {
      militaryPlaceholder.style.display = isActive ? 'none' : 'block';
    }
  }

  function clearMilitaryFields() {
    document.getElementById("militaryGrade").value = "";
    document.getElementById("dualMilitary").value = "";
    document.getElementById("militaryBranch").value = "";
    document.getElementById("militaryUnit").value = "";
    document.getElementById("supervisorId").value = "";
    document.getElementById("supervisorName").value = "";
    document.getElementById("supervisorEmail").value = "";
    
    const dualMilitarySelect = document.getElementById("dualMilitary-select");
    if (dualMilitarySelect) {
      dualMilitarySelect.value = "";
    }
  }

  function handleSupervisorIdChange(supervisorIdField) {
    const supervisorId = supervisorIdField.value.trim();
    
    if (!supervisorId) {
      document.getElementById("supervisorName").value = "";
      document.getElementById("supervisorEmail").value = "";
      return;
    }

    fetch(`http://localhost:3000/api/supervisor/${supervisorId}`)
      .then(res => {
        if (res.status === 404) {
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
          const currentName = document.getElementById("supervisorName").value;
          const currentEmail = document.getElementById("supervisorEmail").value;
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
    
    document.getElementById('modalSupervisorId').textContent = supervisorData.Supervisor_ID;
    document.getElementById('modalSupervisorName').textContent = supervisorData.Supervisor_Name || 'Not specified';
    document.getElementById('modalSupervisorEmail').textContent = supervisorData.Supervisor_Email || 'Not specified';
    
    modal.style.display = 'flex';

    document.getElementById('loadExisting').onclick = () => {
      document.getElementById("supervisorName").value = supervisorData.Supervisor_Name || "";
      document.getElementById("supervisorEmail").value = supervisorData.Supervisor_Email || "";
      modal.style.display = 'none';
    };

    document.getElementById('editInfo').onclick = () => {
      modal.style.display = 'none';
    };

    document.getElementById('cancelAction').onclick = () => {
      document.getElementById("supervisorId").value = "";
      document.getElementById("supervisorName").value = currentName;
      document.getElementById("supervisorEmail").value = currentEmail;
      modal.style.display = 'none';
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.getElementById('cancelAction').click();
      }
    };
  }

  function toggleEditMode(isEditing) {
    console.log('toggleEditMode called with:', isEditing); // Debug log
    
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
            console.log('Status dropdown changed to:', dropdown.value); // Debug log
            handleMilitaryVisibility(dropdown.value);
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

    if (isEditing) {
      const supervisorIdField = document.getElementById("supervisorId");
      if (supervisorIdField) {
        supervisorIdField.addEventListener('blur', () => handleSupervisorIdChange(supervisorIdField));
      }
    }
  }

  // DELETE ACCOUNT FUNCTIONALITY
  function setupDeleteAccountFeature() {
    if (!deleteAccountBtn) return;

    const deleteModal = document.getElementById('deleteAccountModal');
    const deleteCancelBtn = document.getElementById('cancelDeleteAccount');
    const deleteConfirmBtn = document.getElementById('confirmDeleteAccount');
    
    // Delete account button click handler
    deleteAccountBtn.addEventListener('click', function() {
      deleteModal.style.display = 'flex';
    });
    
    // Cancel button click handler
    deleteCancelBtn.addEventListener('click', function() {
      deleteModal.style.display = 'none';
    });
    
    // Modal backdrop click handler
    deleteModal.addEventListener('click', function(e) {
      if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
      }
    });
    
    // Confirm delete button click handler
    deleteConfirmBtn.addEventListener('click', function() {
      this.disabled = true;
      this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting Account...';
      this.style.cursor = 'not-allowed';
      
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('No user ID found. Cannot delete account.');
        this.disabled = false;
        this.innerHTML = '<i class="fa-solid fa-trash"></i> Yes, Delete Account';
        this.style.cursor = 'pointer';
        deleteModal.style.display = 'none';
        return;
      }
      
      // Call the delete account API
      deleteAccount(userId)
        .then(() => {
          alert('Account deleted successfully. You will be redirected to the login page.');
          sessionStorage.clear();
          window.location.href = '../HTML/pawfile-login.html';
        })
        .catch(error => {
          console.error('Error deleting account:', error);
          alert('Error deleting account: ' + error.message);
          this.disabled = false;
          this.innerHTML = '<i class="fa-solid fa-trash"></i> Yes, Delete Account';
          this.style.cursor = 'pointer';
          deleteModal.style.display = 'none';
        });
    });
  }

  // Function to delete account with cascading deletions
  function deleteAccount(userId) {
    return fetch(`http://localhost:3000/api/sponsor/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Failed to delete account');
        });
      }
      return response.json();
    })
    .then(result => {
      console.log('Account deletion result:', result);
      return result;
    });
  }

  editBtn.addEventListener('click', function () {
    const isEditing = this.classList.toggle('editing-mode');
    
    if (isEditing) {
      console.log('Entering edit mode'); // Debug log
      this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
      toggleEditMode(true);
    } else {
      console.log('Attempting to save - validating fields'); // Debug log
      
      // FIXED: Create a temporary form element to use browser validation
      const tempForm = document.createElement('form');
      tempForm.style.display = 'none';
      document.body.appendChild(tempForm);
      
      // Get all required fields and add them to the temp form
      const requiredInputs = document.querySelectorAll('input[required]');
      const requiredSelects = document.querySelectorAll('select[required]');
      
      console.log('Found required inputs:', requiredInputs.length); // Debug log
      console.log('Found required selects:', requiredSelects.length); // Debug log
      
      let allValid = true;
      let firstInvalidField = null;
      
      // Check inputs
      requiredInputs.forEach(input => {
        // Skip hidden inputs
        if (input.style.display === 'none' || input.parentElement.style.display === 'none') {
          console.log('Skipping hidden input:', input.id);
          return;
        }
        
        if (!input.checkValidity()) {
          console.log('Invalid input found:', input.id, 'Value:', input.value); // Debug log
          allValid = false;
          if (!firstInvalidField) firstInvalidField = input;
        }
      });
      
      // Check selects (dropdowns)
      requiredSelects.forEach(select => {
        // Skip hidden selects
        if (select.style.display === 'none' || select.parentElement.style.display === 'none') {
          console.log('Skipping hidden select:', select.id);
          return;
        }
        
        if (!select.checkValidity()) {
          console.log('Invalid select found:', select.id, 'Value:', select.value); // Debug log
          allValid = false;
          if (!firstInvalidField) firstInvalidField = select;
        }
      });
      
      // Clean up temp form
      document.body.removeChild(tempForm);
      
      if (!allValid && firstInvalidField) {
        console.log('Validation failed, focusing on:', firstInvalidField.id); // Debug log
        firstInvalidField.focus();
        firstInvalidField.reportValidity();
        
        // Toggle back to edit mode
        this.classList.add('editing-mode');
        this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
        return;
      }
      
      console.log('All fields valid, proceeding to save'); // Debug log
      this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
      toggleEditMode(false);

      const currentStatus = document.getElementById("status-select")?.value || document.getElementById("status").value;
      
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
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('Fetched sponsor data:', data);
      
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

      setTimeout(() => {
        const sponsorStatus = data.Sponsor_Status || "";
        console.log('Processing sponsor status:', sponsorStatus);
        handleMilitaryVisibility(sponsorStatus);
      }, 100);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      alert('Error fetching sponsor profile: ' + err.message);
    });

  // Initialize delete account feature
  setupDeleteAccountFeature();
});