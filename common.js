// Shared by every page: branding, API calls and small helpers.
const CFG = window.APP_CONFIG;
const DEMO = !CFG.API_URL;

const $ = (sel, root = document) => root.querySelector(sel);

function deviceId() {
  try {
    let id = localStorage.getItem('helpdesk-device');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem('helpdesk-device', id);
    }
    return id;
  } catch (e) {
    return '';
  }
}

async function api(payload) {
  if (DEMO) return demoApi(payload);
  let res;
  try {
    res = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(payload) });
  } catch (e) {
    throw new Error('Could not reach the server. Please check your internet connection and try again.');
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('The server returned an unexpected response. Please try again later.');
  }
  if (!data.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}

// Demo mode: lets you preview the pages before the backend is connected.
async function demoApi(p) {
  await new Promise(r => setTimeout(r, p.action === 'upload' ? 900 : 700));
  const year = new Date().getFullYear();
  if (p.action === 'submit') return { ok: true, caseId: `APT-${year}-0001`, uploadToken: 'demo' };
  if (p.action === 'upload') return { ok: true };
  if (p.action === 'track') {
    return {
      ok: true,
      case: {
        caseId: p.caseId.toUpperCase(), status: 'In Progress', category: 'Water Leakage & Plumbing',
        location: 'Block A, staircase level 2', submittedAt: `2 Jan ${year}, 9:14 AM`,
        inProgressAt: `2 Jan ${year}, 2:30 PM`, resolvedAt: '', duration: '',
      },
    };
  }
}

function applyBranding() {
  document.querySelectorAll('[data-building]').forEach(el => { el.textContent = CFG.BUILDING_NAME; });
  document.querySelectorAll('[data-tagline]').forEach(el => { el.textContent = CFG.TAGLINE; });
  const initials = CFG.BUILDING_NAME.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  document.querySelectorAll('[data-initials]').forEach(el => { el.textContent = initials; });
  const contact = $('[data-contact]');
  if (contact) {
    contact.textContent = CFG.CONTACT_LINE;
    contact.hidden = !CFG.CONTACT_LINE;
  }
  document.title = document.title.replace('Resident Report', CFG.BUILDING_NAME);
  $('#year').textContent = new Date().getFullYear();
  if (DEMO) $('#demo-banner').hidden = false;
}

function fillSelect(select, options) {
  options.forEach(o => select.add(new Option(o, o)));
}

document.addEventListener('DOMContentLoaded', applyBranding);
