document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form values
    const userRole = document.getElementById('userRole').value;
    const sponsorId = document.getElementById('sponsorId').value.trim().toUpperCase();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!sponsorId || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    // Show loading state
    setLoading(true);

    try {
      // Send login request to server
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sponsorId,
          password,
          userRole 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store session data
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('sponsorId', sponsorId);
      sessionStorage.setItem('sponsorData', JSON.stringify(data.sponsorData || {}));

      // Show success and redirect
      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = data.redirect || '../../HTML/sponsor-profile.html';
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Helper functions
  function setLoading(isLoading) {
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = isLoading;
    }
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  }

  function showSuccess(message) {
    // You can implement a success message display similar to showError()
    alert(message); // Temporary using alert for success
  }
});