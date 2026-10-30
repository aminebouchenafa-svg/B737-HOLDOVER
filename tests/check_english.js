// Parcourt l'app en anglais et signale tout texte français restant. Usage : node tests/check_english.js [dossier_captures]
const { chromium, devices } = require('playwright');
const path = require('path');
const url = 'file://' + path.join(__dirname, '..', 'index.html');
const shots = process.argv[2];
const FRENCH = /[éèêàçùâîôûœ]|\b(le|la|les|des|du|une|est|pas|sur|avec|pour|dans|aucun|neige|pluie|givre|étape|bande|calcul|minuteur|tableau|décoll|valeur|heure|début|jour|nuit|fluide|eau)\b/;
const ALLOW = /Air Algérie|Algérie|MANEX A|CL-AH-DOA|Éd\./g;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.click('#splash'); await p.waitForTimeout(700);
  await p.click('#langBtn'); await p.waitForTimeout(200);
  const found = new Map();
  const scan = async (where) => {
    const txt = await p.evaluate(() => {
      const sec = document.querySelector('section.screen.on');
      return [document.querySelector('header').innerText, sec ? sec.innerText : '', document.querySelector('#tabbar').innerText].join('\n');
    });
    for (const line of txt.split('\n')) {
      const clean = line.replace(ALLOW, '');
      if (FRENCH.test(clean)) { const k = line.trim(); if (!found.has(k)) found.set(k, where); }
    }
    if (shots) await p.screenshot({ path: `${shots}/en-${where}.png`, fullPage: true });
  };
  await scan('home');
  // calculator: snow flow
  await p.click('#hNew'); await scan('calc-fluid');
  await p.click('[data-why="fluid"]'); await scan('calc-why');
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="±"]'); await p.click('[data-key="6"]'); await scan('calc-oat');
  await p.click('#oatOk'); await p.click('#coldWing'); await scan('calc-conc');
  await p.click('#coldWing');
  await p.click('[data-conc="100/0"]'); await scan('calc-cond');
  await p.click('[data-cond="FZDZ"]'); await scan('calc-sub');
  await p.click('[data-goto="cond"]').catch(()=>{});
  await p.evaluate(() => { location.hash = '#calc'; go('cond'); });
  await p.click('[data-cond="SNOW"]'); await p.fill('#visIn', '1600'); await scan('calc-snow-nodaynight');
  await p.click('[data-night="1"]'); await p.click('[data-metar="-SN"]'); await scan('calc-snow');
  await p.click('#snowOk'); await scan('result');
  await p.fill('#startIn', '99'); await p.click('#startBtn'); await scan('result-err');
  await p.fill('#startIn', await p.evaluate(() => utcNowHM())); await p.click('#startBtn'); await p.waitForTimeout(1200); await scan('timer');
  // no-HOT + frost + heavy snow
  for (const [fl, k, c] of [['II','2','FZRA_MH'],['IV','2','FROST'],['I','2','RA_COLDSOAK']]) {
    await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
    await p.click(`[data-fluid="${fl}"]`); await p.click(`[data-key="${k}"]`); await p.click('#oatOk');
    if (fl !== 'I') await p.click('[data-conc="100/0"]');
    await p.click(`[data-cond="${c}"]`); await scan('result-' + c);
  }
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="±"]'); await p.click('[data-key="5"]'); await p.click('#oatOk');
  await p.click('[data-conc="100/0"]'); await p.click('[data-cond="SNOW"]'); await p.click('[data-vis="400"]'); await p.click('[data-night="0"]'); await p.click('#snowOk'); await scan('result-heavy');
  for (const s of ['home', 'learn', 'proc', 'decode', 'quiz', 'yul', 'about']) {
    await p.evaluate(s => location.hash = '#' + s, s); await p.waitForTimeout(150);
    if (s === 'decode') { await p.fill('#decIn', 'Type I/IV/75 1432'); }
    if (s === 'proc') { await p.click('#listenBtn'); }
    if (s === 'quiz') { await p.click('[data-o="0"]'); }
    await scan(s);
  }
  await p.evaluate(() => { stopTimer(); location.hash = '#timer'; }); await scan('timer-empty');
  await p.click('#mGo'); await scan('timer-manual-err');
  // alarm text
  const alarm = await p.evaluate(() => document.querySelector('#alarm').innerText);
  for (const line of alarm.split('\n')) if (FRENCH.test(line.replace(ALLOW,''))) found.set(line.trim(), 'alarm');
  // back to French works
  await p.click('#langBtn'); await p.evaluate(() => location.hash = '#home'); await p.waitForTimeout(200);
  const fr = await p.evaluate(() => document.querySelector('#hGreet').textContent);
  console.log('Retour FR :', fr);
  console.log(found.size ? 'TEXTE FRANÇAIS RESTANT EN MODE EN :' : 'Aucun texte français en mode EN.');
  for (const [k, v] of found) console.log(`  [${v}] ${k}`);
  console.log(errs.length ? 'ERREURS JS : ' + errs.join(' | ') : 'Aucune erreur JS.');
  await b.close();
  process.exit(found.size || errs.length ? 1 : 0);
})();
