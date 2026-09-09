// basic UI interactions
document.getElementById('auth-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  // visual feedback only
  alert('Welcome back! Redirecting to lobby...\n(Demo – no real backend)');
  document.getElementById('login-modal').style.display = 'none';
  this.reset();
});

// close modal on outside click
document.getElementById('login-modal').addEventListener('click', function (e) {
  if (e.target === this) this.style.display = 'none';
});