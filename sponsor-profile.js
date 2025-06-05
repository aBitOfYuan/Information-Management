document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.querySelector('.edit-btn');
    const signOutBtn = document.querySelector('.sign-out-btn');
    const allInputs = document.querySelectorAll('input');
    const dropdowns = document.querySelectorAll('.dropdown-select');
    
    // Edit button functionality
    editBtn.addEventListener('click', function() {
        const isEditing = this.classList.toggle('editing-mode');
        
        if (isEditing) {
            this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
            // Enable all inputs
            allInputs.forEach(input => {
                input.removeAttribute('readonly');
                input.style.backgroundColor = '#fff';
                input.style.borderColor = '#0F5AA6';
            });
            
            // Enable dropdowns
            dropdowns.forEach(dropdown => {
                dropdown.disabled = false;
                dropdown.style.backgroundColor = '#fff';
                dropdown.style.borderColor = '#0F5AA6';
            });
        } else {
            this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
            // Disable all inputs
            allInputs.forEach(input => {
                input.setAttribute('readonly', true);
                input.style.backgroundColor = '#e9ecef';
                input.style.borderColor = '#e0e0e0';
            });
            
            // Disable dropdowns
            dropdowns.forEach(dropdown => {
                dropdown.disabled = true;
                dropdown.style.backgroundColor = '#e9ecef';
                dropdown.style.borderColor = '#e0e0e0';
            });
            
            alert('Changes saved successfully!');
        }
    });
    
    // Sign out button functionality - now redirects to login page
    signOutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to sign out?')) {
            // Redirect to login page after 1 second (to show the alert)
            setTimeout(function() {
                window.location.href = 'pawfile-login.html'; 
            }, 250);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const sponsorID = "X3D7P"; // You can also fetch this dynamically from session or URL

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
