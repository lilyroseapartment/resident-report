// Track my case: look up a complaint by case ID + phone number.
const trackForm = $('#track-form');
const params = new URLSearchParams(location.search);
if (params.get('id')) {
  trackForm.elements.caseId.value = params.get('id');
  trackForm.elements.phone.focus();
}

trackForm.addEventListener('submit', async e => {
  e.preventDefault();
  const caseId = trackForm.elements.caseId.value.trim().toUpperCase();
  const phone = trackForm.elements.phone.value.trim();
  const err = $('#track-error');
  err.hidden = true;
  if (!caseId || phone.replace(/\D/g, '').length < 8) {
    err.textContent = 'Please enter your case ID and phone number.';
    err.hidden = false;
    return;
  }

  const btn = $('#track-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  try {
    const { case: c } = await api({ action: 'track', caseId, phone, deviceId: deviceId() });
    render(c);
  } catch (ex) {
    $('#result').hidden = true;
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Check status';
  }
});

function render(c) {
  $('#r-id').textContent = c.caseId;
  const badge = $('#r-status');
  badge.textContent = c.status;
  badge.className = 'badge badge-' + c.status.toLowerCase().replace(/\s+/g, '-');

  const steps = [
    ['Received', c.submittedAt, true],
    ['In progress', c.inProgressAt, c.status !== 'New'],
    ['Resolved', c.resolvedAt, c.status === 'Resolved'],
  ];
  const ol = $('#r-timeline');
  ol.replaceChildren();
  steps.forEach(([label, when, done]) => {
    const li = document.createElement('li');
    li.className = done ? 'done' : '';
    const t = document.createElement('strong');
    t.textContent = label;
    const d = document.createElement('span');
    d.textContent = when || (done ? '' : 'Pending');
    li.append(t, d);
    ol.append(li);
  });

  $('#r-category').textContent = c.category || '–';
  $('#r-location').textContent = c.location || '–';
  $('#r-duration').textContent = c.duration;
  $('#r-duration-row').hidden = !c.duration;
  $('#result').hidden = false;
  $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
