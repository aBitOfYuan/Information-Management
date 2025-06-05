// Arrow icon click => navigate to pet details page
document.querySelectorAll('.pet-card .fa-arrow-up-right-from-square').forEach(icon => {
  icon.addEventListener('click', function (event) {
    event.stopPropagation(); // Prevent bubbling to card
    const petCard = this.closest('.pet-card');
    const petId = petCard.getAttribute('data-pet-id');
    if (petId) {
      window.location.href = `pawfile-sponsor-pets2.html?petId=${encodeURIComponent(petId)}`;
    }
  });
});

// Highlight pet card on hover
document.querySelectorAll('.pet-card').forEach(card => {
  card.addEventListener('mouseenter', function () {
    this.classList.add('highlight');
  });
  card.addEventListener('mouseleave', function () {
    this.classList.remove('highlight');
  });
});

// Sign out button confirmation
const signOutBtn = document.querySelector('.sign-out');
if (signOutBtn) {
  signOutBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = 'login.html';
    }
  });
};
