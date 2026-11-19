/* Guardia notturna: la prova finale (PIANO.md, «Finale»). Una storia continua che mette insieme le esperienze:
   punto nave con tre stelle al crepuscolo (13), controllo della bussola all'alba (14), latitudine meridiana (10),
   rapporto al comandante. Il caso è quello dell'esempio di «Fondamenti» vol. 2, p. 107: 18/04/2015, posizione
   15°25,9′N 085°02,4′E, Rᵥ 062°, V 12 nodi, letture delle bussole del libro. Scelte del libro 3D, dette in pagina:
   la nave vera sta 4 miglia a Ovest e 2 a Sud del punto stimato; il sestante ha +1,0′ di errore sistematico;
   a mezzogiorno la nave si ferma (il libro userebbe il meridiano mobile, p. 96). Regole in design.md */
(function () {
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;
  const v1 = (x) => x.toFixed(1).replace('.', ',');
  const az = (x) => { const r = Math.round((((x % 360) + 360) % 360) * 10) / 10; const g = Math.floor(r); return `${String(g % 360).padStart(3, '0')},${Math.round((r - g) * 10)}°`; };
  const segnoEW = (x) => `${v1(Math.abs(x))}°${x >= 0 ? 'E' : 'W'}`;
  const pos = (p) => `${Cielo.ang(p.lat, { segno: 'NS' })} ${Cielo.ang(p.lon, { segno: 'EW', tre: true })}`;

  /* Il caso del libro (p. 107) ------------------------------------------------------------------------- */
  const LIBRO = { lat: G(15, 25.9), lon: G(85, 2.4) }; // punto stimato all'alba
  const RV = 62; const V = 12; const AG = 79.2; const AB = 79.0; const D = -1.5; const DEV = 5.4;
  const SCARTO = [-4, -2]; // nave vera rispetto al punto stimato, miglia Est e Nord
  const ERRORE = 1.0; // primi in più su ogni altezza
  const H0 = -55 / 60;

  // Lossodromia piana: m miglia per la rotta R
  const corri = (p, m, R) => {
    const lat = p.lat + (m * Math.cos(R * RAD)) / 60;
    return { lat, lon: p.lon + (m * Math.sin(R * RAD)) / 60 / Math.cos(((p.lat + lat) / 2) * RAD) };
  };
  // Istante dell'alba (lembo superiore) nel punto del libro: è l'origine dei tempi della storia
  const oss = new Astronomy.Observer(LIBRO.lat, LIBRO.lon, 0);
  const ALBA = Astronomy.SearchAltitude('Sun', oss, +1, new Date('2015-04-17T18:00:00Z'), 2, H0).date.getTime();
  const CREP = Astronomy.SearchAltitude('Sun', oss, +1, new Date('2015-04-17T18:00:00Z'), 2, -9).date.getTime();
  const stimatoA = (ms) => corri(LIBRO, (V * (ms - ALBA)) / 3600e3, RV);
  const veroA = (ms) => Carteggio.coordinate(SCARTO, stimatoA(ms).lat, stimatoA(ms).lon);
  const NOON = (() => {
    const p = veroA(ALBA + 6 * 3600e3);
    const ev = Astronomy.SearchHourAngle('Sun', new Astronomy.Observer(p.lat, p.lon, 0), 0, new Date(ALBA));
    return ev.time.date.getTime();
  })();

  /* Lo stato della guardia ----------------------------------------------------------------------------- */
  const st = () => Libro.stato('guardia');
  const salva = (m) => Libro.aggiorna('guardia', m);
  const pr = { fase: null, rette: [], fix: null, vertici: null, esito: {}, scelte: {} };

  function entra(fase) {
    if (pr.fase === fase) return;
    pr.fase = fase;
    if (fase === 'crep') { const p = veroA(CREP); Cielo.imposta({ lat: p.lat, lon: p.lon, luogo: '', data: CREP, corre: false }); }
    if (fase === 'alba') { const p = veroA(ALBA); Cielo.imposta({ lat: p.lat, lon: p.lon, luogo: '', data: ALBA - 12 * 60e3 + 17e3, corre: false }); }
    if (fase === 'noon') { const p = veroA(NOON); Cielo.imposta({ lat: p.lat, lon: p.lon, luogo: '', data: NOON - 30 * 60e3, corre: false }); }
  }
  const ponte = Scene.ponte({ guarda: 90, phi: 1.2 });
  function mondoPonte(fase) {
    return () => {
      const m = ponte(); const prima = pr.fase;
      entra(fase);
      m.vistaIniziale = () => {
        if (fase === 'crep') return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: 90 * RAD, phi: 1.0, r: 70 };
        const v = Cielo.vistoDallaNave('Sole');
        return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: v.a * RAD, phi: fase === 'alba' ? 1.38 : Math.min(1.5, Math.max(0.3, (80 - Math.max(v.h, 0)) * RAD)), r: fase === 'alba' ? 40 : 60 };
      };
      if (prima !== fase) setTimeout(() => { if (!vr()) Motore.vista(m.vistaIniziale()); Motore.ridisegna(); }, 0);
      return m;
    };
  }

  /* Prima guardia: il punto nave al crepuscolo ------------------------------------------------------------ */
  const CANDIDATE = ['Polare', 'Kochab', 'Vega', 'Arturo', 'Capella', 'Sirio', 'Altair', 'Deneb', 'Aldebaran', 'Betelgeuse', 'Rigel', 'Procyon', 'Regolo', 'Spica', 'Antares', 'Polluce', 'Fomalhaut', 'Dubhe', 'Alphecca', 'Hamal', 'Markab', 'Enif', 'Rasalhague', 'Denebola', 'Mirfak', 'Alpheratz', 'Diphda', 'Alkaid', 'Eltanin', 'Nunki', 'Peacock', 'Shaula', 'Kaus Aust.', 'Acrux', 'Gacrux', 'Hadar', 'Rigil Kent.', 'Canopo', 'Achernar', 'Al Na\'ir', 'Atria'];
  const nomeIt = (n) => ({ Procyon: 'Procione', 'Kaus Aust.': 'Kaus Australis', 'Rigil Kent.': 'Rigil Kentaurus' }[n] || n);
  const DRc = stimatoA(CREP); const VEc = veroA(CREP);
  function retta(nome) {
    const s = Cielo.stella(nome, Cielo.tempo(CREP));
    const a = Cielo.altazimut(s.T, s.dec, DRc.lat, DRc.lon); const b = Cielo.altazimut(s.T, s.dec, VEc.lat, VEc.lon);
    return { nome, a: a.a, hs: a.h, hv: b.h + ERRORE / 60, dh: (b.h - a.h) * 60 + ERRORE };
  }
  const visibili = (() => {
    let lista = null;
    return () => {
      if (lista) return lista;
      const v = CANDIDATE.filter((n) => Cielo.hrDi[n] !== undefined).map((n) => ({ n, r: retta(n) })).filter((x) => x.r.hs > 15 && x.r.hs < 75).sort((a, b) => a.r.a - b.r.a);
      const k = Math.ceil(v.length / 12);
      lista = v.filter((x, i) => i % k === 0).map((x) => x.n);
      return lista;
    };
  })();
  const COLORI = ['#B3362B', '#2E7DB5', '#2E8B57'];
  const carta = Scene.carta({
    disegna: (ctx, W, H) => Carteggio.disegna(ctx, W, H, {
      phi: DRc.lat, scala: 70, centro: [W * 0.6, H * 0.42],
      rette: pr.rette.map((r, k) => ({ ...r, nome: nomeIt(r.nome), col: COLORI[k % 3] })),
      fix: pr.fix, vertici: pr.vertici,
      titolo: `Crepuscolo del 18/04/2015 · punto stimato ${pos(DRc)} · ${Cielo.ora(CREP).slice(0, 5)} UTC`,
    }),
  });
  function mondoCarta() { const m = carta(); entra('crep'); return m; }
  function fixCrep() {
    pr.fix = null; pr.vertici = null;
    if (pr.rette.length < 3) { pr.esito.crep = { tipo: 'errato', testo: 'Il comandante vuole tre rette.' }; return; }
    const f = Carteggio.fixTre(pr.rette);
    pr.fix = f.p; pr.vertici = f.vertici;
    if (f.modo !== 'incentro') { pr.esito.crep = { tipo: 'errato', testo: 'Le tre stelle stanno in metà orizzonte: scegline tre sparse tutto intorno, così l\'incentro elimina l\'errore sistematico (p. 133).' }; return; }
    const c = Carteggio.coordinate(f.p, DRc.lat, DRc.lon);
    const err = Math.hypot(f.p[0] - SCARTO[0], f.p[1] - SCARTO[1]);
    salva({ fix: c, eps: f.d, crep: err < 0.5 });
    pr.esito.crep = err < 0.5
      ? { tipo: 'giusto', testo: `FIX delle ${Cielo.ora(CREP).slice(0, 5)}: ${pos(c)}, a ${v1(Math.hypot(f.p[0], f.p[1]))} miglia dal punto stimato. Errore sistematico del sestante: ${v1(f.d)}′. Annotato sul giornale.` }
      : { tipo: 'errato', testo: 'Il triangolo è troppo largo per fidarsi: prova stelle con azimut più distanti fra loro.' };
  }

  /* Seconda guardia: l'alba e le bussole --------------------------------------------------------------- */
  // Risposte arrotondate: al decimo di grado per gli azimut (passo 10), al decimo di primo per le latitudini (600)
  function opzioni(giusto, sbagliati, passo = 10) {
    const l = [giusto, ...sbagliati].map((v, i) => ({ v: Math.round(v * passo) / passo, giusta: i === 0 }));
    return l.filter((x, i) => l.findIndex((y) => y.v === x.v) === i).sort((a, b) => a.v - b.v);
  }
  function controllaAlba() {
    const v = Cielo.vistoDallaNave('Sole'); const dh = (v.h - H0) * 60;
    if (Math.abs(dh) > 4) { pr.esito.alba = { tipo: 'nota', testo: dh < 0 ? `Il lembo superiore non è ancora sorto: il centro è a ${Cielo.ang(v.h)}.` : `Il centro è a ${Cielo.ang(v.h)}: sei oltre il −55′, torna indietro.` }; pr.scelte.cg = null; return; }
    pr.av = v.a;
    pr.esito.alba = { tipo: 'nota', testo: `Lembo superiore sull'orizzonte. Azimut vero calcolato a_v = ${az(v.a)}; gyro a_g = ${az(AG)}; bussola a_b = ${az(AB)}, d = ${segnoEW(D)}. Quanto vale la correzione gyro?` };
    if (!pr.scelte.cg) pr.scelte.cg = opzioni(v.a - AG, [AG - v.a, v.a - AB, v.a - AG + 1]);
  }

  /* Terza guardia: il mezzogiorno ---------------------------------------------------------------------- */
  function controllaNoon() {
    const v = Cielo.vistoDallaNave('Sole'); const P = v.t > 180 ? v.t - 360 : v.t;
    if (Math.abs(P) > 0.5) { pr.esito.noon = { tipo: 'nota', testo: Math.abs(P) < 3 ? (P < 0 ? 'Il Sole sale ancora, piano piano.' : 'Il Sole ha cominciato a scendere: torna indietro.') : `Sole a ${Cielo.ang(v.h)}: aspetta il passaggio in meridiano.` }; pr.scelte.fi = null; return; }
    // L'altezza meridiana è la massima del giorno: con il Sole alto anche pochi secondi dal culmine contano
    const hm = 90 - Math.abs(Cielo.stato.lat - v.dec);
    const aSud = Math.cos(v.a * RAD) < 0; const zm = (90 - hm) * (aSud ? 1 : -1);
    pr.esito.noon = { tipo: 'nota', testo: `Passaggio in meridiano a ${aSud ? 'Sud' : 'Nord'}: hₘ = ${Cielo.ang(hm)}, δ☉ = ${Cielo.ang(v.dec, { segno: 'NS' })}. Quanto vale φ?` };
    if (!pr.scelte.fi) pr.scelte.fi = opzioni(zm + v.dec, [-zm + v.dec, hm + v.dec], 600);
  }

  function comandi(id) {
    if (id.startsWith('retta:')) {
      const nome = id.slice(6);
      if (pr.rette.find((r) => r.nome === nome)) pr.rette = pr.rette.filter((r) => r.nome !== nome);
      else { pr.rette.push(retta(nome)); if (pr.rette.length > 3) pr.rette.shift(); }
      pr.fix = null; pr.vertici = null; pr.esito.crep = null;
    }
    if (id === 'fai-fix') fixCrep();
    if (id === 'azzera') { pr.rette = []; pr.fix = null; pr.vertici = null; pr.esito.crep = null; }
    const passo = { 'dieci-': -600, 'min-': -60, 'sec-': -10, 'sec+': 10, 'min+': 60, 'dieci+': 600 }[id];
    if (passo) {
      Cielo.imposta({ data: Cielo.stato.data + passo * 1000, corre: false });
      if (pr.fase === 'alba') controllaAlba(); else if (pr.fase === 'noon') controllaNoon();
      if (!vr()) Motore.vista(ponte().vistaIniziale());
    }
    if (id.startsWith('cg:') && pr.scelte.cg) {
      const x = pr.scelte.cg[Number(id.slice(3))];
      if (x.giusta) {
        const am = pr.av - D; const dev = am - AB;
        salva({ alba: true, cg: x.v, dev });
        pr.esito.alba = { tipo: 'giusto', testo: `c_g = a_v − a_g = ${x.v >= 0 ? '+' : '−'}${v1(Math.abs(x.v))}°: la gyro va bene. Bussola: a_m = a_v − d = ${az(am)}, δ = a_m − a_b = ${segnoEW(dev)}; la tabella delle deviazioni per Rᵥ 062° dice ${segnoEW(DEV)}. La magnetica va ricontrollata, come conclude il libro (p. 107).` };
      } else pr.esito.alba = { tipo: 'errato', testo: 'No: la correzione gyro è azimut vero meno azimut gyro (7.1).' };
    }
    if (id.startsWith('fi:') && pr.scelte.fi) {
      const x = pr.scelte.fi[Number(id.slice(3))];
      if (x.giusta) {
        salva({ noon: true, fiNoon: x.v });
        pr.esito.noon = { tipo: 'giusto', testo: `φ = zₘ + δ = ${Cielo.ang(x.v, { segno: 'NS' })}. Annotata sul giornale: è l'ora del rapporto.` };
      } else pr.esito.noon = { tipo: 'errato', testo: 'No: zₘ = 90° − hₘ, positiva se il Sole culmina a Sud, e δ con il suo segno (6.4).' };
    }
    if (st().crep && st().alba && st().noon) salva({ fatta: true });
    carta().ridisegna();
    Motore.sporco();
  }

  /* Le pagine ----------------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  const FASI = ['Ordini', 'Crepuscolo', 'Alba', 'Meridiana', 'Rapporto'];
  const rail = (k) => ({ t: 'rail', lista: FASI.map((nome, i) => ({ id: `sez:guardia:${i}`, testo: nome, on: i === k })) });
  const tempo = () => ({ t: 'bottoni', h: 80, size: 26, lista: [['dieci-', '−10 min'], ['min-', '−1 min'], ['sec-', '−10 s'], ['sec+', '+10 s'], ['min+', '+1 min'], ['dieci+', '+10 min']].map(([id, testo]) => ({ id, testo })) });
  const spunta = (testo, fatta) => ({ t: 'spunta', testo, fatta: !!fatta });
  const riquadro = () => ({ t: 'riquadro', size: 30, testo: `${Cielo.giorno()} ${Cielo.ora()} UTC · Rᵥ 062°, 12 nodi · Sole: centro a ${Cielo.ang(Cielo.vistoDallaNave('Sole').h)}, azimut ${az(Cielo.vistoDallaNave('Sole').a)}` });
  const esito = (k) => (pr.esito[k] ? [{ t: 'esito', ...pr.esito[k] }] : []);
  const stelleBottoni = () => {
    const l = visibili().map((n) => ({ id: `retta:${n}`, testo: `${nomeIt(n)} ${Math.round(retta(n).a)}°`, on: !!pr.rette.find((r) => r.nome === n) }));
    const m = Math.ceil(l.length / 2);
    return [l.slice(0, m), l.slice(m)].filter((x) => x.length).map((x) => ({ t: 'bottoni', h: 74, size: 26, lista: x }));
  };
  // La posizione stimata a mezzogiorno: dal FIX dello studente, con la corsa fino all'istante della meridiana
  function rapporto() {
    const s = st(); const righe = [['Voce', 'Il tuo giornale', 'Controllo']];
    if (s.fix) {
      const vero = veroA(CREP); const e = Math.hypot((s.fix.lat - vero.lat) * 60, (s.fix.lon - vero.lon) * 60 * Math.cos(vero.lat * RAD));
      righe.push(['FIX al crepuscolo', pos(s.fix), `${v1(e)} miglia dalla nave vera`]);
      righe.push(['Errore del sestante', `${v1(s.eps)}′`, `${v1(ERRORE)}′ messi dal libro 3D`]);
    } else righe.push(['FIX al crepuscolo', '—', 'da fare']);
    righe.push(['Correzione gyro', s.alba ? `${s.cg >= 0 ? '+' : '−'}${v1(Math.abs(s.cg))}°` : '—', s.alba ? 'gyro in ordine' : 'da fare']);
    righe.push(['Deviazione bussola', s.alba ? segnoEW(s.dev) : '—', s.alba ? `tabella ${segnoEW(DEV)}: da rivedere` : 'da fare']);
    if (s.noon && s.fix) {
      const stimNoon = corri(s.fix, (V * (NOON - CREP)) / 3600e3, RV);
      righe.push(['Latitudine meridiana', Cielo.ang(s.fiNoon, { segno: 'NS' }), `stimata dal FIX ${Cielo.ang(stimNoon.lat, { segno: 'NS' })}`]);
    } else righe.push(['Latitudine meridiana', s.noon ? Cielo.ang(s.fiNoon, { segno: 'NS' }) : '—', s.noon ? '' : 'da fare']);
    return righe;
  }

  Motore.sezione('guardia', {
    spreads: () => {
      const s = st();
      return [
        {
          mondo: mondoPonte('crep'), azione: comandi,
          sx: [
            rail(0),
            { t: 'titolo', testo: 'Guardia notturna' },
            { t: 'p', size: 36, testo: 'Golfo del Bengala, notte fra il 17 e il 18 aprile 2015. La nave fa rotta vera **062°** a **12 nodi**. Sei l\'ufficiale di guardia; il comandante ha lasciato gli ordini sul giornale:' },
            { t: 'p', size: 34, testo: '1. Al crepuscolo mattutino, punto nave con **tre stelle**. 2. Al sorgere del Sole, **controllo delle bussole**. 3. A mezzogiorno vero, **latitudine meridiana**. 4. Poi il **rapporto**.' },
            { t: 'nota', testo: 'È il caso dell\'esempio di p. 107: posizione, rotta, velocità e letture delle bussole sono quelle del libro. Il cielo è calcolato.' },
          ],
          dx: [
            finestra(860, 'Sei in controplancia, prima dell\'alba.', 'Vai a grandezza vera per stare sul ponte.'),
            ...scala(),
            { t: 'nota', testo: 'Il libro 3D mette la nave vera 4 miglia a Ovest e 2 a Sud del punto stimato, e dà al sestante +1,0′ di errore sistematico: tocca a te scoprirlo.' },
          ],
        },
        {
          mondo: mondoCarta, azione: comandi,
          sx: [
            rail(1),
            { t: 'sotto', testo: `Crepuscolo, ore ${Cielo.ora(CREP).slice(0, 5)} UTC: scegli tre stelle` },
            ...stelleBottoni(),
            { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'fai-fix', testo: 'Cerca il FIX' }, { id: 'azzera', testo: 'Foglio pulito' }] },
            ...esito('crep'),
            spunta('Punto nave con tre stelle sparse sull\'orizzonte (esperienza 13).', s.crep),
          ],
          dx: [
            finestra(860, 'Guarda il foglio sul tavolo.', 'Vai a grandezza vera per stare al tavolo.'),
            ...scala(),
            { t: 'nota', testo: 'Fra parentesi l\'azimut dal punto stimato. Le rette si tracciano come nelle esperienze 12 e 13.' },
          ],
        },
        {
          mondo: mondoPonte('alba'), azione: comandi,
          sx: [
            rail(2),
            { t: 'sotto', testo: 'Alba: aspetta il lembo superiore del Sole' },
            tempo(),
            riquadro(),
            ...esito('alba'),
            ...(pr.scelte.cg && !s.alba ? [{ t: 'bottoni', h: 80, size: 30, lista: pr.scelte.cg.map((x, i) => ({ id: `cg:${i}`, testo: `c_g = ${x.v >= 0 ? '+' : '−'}${v1(Math.abs(x.v))}°` })) }] : []),
            spunta('Correzione gyro e deviazione della bussola al sorgere (esperienza 14).', s.alba),
          ],
          dx: [
            finestra(860, 'Guarda il Sole sull\'orizzonte, a Est.', 'Vai a grandezza vera per stare sul ponte.'),
            ...scala(),
            { t: 'nota', testo: 'Il lembo superiore tocca l\'orizzonte quando il centro è a −55′ (p. 107): tolleranza ±4′.' },
          ],
        },
        {
          mondo: mondoPonte('noon'), azione: comandi,
          sx: [
            rail(3),
            { t: 'sotto', testo: 'Mezzogiorno: trova il passaggio in meridiano' },
            tempo(),
            riquadro(),
            ...esito('noon'),
            ...(pr.scelte.fi && !s.noon ? [{ t: 'bottoni', h: 80, size: 30, lista: pr.scelte.fi.map((x, i) => ({ id: `fi:${i}`, testo: `φ = ${Cielo.ang(x.v, { segno: 'NS' })}` })) }] : []),
            spunta('Latitudine al passaggio in meridiano (esperienza 10).', s.noon),
          ],
          dx: [
            finestra(860, 'Guarda il Sole: sale, si ferma, scende.', 'Vai a grandezza vera per stare sul ponte.'),
            ...scala(),
            { t: 'nota', testo: 'Per semplicità qui la nave si ferma per la meridiana; in navigazione il libro calcola l\'istante con il meridiano mobile (p. 96).' },
          ],
        },
        {
          azione: comandi,
          sx: [
            rail(4),
            { t: 'titolo', testo: 'Rapporto al comandante' },
            { t: 'tabella', col: [30, 34, 36], size: 28, righe: rapporto() },
            { t: 'nota', testo: 'La latitudine stimata a mezzogiorno viene dal tuo FIX, con 12 nodi per 062° fino alla meridiana.' },
          ],
          dx: s.fatta ? [
            { t: 'titolo', testo: 'Guardia smontata' },
            { t: 'p', testo: 'Punto nave, bussole e meridiana: il giornale è in ordine. Il comandante firma il rapporto.' },
            { t: 'disegno', h: 420, fn: (c, x, y, w, h) => { c.fillStyle = '#0B2545'; c.fillRect(x + w * 0.2, y, w * 0.6, h); c.fillStyle = '#E3C878'; Libro.stellina(c, x + w / 2, y + h * 0.45, h * 0.3); c.fill(); } },
            { t: 'bottoni', lista: [{ id: 'sez:stelle:0', testo: 'Le tue stelle' }, { id: 'sez:indice:0', testo: 'Indice' }] },
          ] : [
            { t: 'titolo', testo: 'Il rapporto non è completo' },
            { t: 'p', testo: 'Il comandante aspetta il punto nave, il controllo delle bussole e la meridiana.' },
            { t: 'bottoni', lista: [{ id: 'sez:guardia:1', testo: 'Torna al crepuscolo' }] },
          ],
        },
      ];
    },
  });
  Libro.GUARDIA = true;
})();
