/* Il cielo condiviso: luogo, data, ora e altezza dell'occhio, letti da tutte le scene.
   Le posizioni si calcolano (Astronomy Engine e Bright Star Catalogue), non si disegnano a mano.
   Le correzioni delle altezze vengono dalle tavole delle Effemeridi nautiche IIM. Regole in design.md */
window.Cielo = (function () {
  const A = window.Astronomy;
  const RAD = Math.PI / 180;
  const CHIAVE = 'libroAstro.cielo';

  // Costanti fisiche per semidiametro e parallasse (raggi nominali IAU, km)
  const R_SOLE = 695700; const R_LUNA = 1737.4; const R_TERRA = 6378.137; const KM_AU = 149597870.7;

  const LUOGHI = {
    procida: { nome: 'al largo di Procida', lat: 40 + 45 / 60, lon: 13 + 55 / 60 },
    equatore: { nome: 'all\'equatore', lat: 0, lon: 13 + 55 / 60 },
    polo: { nome: 'al Polo Nord', lat: 89.99, lon: 0 },
  };

  /* Stato ------------------------------------------------------------------- */
  const stato = { lat: LUOGHI.procida.lat, lon: LUOGHI.procida.lon, luogo: 'procida', data: Date.now(), occhio: 15, velocita: 1, corre: true };
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    // Luogo e occhio restano; all'apertura il cielo è quello di adesso
    if (s && typeof s === 'object') Object.assign(stato, { lat: s.lat, lon: s.lon, luogo: s.luogo, occhio: s.occhio });
  } catch (e) { /* il browser non salva: si resta in memoria */ }
  const ascoltatori = [];
  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { /* vedi sopra */ }
  }
  function avvisa(cosa) { ascoltatori.forEach((f) => f(cosa)); }
  function imposta(mod) {
    Object.assign(stato, mod);
    if (mod.lat !== undefined || mod.lon !== undefined) stato.lat = Math.max(-89.99, Math.min(89.99, stato.lat));
    if (stato.lon > 180) stato.lon -= 360; if (stato.lon <= -180) stato.lon += 360;
    salva(); avvisa(mod);
  }
  function ascolta(f) { ascoltatori.push(f); }

  // Il tempo scorre una sola volta per fotogramma, anche se più scene lo chiedono
  let ultimo = 0;
  function scorri() {
    const ora = performance.now();
    const dt = ultimo ? Math.min(0.25, (ora - ultimo) / 1000) : 0;
    ultimo = ora;
    if (!stato.corre || !dt) return false;
    stato.data += dt * 1000 * stato.velocita;
    avvisa({ tempo: true });
    return true;
  }

  /* Calcolo ------------------------------------------------------------------ */
  const tempo = (ms) => A.MakeTime(new Date(ms === undefined ? stato.data : ms));
  const norm = (g) => ((g % 360) + 360) % 360;

  // Tempo siderale apparente di Greenwich in gradi: è il Tγ delle effemeridi
  function tGamma(t) { return norm(A.SiderealTime(t) * 15); }

  // Da vettore J2000 a coordinate dell'equatore vero della data
  const daJ2000 = (t, v) => A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(t), v));

  const NOMI_CORPI = { Sole: 'Sun', Luna: 'Moon', Venere: 'Venus', Marte: 'Mars', Giove: 'Jupiter', Saturno: 'Saturn' };

  /* Coordinate geocentriche, come nelle pagine giornaliere delle effemeridi:
     T (angolo orario di Greenwich), declinazione, 360° − α, distanza in km */
  function corpo(nome, t) {
    t = t || tempo();
    const eq = daJ2000(t, A.GeoVector(NOMI_CORPI[nome], t, true));
    const ra = eq.ra * 15;
    return { nome, T: norm(tGamma(t) - ra), dec: eq.dec, sha: norm(360 - ra), ra, km: eq.dist * KM_AU };
  }

  // Stelle del catalogo: moto proprio dal 2000, poi precessione e nutazione fino alla data
  const ST = window.STELLE.stelle;
  const perHR = {}; ST.forEach((s, i) => { perHR[s[0]] = i; });
  const nomiStelle = window.STELLE.nomi;
  const hrDi = {}; Object.keys(nomiStelle).forEach((hr) => { hrDi[nomiStelle[hr]] = Number(hr); });
  function vettoreJ2000(s, t) {
    const anni = t.tt / 365.25;
    const dec = (s[2] + (s[6] * anni) / 3600) * RAD;
    const ra = (s[1] + (s[5] * anni) / 3600 / Math.cos(s[2] * RAD)) * RAD;
    return new A.Vector(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec), t);
  }
  function stella(nome, t) {
    t = t || tempo();
    const s = ST[perHR[hrDi[nome]]];
    const eq = daJ2000(t, vettoreJ2000(s, t));
    const ra = eq.ra * 15;
    return { nome, T: norm(tGamma(t) - ra), dec: eq.dec, sha: norm(360 - ra), ra, mag: s[3] };
  }
  // Tutte le stelle come vettori dell'equatore della data (per disegnarle)
  function vettoriStelle(t) {
    const rot = A.Rotation_EQJ_EQD(t);
    return ST.map((s) => { const v = A.RotateVector(rot, vettoreJ2000(s, t)); return [v.x, v.y, v.z]; });
  }

  // Altezza e azimut veri per l'osservatore, dal triangolo di posizione (senza rifrazione)
  function altazimut(T, dec, lat, lon) {
    const t = (T + lon) * RAD; const d = dec * RAD; const f = lat * RAD;
    const sh = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(t);
    const h = Math.asin(Math.max(-1, Math.min(1, sh)));
    const y = -Math.cos(d) * Math.sin(t); const x = Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(t);
    return { h: h / RAD, a: norm(Math.atan2(y, x) / RAD), t: norm(T + lon) };
  }
  // Astro visto dalla nave: altezza vera del centro (geocentrica), azimut, semidiametro e parallasse orizzontale in primi
  function vistoDallaNave(nome, t) {
    t = t || tempo();
    const c = NOMI_CORPI[nome] ? corpo(nome, t) : stella(nome, t);
    const az = altazimut(c.T, c.dec, stato.lat, stato.lon);
    const sd = nome === 'Sole' ? Math.asin(R_SOLE / c.km) / RAD * 60 : nome === 'Luna' ? Math.asin(R_LUNA / c.km) / RAD * 60 : 0;
    const par = c.km ? Math.asin(R_TERRA / c.km) / RAD * 60 : 0;
    return { ...c, h: az.h, a: az.a, t: az.t, sd, par };
  }

  /* Tavole delle Effemeridi nautiche IIM 2020, «Correzioni delle altezze di stelle e pianeti» (p. 346 del PDF).
     Tavole critiche: il valore vale fra due ingressi consecutivi. c1 = 20′ − i, c2 = 40′ − r */
  const C1_M = [0.34, 0.43, 0.49, 0.58, 0.67, 0.76, 0.85, 0.98, 1.10, 1.22, 1.34, 1.49, 1.62, 1.72, 1.92, 2.10, 2.26, 2.44, 2.62, 2.80, 2.99, 3.20, 3.41, 3.63, 3.84, 4.05, 4.30, 4.54, 4.79, 5.03, 5.30, 5.58, 5.82, 6.13, 6.40, 6.71, 6.98, 7.28, 7.59, 7.92, 8.26, 8.56, 8.90, 9.27, 9.60, 9.97, 10.33, 10.70, 11.06, 11.46, 11.86, 12.22, 12.65, 13.05,
    13.41, 13.72, 14.33, 14.63, 14.94, 15.54, 15.85, 16.46, 16.76, 17.37, 17.68, 18.29, 18.90, 19.20, 19.81, 20.42, 20.73, 21.34, 21.95, 22.56, 22.86, 23.47, 24.08, 24.69, 25.30, 25.91, 26.52, 26.82, 27.43, 28.04, 28.65, 29.26, 29.87, 30.78, 31.39, 32.00, 32.61, 33.22, 33.83, 34.44, 35.36, 35.97, 36.58, 37.19, 38.10, 38.71, 39.32, 40.23, 40.84, 41.45, 42.37, 42.89, 43.89, 44.50, 45.42];
  // Fra C1_M[k] e C1_M[k+1] la prima correzione vale 18,9′ − 0,1′·k (da 18,9′ a 8,2′)
  function c1(e) {
    let k = 0; while (k < C1_M.length - 2 && e >= C1_M[k + 1]) k++;
    return Math.round((18.9 - 0.1 * k) * 10) / 10;
  }
  const G = (g, p) => g + p / 60;
  const C2_H = [G(4, 23), G(4, 26), G(4, 29), G(4, 32), G(4, 36), G(4, 39), G(4, 42), G(4, 46), G(4, 49), G(4, 53), G(4, 56), G(5, 0), G(5, 4), G(5, 8), G(5, 12), G(5, 16), G(5, 20), G(5, 24), G(5, 28), G(5, 32), G(5, 37), G(5, 41), G(5, 46), G(5, 51), G(5, 55), G(6, 0), G(6, 5), G(6, 11), G(6, 16), G(6, 21), G(6, 27), G(6, 32), G(6, 38), G(6, 44), G(6, 50), G(6, 56), G(7, 2), G(7, 9), G(7, 16), G(7, 23), G(7, 30), G(7, 37), G(7, 44), G(7, 52), G(8, 0), G(8, 8), G(8, 16), G(8, 25), G(8, 34), G(8, 43), G(8, 52), G(9, 2), G(9, 12), G(9, 23), G(9, 33),
    G(9, 44), G(9, 56), G(10, 8), G(10, 20), G(10, 33), G(10, 46), G(11, 0), G(11, 14), G(11, 29), G(11, 45), G(12, 1), G(12, 18), G(12, 35), G(12, 54), G(13, 13), G(13, 33), G(13, 54), G(14, 16), G(14, 40), G(15, 4), G(15, 30), G(15, 57), G(16, 26), G(16, 56), G(17, 28), G(18, 2), G(18, 38), G(19, 17), G(19, 58), G(20, 42), G(21, 28), G(22, 19), G(23, 13), G(24, 11), G(25, 14), G(26, 22), G(27, 36), G(28, 56), G(30, 24), G(32, 0), G(33, 45), G(35, 40), G(37, 48), G(40, 8), G(42, 44), G(45, 36), G(48, 47), G(52, 18), G(56, 11), G(60, 28), G(65, 8), G(70, 11), G(75, 34), G(81, 13), G(87, 3), 90];
  // Fra C2_H[k] e C2_H[k+1] la seconda correzione vale 29,1′ + 0,1′·k (da 29,1′ a 40,0′); sotto 4°23′ la tavola non c'è
  function c2(ho) {
    if (ho < C2_H[0]) return null;
    let k = 0; while (k < C2_H.length - 2 && ho >= C2_H[k + 1]) k++;
    return Math.round((29.1 + 0.1 * k) * 10) / 10;
  }
  const depressione = (e) => 20 - c1(e); // i, in primi
  const rifrazione = (ho) => { const v = c2(ho); return v === null ? null : 40 - v; }; // r, in primi

  /* Dove si vede un astro rispetto all'orizzonte marino: il contrario delle correzioni (formula 4.7 del libro).
     lembo: 'inf' | 'sup' | null (centro). Risultato in gradi: è l'altezza osservata h_o */
  function altezzaOsservata(v, lembo) {
    const i = depressione(stato.occhio) / 60;
    let ho = v.h;
    for (let k = 0; k < 4; k++) {
      const r = (rifrazione(ho) ?? 0) / 60;
      const sd = (lembo === 'inf' ? -v.sd : lembo === 'sup' ? v.sd : 0) / 60;
      const par = (v.par * Math.cos(ho * RAD)) / 60;
      ho = v.h + i + r + sd - par;
    }
    return ho;
  }

  // Mattina della data scelta in cui il Sole arriva all'altezza voluta (per le prove col sestante)
  function oraColSole(altezza) {
    const oss = new A.Observer(stato.lat, stato.lon, 0);
    const d = new Date(stato.data); d.setUTCHours(0, 0, 0, 0);
    const t = A.SearchAltitude('Sun', oss, +1, d, 1, altezza);
    return t ? t.date.getTime() : null;
  }

  /* Primo istante dopo «da» (ms) in cui il Sole passa per l'altezza voluta: verso +1 sorge, −1 tramonta.
     Serve alle prove che vogliono la notte o il crepuscolo nel luogo della nave */
  function istanteSole(altezza, verso, da) {
    const oss = new A.Observer(stato.lat, stato.lon, 0);
    const t = A.SearchAltitude('Sun', oss, verso, new Date(da === undefined ? stato.data : da), 2, altezza);
    return t ? t.date.getTime() : null;
  }

  /* Scrittura come nel libro: gradi e primi con un decimale, virgola decimale */
  function ang(g, opz = {}) {
    let s = ''; let v = g;
    if (opz.segno) { s = v < 0 ? opz.segno[1] : opz.segno[0]; v = Math.abs(v); } else if (v < 0) { s = '−'; v = -v; }
    let gradi = Math.floor(v); let primi = Math.round((v - gradi) * 600) / 10;
    if (primi >= 60) { gradi += 1; primi -= 60; }
    const p = primi.toFixed(1).replace('.', ',').padStart(4, '0');
    const gg = opz.tre ? String(gradi).padStart(3, '0') : String(gradi);
    return `${s}${gg}°${p}′`;
  }
  const primi = (p) => `${p < 0 ? '−' : '+'}${Math.abs(p).toFixed(1).replace('.', ',').padStart(4, '0')}′`;
  const due = (n) => String(n).padStart(2, '0');
  function ora(ms) { const d = new Date(ms === undefined ? stato.data : ms); return `${due(d.getUTCHours())}:${due(d.getUTCMinutes())}:${due(d.getUTCSeconds())}`; }
  function giorno(ms) { const d = new Date(ms === undefined ? stato.data : ms); return `${due(d.getUTCDate())}/${due(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; }
  function luogo() {
    const l = LUOGHI[stato.luogo];
    return `${ang(stato.lat, { segno: 'NS' })} ${ang(stato.lon, { segno: 'EW', tre: true })}${l && l.lat === stato.lat && l.lon === stato.lon ? ` (${l.nome})` : ''}`;
  }

  return {
    stato, imposta, ascolta, scorri, LUOGHI, tempo, tGamma, corpo, stella, vettoriStelle, altazimut, vistoDallaNave,
    c1, c2, depressione, rifrazione, altezzaOsservata, oraColSole, istanteSole, ang, primi, ora, giorno, luogo, norm,
    nomiStelle, hrDi, perHR, CORPI: Object.keys(NOMI_CORPI),
  };
})();
