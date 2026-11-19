/* Esperienza 9: riconoscere le stelle. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2: § 1.7, crepuscoli (p. 32); § 5.1, allineamenti stellari (pp. 82–85); § 5.2, star finder (pp. 87–88).
   Lo star finder è disegnato in modo schematico: stelle e reticoli sono calcolati. Regole in design.md */
(function () {
  const N = 9;
  const { tratto } = Tavola;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'ora', testo: 'Trova un\'ora in cui si vedono sia le stelle sia l\'orizzonte.' },
    { id: 'allinea', testo: 'Segui due allineamenti fino alla stella che indicano.' },
    { id: 'finder', testo: 'Riconosci un astro con lo star finder.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Il crepuscolo nautico va da quando il Sole è a…', scelte: ['0° a −6°', '−6° a −12°', '−12° a −18°'], giusta: 1, perche: 'Civile da 0° a −6°, nautico da −6° a −12°; l\'astronomico arriva a −18°. {{p. 32, tab. 1.8}}' },
    { n: 2, testo: 'Perché per le stelle si sceglie il crepuscolo nautico?', scelte: ['Si vedono le stelle più luminose e anche l\'orizzonte', 'Le stelle sono più alte', 'La rifrazione è nulla'], giusta: 0, perche: 'Col sestante servono sia l\'astro sia l\'orizzonte: è il momento migliore, e dura circa mezz\'ora. {{p. 32}}' },
    { n: 3, testo: 'Prolungando Merak–Dubhe di circa 5 volte la loro distanza si trova…', scelte: ['la Polare', 'Arturo', 'Vega'], giusta: 0, perche: 'L\'allineamento Merak–Dubhe dell\'Orsa Maggiore porta alla Polare, nell\'Orsa Minore. {{p. 82}}' },
    { n: 4, testo: 'Arturo e Alphecca conducono a…', scelte: ['Vega, della Lira', 'Sirio, del Cane Maggiore', 'Capella, dell\'Auriga'], giusta: 0, perche: 'Vicino a Vega si riconoscono il Cigno con Deneb e l\'Aquila con Altair: il «triangolo estivo». {{p. 85}}' },
    { n: 5, testo: 'Con lo star finder, la freccia del disco trasparente va messa sul…', scelte: ['tempo sidereo locale', 'tempo medio di Greenwich', 'valore della latitudine'], giusta: 0, perche: 'La freccia indica il mezzo cielo superiore: segnato il tempo sidereo locale, il reticolo dà altezza e azimut degli astri. {{p. 88}}' },
    { n: 6, testo: 'Sul disco stellato dello star finder ci sono…', scelte: ['le 57 stelle fisse più luminose, dei due emisferi', 'solo le stelle dell\'emisfero Nord', 'tutte le stelle visibili a occhio nudo'], giusta: 0, perche: 'Un lato è centrato sul polo Nord, l\'altro sul polo Sud, ma ognuno porta le stelle dei due emisferi. Altre si possono aggiungere a matita. {{pp. 87–88}}' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  /* Allineamenti del libro: dalle prime due stelle si va verso la terza --------------------------- */
  const ALLINEAMENTI = [
    { id: 'polare', stelle: ['Merak', 'Dubhe', 'Polare'], testo: 'Merak → Dubhe → Polare', rif: 'p. 82' },
    { id: 'leone', stelle: ['Dubhe', 'Merak', 'Regolo'], testo: 'Dubhe → Merak → Regolo, nel Leone', rif: 'p. 84' },
    { id: 'arturo', stelle: ['Alioth', 'Alkaid', 'Arturo'], testo: 'Coda dell\'Orsa Maggiore → Arturo', rif: 'p. 84' },
    { id: 'vega', stelle: ['Arturo', 'Alphecca', 'Vega'], testo: 'Arturo → Alphecca → Vega', rif: 'p. 85' },
    { id: 'procione', stelle: ['Bellatrix', 'Betelgeuse', 'Procyon'], testo: 'Bellatrix → Betelgeuse → Procione', rif: 'p. 83' },
    { id: 'gemelli', stelle: ['Rigel', 'Betelgeuse', 'Polluce'], testo: 'Rigel → Betelgeuse → Gemelli (Polluce)', rif: 'p. 83' },
  ];
  const pr = { esito: null, al: null, trovate: new Set(Libro.stato(N).trovate || []), volta: null, linee: null, preparato: false, ts: 0, incognito: null, scelte: [] };
  const visibile = (nome) => Cielo.vistoDallaNave(nome).h > 3;
  const visibili = () => ALLINEAMENTI.filter((a) => a.stelle.every(visibile));

  function disegnaAllineamento() {
    if (!pr.linee) return;
    pr.linee.children.forEach((x) => x.geometry.dispose()); pr.linee.clear();
    const al = ALLINEAMENTI.find((x) => x.id === pr.al);
    if (!al || !pr.volta) return;
    const v = pr.volta; const R = v.R * 0.985;
    const [a, b, c] = al.stelle.map((n) => v.dove(n));
    const asse = new THREE.Vector3().crossVectors(a, b).normalize();
    const fine = b.angleTo(c) + 5 * RAD; const passi = 64;
    const punti = [a.clone().multiplyScalar(R)];
    const q = new THREE.Quaternion();
    for (let i = 0; i <= passi; i++) { q.setFromAxisAngle(asse, (fine * i) / passi); punti.push(b.clone().applyQuaternion(q).multiplyScalar(R)); }
    pr.linee.add(tratto(punti, v.R * 0.0022, 0xE3C878));
  }
  // Se il cielo cambia, la linea si ridisegna; se l'astro incognito è tramontato, se ne sceglie un altro
  Cielo.ascolta((cosa) => {
    if (pr.al) disegnaAllineamento();
    if (cosa && cosa.tempo) return;
    if (pr.preparato && (!pr.incognito || Cielo.vistoDallaNave(pr.incognito).h < 10)) nuovoIncognito();
  });

  const ponte = Scene.ponte({ guarda: 0, phi: 1.15, extra: (radice, v) => { pr.volta = v; pr.linee = new THREE.Group(); v.g.add(pr.linee); } });
  function crepuscolo(verso) { const t = Cielo.istanteSole(-9, verso); if (t) Cielo.imposta({ data: t, corre: false }); }
  function mezzanotte() {
    const oss = new Astronomy.Observer(Cielo.stato.lat, Cielo.stato.lon, 0);
    const t = Astronomy.SearchHourAngle('Sun', oss, 12, new Date(Cielo.stato.data));
    if (t) Cielo.imposta({ data: t.time.date.getTime(), corre: false });
  }
  function mondo() {
    const m = ponte();
    if (!pr.preparato) {
      pr.preparato = true; crepuscolo(-1); nuovoIncognito();
      m.lente = () => tex; m.puntato = () => Motore.ridisegna();
    }
    if (!pr.incognito) nuovoIncognito();
    disegnaFinder();
    return m;
  }

  /* Lo star finder: disco stellato centrato sul polo elevato, disco trasparente della latitudine più vicina */
  const LW = 1020; const LH = 600;
  const tela = document.createElement('canvas'); tela.width = LW; tela.height = LH;
  const tex = new THREE.CanvasTexture(tela); tex.colorSpace = THREE.SRGBColorSpace;
  const tsLocale = () => Cielo.norm(Cielo.tGamma(Cielo.tempo()) + Cielo.stato.lon);
  const discoLat = () => { const l = Math.abs(Cielo.stato.lat); return Math.min(85, Math.max(5, Math.round((l - 5) / 10) * 10 + 5)) * (Cielo.stato.lat < 0 ? -1 : 1); };
  function disegnaFinder() {
    const c = tela.getContext('2d');
    c.fillStyle = '#0A1322'; c.fillRect(0, 0, LW, LH);
    const cx = 300; const cy = 300; const RD = 270;
    const nord = Cielo.stato.lat >= 0; const sg = nord ? 1 : -1;
    // Dal polo elevato (centro) al polo depresso (bordo); α cresce in senso antiorario sul lato Nord
    const xy = (ra, dec) => { const r = ((90 - sg * dec) / 180) * RD; const th = -sg * ra * RAD - Math.PI / 2; return [cx + r * Math.cos(th), cy - r * Math.sin(th)]; };
    c.fillStyle = '#E9E2C8'; c.beginPath(); c.arc(cx, cy, RD, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#8A7F63'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, RD / 2, 0, Math.PI * 2); c.stroke();
    c.font = '22px Atkinson, sans-serif'; c.fillStyle = '#5B5440'; c.textAlign = 'center';
    for (let ra = 0; ra < 360; ra += 30) { const [x, y] = xy(ra, -sg * 86); c.fillText(String(ra), x, y + 7); }
    // Le stelle con nome più luminose
    Object.keys(Cielo.hrDi).forEach((nome) => {
      const s = Cielo.stella(nome); if (s.mag > 2.6 || (nome === pr.incognito)) return;
      const [x, y] = xy(s.ra, s.dec);
      c.fillStyle = '#0B2545'; c.beginPath(); c.arc(x, y, Math.max(2.5, 6 - s.mag * 1.6), 0, Math.PI * 2); c.fill();
    });
    if (pr.incognito) {
      const s = Cielo.stella(pr.incognito); const [x, y] = xy(s.ra, s.dec);
      c.fillStyle = '#0B2545'; c.beginPath(); c.arc(x, y, Math.max(2.5, 6 - s.mag * 1.6), 0, Math.PI * 2); c.fill();
    }
    c.font = '20px Atkinson, sans-serif'; c.textAlign = 'left'; c.fillStyle = '#3B4654';
    Object.keys(Cielo.hrDi).forEach((nome) => { const s = Cielo.stella(nome); if (s.mag > 1.6) return; const [x, y] = xy(s.ra, s.dec); c.fillText(nome, x + 8, y + 6); });
    // Disco trasparente: almicantarat ogni 10°, verticali ogni 30°, ruotato sul tempo sidereo scelto
    const fi = discoLat() * RAD; const ts = pr.ts;
    const punto = (h, a) => {
      h *= RAD; a *= RAD;
      const sd = Math.sin(fi) * Math.sin(h) + Math.cos(fi) * Math.cos(h) * Math.cos(a); const dec = Math.asin(sd);
      const st = -Math.sin(a) * Math.cos(h) / Math.cos(dec); const ct = (Math.sin(h) - Math.sin(fi) * sd) / (Math.cos(fi) * Math.cos(dec));
      const t = Math.atan2(st, ct) / RAD;
      return xy(Cielo.norm(ts - t), dec / RAD);
    };
    c.strokeStyle = 'rgba(30,90,200,0.85)'; c.lineWidth = 2;
    for (let h = 0; h <= 80; h += 10) { c.lineWidth = h === 0 ? 4 : 2; c.beginPath(); for (let a = 0; a <= 360; a += 4) { const [x, y] = punto(h, a); if (a) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    c.lineWidth = 2;
    for (let a = 0; a < 360; a += 30) { c.beginPath(); for (let h = 0; h <= 90; h += 3) { const [x, y] = punto(h, a); if (h) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    // La freccia del mezzo cielo superiore, sul bordo
    const [fx, fy] = xy(ts, -sg * 90); const [gx, gy] = xy(ts, -sg * 78);
    c.strokeStyle = '#B23A2E'; c.lineWidth = 6; c.beginPath(); c.moveTo(gx, gy); c.lineTo(fx, fy); c.stroke();
    c.font = '700 26px Atkinson, sans-serif'; c.fillStyle = '#E9EEF6';
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a]) => { const [x, y] = punto(-2, a); c.fillText(t, x - 8, y + 8); });
    // Destra: i dati
    c.textAlign = 'left'; c.fillStyle = '#E9EEF6'; c.font = '700 34px Atkinson, sans-serif';
    c.fillText('Star finder', 620, 60);
    c.font = '30px Atkinson, sans-serif'; c.fillStyle = '#C9D3DE';
    c.fillText(`Lato ${nord ? 'Nord' : 'Sud'}, disco ${Math.abs(discoLat())}°${nord ? 'N' : 'S'}`, 620, 110);
    c.fillText(`Freccia su tₛ = ${Math.round(ts)}°`, 620, 160);
    if (pr.incognito) {
      const v = Cielo.vistoDallaNave(pr.incognito);
      c.fillStyle = '#E3C878'; c.font = '700 32px Atkinson, sans-serif';
      c.fillText('Astro incognito', 620, 250);
      c.font = '30px Atkinson, sans-serif';
      c.fillText(`altezza ≈ ${Math.round(v.h)}°`, 620, 300); c.fillText(`azimut ≈ ${String(Math.round(v.a) % 360).padStart(3, '0')}°`, 620, 345);
    }
    c.fillStyle = '#9AA7B4'; c.font = '24px Atkinson, sans-serif'; c.fillText('Disegno schematico,', 620, LH - 50); c.fillText('posizioni calcolate.', 620, LH - 20);
    tex.needsUpdate = true;
  }
  function nuovoIncognito() {
    const usate = new Set(ALLINEAMENTI.flatMap((a) => a.stelle));
    const tutte = Object.keys(Cielo.hrDi).map((n) => ({ n, v: Cielo.vistoDallaNave(n) })).filter((x) => x.v.mag < 2.1);
    const cand = tutte.filter((x) => x.v.h > 15 && x.v.h < 70 && x.v.mag < 1.6 && !usate.has(x.n));
    if (!cand.length) { pr.incognito = null; pr.scelte = []; return; }
    const x = cand[Math.floor(Math.random() * cand.length)];
    pr.incognito = x.n;
    // Le risposte sbagliate sono stelle visibili anche loro: non si indovina per esclusione
    const altre = tutte.filter((y) => y.n !== x.n && y.v.h > 5).sort(() => Math.random() - 0.5).slice(0, 2).map((y) => y.n);
    pr.scelte = [x.n, ...altre].sort();
  }

  /* Comandi della prova ----------------------------------------------------------------------- */
  function salvaTrovate() { Libro.aggiorna(N, { trovate: [...pr.trovate] }); }
  function comandi(id) {
    const s = Cielo.stato;
    if (id === 'ora-' || id === 'ora+') Cielo.imposta({ data: s.data + (id === 'ora+' ? 1 : -1) * 6e5, corre: false });
    if (id === 'serale') crepuscolo(-1);
    if (id === 'mattutino') crepuscolo(+1);
    if (id === 'mezzanotte') mezzanotte();
    if (id === 'osserva') {
      const h = Cielo.vistoDallaNave('Sole').h;
      if (h > -6) pr.esito = { tipo: 'errato', testo: `Sole a ${Cielo.ang(h)}: c'è ancora troppa luce, le stelle non si vedono quasi.` };
      else if (h < -12) pr.esito = { tipo: 'errato', testo: `Sole a ${Cielo.ang(h)}: le stelle ci sono, ma l'orizzonte non si distingue più. Col sestante non si misura.` };
      else { lez.completa('ora'); pr.esito = { tipo: 'giusto', testo: `Sole a ${Cielo.ang(h)}: crepuscolo nautico. Stelle e orizzonte, insieme.` }; }
    }
    if (id.startsWith('al:')) {
      const al = ALLINEAMENTI.find((x) => x.id === id.slice(3));
      if (!al.stelle.every(visibile)) pr.esito = { tipo: 'errato', testo: `Adesso non si vedono tutte: ${al.stelle.filter((x) => !visibile(x)).join(', ')} sotto l'orizzonte.` };
      else {
        pr.al = al.id; disegnaAllineamento();
        pr.esito = { tipo: 'neutro', testo: `Dalla prima stella alla seconda, e avanti: dove arriva la linea? {{${al.rif}}}` };
      }
    }
    if (id === 'ts-' || id === 'ts+') pr.ts = Cielo.norm(Math.round(pr.ts) + (id === 'ts+' ? 1 : -1));
    if (id === 'altro') nuovoIncognito();
    if (id.startsWith('sf:')) rispondi(id.slice(3));
    if (id.startsWith('t:')) {
      const a = id.slice(2).split(',').find((x) => x.startsWith('astro:'));
      if (a) punta(a.slice(6));
    }
    disegnaFinder();
    Motore.sporco();
  }
  function punta(nome) {
    const al = ALLINEAMENTI.find((x) => x.id === pr.al);
    if (al && nome === al.stelle[2]) {
      pr.trovate.add(al.id); salvaTrovate();
      if (pr.trovate.size >= 2) lez.completa('allinea');
      pr.esito = { tipo: 'giusto', testo: `${nome}: trovata. ${pr.trovate.size >= 2 ? '' : 'Ora un altro allineamento.'}` };
      return;
    }
    const v = Cielo.vistoDallaNave(nome);
    pr.esito = { tipo: 'neutro', testo: `${nome}: altezza ${Cielo.ang(v.h)}, azimut ${Cielo.ang(v.a, { tre: true })}.` };
  }
  function rispondi(nome) {
    const scarto = Math.abs(Cielo.norm(pr.ts - tsLocale() + 180) - 180);
    if (scarto > 3) { pr.esito = { tipo: 'errato', testo: 'Prima orienta il disco: la freccia va sul tempo sidereo locale.' }; return; }
    if (nome === pr.incognito) { lez.completa('finder'); pr.esito = { tipo: 'giusto', testo: `È ${nome}. Cercala nel cielo, all'azimut indicato.` }; } else pr.esito = { tipo: 'errato', testo: `Non è ${nome}: guarda dove si incrociano l'almicantarat e il verticale.` };
  }
  function istruzioni() {
    if (!lez.fatte.has('ora')) return 'Prova le ore: crepuscolo serale, mezzanotte, crepuscolo mattutino. Quando si può osservare, premi **Si può osservare?**';
    if (!lez.fatte.has('allinea')) return 'Scegli un allineamento fra quelli visibili: segui la linea gialla e punta la stella dove arriva.';
    if (!lez.fatte.has('finder')) return `Star finder, sotto la vista del cielo: porta la freccia su tₛ = ${Cielo.ang(tsLocale(), { tre: true })}, poi cerca l'astro incognito nel reticolo.`;
    return 'Missioni fatte. Vai avanti.';
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei in controplancia. Punta una stella col controller.' : 'Vai a grandezza vera per stare sul ponte.' });
  const RISPOSTE = { si: 'Sì: il cielo è più buio e le stelle si vedono meglio', no: 'No: manca qualcosa per misurare', luna: 'Solo con la Luna piena' };
  function righeAllineamenti() {
    const vis = visibili();
    const lista = ALLINEAMENTI.map((a) => ({ id: `al:${a.id}`, testo: a.testo, on: pr.al === a.id, off: !vis.includes(a) }));
    return [0, 2, 4].map((i) => ({ t: 'bottoni', h: 84, size: 30, lista: lista.slice(i, i + 2) }));
  }
  function crepuscoli() {
    const fmt = (t) => (t ? Cielo.ora(t).slice(0, 5) : '—');
    const inizio = Cielo.stato.data - 864e5 / 2;
    const r = (alt) => [fmt(Cielo.istanteSole(alt, +1, inizio)), fmt(Cielo.istanteSole(alt, -1, inizio))];
    const civ = r(-6); const nau = r(-12); const sole = r(0);
    return [['', 'Mattino', 'Sera'], ['Sole a 0°', sole[0], sole[1]], ['Sole a −6°', civ[0], civ[1]], ['Sole a −12°', nau[0], nau[1]]];
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const sole = Cielo.vistoDallaNave('Sole').h;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Riconoscere le stelle' },
          { t: 'p', size: 38, testo: 'In mare la difficoltà più grande è capire quale astro si sta guardando. Le stelle fisse utili per la navigazione sono solo 66: si possono imparare. {{p. 82}}' },
          { t: 'p', size: 38, testo: 'Il sistema più immediato: partire da costellazioni facili e seguire gli **allineamenti** fra le loro stelle. {{p. 82}}' },
          { t: 'riquadro', size: 34, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · Sole a ${Cielo.ang(sole)} · ${Cielo.luogo()}` },
        ],
        dx: [finestra(900), ...scala(), { t: 'nota', testo: 'Posizioni calcolate con Astronomy Engine e Bright Star Catalogue.' }],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Per misurare un\'altezza col sestante porti la stella a toccare l\'orizzonte.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Si possono fare osservazioni di stelle a mezzanotte?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'ora', nome: `Ora (UTC) · Sole a ${Cielo.ang(sole)}`, valore: Cielo.ora().slice(0, 5) },
          { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'serale', testo: 'Crepuscolo serale' }, { id: 'mezzanotte', testo: 'Mezzanotte' }, { id: 'mattutino', testo: 'Crepuscolo mattutino' }] },
          { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'osserva', testo: 'Si può osservare?', on: true }] },
          ...righeAllineamenti(),
          { t: 'passo', id: 'ts', nome: 'Star finder: freccia su tₛ', valore: `${Math.round(pr.ts)}°` },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(470), ...scala(),
          { t: 'zona', id: 'lente', h: LH },
          ...(pr.scelte.length ? [{ t: 'bottoni', h: 80, size: 32, lista: [...pr.scelte.map((n) => ({ id: `sf:${n}`, testo: n })), { id: 'altro', testo: 'Un altro' }] }] : [{ t: 'nota', testo: 'Nessuna stella brillante alta abbastanza: cambia ora.' }]),
          { t: 'riquadro', size: 32, testo: istruzioni() },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Il crepuscolo nautico' },
          ...(p ? [{ t: 'nota', testo: p === 'no' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 38, testo: 'A mezzanotte le stelle si vedono bene, ma l\'**orizzonte** no: col sestante non si misura. Nel **crepuscolo nautico**, con il Sole fra −6° e −12°, si vedono le stelle più luminose e anche l\'orizzonte. Dura circa mezz\'ora. {{p. 32, tab. 1.8}}' },
          { t: 'tabella', col: [40, 30, 30], size: 32, righe: crepuscoli() },
          { t: 'nota', testo: `Oggi, ${Cielo.luogo()}, ore UTC calcolate con Astronomy Engine.` },
        ],
        dx: [
          { t: 'p', size: 36, testo: 'Non tutte le stelle si vedono in ogni stagione: quando sono vicine al Sole sulla sfera, sorgono e tramontano con lui e di notte non ci sono. {{p. 85}}' },
          { t: 'sotto', testo: 'Gli allineamenti del libro' },
          { t: 'p', size: 34, testo: 'Merak–Dubhe, prolungato di circa 5 volte, porta alla **Polare**; al contrario porta al **Leone**, con Regolo. La coda dell\'Orsa Maggiore conduce ad **Arturo**; Arturo e Alphecca a **Vega**. {{pp. 82–85}}' },
          { t: 'p', size: 34, testo: 'Da Orione: Bellatrix–Betelgeuse porta a **Procione**, Rigel–Betelgeuse ai **Gemelli**. {{p. 83}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Lo star finder' },
          { t: 'p', size: 36, testo: 'Un disco rigido porta le **57 stelle fisse** più luminose: un lato centrato sul polo Nord, l\'altro sul polo Sud. Il bordo è graduato da 0° a 360°. {{p. 87}}' },
          { t: 'p', size: 36, testo: 'Sopra si mette uno dei **9 dischi trasparenti**, per le latitudini da 5° a 85°, con il reticolo di verticali e almicantarat. Si scelgono il disco più vicino alla propria latitudine e il lato con lo stesso nome. {{pp. 87–88}}' },
        ],
        dx: [
          { t: 'p', size: 36, testo: 'Si ruota il disco trasparente finché la freccia, che indica il mezzo cielo superiore, segna il **tempo sidereo locale**: il reticolo dice, in modo approssimato, quale astro ha l\'altezza e l\'azimut misurati. {{p. 88}}' },
          { t: 'p', size: 36, testo: 'Serve anche a preparare le osservazioni: il «calepino delle osservazioni» sceglie in anticipo le stelle da osservare, ben distribuite sull\'orizzonte. {{p. 88}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
