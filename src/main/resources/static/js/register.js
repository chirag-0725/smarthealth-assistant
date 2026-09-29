const noteEl = document.getElementById('formNote');

function showNote(text) {
  noteEl.innerHTML = `<div class="form-note error">${text}</div>`;
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';
  noteEl.innerHTML = '';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data.error || (data.fieldErrors ? Object.values(data.fieldErrors)[0] : 'Something went wrong.');
      showNote(message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      return;
    }

    window.location.href = 'login.html?registered=1';
  } catch (err) {
    showNote('Couldn\'t reach the server. Is the app running?');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create account';
  }
});
