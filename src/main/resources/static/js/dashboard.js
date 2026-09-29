// Guard: bounce to login if there's no session at all.
if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

document.getElementById('whoLabel').textContent = Auth.getName()
  ? `Signed in as ${Auth.getName()}`
  : 'Signed in';

document.getElementById('logoutBtn').addEventListener('click', () => {
  Auth.clear();
  window.location.href = 'login.html';
});

// ---------- Nav switching ----------

document.querySelectorAll('.nav-item[data-panel]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-panel]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');
  });
});

// ---------- Health logs ----------

const logsContainer = document.getElementById('logsContainer');
const logForm = document.getElementById('logForm');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');

toggleFormBtn.addEventListener('click', () => {
  logForm.classList.toggle('open');
  if (logForm.classList.contains('open')) {
    document.getElementById('logDate').valueAsDate = new Date();
  }
});

cancelFormBtn.addEventListener('click', () => {
  logForm.classList.remove('open');
  logForm.reset();
});

const MOOD_LABELS = {
  great: 'Great', good: 'Good', okay: 'Okay', low: 'Low', rough: 'Rough'
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

let cachedLogs = [];

async function loadLogs() {
  try {
    const res = await apiFetch('/api/health-logs?size=50&sort=date,desc');
    if (!res.ok) throw new Error('Failed to load');
    const page = await res.json();
    cachedLogs = page.content || [];
    renderLogs(cachedLogs);
    renderTrends(cachedLogs);
  } catch (err) {
    logsContainer.innerHTML = '<div class="empty-state">Couldn\'t load your entries. Try refreshing the page.</div>';
  }
}

function renderLogs(entries) {
  if (!entries.length) {
    logsContainer.innerHTML = '<div class="empty-state">Nothing logged yet. Add your first entry to start noticing patterns.</div>';
    return;
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : -1));

  const items = entries.map((entry) => `
    <li>
      <div class="entry-date">${formatDate(entry.date)}</div>
      <div class="entry-card">
        <div class="entry-top">
          <span class="entry-mood">${entry.mood ? (MOOD_LABELS[entry.mood] || entry.mood) : 'No mood logged'}</span>
          <button class="delete-link" data-id="${entry.id}">Delete</button>
        </div>
        <div class="entry-meta">
          ${entry.sleepHours != null ? entry.sleepHours + 'h sleep' : ''}${entry.symptoms ? (entry.sleepHours != null ? ' · ' : '') + entry.symptoms : ''}
        </div>
        ${entry.notes ? `<div class="entry-notes">${escapeHtml(entry.notes)}</div>` : ''}
      </div>
    </li>
  `).join('');

  logsContainer.innerHTML = `<ul class="timeline">${items}</ul>`;

  logsContainer.querySelectorAll('.delete-link').forEach((btn) => {
    btn.addEventListener('click', () => deleteLog(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

logForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    date: document.getElementById('logDate').value,
    sleepHours: document.getElementById('logSleep').value ? Number(document.getElementById('logSleep').value) : null,
    mood: document.getElementById('logMood').value || null,
    symptoms: document.getElementById('logSymptoms').value || null,
    notes: document.getElementById('logNotes').value || null
  };

  try {
    const res = await apiFetch('/api/health-logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Save failed');

    logForm.reset();
    logForm.classList.remove('open');
    loadLogs();
  } catch (err) {
    alert('Couldn\'t save that entry. Please try again.');
  }
});

async function deleteLog(id) {
  if (!confirm('Delete this entry? This can\'t be undone.')) return;
  try {
    const res = await apiFetch(`/api/health-logs/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Delete failed');
    loadLogs();
  } catch (err) {
    alert('Couldn\'t delete that entry. Please try again.');
  }
}

loadLogs();

// ---------- AI chat ----------

const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

function appendMessage(role, text, disclaimer) {
  const isUrgent = role === 'ai' && text.startsWith('URGENT:');
  const displayText = isUrgent ? text.replace(/^URGENT:\s*/, '') : text;

  const wrap = document.createElement('div');
  wrap.className = `msg msg-${role}${isUrgent ? ' msg-urgent' : ''}`;
  wrap.innerHTML = `
    ${isUrgent ? '<div style="font-size:12px;font-weight:600;color:var(--danger);margin-bottom:4px;">This may need urgent attention</div>' : ''}
    <div class="msg-bubble">${escapeHtml(displayText)}</div>
    ${disclaimer ? `<div class="msg-disclaimer">${escapeHtml(disclaimer)}</div>` : ''}
  `;
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendSymptomCheck() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatSendBtn.disabled = true;

  appendMessage('ai', 'Thinking…');
  const thinkingBubble = chatLog.lastChild;

  try {
    const res = await apiFetch('/api/ai/symptom-check', {
      method: 'POST',
      body: JSON.stringify({ description: text })
    });

    const data = await res.json();
    thinkingBubble.remove();

    if (!res.ok) {
      appendMessage('ai', data.error || 'Something went wrong reaching the AI service. Please try again shortly.');
      return;
    }

    appendMessage('ai', data.result, data.disclaimer);
  } catch (err) {
    thinkingBubble.remove();
    appendMessage('ai', 'Something went wrong reaching the AI service. Please try again shortly.');
  } finally {
    chatSendBtn.disabled = false;
  }
}

chatSendBtn.addEventListener('click', sendSymptomCheck);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendSymptomCheck();
});

// ---------- Weekly AI summary ----------

document.getElementById('weeklySummaryBtn').addEventListener('click', async () => {
  const btn = document.getElementById('weeklySummaryBtn');
  btn.disabled = true;
  btn.textContent = 'Summarizing…';

  appendMessage('ai', 'Looking at your last 7 days…');
  const placeholder = chatLog.lastChild;

  try {
    const res = await apiFetch('/api/ai/weekly-summary', { method: 'POST' });
    const data = await res.json();
    placeholder.remove();

    if (!res.ok) {
      appendMessage('ai', data.error || 'Couldn\'t generate a summary right now.');
    } else {
      appendMessage('ai', data.result, data.disclaimer);
    }
  } catch (err) {
    placeholder.remove();
    appendMessage('ai', 'Couldn\'t generate a summary right now. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Summarize my week';
  }
});

// ---------- Vitals ----------

const vitalsContainer = document.getElementById('vitalsContainer');
const vitalForm = document.getElementById('vitalForm');
const toggleVitalFormBtn = document.getElementById('toggleVitalFormBtn');
const cancelVitalFormBtn = document.getElementById('cancelVitalFormBtn');

toggleVitalFormBtn.addEventListener('click', () => {
  vitalForm.classList.toggle('open');
  if (vitalForm.classList.contains('open')) {
    document.getElementById('vitalDate').valueAsDate = new Date();
  }
});
cancelVitalFormBtn.addEventListener('click', () => {
  vitalForm.classList.remove('open');
  vitalForm.reset();
});

async function loadVitals() {
  try {
    const res = await apiFetch('/api/vitals?size=50&sort=date,desc');
    if (!res.ok) throw new Error('failed');
    const page = await res.json();
    renderVitals(page.content || []);
  } catch (err) {
    vitalsContainer.innerHTML = '<div class="empty-state">Couldn\'t load your readings. Try refreshing.</div>';
  }
}

function renderVitals(entries) {
  if (!entries.length) {
    vitalsContainer.innerHTML = '<div class="empty-state">No readings yet. Add your first blood pressure, heart rate or weight entry.</div>';
    return;
  }
  entries.sort((a, b) => (a.date < b.date ? 1 : -1));

  const items = entries.map((v) => {
    const parts = [];
    if (v.systolic && v.diastolic) parts.push(`${v.systolic}/${v.diastolic} mmHg`);
    if (v.heartRate) parts.push(`${v.heartRate} bpm`);
    if (v.weightKg) parts.push(`${v.weightKg} kg`);
    return `
      <li>
        <div class="entry-date">${formatDate(v.date)}</div>
        <div class="entry-card">
          <div class="entry-top">
            <span class="entry-mood">${parts.join(' · ') || 'No values recorded'}</span>
            <button class="delete-link" data-id="${v.id}">Delete</button>
          </div>
          ${v.notes ? `<div class="entry-notes">${escapeHtml(v.notes)}</div>` : ''}
        </div>
      </li>
    `;
  }).join('');

  vitalsContainer.innerHTML = `<ul class="timeline">${items}</ul>`;
  vitalsContainer.querySelectorAll('.delete-link').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this reading?')) return;
      await apiFetch(`/api/vitals/${btn.dataset.id}`, { method: 'DELETE' });
      loadVitals();
    });
  });
}

vitalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    date: document.getElementById('vitalDate').value,
    systolic: numOrNull('vitalSystolic'),
    diastolic: numOrNull('vitalDiastolic'),
    heartRate: numOrNull('vitalHeartRate'),
    weightKg: numOrNull('vitalWeight'),
    notes: document.getElementById('vitalNotes').value || null
  };
  try {
    const res = await apiFetch('/api/vitals', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('save failed');
    vitalForm.reset();
    vitalForm.classList.remove('open');
    loadVitals();
  } catch (err) {
    alert('Couldn\'t save that reading. Please try again.');
  }
});

function numOrNull(id) {
  const val = document.getElementById(id).value;
  return val ? Number(val) : null;
}

loadVitals();

// ---------- Medications ----------

const medsContainer = document.getElementById('medsContainer');
const medForm = document.getElementById('medForm');
const toggleMedFormBtn = document.getElementById('toggleMedFormBtn');
const cancelMedFormBtn = document.getElementById('cancelMedFormBtn');

toggleMedFormBtn.addEventListener('click', () => medForm.classList.toggle('open'));
cancelMedFormBtn.addEventListener('click', () => {
  medForm.classList.remove('open');
  medForm.reset();
});

let cachedMeds = [];

async function loadMeds() {
  try {
    const res = await apiFetch('/api/medications');
    if (!res.ok) throw new Error('failed');
    cachedMeds = await res.json();
    renderMeds(cachedMeds);
  } catch (err) {
    medsContainer.innerHTML = '<div class="empty-state">Couldn\'t load your medications. Try refreshing.</div>';
  }
}

function renderMeds(meds) {
  if (!meds.length) {
    medsContainer.innerHTML = '<div class="empty-state">No medications added yet.</div>';
    return;
  }
  medsContainer.innerHTML = meds.map((m) => `
    <div class="med-item ${m.active ? '' : 'inactive'}">
      <div class="med-info">
        <div class="name">${escapeHtml(m.name)}</div>
        <div class="meta">${[m.dosage, m.frequency].filter(Boolean).map(escapeHtml).join(' · ') || 'No details added'}</div>
      </div>
      <div class="med-actions">
        <button class="pill-btn" data-toggle="${m.id}" data-active="${m.active}">${m.active ? 'Mark inactive' : 'Mark active'}</button>
        <button class="pill-btn" data-delete="${m.id}">Delete</button>
      </div>
    </div>
  `).join('');

  medsContainer.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggle;
      const med = cachedMeds.find((m) => String(m.id) === String(id));
      if (!med) return;
      await apiFetch(`/api/medications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          active: !med.active
        })
      });
      loadMeds();
    });
  });

  medsContainer.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this medication?')) return;
      await apiFetch(`/api/medications/${btn.dataset.delete}`, { method: 'DELETE' });
      loadMeds();
    });
  });
}

medForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('medName').value,
    dosage: document.getElementById('medDosage').value || null,
    frequency: document.getElementById('medFrequency').value || null,
    active: true
  };
  try {
    const res = await apiFetch('/api/medications', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('save failed');
    medForm.reset();
    medForm.classList.remove('open');
    loadMeds();
  } catch (err) {
    alert('Couldn\'t save that medication. Please try again.');
  }
});

loadMeds();

// ---------- Trends ----------

const MOOD_SCORE = { rough: 1, low: 2, okay: 3, good: 4, great: 5 };
let sleepChartInstance = null;
let moodChartInstance = null;

function renderTrends(entries) {
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-14);
  const labels = sorted.map((e) => e.date.slice(5)); // MM-DD
  const sleepData = sorted.map((e) => e.sleepHours ?? null);
  const moodData = sorted.map((e) => (e.mood ? MOOD_SCORE[e.mood] ?? null : null));

  const sleepCtx = document.getElementById('sleepChart');
  const moodCtx = document.getElementById('moodChart');
  if (!sleepCtx || !moodCtx || typeof Chart === 'undefined') return;

  if (sleepChartInstance) sleepChartInstance.destroy();
  if (moodChartInstance) moodChartInstance.destroy();

  sleepChartInstance = new Chart(sleepCtx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Hours', data: sleepData, borderColor: '#2F6F62', backgroundColor: 'rgba(47,111,98,0.12)', tension: 0.3, fill: true, spanGaps: true }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, suggestedMax: 10 } } }
  });

  moodChartInstance = new Chart(moodCtx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Mood', data: moodData, borderColor: '#D68C3F', backgroundColor: 'rgba(214,140,63,0.12)', tension: 0.3, fill: true, spanGaps: true }] },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { min: 1, max: 5, ticks: { callback: (v) => ({1:'Rough',2:'Low',3:'Okay',4:'Good',5:'Great'})[v] || '' } } }
    }
  });
}

