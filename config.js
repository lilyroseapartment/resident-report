// Site settings. Keep BLOCKS, CATEGORIES and the file limits in sync with apps-script/Code.gs.
window.APP_CONFIG = {
  // Paste your Apps Script web app URL here (it ends with /exec).
  // Leave empty to preview the site in demo mode: nothing is saved.
  API_URL: 'https://script.google.com/macros/s/AKfycbzXIFmfgxdE059GbBET4XaLPKqerkEXzUwntRsXj_wzYrt1PqXkNQuKT-fB-BNu-uCu/exec',

  BUILDING_NAME: 'Lily Rose Apartment',
  TAGLINE: 'Submit, track, and stay updated on your reported issues',
  // Shown in the footer, e.g. 'Management Office · 03-1234 5678'. Leave empty to hide.
  CONTACT_LINE: '',

  MAX_FILES: 3,
  MAX_IMAGE_MB: 10,
  MAX_VIDEO_MB: 20,

  BLOCKS: ['A', 'A1', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'E1', 'F', 'F1', 'G', 'G1'],

  CATEGORIES: [
    'Security & Safety',
    'Parking & Visitors',
    'Building & Common Area',
    'Water Leakage & Plumbing',
    'Cleanliness & Waste',
    'Nuisance & Neighbour Issues',
    'Suggestions & Feedback',
    'Others',
  ],
};
