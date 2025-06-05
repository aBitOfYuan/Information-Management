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
