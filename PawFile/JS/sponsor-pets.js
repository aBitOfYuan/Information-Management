// Sample pet data — replace with API or database data as needed
let pets = []; // Will be loaded from API

// Reference to the pet list container in DOM
const petList = document.getElementById('petList');

// Fetch pets for the logged-in sponsor
function fetchPetsAndRender() {
  const sponsorID = sessionStorage.getItem('userId');
  if (!sponsorID) {
    alert('No logged-in user detected. Redirecting to login page.');
    window.location.href = '../HTML/pawfile-login.html';
    return;
  }
  fetch(`http://localhost:3000/api/sponsor/${sponsorID}/pets`)
    .then(res => res.json())
    .then(data => {
      pets = data;
      renderPets();
    })
    .catch(err => {
      console.error("Fetch pets error:", err);
      pets = [];
      renderPets();
    });
}

/**
 * Render the pet cards dynamically based on the pets array
 */
function renderPets() {
  petList.innerHTML = ''; // Clear previous content

  if (!pets.length) {
    petList.innerHTML = '<li style="color:#888; padding:20px;">No pets found for your account.</li>';
    return;
  }

  pets.forEach(pet => {
    // Create a list item for each pet
    const li = document.createElement('li');
    li.className = 'pet-card';
    li.setAttribute('data-pet-id', pet.id);

    // Pet card inner HTML with name, ID, remove and edit icons
    li.innerHTML = `
      <div>
        <span class="pet-name">${pet.name}</span>
        <div class="pet-id">PET ID: ${pet.id}</div>
      </div>
      <div class="icon-group">
        <i class="fa-solid fa-trash remove-icon" title="Remove Pet"></i>
        <a href="../HTML/sponsor-pets-details.html?petId=${encodeURIComponent(pet.id)}" class="pet-detail-link" title="View Details">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    `;
    petList.appendChild(li);
  });

  attachEventListeners();
}

/**
 * Attach event listeners for remove button, card hover, and sign out button
 */
function attachEventListeners() {
  // Remove pet event
  document.querySelectorAll('.remove-icon').forEach(icon => {
    icon.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent card click event

      const petCard = this.closest('.pet-card');
      const petId = petCard.getAttribute('data-pet-id');

      if (petId) {
        // Confirm removal
        removePet(petId);
      }
    });
  });

  // Highlight pet card on hover
  document.querySelectorAll('.pet-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.classList.add('highlight'));
    card.addEventListener('mouseleave', () => card.classList.remove('highlight'));
  });

  // Sign out button confirmation
  const signOutBtn = document.querySelector('.sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out?')) {
        window.location.href = '../HTML/pawfile-login.html';
      }
    });
  }
}

/**
 * Remove pet from the list and database
 * @param {string} petId - The ID (microchip number) of the pet to remove
 */
function removePet(petId) {
  const sponsorID = sessionStorage.getItem('userId');
  
  if (!sponsorID) {
    alert('No logged-in user detected. Redirecting to login page.');
    window.location.href = '../HTML/pawfile-login.html';
    return;
  }

  if (confirm(`Are you sure you want to permanently delete pet with ID ${petId}?`)) {
    fetch(`http://localhost:3000/api/pets/${petId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || 'Failed to delete pet');
        });
      }
      return response.json();
    })
    .then(data => {
      // Remove pet from local array and re-render
      const index = pets.findIndex(p => p.id === petId);
      if (index !== -1) {
        pets.splice(index, 1);
        renderPets();
      }
      alert('Pet deleted successfully');
    })
    .catch(error => {
      console.error('Error deleting pet:', error);
      alert(`Failed to delete pet: ${error.message}`);
    });
  }
}

// Initial rendering of pets when page loads
fetchPetsAndRender();