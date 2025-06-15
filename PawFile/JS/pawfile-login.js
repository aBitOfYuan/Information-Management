document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const userRole = document.getElementById('userRole').value;
    const sponsorId = document.getElementById('sponsorId').value.trim();
    const password = document.getElementById('password').value;

    if (!sponsorId || !password) {
      alert('Please fill in all required fields.');
      return;
    }

    const users = {
      sponsor: [
        { id: 'A7B9K', password: '123' },
        { id: 'M9Z4Q', password: '123' },
        { id: 'X3D7P', password: '123' },
      ],
      admin: [
        { id: 'admin', password: 'adminpass' }
      ]
    };

    // Find user with matching id and password
    const userFound = users[userRole]?.some(user => user.id === sponsorId && user.password === password);

    if (userFound) {
      // Save login status and role in sessionStorage
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('userId', sponsorId);

      alert(`${capitalize(userRole)} login successful! Redirecting to profile page...`);

      // Redirect after 1 second to sponsor-profile.html
      setTimeout(() => {
        window.location.href = '../HTML/sponsor-profile.html';
      }, 1000);
    } else {
      alert('Invalid ID or password.');
    }
  });

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
