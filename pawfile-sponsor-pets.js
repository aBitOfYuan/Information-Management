// Only arrow icon click navigates to pawfile-sponsor-pets2.html
document.querySelectorAll('.pet-card .fa-arrow-up-right-from-square').forEach(icon => {
  icon.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent bubbling to card
    const petCard = this.closest('.pet-card');
    const petId = petCard.getAttribute('data-pet-id');
    window.location.href = `pawfile-sponsor-pets2.html?petId=${encodeURIComponent(petId)}`;
  });
});

// Highlight pet card on hover
document.querySelectorAll('.pet-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.classList.add('highlight');
  });
  card.addEventListener('mouseleave', function() {
    this.classList.remove('highlight');
  });
});

// Sign out button confirmation
const signOutBtn = document.querySelector('.sign-out');
if (signOutBtn) {
  signOutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to sign out?')) {
      // Redirect or perform sign out logic here
      window.location.href = 'login.html';
    }
  });
});
