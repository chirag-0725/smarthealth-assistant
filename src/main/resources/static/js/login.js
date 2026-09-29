const params = new URLSearchParams(window.location.search);
const noteEl = document.getElementById('formNote');

if (params.get('expired') === '1') {
  showNote('Your session ended. Log in again to continue.');
}
if (params.get('registered') === '1') {
  showNote('Account created. Log in to continue.', false);
}

function showNote(text, isError = true) {
  noteEl.innerHTML = `<div class="form-note ${isError ? 'error' : ''}" style="${isError ? '' : 'background:#EAF1EC;color:#2F6F62;border:1px solid #CBE0D3;'}">${text}</div>`;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in…';
  noteEl.innerHTML = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showNote(data.error || 'That email or password doesn\'t match our records.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
      return;
    }

    Auth.save(data.accessToken, data.name, data.email);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showNote('Couldn\'t reach the server. Is the app running?');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';
  }
});
