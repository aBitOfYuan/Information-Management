// Sample pet data — replace with API or database data as needed
const pets = [
  { id: 'A7B9K', name: 'KingKong' },
  { id: 'C2B2K', name: 'Tiger' },
  { id: 'A2Z4D', name: 'Dora' }
];

// Reference to the pet list container in DOM
const petList = document.getElementById('petList');

/**
 * Render the pet cards dynamically based on the pets array
 */
function renderPets() {
  petList.innerHTML = ''; // Clear previous content

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
        if (confirm(`Are you sure you want to remove pet with ID ${petId}?`)) {
          removePet(petId);
        }
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
 * Remove pet from the list and re-render
 * @param {string} petId - The ID of the pet to remove
 */
function removePet(petId) {
  const index = pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    pets.splice(index, 1); // Remove pet from array
    renderPets();          // Refresh the displayed list
  }
}

// Initial rendering of pets when page loads
renderPets();
