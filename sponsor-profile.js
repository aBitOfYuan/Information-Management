document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.querySelector('.edit-btn');
    const signOutBtn = document.querySelector('.sign-out-btn');
    const inputs = document.querySelectorAll('input:not([readonly])');
    
    // Edit button functionality
    editBtn.addEventListener('click', function() {
        const isEditing = this.classList.toggle('editing-mode');
        
        if (isEditing) {
            this.innerHTML = '<i class="fa-solid fa-save"></i> Save';
            inputs.forEach(input => {
                input.removeAttribute('readonly');
                input.style.backgroundColor = '#fff';
                input.style.borderColor = '#0F5AA6';
            });
        } else {
            this.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
                input.style.backgroundColor = '#f8f9fa';
                input.style.borderColor = '#e0e0e0';
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
            }, 1000);
            alert('You have been signed out successfully. Redirecting to login page...');
        }
    });
});