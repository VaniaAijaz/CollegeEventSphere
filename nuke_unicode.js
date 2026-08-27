const fs = require('fs');

const targets = [
  'client/src/pages/OrganizerDashboard.jsx',
  'client/src/pages/AdminDashboard.jsx',
];

targets.forEach(rel => {
  const fpath = require('path').join('c:/Users/PC/Downloads/CollegeEventSphere', rel);
  let src = fs.readFileSync(fpath, 'utf8');

  // Replace ALL box-drawing / special Unicode chars with ASCII equivalents
  // These break the oxc Rust parser
  const before = src;
  
  // Box drawing doubles and singles
  src = src.replace(/\u2550/g, '=');  // ═
  src = src.replace(/\u2551/g, '|');  // ║
  src = src.replace(/\u2554/g, '+');  // ╔
  src = src.replace(/\u2557/g, '+');  // ╗
  src = src.replace(/\u255a/g, '+');  // ╚
  src = src.replace(/\u255d/g, '+');  // ╝
  src = src.replace(/\u2560/g, '+');  // ╠
  src = src.replace(/\u2563/g, '+');  // ╣
  src = src.replace(/\u2566/g, '+');  // ╦
  src = src.replace(/\u2569/g, '+');  // ╩
  src = src.replace(/\u256c/g, '+');  // ╬
  src = src.replace(/\u2500/g, '-');  // ─
  src = src.replace(/\u2502/g, '|');  // │
  src = src.replace(/\u250c/g, '+');  // ┌
  src = src.replace(/\u2510/g, '+');  // ┐
  src = src.replace(/\u2514/g, '+');  // └
  src = src.replace(/\u2518/g, '+');  // ┘
  src = src.replace(/\u251c/g, '+');  // ├
  src = src.replace(/\u2524/g, '+');  // ┤
  src = src.replace(/\u252c/g, '+');  // ┬
  src = src.replace(/\u2534/g, '+');  // ┴
  src = src.replace(/\u253c/g, '+');  // ┼

  // Em-dash, en-dash
  src = src.replace(/\u2014/g, '--');
  src = src.replace(/\u2013/g, '-');

  // Smart quotes
  src = src.replace(/\u2018/g, "'");
  src = src.replace(/\u2019/g, "'");
  src = src.replace(/\u201c/g, '"');
  src = src.replace(/\u201d/g, '"');

  if (src !== before) {
    fs.writeFileSync(fpath, src, 'utf8');
    console.log('Cleaned:', rel);
  } else {
    console.log('No changes:', rel);
  }
});

console.log('Done.');
