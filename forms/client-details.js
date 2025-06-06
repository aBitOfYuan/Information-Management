// Function to handle exit button click
function exitApp() {
    // Show confirmation dialog
    const confirmExit = confirm("Are you sure you want to exit?");
    
    if (confirmExit) {
        // Close the window/tab
        window.close();
        
        // Fallback for browsers that don't allow window.close()
        // Redirect to a blank page or show exit message
        setTimeout(() => {
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #FFA500, #FFD700);
                    font-family: Arial, sans-serif;
                    color: #1E5A8A;
                    font-size: 2rem;
                    text-align: center;
                ">
                    <div>
                        <h1>Thank you for using PawFile!</h1>
                        <p style="margin-top: 1rem; font-size: 1.2rem;">You can now close this tab.</p>
                    </div>
                </div>
            `;
        }, 100);
    }
}

// Add keyboard shortcut for exit (Escape key)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        exitApp();
    }
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
    
    // Add click effect to account card
    const accountCard = document.querySelector('.account-card');
    accountCard.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const sponsorId = sessionStorage.getItem("sponsorId");
  const password = sessionStorage.getItem("password");

  const sponsorIdElem = document.getElementById("sponsor-id");
  const passwordElem = document.getElementById("password");

  if (sponsorId && password) {
    sponsorIdElem.textContent = sponsorId;
    passwordElem.textContent = password;
  } else {
    sponsorIdElem.textContent = "Not available";
    passwordElem.textContent = "Not available";
  }
});

function exitApp() {
  // Define your exit logic here, for example:
  window.close(); // or redirect somewhere
}

// Add transition effect to account card
document.querySelector('.account-card').style.transition = 'transform 0.2s ease';