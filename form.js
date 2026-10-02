// Complaint form: validation, attachments and submission.
const FILE_TYPES = {
  jpg:  { kind: 'image', mimes: ['image/jpeg', 'image/jpg'] },
  jpeg: { kind: 'image', mimes: ['image/jpeg', 'image/jpg'] },
  png:  { kind: 'image', mimes: ['image/png'] },
  webp: { kind: 'image', mimes: ['image/webp'] },
  heic: { kind: 'image', mimes: ['image/heic', 'image/heif'] },
  mp4:  { kind: 'video', mimes: ['video/mp4'] },
  mov:  { kind: 'video', mimes: ['video/quicktime'] },
};

const form = $('#complaint-form');
const startedAt = Date.now();
let files = [];

fillSelect($('#category'), CFG.CATEGORIES);
fillSelect($('#block'), CFG.BLOCKS);
$('#file-rules').textContent =
  `JPG, PNG, WEBP, HEIC, MP4 or MOV · up to ${CFG.MAX_FILES} files · photos ${CFG.MAX_IMAGE_MB} MB, videos ${CFG.MAX_VIDEO_MB} MB each`;

$('#description').addEventListener('input', e => { $('#desc-count').textContent = e.target.value.length; });

/* ── Attachments ── */

function fileInfo(file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  const t = FILE_TYPES[ext];
  if (!t || (file.type && !t.mimes.includes(file.type.toLowerCase()))) {
    return { error: `"${file.name}" isn't allowed. Only photos and videos (JPG, PNG, WEBP, HEIC, MP4, MOV) can be attached.` };
  }
  const max = t.kind === 'video' ? CFG.MAX_VIDEO_MB : CFG.MAX_IMAGE_MB;
  if (file.size > max * 1024 * 1024) return { error: `"${file.name}" is too large. ${t.kind === 'video' ? 'Videos' : 'Photos'} must be under ${max} MB.` };
  if (!file.size) return { error: `"${file.name}" is empty.` };
  return { kind: t.kind };
}

function addFiles(list) {
  const errors = [];
  for (const file of list) {
    if (files.length >= CFG.MAX_FILES) { errors.push(`You can attach up to ${CFG.MAX_FILES} files.`); break; }
    if (files.some(f => f.file.name === file.name && f.file.size === file.size)) continue;
    const info = fileInfo(file);
    if (info.error) errors.push(info.error);
    else files.push({ file, kind: info.kind });
  }
  $('#file-error').textContent = errors.join(' ');
  renderFiles();
}

function renderFiles() {
  const ul = $('#file-list');
  ul.querySelectorAll('img').forEach(img => URL.revokeObjectURL(img.src));
  ul.replaceChildren();
  files.forEach((f, i) => {
    const li = document.createElement('li');
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (f.kind === 'image' && !/\.heic$/i.test(f.file.name)) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f.file);
      img.alt = '';
      thumb.append(img);
    } else {
      thumb.textContent = f.kind === 'video' ? 'VIDEO' : 'PHOTO';
    }
    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('span');
    name.className = 'fname';
    name.textContent = f.file.name;
    const size = document.createElement('span');
    size.className = 'fsize';
    size.textContent = formatSize(f.file.size);
    meta.append(name, size);
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'remove';
    rm.setAttribute('aria-label', `Remove ${f.file.name}`);
    rm.textContent = '×';
    rm.addEventListener('click', () => { files.splice(i, 1); $('#file-error').textContent = ''; renderFiles(); });
    li.append(thumb, meta, rm);
    ul.append(li);
  });
  $('#dropzone').classList.toggle('full', files.length >= CFG.MAX_FILES);
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

