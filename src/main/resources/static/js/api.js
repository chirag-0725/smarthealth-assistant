// Small helper shared by every page: stores the JWT and wraps fetch()
// so every call to our own API automatically sends "Authorization: Bearer <token>".

const Auth = {
  getToken() {
    return localStorage.getItem('sh_token');
  },
  getName() {
    return localStorage.getItem('sh_name') || '';
  },
  save(accessToken, name, email) {
    localStorage.setItem('sh_token', accessToken);
    if (name) localStorage.setItem('sh_name', name);
    if (email) localStorage.setItem('sh_email', email);
  },
  clear() {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_name');
    localStorage.removeItem('sh_email');
  },
  isLoggedIn() {
    return !!this.getToken();
  }
};

// Wrapper around fetch() for our own /api/** endpoints.
// Adds the JWT header, and sends the caller straight back to login.html
// if the server says the session is no longer valid.
async function apiFetch(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );

  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const response = await fetch(path, Object.assign({}, options, { headers }));

  if (response.status === 401 || response.status === 403) {
    Auth.clear();
    window.location.href = 'login.html?expired=1';
    // Throw so callers don't try to keep processing this response.
    throw new Error('Session expired');
  }

  return response;
}
