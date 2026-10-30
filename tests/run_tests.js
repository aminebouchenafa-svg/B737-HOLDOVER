// Tests du cahier des charges §6 + parcours UI. Usage : node tests/run_tests.js [dossier_captures]
const { chromium, devices } = require('playwright');
const path = require('path');
const url = 'file://' + path.join(__dirname, '..', 'index.html');
const shots = process.argv[2];
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url);
  if (shots) { await p.waitForTimeout(2200); await p.screenshot({ path: shots + '/01-splash.png' }); }

  // ---- Moteur ----
  const E = await p.evaluate(() => {
    const c = (fluid, conc, oat, key) => computeHOT({ fluid, conc, oat, key });
    return {
      t1: c('IV', '100/0', -5, 'FZFG'),
      t2: c('I', null, -2, 'SN_L'),
      t3a: c('II', '75/25', -12, 'FZRA_L'),
      t3b: c('II', '75/25', -10, 'FZRA_L'),
      t4: snowIntensity(1600, true, -6).intensity,
      t5: concRefusal('50/50', -5, false),
      t6: c('IV', '100/0', -12, 'FROST'),
      x1: c('IV', '100/0', 0, 'SN_RA_M'), x2: c('II', '100/0', 2, 'RA_COLDSOAK'),
      x3: c('I', null, -12, 'FZDZ'), x4: c('I', null, -30, 'FROST'),
      x5: c('IV', '100/0', -3, 'FZFG'), x6: c('IV', '100/0', -3.5, 'FZFG'),
      x7: c('IV', '75/25', -14, 'SN_M'), x8: c('IV', '100/0', -26, 'FROST'),
      x9: concRefusal('75/25', -15, false), x10: concRefusal('50/50', -3, true), x11: concRefusal('50/50', -3, false),
      q2: c('IV', '100/0', -6, INT_COL[snowIntensity(1600, true, -6).intensity]),
      n1: c('IV', '100/0', -10, 'FZRA_L'), n2: c('IV', '100/0', -16, 'FZFG'),
      n3: snowIntensity(4000, true, -5).intensity, n4: snowIntensity(4800, true, 0).intensity, n5: snowIntensity(4800, true, -5).intensity,
      f1: (()=>{ const n=new Date(); const fut=new Date(n.getTime()+40*60e3); const hm=String(fut.getUTCHours()).padStart(2,'0')+':'+String(fut.getUTCMinutes()).padStart(2,'0'); return startDate(hm); })(),
      f2: (()=>{ const n=new Date(); const p=new Date(n.getTime()-20*60e3); const hm=String(p.getUTCHours()).padStart(2,'0')+':'+String(p.getUTCMinutes()).padStart(2,'0'); return Math.round((Date.now()-startDate(hm))/60e3); })(),
      st1: (()=>{ localStorage.setItem('x.t','"oops"'); const a=store.get('x.t',[]); localStorage.setItem('x.t','null'); const b=store.get('x.t',{}); localStorage.setItem('x.t','{bad'); const c=store.get('x.t',5); return Array.isArray(a)&&typeof b==='object'&&b!==null&&c===5; })(),
      d4: decodeCode('2-step Type IV/75 at 1432'), d5: decodeCode('Type I/IV/75 1432'), d6: decodeCode('(Type II/75/ at 1650).'), d7: decodeCode('IV75 1432Z.'),
      h1: [parseHotMin('25'), parseHotMin('025'), parseHotMin('0:25'), parseHotMin('0h25'), parseHotMin('1:05'), parseHotMin('abc'), parseHotMin('0')],
      d1: decodeCode('Type IV/75 1432'), d2: decodeCode('de-icing complete Type II/75 at 1650'), d3: decodeCode('TYPE I 06:40Z'),
    };
  });
  ok(E.t1.ok && E.t1.hot === '0:15' && E.t1.range.max === '0:35' && E.t1.tableId === 't20', 'Type IV 100/0, -5 °C, FZFG → 0:15 (0:15-0:35, Tableau 20)');
  ok(E.t2.ok && E.t2.hot === '0:11' && E.t2.tableId === 't2', 'Type I, -2 °C, neige faible → 0:11 (Tableau 2)');
  ok(!E.t3a.ok, 'Type II 75/25, -12 °C, FZRA_L → aucun HOT');
  ok(E.t3b.ok && E.t3b.hot === '0:09', 'Type II 75/25, -10 °C, FZRA_L → 0:09');
  ok(E.t4 === 'Moderate', 'Neige 1600 m, nuit, -6 °C → MODÉRÉE');
  ok(!!E.t5, 'Type IV 50/50 à -5 °C → refusé (Tableau 55)');
  ok(E.t6.ok && E.t6.hot === '6:00', 'Givre actif, Type IV 100/0, -12 °C → 6:00');
  ok(!E.x1.ok, 'SN_RA_M à 0 °C → aucun HOT');
  ok(E.x2.ok && E.x2.hot === '0:07', 'RA_COLDSOAK Type II 100/0 à +2 °C → 0:07');
  ok(!E.x3.ok, 'Type I FZDZ sous -10 °C → case vide');
  ok(E.x4.ok && E.x4.hot === '0:45', 'Givre actif Type I → 0:45 (aluminium)');
  ok(E.x5.hot === '1:15' && E.x6.hot === '0:15', 'Borne -3 °C : -3 → bande haute, -3.5 → bande suivante');
  ok(E.x7.ok && E.x7.hot === '0:25', 'Type IV 75/25 -14 °C SN_M → 0:25 (borne incluse)');
  ok(!E.x8.ok, 'Givre actif sous -25 °C → aucun HOT');
  ok(!!E.x9 && !!E.x10 && !E.x11, 'Tableau 55 : 75/25 refusé à -15, 50/50 refusé aile froide, 50/50 OK à -3');
  ok(E.q2.hot === '0:25', 'Quiz Q2 : Type IV 100/0 -6 °C neige modérée → 0:25');
  ok(E.n1.hot === '0:15' && E.n1.range.max === '0:25', 'Winter 2026-27 : Type IV 100/0 -10 °C -FZRA → 0:15 (Tableau 20)');
  ok(E.n2.hot === '0:15' && E.n2.range.max === '0:25', 'Winter 2026-27 : Type IV 100/0 -16 °C FZFG → 0:15–0:25');
  ok(E.n3 === 'Light' && E.n4 === 'Light' && E.n5 === 'Very Light', 'Winter 2026-27 : Tableau 53 nuit 4000 m → faible ; 4800 m > -1 °C → faible');
  ok(E.f1 === null, 'Minuteur : heure de début > 5 min dans le futur refusée');
  ok(E.f2 >= 19 && E.f2 <= 21, 'Minuteur : heure de début passée acceptée (y compris autour de minuit)');
  ok(E.st1, 'Mémoire : valeurs corrompues ignorées sans planter');
  ok(E.d4.fluid==='IV' && E.d4.conc==='75/25' && E.d4.time==='14:32', 'Décodeur « 2-step Type IV/75 at 1432 »');
  ok(E.d5.fluid==='IV' && E.d5.multi && E.d5.conc==='75/25', 'Décodeur « Type I/IV/75 1432 » → 2e étape Type IV + alerte');
  ok(E.d6.fluid==='II' && E.d6.time==='16:50', 'Décodeur avec parenthèses et point final');
  ok(E.d7.fluid==='IV' && E.d7.conc==='75/25' && E.d7.time==='14:32', 'Décodeur « IV75 1432Z. »');
  ok(JSON.stringify(E.h1)==='[25,25,25,25,65,null,null]', 'Minuteur manuel : 25 / 025 / 0:25 / 0h25 / 1:05 acceptés');
  ok(E.d1.fluid === 'IV' && E.d1.conc === '75/25' && E.d1.time === '14:32', 'Décodeur « Type IV/75 1432 »');
  ok(E.d2.fluid === 'II' && E.d2.conc === '75/25' && E.d2.time === '16:50', 'Décodeur « Type II/75 at 1650 »');
  ok(E.d3.fluid === 'I' && E.d3.time === '06:40', 'Décodeur « TYPE I 06:40Z »');

  // ---- Parcours UI : neige 1600 m nuit -6 °C, Type IV 100/0 ----
  await p.click('#splash').catch(() => {});
  await p.waitForTimeout(800);
  // ---- Accès : utilisateur / mot de passe ----
  const crypto = require('crypto');
  const shaOk = await p.evaluate(() => [sha256(''), sha256('abc'), sha256('héllo ✈')]);
  const nodeSha = ['', 'abc', 'héllo ✈'].map(x => crypto.createHash('sha256').update(x, 'utf8').digest('hex'));
  ok(JSON.stringify(shaOk) === JSON.stringify(nodeSha), 'SHA-256 de l\'app identique à celui de Node');
  ok(await p.isVisible('#gate'), 'Écran de connexion affiché au premier lancement');
  await p.fill('#gUser', 'B737AH'); await p.fill('#gPass', 'mauvais'); await p.click('#gateForm button[type=submit]');
  ok((await p.textContent('#gErr')).includes('incorrect') && await p.isVisible('#gate'), 'Mauvais mot de passe refusé');
  // Le vrai mot de passe n'est jamais écrit dans le dépôt : variables HOT_USER / HOT_PASS (facultatives).
  if (process.env.HOT_USER && process.env.HOT_PASS) {
    await p.fill('#gUser', ' ' + process.env.HOT_USER.toLowerCase() + ' '); await p.fill('#gPass', process.env.HOT_PASS); await p.click('#gateForm button[type=submit]');
    ok(!(await p.isVisible('#gate')), 'Bon identifiant accepté (utilisateur insensible à la casse)');
  } else {
    await p.evaluate(() => { store.set('hot.auth', AUTH_HASH); gateCheck(); });
    console.log('(info) HOT_USER / HOT_PASS absents : connexion simulée');
  }
  await p.reload(); await p.click('#splash').catch(() => {}); await p.waitForTimeout(700);
  ok(!(await p.isVisible('#gate')), 'Connexion mémorisée après rechargement');
  if (shots) await p.screenshot({ path: shots + '/02-home.png', fullPage: true });
  await p.click('a[href="#calc"]');
  await p.click('[data-fluid="IV"]');
  for (const k of ['±', '6']) await p.click(`[data-key="${k}"]`);
  ok((await p.textContent('.band')).includes('sous -3 à -8'), 'UI : bande OAT affichée');
  await p.click('#oatOk');
  ok(await p.$eval('[data-conc="50/50"]', e => e.classList.contains('dis')), 'UI : 50/50 grisé à -6 °C');
  if (shots) await p.screenshot({ path: shots + '/03-conc.png', fullPage: true });
  await p.click('[data-conc="100/0"]');
  if (shots) await p.screenshot({ path: shots + '/04-cond.png', fullPage: true });
  await p.click('[data-cond="SNOW"]');
  await p.fill('#visIn', '1600');
  await p.click('[data-night="1"]');
  await p.click('[data-metar="-SN"]');
  ok((await p.textContent('#snowOut')).includes('METAR dit -SN, mais le tableau dit MODÉRÉE : on retient MODÉRÉE'), 'UI : message METAR vs Tableau 53');
  if (shots) await p.screenshot({ path: shots + '/05-snow.png', fullPage: true });
  await p.click('#snowOk');
  ok((await p.textContent('.res .big')).trim() === '0:25', 'UI : résultat 0:25');
  ok((await p.textContent('.mxref')).includes('Tableau 20, page 35'), 'UI : référence Tableau 20, page 35');
  ok(await p.$eval('td.hx', e => e.textContent) === '0:25–0:45', 'UI : case surlignée 0:25–0:45');
  if (shots) await p.screenshot({ path: shots + '/06-result.png', fullPage: true });
  await p.click('#startBtn');
  await p.waitForTimeout(1200);
  if (shots) await p.screenshot({ path: shots + '/07-timer.png', fullPage: true });
  ok(/\d+:\d\d/.test(await p.textContent('#tt')), 'UI : minuteur actif');

  // ---- Aucun HOT : FZRA modérée ----
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="II"]'); await p.click('[data-key="2"]'); await p.click('#oatOk');
  await p.click('[data-conc="100/0"]'); await p.click('[data-cond="FZRA_MH"]');
  ok((await p.textContent('.res.none .big')).includes('AUCUN HOT'), 'UI : FZRA modérée → écran rouge AUCUN HOT');
  if (shots) await p.screenshot({ path: shots + '/08-none.png', fullPage: true });

  // ---- Neige + pluie via Tableau 53 ----
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="2"]'); await p.click('#oatOk');
  await p.click('[data-conc="100/0"]'); await p.click('[data-cond="SNRA"]');
  await p.fill('#visIn', '2800');
  ok(await p.$eval('#snowOk', b => b.disabled), 'UI : « Voir le HOT » bloqué tant que jour/nuit non choisi');
  await p.click('[data-night="0"]');
  await p.click('#snowOk');
  ok((await p.textContent('.res .big')).trim() === '0:15', 'UI : neige faible + pluie à +2 °C → colonne -FZRA (0:15)');
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="2"]'); await p.click('#oatOk');
  await p.click('[data-conc="100/0"]'); await p.click('[data-cond="SNRA"]');
  await p.click('[data-vis="1200"]'); await p.click('[data-night="0"]'); await p.click('#snowOk');
  ok((await p.textContent('.res .big')).trim() === '0:06', 'UI : neige modérée + pluie à +2 °C → 0:06');
  // ---- Historique : rouvrir un calcul ----
  await p.evaluate(() => location.hash = '#home'); await p.waitForTimeout(200);
  await p.click('[data-h="0"]'); await p.waitForTimeout(200);
  ok((await p.textContent('.res .big')).trim() === '0:06', 'UI : historique → rouvre le dernier résultat');

  // ---- Guide : exemple guidé (on touche toujours le bouton en surbrillance) ----
  await p.evaluate(() => { stopTimer(); location.hash = '#guide'; }); await p.waitForTimeout(200);
  await p.click('#gTry'); await p.waitForTimeout(200);
  for (let i = 0; i < 8 && !(await p.$('#coachEnd')); i++) { await p.click('.coach-target'); await p.waitForTimeout(120); }
  ok((await p.textContent('.res .big')).trim() === '1:15', 'Guide : exemple CDG FZFG −3 °C Type IV 100/0 → 1:15');
  ok(!(await p.evaluate(() => store.get('hot.hist', []).some(e => e.s && e.s.cond==='FZFG' && e.s.oatStr==='-3'))), "Guide : l'exemple n'est pas ajouté aux derniers calculs");
  await p.click('#coachEnd'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => location.hash === '#home' && !COACH), 'Guide : « Terminer » revient à l\'accueil');
  // ---- Alarme iOS : lien Raccourcis avec les minutes restantes (arrondi vers le bas) ----
  const sc = await p.evaluate(() => { startTimer(hmUTC(Date.now()), 25, 45, 'x', ''); let u=''; const rem=T.start+T.minM*60e3-Date.now(); u = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT)}&input=text&text=${Math.floor(rem/60e3)}`; stopTimer(); return u; });
  ok(/^shortcuts:\/\/run-shortcut\?name=HOT%20737&input=text&text=2[45]$/.test(sc), 'Alarme iOS : lien Raccourcis correct (' + sc + ')');

  // ---- Heure de début dans le futur : message clair sur la page ----
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="2"]'); await p.click('#oatOk'); await p.click('[data-conc="100/0"]'); await p.click('[data-cond="FZFG"]');
  const fut = await p.evaluate(() => { const d=new Date(Date.now()+7*3600e3); return String(d.getUTCHours()).padStart(2,'0')+String(d.getUTCMinutes()).padStart(2,'0'); });
  await p.fill('#startIn', fut); await p.click('#startBtn');
  ok((await p.textContent('#startErr')).includes("n'est pas encore passé"), 'Heure future : message clair affiché sous le champ');
  await p.click('[data-now="startIn"]');
  ok(await p.$eval('#startIn', e => e.value) === await p.evaluate(() => utcNowHM()), 'Bouton « Maintenant » remplit l\'heure UTC actuelle');
  await p.click('#startBtn'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => location.hash === '#timer' && !!T), 'Minuteur lancé avec « Maintenant »');
  await p.evaluate(() => stopTimer());

  // ---- Autres écrans ----
  for (const s of ['learn', 'proc', 'decode', 'quiz', 'yul', 'about']) {
    await p.evaluate(s => location.hash = '#' + s, s); await p.waitForTimeout(150);
    if (s === 'decode') { await p.fill('#decIn', 'Type IV/75 1432'); ok((await p.textContent('#decOut')).includes('HOT démarré à 14:32'), 'UI : décodeur'); }
    if (s === 'proc') { await p.click('#listenBtn'); await p.waitForTimeout(1500); }
    if (s === 'quiz') { await p.click('[data-o="1"]'); }
    if (shots) await p.screenshot({ path: `${shots}/10-${s}.png`, fullPage: true });
  }
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(!overflow, 'Pas de défilement horizontal de la page');
  ok(errs.length === 0, 'Aucune erreur JS ' + errs.join(' | '));
  await b.close();
  console.log(fail ? `\n${fail} échec(s)` : '\nTous les tests passent');
  process.exit(fail ? 1 : 0);
})();