$('#files').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
const dz = $('#dropzone');
['dragenter', 'dragover'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave', 'drop'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));

/* ── Validation ── */

const rules = {
  name: v => v.trim() ? '' : 'Please enter your name.',
  applicantType: v => v ? '' : 'Please choose Owner or Tenant.',
  block: v => v ? '' : 'Please choose your block.',
  unit: v => v.trim() ? '' : 'Please enter your unit number.',
  phone: v => { const d = v.replace(/\D/g, ''); return d.length >= 8 && d.length <= 15 ? '' : 'Please enter a valid phone number.'; },
  category: v => v ? '' : 'Please choose a category.',
  location: v => v.trim() ? '' : 'Where is the issue?',
  description: v => v.trim().length >= 10 ? '' : 'Please describe the issue (at least 10 characters).',
  consent: (v, el) => el.checked ? '' : 'Please agree to the privacy notice to submit.',
};

// Radio groups come back as a list; use their first input for focus and events.
const control = n => (form.elements[n] instanceof RadioNodeList ? form.elements[n][0] : form.elements[n]);

function validateField(n) {
  const el = control(n);
  const msg = rules[n](form.elements[n].value, el);
  const field = el.closest('.field');
  field.classList.toggle('invalid', !!msg);
  $('.error', field).textContent = msg;
  return !msg;
}

Object.keys(rules).forEach(n => {
  const list = form.elements[n] instanceof RadioNodeList ? [...form.elements[n]] : [form.elements[n]];
  list.forEach(el => {
    el.addEventListener(el.type === 'checkbox' || el.type === 'radio' ? 'change' : 'blur', () => validateField(n));
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) validateField(n); });
  });
});

/* ── Submit ── */

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    r.readAsDataURL(file);
  });
}

function show(id) {
  ['form-view', 'progress-view', 'success-view'].forEach(v => { $('#' + v).hidden = v !== id; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setProgress(title, sub, pct) {
  $('#progress-title').textContent = title;
  $('#progress-sub').textContent = sub;
  $('#progress-bar').style.width = pct + '%';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  $('#form-error').hidden = true;
  const invalid = Object.keys(rules).filter(n => !validateField(n));
  if (invalid.length) { control(invalid[0]).focus(); return; }

  const v = n => form.elements[n].value.trim();
  const payload = {
    action: 'submit',
    name: v('name'), applicantType: v('applicantType'), block: v('block'), unit: v('unit'), phone: v('phone'),
    category: v('category'), location: v('location'), description: v('description'),
    files: files.map(f => ({ name: f.file.name, type: f.file.type, size: f.file.size })),
    consent: form.elements.consent.checked,
    website: form.elements.website.value,
    elapsedMs: Date.now() - startedAt,
    deviceId: deviceId(),
  };

  show('progress-view');
  setProgress('Submitting your complaint…', 'Please keep this page open.', 10);

  let result;
  try {
    result = await api(payload);
  } catch (err) {
    show('form-view');
    $('#form-error').textContent = err.message;
    $('#form-error').hidden = false;
    return;
  }

  const failed = [];
  if (result.uploadToken) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress(`Uploading ${f.kind} ${i + 1} of ${files.length}…`, f.file.name, 15 + Math.round((i / files.length) * 80));
      try {
        const data = await readBase64(f.file);
        await api({ action: 'upload', caseId: result.caseId, token: result.uploadToken, name: f.file.name, type: f.file.type, data });
      } catch (err) {
        failed.push(err.message);
      }
    }
  }
  setProgress('Done', '', 100);

  $('#case-id').textContent = result.caseId;
  $('#track-link').href = 'track.html?id=' + encodeURIComponent(result.caseId);
  const warn = $('#upload-warn');
  warn.hidden = !failed.length;
  warn.textContent = failed.length
    ? `Your complaint was received, but ${failed.length === 1 ? 'one file' : failed.length + ' files'} could not be uploaded: ${failed.join(' ')} Please send ${failed.length === 1 ? 'it' : 'them'} to the management office, quoting your case ID.`
    : '';
  show('success-view');
});

$('#copy-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#case-id').textContent);
    $('#copy-btn').textContent = 'Copied';
    setTimeout(() => { $('#copy-btn').textContent = 'Copy'; }, 1500);
  } catch (e) { /* clipboard unavailable: the ID is still on screen */ }
});
