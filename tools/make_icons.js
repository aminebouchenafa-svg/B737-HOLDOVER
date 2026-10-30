// Génère les icônes PWA (flocon + « HOT », fond noir, néon bleu glacier) via Playwright.
// Usage : node tools/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const orb = fs.readFileSync(path.join(root, 'src/fonts/orb.woff2')).toString('base64');
const arms = [0, 60, 120, 180, 240, 300].map(a =>
  `<g transform="rotate(${a} 256 200)"><path d="M256 200V70M256 112l-30-26M256 112l30-26M256 150l-22-20M256 150l22-20"/></g>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><filter id="g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<radialGradient id="bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#0b2230"/><stop offset=".6" stop-color="#03070a"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#bg)"/>
<g filter="url(#g)" stroke="#5fd8ff" stroke-width="16" stroke-linecap="round" fill="none">${arms}<circle cx="256" cy="200" r="16" fill="#5fd8ff" stroke="none"/></g>
<text x="256" y="440" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="104" letter-spacing="10" fill="#e9fbff" filter="url(#g)">HOT</text>
</svg>`;
(async () => {
  fs.writeFileSync(path.join(root, 'icons/icon.svg'), svg);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(`<style>@font-face{font-family:Orbitron;font-weight:400 900;src:url(data:font/woff2;base64,${orb})}html,body{margin:0;background:#000}</style><div id="i">${svg}</div>`);
  await p.evaluate(() => document.fonts.ready);
  for (const s of [512, 192, 180]) {
    await p.setViewportSize({ width: s, height: s });
    await p.evaluate(s => { const e = document.querySelector('#i svg'); e.setAttribute('width', s); e.setAttribute('height', s); }, s);
    await p.screenshot({ path: path.join(root, `icons/icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
