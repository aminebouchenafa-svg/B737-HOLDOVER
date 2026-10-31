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
    const c2 = o => { const r = computeHOT(o); delete r.tbl; return r; };
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
      b1: c2({fluid:'IV', conc:'100/0', oat:-3, key:'FZFG', brand:'37'}), b1g: c('IV','100/0',-3,'FZFG'),
      b2: c2({fluid:'IV', conc:'100/0', oat:-24, key:'FZFG', brand:'25'}),
      b3: c2({fluid:'II', conc:'100/0', oat:-5, key:'SN_M', brand:'10'}),
      b4: c2({fluid:'IV', conc:'100/0', oat:-12, key:'FZRA_L', brand:'37'}),
      b5: c2({fluid:'II', conc:'100/0', oat:-5, key:'SN_M', brand:'37'}),
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
  ok(E.b1.ok && E.b1.hot === '2:05' && E.b1.tableId === 'b37' && E.b1g.hot === '1:15', 'Marque : DOW EG106 (T37) Type IV 100/0 −3 °C FZFG → 2:05 (générique 1:15)');
  ok(!E.b2.ok && /LOUT/.test(E.b2.reason), 'Marque : OAT sous la dernière bande (T25, −24 °C) → aucun HOT (LOUT)');
  ok(E.b3.ok && E.b3.key === 'SN' && E.b3.tableId === 'b10', 'Marque à colonne neige unique (T10) : neige modérée → colonne SN');
  ok(!E.b4.ok, 'Marque : -FZRA sous −10 °C → aucun HOT (note 10)');
  ok(E.b5.tableId === 't4', 'Marque Type IV ignorée si le fluide est du Type II');
  ok(E.d1.fluid === 'IV' && E.d1.conc === '75/25' && E.d1.time === '14:32', 'Décodeur « Type IV/75 1432 »');
  ok(E.d2.fluid === 'II' && E.d2.conc === '75/25' && E.d2.time === '16:50', 'Décodeur « Type II/75 at 1650 »');
  ok(E.d3.fluid === 'I' && E.d3.time === '06:40', 'Décodeur « TYPE I 06:40Z »');

  // ---- Parcours UI : neige 1600 m nuit -6 °C, Type IV 100/0 ----
  // ---- Accès : l'écran « Winter is Coming » reste jusqu'à « Continuer », identifiant en bas ----
  const crypto = require('crypto');
  const shaOk = await p.evaluate(() => [sha256(''), sha256('abc'), sha256('héllo ✈')]);
  const nodeSha = ['', 'abc', 'héllo ✈'].map(x => crypto.createHash('sha256').update(x, 'utf8').digest('hex'));
  ok(JSON.stringify(shaOk) === JSON.stringify(nodeSha), 'SHA-256 de l\'app identique à celui de Node');
  await p.waitForTimeout(3800);
  ok(await p.isVisible('#splash'), "Écran d'ouverture toujours affiché après 4 s sans action");
  ok(await p.isVisible('#gUser') && await p.isVisible('#gPass') && await p.isVisible('#spGo'), "Identifiant et « Continuer » en bas de l'écran d'ouverture");
  await p.click('.sp-inner'); await p.waitForTimeout(300);
  ok(await p.isVisible('#splash'), "Toucher l'écran ne le ferme pas");
  await p.fill('#gUser', 'B737AH'); await p.fill('#gPass', 'mauvais'); await p.click('#spGo');
  ok((await p.textContent('#gErr')).includes('incorrect') && await p.isVisible('#splash'), 'Mauvais mot de passe refusé');
  // Le vrai mot de passe n'est jamais écrit dans le dépôt : variables HOT_USER / HOT_PASS (facultatives).
  if (process.env.HOT_USER && process.env.HOT_PASS) {
    await p.fill('#gUser', ' ' + process.env.HOT_USER.toLowerCase() + ' '); await p.fill('#gPass', process.env.HOT_PASS); await p.click('#spGo');
    await p.waitForTimeout(800);
    ok(!(await p.$('#splash')), 'Bon identifiant accepté → entrée dans l\'app');
  } else {
    await p.evaluate(() => { store.set('hot.auth', AUTH_HASH); gateCheck(); }); await p.click('#spGo'); await p.waitForTimeout(800);
    console.log('(info) HOT_USER / HOT_PASS absents : connexion simulée');
  }
  await p.reload(); await p.waitForTimeout(1800);
  ok(!(await p.isVisible('#gUser')) && await p.isVisible('#spGo'), 'Connecté : seulement « Continuer » en bas');
  await p.click('#spGo'); await p.waitForTimeout(800);
  ok(!(await p.$('#splash')), '« Continuer » ouvre l\'app');
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

  // ---- Procédure : choix NG / MAX ----
  await p.evaluate(() => { location.hash = '#proc'; }); await p.waitForTimeout(200);
  await p.click('[data-fleet="ng"]');
  let txt = await p.textContent('#procBody');
  ok(txt.includes('70 % N1') && !txt.includes('≥ 31 °C') && txt.includes('FCOM NG SP.16'), 'Procédure NG : run-up 70 % N1, pas de contrôle huile MAX');
  await p.click('[data-fleet="max"]');
  txt = await p.textContent('#procBody');
  ok(txt.includes('≥ 50 % N1') && txt.includes('≥ 31 °C') && !txt.includes('70 % N1') && txt.includes('FCOM MAX SP.16'), 'Procédure MAX : run-up 50 % N1 et huile ≥ 31 °C');
  ok(await p.evaluate(() => store.get('hot.fleet','') === 'max'), 'Choix MAX mémorisé');
  await p.click('[data-fleet="ng"]');

  // ---- METAR collé → calcul pré-rempli ----
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.fill('#metIn', 'LFPG 150630Z 00000KT 0300 R27L/0450N FZFG VV001 M03/M04 Q1027'); await p.click('#metGo'); await p.waitForTimeout(150);
  ok((await p.textContent('#metOut')).includes('-3 °C') && (await p.textContent('#metOut')).includes('300 m'), 'METAR collé : OAT et visibilité pré-remplies');
  await p.click('[data-fluid="IV"]');
  ok((await p.textContent('.oatdisp')).includes('-3'), 'METAR : OAT −3 déjà saisie');
  await p.click('#oatOk'); await p.click('[data-conc="100/0"]');
  ok(await p.$eval('[data-cond="FZFG"]', e => e.classList.contains('sel')), 'METAR : FZFG présélectionné');
  await p.click('[data-cond="FZFG"]');
  ok((await p.textContent('.res .big')).trim() === '1:15', 'METAR : résultat 1:15 (Type IV 100/0, −3 °C, FZFG)');

  // ---- Marque du fluide dans l'interface ----
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="±"]'); await p.click('[data-key="3"]'); await p.click('#oatOk');
  await p.selectOption('#brandSel', '37'); await p.waitForTimeout(100);
  await p.click('[data-conc="100/0"]'); await p.click('[data-cond="FZFG"]');
  ok((await p.textContent('.res .big')).trim() === '2:05' && (await p.textContent('.mxref')).includes('Tableau 37, page 52'), 'UI marque : DOW EG106 → 2:05, Tableau 37 page 52');
  ok((await p.textContent('#calcBody')).includes('Table générique : 1:15'), 'UI marque : HOT générique affiché pour comparaison');
  await p.evaluate(() => { location.hash = '#calc'; resetCalc(); });
  await p.click('[data-fluid="IV"]'); await p.click('[data-key="±"]'); await p.click('[data-key="3"]'); await p.click('#oatOk');
  await p.selectOption('#brandSel', '21'); await p.waitForTimeout(100);
  ok(await p.$eval('[data-conc="75/25"]', e => e.classList.contains('dis')) && !(await p.$eval('[data-conc="100/0"]', e => e.classList.contains('dis'))), 'UI marque : 75/25 grisé quand la table de marque ne le prévoit pas (T21)');

  // ---- Escales (OM C) ----
  await p.evaluate(() => { location.hash = '#stations'; }); await p.waitForTimeout(200);
  ok((await p.$$('.card.st')).length === 51, 'Escales : 51 escales listées');
  await p.fill('#stSearch', 'vienna'); await p.waitForTimeout(100);
  let stTxt = await p.textContent('#stList');
  ok((await p.$$('.card.st')).length === 1 && stTxt.includes('CELEBI') && stTxt.includes('131.675'), 'Escales : recherche « vienna » → LOWW, CELEBI 131.675');
  await p.fill('#stSearch', 'LFPG'); await p.waitForTimeout(100);
  ok((await p.textContent('#stList')).includes('ALYZIA') && (await p.textContent('#stList')).includes('131.915'), 'Escales : LFPG → ALYZIA 131.915');
  await p.click('[data-stmetar="LFPG"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => location.hash === '#calc' && document.getElementById('metIn').value === 'LFPG'), 'Escales : bouton METAR ouvre le calculateur avec LFPG');
  await p.fill('#stSearch', '').catch(()=>{}); await p.evaluate(() => { stQuery=''; });

  // ---- Corrections grand froid (FCOM SP.16) ----
  const CC = await p.evaluate(() => ({
    a: coldCorr(-20, 1000, 'ft'), b: coldCorr(-15, 1000, 'ft'), c: coldCorr(-10, 250, 'ft'), d: coldCorr(-10, 6000, 'ft'),
    e: coldCorr(5, 1000, 'ft'), f: coldCorr(-55, 1000, 'ft'), g: coldCorr(-30, 300, 'm'), h: coldCorr(0, 2000, 'ft'), i: coldCorr(-40, 120, 'ft') }));
  ok(CC.a.corr === 140, 'Grand froid : −20 °C, hauteur 1000 ft → +140 ft');
  ok(CC.b.corr === 140, 'Grand froid : −15 °C → ligne −20 °C (prudent) → +140 ft');
  ok(CC.c.corr === 30, 'Grand froid : hauteur 250 ft → colonne 300 ft (prudent) → +30 ft à −10 °C');
  ok(CC.d.corr === 580, 'Grand froid : 6000 ft à −10 °C → 2 × 290 = +580 ft (extrapolation FCOM)');
  ok(CC.e.none && CC.f.out, 'Grand froid : > 0 °C pas de correction ; < −50 °C hors tableau');
  ok(CC.g.corr === 60 && CC.h.corr === 120 && CC.i.corr === 50, 'Grand froid : mètres −30 °C 300 m → +60 m ; 0 °C 2000 ft → +120 ; 120 ft → colonne 200');
  await p.evaluate(() => { localStorage.removeItem('hot.ca'); location.hash = '#coldalt'; });
  await p.waitForTimeout(150);
  await p.fill('#caTemp', '-20'); await p.fill('#caElev', '400'); await p.fill('[data-cav="1"]', '1400'); await p.waitForTimeout(100);
  const caTxt = await p.textContent('#caOut');
  ok(caTxt.includes('1540') && caTxt.includes('1600'), 'UI grand froid : DA 1400 ft, élévation 400 ft, −20 °C → 1540 ft, MCP 1600');
  // ---- Anti-givrage & run-ups ----
  await p.evaluate(() => { localStorage.removeItem('hot.ai'); Object.assign(AI,{oat:'',moist:false,contam:false,severe:false,src:null}); FLEET='ng'; location.hash = '#antiice'; });
  await p.waitForTimeout(150);
  await p.fill('#aiMet', 'LFPG 150630Z 00000KT 0300 FZFG VV001 M03/M04 Q1027'); await p.click('#aiMetGo'); await p.waitForTimeout(150);
  let aiTxt = await p.textContent('#aiBody');
  ok(aiTxt.includes('CONDITIONS GIVRANTES') && aiTxt.includes('toutes les 10 min'), 'Anti-givrage : FZFG −3 °C NG → conditions givrantes, run-up 1 s toutes les 10 min');
  await p.click('[data-aifleet="max"]'); aiTxt = await p.textContent('#aiBody');
  ok(aiTxt.includes('60 min') && aiTxt.includes('50 % N1'), 'Anti-givrage : MAX → 50 % N1 toutes les 60 min');
  await p.click('#ruStart'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => RU && RU.int === 60) && (await p.textContent('#ruT')).match(/\d/), 'Rappel run-up MAX démarré (60 min)');
  await p.evaluate(() => { RU.start = Date.now() - 61*60e3; RU.alerted=false; }); await p.waitForTimeout(1300);
  ok(await p.isVisible('#ruAlarm'), 'Rappel run-up : alerte à l\'échéance');
  await p.click('#ruAlarmOk'); await p.waitForTimeout(150);
  ok(!(await p.isVisible('#ruAlarm')) && await p.evaluate(() => Date.now() - RU.start < 5000), '« Run-up effectué » relance l\'intervalle');
  await p.click('#ruStop'); await p.click('[data-aifleet="ng"]');
  await p.fill('#aiMet', 'LFPG 150700Z 21012KT 6000 -RA BKN008 04/03 Q1002'); await p.click('#aiMetGo'); await p.waitForTimeout(150);
  aiTxt = await p.textContent('#aiBody');
  ok(aiTxt.includes('CONDITIONS GIVRANTES') && !aiTxt.includes('Run-ups moteur'), 'Anti-givrage : −RA +4 °C → conditions givrantes, pas de run-up (OAT > 3 °C)');
  await p.fill('#aiOat', '12'); await p.dispatchEvent('#aiOat', 'change'); await p.waitForTimeout(100);
  ok((await p.textContent('#aiBody')).includes('ne pas utiliser'), 'Anti-givrage : OAT 12 °C → ne pas utiliser l\'anti-givrage');

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
