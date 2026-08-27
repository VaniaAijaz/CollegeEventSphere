const fs = require('fs');
const path = require('path');

const files = [
  'client/src/pages/Home.jsx',
  'client/src/pages/EventDetail.jsx',
  'client/src/pages/Dashboard.jsx',
  'client/src/pages/Events.jsx',
  'client/src/pages/Login.jsx',
  'client/src/pages/Register.jsx',
  'client/src/pages/Profile.jsx',
  'client/src/pages/Messages.jsx',
  'client/src/pages/Gallery.jsx',
  'client/src/pages/About.jsx',
  'client/src/pages/Contact.jsx',
  'client/src/pages/EventBooths.jsx',
  'client/src/components/events/EventCard.jsx',
  'client/src/components/layout/Navbar.jsx',
  'client/src/components/layout/Footer.jsx',
  'client/src/components/chatbot/ChatbotWidget.jsx',
];

// Garbled multi-byte sequences that appear when UTF-8 is misread as latin1
const replacements = [
  // em-dash  â€"  -> --
  [/\u00e2\u0080\u0094/g, '--'],
  // right single quote  â€™  -> '
  [/\u00e2\u0080\u0099/g, "'"],
  // left single quote  â€˜  -> '
  [/\u00e2\u0080\u0098/g, "'"],
  // left double quote  â€œ  -> "
  [/\u00e2\u0080\u009c/g, '"'],
  // right double quote  â€  -> "
  [/\u00e2\u0080\u009d/g, '"'],
  // ellipsis  â€¦  -> ...
  [/\u00e2\u0080\u00a6/g, '...'],
  // box drawing horizontal  â"€  -> -
  [/\u00e2\u0094\u0080/g, '-'],
  // double horizontal  â•  -> =
  [/\u00e2\u0095[\x90-\x9f]/g, '='],
  // en-dash  â€"  -> -
  [/\u00e2\u0080\u0093/g, '-'],
  // nbsp  Â  -> space
  [/\u00c2\u00a0/g, ' '],
  // bullet  â€¢  -> *
  [/\u00e2\u0080\u00a2/g, '*'],
  // arrow  â†'  -> ->
  [/\u00e2\u0086\u0092/g, '->'],
  // Registered  Â®  -> (R)
  [/\u00c2\u00ae/g, '(R)'],
  // Degree  Â°  -> deg
  [/\u00c2\u00b0/g, 'deg'],
];

let totalFixed = 0;
files.forEach(rel => {
  const f = path.join('c:/Users/PC/Downloads/CollegeEventSphere', rel);
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  replacements.forEach(([re, val]) => {
    const before = c;
    c = c.replace(re, val);
    if (c !== before) changed = true;
  });
  if (changed) {
    fs.writeFileSync(f, c);
    console.log('fixed:', rel);
    totalFixed++;
  }
});
console.log('Total files fixed:', totalFixed);
