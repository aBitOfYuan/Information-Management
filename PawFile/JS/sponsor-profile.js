document.addEventListener('DOMContentLoaded', function() {
  const editBtn = document.querySelector('.edit-btn');
  const signOutBtn = document.querySelector('.sign-out-btn');

  // These fields will have both readonly input and dropdown generated dynamically
  const toggleFields = [
    {
      id: 'status',
      options: ['ACTIVE DUTY', 'CIVILIAN', 'RETIRED']
    },
    {
      id: 'dualMilitary',
      options: ['YES', 'NO', 'N/A']
    },
    {
      id: 'preferredContact',
      options: ['SPONSOR', 'SPOUSE', 'WORK', 'PERSONAL']
    }
  ];

  // Function to create dropdown for a field, with the current value selected
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

  // Toggle between input and dropdown for edit mode
  function toggleEditMode(isEditing) {
    // Enable/disable all normal inputs (except toggleFields)
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
      if (isEditing) {
        // Create dropdown and replace input with dropdown
        const currentValue = input.value;
        const dropdown = createDropdown(field.id, field.options, currentValue);
        dropdown.style.backgroundColor = '#fff';
        dropdown.style.borderColor = '#0F5AA6';
        input.style.display = 'none';
        input.parentNode.appendChild(dropdown);
      } else {
        // Save dropdown value to input and remove dropdown
        const dropdown = document.getElementById(field.id + '-select');
        if (dropdown) {
          input.value = dropdown.value;
          dropdown.remove();
          input.style.display = '';
        }
      }
    });
  }

  // Edit button functionality
  editBtn.addEventListener('click', function() {
    const isEditing = this.classList.toggle('editing-mode');

    if (isEditing) {
      this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
      toggleEditMode(true);
    } else {
      this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
      toggleEditMode(false);

      alert('Changes saved successfully!');
      // TODO: Add code to send updated data to backend API here
    }
  });

  // Sign out button functionality
  signOutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to sign out?')) {
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '../HTML/pawfile-login.html';
      }, 250);
    }
  });

  // Get sponsor ID from sessionStorage
  const sponsorID = sessionStorage.getItem('userId');

  if (!sponsorID) {
    alert('No logged-in user detected. Redirecting to login page.');
    window.location.href = '../HTML/pawfile-login.html';
    return;
  }

  // Fetch sponsor data
  fetch(`http://localhost:3000/api/sponsor/${sponsorID}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("firstName").value = data.Sponsor_FN;
      document.getElementById("lastName").value = data.Sponsor_LN;
      document.getElementById("middleInitial").value = data.Sponsor_MI;
      document.getElementById("spouseName").value = data.Spouse_Name;
      document.getElementById("status").value = data.Sponsor_Status;
      document.getElementById("militaryGrade").value = data.Grade;
      document.getElementById("dualMilitary").value = data.is_Dual_Military;
      document.getElementById("militaryBranch").value = data.Branch;
      document.getElementById("militaryUnit").value = data.Unit;
      document.getElementById("personalEmail").value = data.Personal_Email;
      document.getElementById("mailBox").value = data.Mail_Box;
      document.getElementById("personalContact").value = data.Sponsor_Phone_No;
      document.getElementById("workContact").value = data.Work_Phone;
      document.getElementById("spouseContact").value = data.Spouse_Alt_No;
      document.getElementById("preferredContact").value = data.Preferred_Contact;
      document.getElementById("supervisorId").value = data.Supervisor_ID;
    })
    .catch(err => console.error("Fetch error:", err));
});
