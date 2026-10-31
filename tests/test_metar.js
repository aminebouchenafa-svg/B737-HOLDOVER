// Tests du lecteur de METAR et du calcul jour / nuit. Usage : node tests/test_metar.js
const { chromium } = require('playwright');
const path = require('path');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const CASES = [
  ['LFPG 150630Z 00000KT 0300 R27L/0450N FZFG VV001 M03/M04 Q1027', { oat: -3, vis: 300, cond: 'FZFG' }],
  ['LOWW 150550Z 31008KT 1400 -SN OVC008 M04/M05 Q1012', { oat: -4, vis: 1400, cond: 'SNOW', mi: '-SN' }],
  ['CYUL 160200Z 15011G17KT 1SM -SN DRSN OVC009 M06/M08 A2948', { oat: -6, vis: 1609, cond: 'SNOW', mi: '-SN' }],
  ['CYUL 161200Z 04010KT 3/4SM -FZRA BR OVC006 M01/M02 A2990', { oat: -1, vis: 1207, cond: 'FZRA_L' }],
  ['CYUL 161200Z 04010KT 1/2SM +FZRA OVC004 M01/M02 A2990', { cond: 'FZRA_MH', vis: 805 }],
  ['LFPG 150700Z 18005KT 2000 -RASN BR OVC005 01/00 Q1005', { oat: 1, cond: 'SNRA' }],
  ['LFPG 150700Z 00000KT 4000 BR NSC M01/M02 Q1025', { cond: 'FZFG', note: true }],
  ['METAR LFPG 310000Z 05009KT CAVOK 08/06 Q1028 NOSIG', { oat: 8, vis: 9999, cond: null, icao: 'LFPG' }],
  ['CYYZ 151200Z 27015KT 1 1/2SM SN BKN010 M10/M12 A2990', { vis: 2414, cond: 'SNOW', mi: 'SN' }],
  ['LOWW 150550Z 31008KT 0800 +SN FG VV002 M02/M03 Q1010', { cond: 'SNOW', mi: '+SN' }],
  ['LOWW 150550Z 31008KT 3000 -SN FZFG M05/M06 Q1010', { cond: 'SN_FZFG' }],
  ['EDDF 150550Z 31008KT 2500 -PL OVC010 M01/M02 Q1010', { cond: 'OTHER' }],
  ['EDDF 150550Z 31008KT 3000 FZDZ OVC003 M01/M01 Q1010', { cond: 'FZDZ' }],
  ['EDDF 150550Z 31008KT 9999 FEW020 M00/M03 Q1020 TEMPO 2000 SN', { oat: 0, cond: null }],
  ['UUEE 150550Z 31008KT 9999NDV -SHSN M12/M15 Q1020', { vis: 9999, cond: 'SNOW', mi: '-SN' }],
  ['LFPG 150700Z 21012KT 6000 -RA BKN008 04/03 Q1002', { cond: null, note: true }],
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  for (const [raw, exp] of CASES) {
    const r = await p.evaluate(raw => { const M = parseMetar(raw); const c = metarCond(M); return { oat: M.oat, vis: M.vis===null?null:Math.min(M.vis,9999), icao: M.icao, cond: c.cond, mi: c.metarInt, note: !!c.note }; }, raw);
    const bad = Object.entries(exp).filter(([k, v]) => r[k] !== v && !(k==='oat' && Object.is(Math.abs(r[k]),Math.abs(v)) && v===0));
    ok(!bad.length, raw + (bad.length ? '  → ' + JSON.stringify(r) : ''));
  }
  // Jour / nuit (soleil sous l'horizon = nuit)
  const dn = await p.evaluate(() => ({
    pgNoon: sunElev(49.01, 2.53, Date.UTC(2026,9,31,11,50)), pgMid: isNight('LFPG', Date.UTC(2026,9,31,0,0)),
    pgDay: isNight('LFPG', Date.UTC(2026,9,31,12,0)), yulEve: isNight('CYUL', Date.UTC(2026,9,31,23,30)),
    yulDay: isNight('CYUL', Date.UTC(2026,9,31,17,0)), unknown: isNight('ZZZZ', Date.now()),
    pgSunrise: (()=>{ for (let m=4*60; m<10*60; m++){ if (sunElev(49.01,2.53,Date.UTC(2026,9,31,0,m)) > -0.833) return m; } })() }));
  ok(Math.abs(dn.pgNoon - 26.5) < 1.5, `Hauteur du soleil à CDG à midi le 31/10 ≈ 26° (${dn.pgNoon.toFixed(1)}°)`);
  ok(dn.pgMid === true && dn.pgDay === false && dn.yulEve === true && dn.yulDay === false && dn.unknown === null, 'Jour / nuit : CDG minuit nuit, midi jour ; YUL 23:30Z nuit, 17:00Z jour ; aéroport inconnu → à choisir');
  ok(dn.pgSunrise >= 6*60+30 && dn.pgSunrise <= 6*60+42, `Lever du soleil à CDG le 31/10 ≈ 06:36 UTC (calcul à la main : midi solaire 11:33, demi-jour 4 h 57) (${Math.floor(dn.pgSunrise/60)}:${String(dn.pgSunrise%60).padStart(2,'0')})`);
  await b.close(); console.log(fail ? `\n${fail} échec(s)` : '\nTous les tests METAR passent'); process.exit(fail ? 1 : 0);
})();