// ---------- Lab report ----------

document.getElementById('labSubmitBtn').addEventListener('click', async () => {
  const text = document.getElementById('labText').value.trim();
  const resultEl = document.getElementById('labResult');
  if (!text) return;

  const btn = document.getElementById('labSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Explaining…';
  resultEl.innerHTML = '';

  try {
    const res = await apiFetch('/api/ai/lab-report', { method: 'POST', body: JSON.stringify({ text }) });
    const data = await res.json();
    if (!res.ok) {
      resultEl.innerHTML = `<div class="ai-result-card">${escapeHtml(data.error || 'Something went wrong.')}</div>`;
    } else {
      resultEl.innerHTML = `<div class="ai-result-card">${escapeHtml(data.result)}</div><div class="ai-result-disclaimer">${escapeHtml(data.disclaimer)}</div>`;
    }
  } catch (err) {
    resultEl.innerHTML = '<div class="ai-result-card">Couldn\'t reach the AI service. Please try again.</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Explain this';
  }
});

// ---------- Profile ----------

async function loadProfile() {
  try {
    const res = await apiFetch('/api/profile');
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    document.getElementById('profileName').value = data.name || '';
    document.getElementById('profileEmail').value = data.email || '';
  } catch (err) {
    // silent — profile panel just stays empty until they interact
  }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const noteEl = document.getElementById('profileNote');
  noteEl.innerHTML = '';
  try {
    const res = await apiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value
      })
    });
    const data = await res.json();
    if (!res.ok) {
      noteEl.innerHTML = `<div class="form-note error">${escapeHtml(data.error || 'Couldn\'t save changes.')}</div>`;
      return;
    }
    Auth.save(Auth.getToken(), data.name, data.email);
    document.getElementById('whoLabel').textContent = `Signed in as ${data.name}`;
    noteEl.innerHTML = '<div class="form-note" style="background:#EAF1EC;color:#2F6F62;border:1px solid #CBE0D3;">Saved.</div>';
  } catch (err) {
    noteEl.innerHTML = '<div class="form-note error">Couldn\'t reach the server.</div>';
  }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const noteEl = document.getElementById('passwordNote');
  noteEl.innerHTML = '';
  try {
    const res = await apiFetch('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value
      })
    });
    if (!res.ok) {
      const data = await res.json();
      noteEl.innerHTML = `<div class="form-note error">${escapeHtml(data.error || 'Couldn\'t update password.')}</div>`;
      return;
    }
    document.getElementById('passwordForm').reset();
    noteEl.innerHTML = '<div class="form-note" style="background:#EAF1EC;color:#2F6F62;border:1px solid #CBE0D3;">Password updated.</div>';
  } catch (err) {
    noteEl.innerHTML = '<div class="form-note error">Couldn\'t reach the server.</div>';
  }
});

loadProfile();

// ---------- Export PDF ----------

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF export isn\'t available right now. Please try again in a moment.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const name = Auth.getName() || 'Patient';

  doc.setFontSize(16);
  doc.text('Health Log Summary', 14, 18);
  doc.setFontSize(11);
  doc.text(`Prepared for: ${name}`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

  let y = 44;
  const sorted = [...cachedLogs].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (!sorted.length) {
    doc.text('No entries logged yet.', 14, y);
  }

  sorted.forEach((entry) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(formatDate(entry.date), 14, y);
    y += 6;
    doc.setFontSize(10);
    const line1 = [
      entry.sleepHours != null ? `Sleep: ${entry.sleepHours}h` : null,
      entry.mood ? `Mood: ${entry.mood}` : null
    ].filter(Boolean).join('   ');
    if (line1) { doc.text(line1, 14, y); y += 5; }
    if (entry.symptoms) { doc.text(`Symptoms: ${entry.symptoms}`, 14, y); y += 5; }
    if (entry.notes) {
      const wrapped = doc.splitTextToSize(`Notes: ${entry.notes}`, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 5;
    }
    y += 4;
  });

  doc.save('health-log-summary.pdf');
});
