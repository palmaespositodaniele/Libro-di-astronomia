/* Esperienza 3: tre sistemi di coordinate. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2: § 1.1 (pp. 11–13), § 1.2 con tabella 1.1 ed esempi di conversione (pp. 14–17),
   sistema equatoriale uranografico (p. 29). Regole in design.md */
(function () {
  const N = 3;
  const { COL, tratto, etichetta } = Tavola;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'tre', testo: 'Guarda l\'astro nei tre sistemi di coordinate.' },
    { id: 'annota', testo: 'Annota le sue coordinate.' },
    { id: 'sposta', testo: 'Sposta la nave di almeno 10° e annotale di nuovo.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'L\'azimut *a* si conta…', scelte: ['da Nord, in senso orario, da 0° a 360°', 'da Sud, verso Est, da 0° a 180°', 'dall\'equatore celeste, da 0° a 90°'], giusta: 0, perche: 'Azimut: da 0° a 360° a partire dal Nord, in senso orario. L\'angolo azimutale Z invece va da 0° a 90° (quadrantale) o a 180°. {{p. 14, tab. 1.1}}' },
    { n: 2, testo: 'Il tempo *t* di un astro si conta…', scelte: ['dal meridiano superiore, verso W, da 0° a 360°', 'dal punto γ, verso E', 'dall\'orizzonte verso lo zenit'], giusta: 0, perche: 'Il tempo va da 0° a 360° in senso retrogrado, verso W. L\'angolo al polo P va da 0° a 180°, E o W. {{p. 14, tab. 1.1}}' },
    { n: 3, testo: 'La distanza zenitale *z* è…', scelte: ['90° − h', '90° − δ', '360° − a'], giusta: 0, perche: 'È l\'arco di verticale fra lo zenit e l\'astro: il complemento dell\'altezza. {{p. 14, tab. 1.1}}' },
    { n: 4, testo: 'Il sistema locale orario usa come riferimenti…', scelte: ['l\'equatore celeste e il meridiano dell\'osservatore', 'l\'orizzonte e il meridiano', 'l\'eclittica e il punto γ'], giusta: 0, perche: 'Declinazione dall\'equatore, tempo dal meridiano superiore dell\'osservatore: per questo è un sistema *locale*. {{p. 14}}' },
    { n: 5, testo: 'La co-ascensione retta 360° − α si conta…', scelte: ['dal punto γ, in senso retrogrado', 'dal meridiano di Greenwich, verso E', 'dal Nord, in senso orario'], giusta: 0, perche: 'L\'ascensione retta α si conta dal punto γ in senso diretto; la co-ascensione retta in senso retrogrado. {{p. 29, tab. 1.7}}' },
    { n: 6, testo: 'La declinazione δ…', scelte: ['si conta da 0° a 90°, N o S, dall\'equatore celeste', 'si conta da 0° a 360°', 'si conta sull\'orizzonte astronomico'], giusta: 0, perche: 'È l\'arco di cerchio orario fra l\'equatore celeste e l\'astro, da 0° a 90° N o S. {{p. 14, tab. 1.1}}' },
  ];
  const conv = (n, testo, val, sol) => ({ n, testo, campi: [['gradi', val, 0, '°']], soluzione: sol });
  const CALCOLI = [
    conv(7, 'a = 036°. Scrivi l\'angolo azimutale: Z = N…°E. {{p. 17}}', 36, 'Z = N36°E.'),
    conv(8, 'a = 205°. Z = S…°W. {{p. 17}}', 25, 'a − 180° = 25°: Z = S25°W.'),
    conv(9, 'Z = N15°W. Quanto vale l\'azimut a? {{p. 17}}', 345, 'a = 360° − 15° = 345°.'),
    conv(10, 'Z = S69°E. Quanto vale l\'azimut a? {{p. 17}}', 111, 'a = 180° − 69° = 111°.'),
    conv(11, 't = 320°. Angolo al polo: P = …°E. {{p. 17}}', 40, 'P = 360° − 320° = 040°E.'),
    conv(12, 'P = 110°E. Quanto vale il tempo t? {{p. 17}}', 250, 't = 360° − 110° = 250°.'),
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* I cerchi, uno alla volta ---------------------------------------------------------------------- */
  const CERCHI = [
    { id: 'orizzonte', nome: 'Orizzonte', testo: 'L\'**orizzonte astronomico** (*rational horizon*) è il cerchio massimo perpendicolare alla verticale dell\'osservatore: divide la sfera nell\'emisfero visibile, con lo **Zenit**, e invisibile, con il **Nadir**. {{p. 12}}' },
    { id: 'meridiano', nome: 'Meridiano', testo: 'Il **meridiano dell\'osservatore** passa per i poli celesti, lo Zenit e il Nadir. Il **meridiano superiore** contiene lo Zenit, l\'**inferiore** il Nadir. {{p. 13}}' },
    { id: 'equatore', nome: 'Equatore', testo: 'L\'**equatore celeste** (*celestial equator*) è perpendicolare all\'asse del mondo. I cerchi minori paralleli a lui sono i **paralleli di declinazione**. {{p. 12}}' },
    { id: 'asse', nome: 'Asse del mondo', testo: 'L\'**asse del mondo** unisce i **poli celesti**: è il prolungamento dell\'asse di rotazione della Terra. I cerchi massimi che lo contengono sono gli **orari** (*celestial meridians*). {{p. 12}}' },
    { id: 'eclittica', nome: 'Eclittica', testo: 'L\'**eclittica** è il cammino apparente del Sole in un anno: taglia l\'equatore celeste nei due punti equinoziali, uno dei quali è il **punto γ**. {{pp. 28–29}}' },
  ];
  const ASTRI = ['Sirio', 'Vega', 'Arturo', 'Capella', 'Canopo', 'Betelgeuse', 'Altair', 'Antares', 'Polare', 'Sole', 'Luna'];
  const sf = { cerchio: 'orizzonte', sistema: 'altaz', astro: 'Vega', c: null, visti: new Set() };
  const SISTEMI = { altaz: 'Altazimutale', orario: 'Orario', equat: 'Equatoriale' };

  // Il sistema equatoriale uranografico: punto γ, cerchio orario dell'astro, declinazione e 360° − α
  function equatoriale(s, k) {
    const g = new THREE.Group(); const R = 10; const r = 0.022 * R * Math.sqrt(k) * 0.5;
    const pe = (de, al) => new THREE.Vector3(Math.cos(de) * Math.cos(al), Math.cos(de) * Math.sin(al), Math.sin(de)).multiplyScalar(R * 1.004);
    const gamma = etichetta('γ', R * 0.09 * Math.min(k, 2), '#9A5B12'); gamma.position.set(R * 1.1, 0, 0);
    s.v.eq.add(g, gamma);
    return {
      g, gamma,
      rifai(c) {
        g.children.forEach((x) => x.geometry.dispose()); g.clear();
        if (!c) return;
        const ra = (360 - c.sha) * RAD; const de = c.dec * RAD;
        const ora = []; for (let i = 0; i <= 64; i++) ora.push(pe(-Math.PI / 2 + (i / 64) * Math.PI, ra));
        g.add(tratto(ora, r * 0.8, 0x4A76A8));
        const d = []; for (let i = 0; i <= 24; i++) d.push(pe((de * i) / 24, ra));
        g.add(tratto(d, r * 1.6, COL.ocra));
        const sha = c.sha * RAD; const w = []; for (let i = 0; i <= 64; i++) w.push(pe(0, -(sha * i) / 64));
        if (c.sha > 1) g.add(tratto(w, r * 1.1, COL.ocra));
      },
    };
  }
  const sferaBase = Scene.sfera({ ogni: () => { rifai(); Motore.ridisegna(); } });
  let eqs = null;
  function mondo() {
    const m = sferaBase();
    if (!eqs) {
      eqs = [equatoriale(m.sfera, 1), equatoriale(m.sferaMini, 5)];
      setTimeout(() => { rifai(); Motore.ridisegna(); }, 0);
    }
    return m;
  }
  function rifai(soloCerchi) {
    const m = sferaBase();
    const prova = soloCerchi === false;
    const accesi = prova ? { orizzonte: true, meridiano: true, equatore: true, asse: true, eclittica: false } : null;
    Object.keys(m.sfera.CERCHI).forEach((k) => {
      const on = accesi ? accesi[k] : k === sf.cerchio || (k === 'asse' && sf.cerchio === 'equatore');
      m.sfera.CERCHI[k].visible = on; m.sferaMini.CERCHI[k].visible = on;
    });
    // La sfera si riorienta di solito al fotogramma dopo: qui serve subito, prima di leggere le coordinate
    m.sfera.v.aggiorna(); m.sferaMini.v.aggiorna();
    const sis = sf.sistema === 'equat' ? 'nessuno' : sf.sistema;
    sf.c = m.sfera.ricostruisci(sf.astro, sis); m.sferaMini.ricostruisci(sf.astro, sis);
    if (eqs) eqs.forEach((e) => { e.rifai(sf.sistema === 'equat' ? sf.c : null); e.gamma.visible = sf.sistema === 'equat' || sf.cerchio === 'eclittica'; });
  }
  // Nel Concetto i cerchi si accendono uno alla volta; nella prova si vedono tutti quelli dei sistemi
  let inProva = false;
  const rifaiQui = () => rifai(inProva ? false : undefined);

  function coordinate(c) {
    if (!c) return 'Scegli un astro.';
    const P = c.t < 180 ? `${Cielo.ang(c.t, { tre: true })}W` : `${Cielo.ang(360 - c.t, { tre: true })}E`;
    if (sf.sistema === 'altaz') return `**${sf.astro}** · altezza h ${Cielo.ang(c.h)} · azimut a ${Cielo.ang(c.a, { tre: true })}`;
    if (sf.sistema === 'orario') return `**${sf.astro}** · declinazione δ ${Cielo.ang(c.dec, { segno: 'NS' })} · tempo t ${Cielo.ang(c.t, { tre: true })} · P ${P}`;
    return `**${sf.astro}** · declinazione δ ${Cielo.ang(c.dec, { segno: 'NS' })} · 360° − α ${Cielo.ang(c.sha, { tre: true })}`;
  }
  const SPIEGA = {
    altaz: 'In ocra l\'**altezza**, sul verticale dell\'astro, e l\'**azimut**, sull\'orizzonte da Nord verso Est. {{p. 14}}',
    orario: 'In ocra la **declinazione**, sul cerchio orario dell\'astro, e il **tempo**, sull\'equatore dal meridiano superiore verso W. {{p. 14}}',
    equat: 'In ocra la **declinazione** e la **co-ascensione retta** 360° − α, sull\'equatore dal punto γ in senso retrogrado. {{p. 30}}',
  };

  /* La prova: lo stesso astro, la nave che si sposta -------------------------------------------- */
  const pr = { esito: null, A: null, B: null };
  function fotografa() {
    const s = Cielo.stato; const c = sf.c;
    return { astro: sf.astro, lat: s.lat, lon: s.lon, h: c.h, a: c.a, dec: c.dec, t: c.t, sha: c.sha };
  }
  function comandiComuni(id) {
    if (id.startsWith('sis:')) { sf.sistema = id.slice(4); sf.visti.add(sf.sistema); if (inProva && sf.visti.size === 3) lez.completa('tre'); }
    if (id === 'astro-' || id === 'astro+') {
      const i = ASTRI.indexOf(sf.astro); sf.astro = ASTRI[(i + (id === 'astro+' ? 1 : ASTRI.length - 1)) % ASTRI.length];
      pr.A = null; pr.B = null;
    }
    if (id.startsWith('t:')) { const a = id.slice(2).split(',').find((x) => x.startsWith('astro:')); if (a) { sf.astro = a.slice(6); pr.A = null; pr.B = null; } }
  }
  function comandiConcetto(id) {
    inProva = false;
    if (id.startsWith('c:')) sf.cerchio = id.slice(2);
    comandiComuni(id);
    rifaiQui(); Motore.sporco();
  }
  function comandiProva(id) {
    inProva = true;
    comandiComuni(id);
    const s = Cielo.stato;
    if (id === 'lat-' || id === 'lat+') Cielo.imposta({ lat: Math.max(-80, Math.min(80, Math.round(s.lat) + (id === 'lat+' ? 5 : -5))), luogo: '' });
    if (id === 'lon-' || id === 'lon+') Cielo.imposta({ lon: Math.round(s.lon) + (id === 'lon+' ? 5 : -5), luogo: '' });
    if (id === 'procida') { const l = Cielo.LUOGHI.procida; Cielo.imposta({ lat: l.lat, lon: l.lon, luogo: 'procida' }); }
    rifaiQui();
    if (id === 'annota') annota();
    Motore.sporco();
  }
  function annota() {
    const f = fotografa();
    if (!pr.A || pr.A.astro !== f.astro) { pr.A = f; pr.B = null; lez.completa('annota'); pr.esito = { tipo: 'giusto', testo: 'Annotato. Ora sposta la nave e annota di nuovo.' }; return; }
    const spost = Math.max(Math.abs(f.lat - pr.A.lat), Math.abs(Cielo.norm(f.lon - pr.A.lon + 180) - 180));
    if (spost < 10) { pr.esito = { tipo: 'errato', testo: 'La nave si è spostata meno di 10°: muovila ancora in latitudine o in longitudine.' }; return; }
    pr.B = f; lez.completa('sposta');
    pr.esito = { tipo: 'giusto', testo: 'Annotato di nuovo. Confronta le due colonne.' };
  }
  function tabella() {
    const A = pr.A; const B = pr.B;
    if (!A) return [{ t: 'p', size: 36, testo: 'Premi **Annota** per scrivere qui le coordinate.' }];
    const cambia = (x, y) => (!B ? '' : Math.abs(Cielo.norm(x - y + 180) - 180) > 0.05 ? 'sì' : 'no');
    const riga = (nome, k, f) => [nome, f(A[k]), B ? f(B[k]) : '', cambia(A[k], B ? B[k] : 0)];
    const tre = (g) => Cielo.ang(g, { tre: true });
    return [{ t: 'tabella', col: [30, 27, 27, 16], size: 30, righe: [
      [A.astro, 'Prima', 'Dopo', 'Cambia?'],
      ['Nave', `${Cielo.ang(A.lat, { segno: 'NS' }).replace(/,\d′/, '′')} ${tre(A.lon).replace(/,\d′/, '′')}`, B ? `${Cielo.ang(B.lat, { segno: 'NS' }).replace(/,\d′/, '′')} ${tre(B.lon).replace(/,\d′/, '′')}` : '', ''],
      riga('Altezza h', 'h', Cielo.ang), riga('Azimut a', 'a', tre),
      riga('Declinazione δ', 'dec', (g) => Cielo.ang(g, { segno: 'NS' })), riga('Tempo t', 't', tre), riga('360° − α', 'sha', tre),
    ] }];
  }
  let provaPronta = false;
  function mondoProva() {
    const m = mondo();
    if (!provaPronta) { provaPronta = true; Cielo.imposta({ corre: false }); }
    inProva = true; setTimeout(() => { rifaiQui(); Motore.ridisegna(); }, 0);
    return m;
  }
  function mondoConcetto() { const m = mondo(); inProva = false; setTimeout(() => { rifaiQui(); Motore.ridisegna(); }, 0); return m; }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei al centro della sfera, al posto dell\'osservatore.' : 'Punta la sfera e tieni premuto il grilletto per girarla.' });
  const sistemi = () => ({ t: 'bottoni', h: 80, size: 32, lista: Object.keys(SISTEMI).map((k) => ({ id: `sis:${k}`, testo: SISTEMI[k], on: sf.sistema === k })) });
  const RISPOSTE = { altaz: 'Altezza e azimut', dec: 'Declinazione e 360° − α', tutte: 'Tutte quante' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const cerchio = CERCHI.find((x) => x.id === sf.cerchio);
    const s = Cielo.stato;
    return [
      {
        passo: 0, mondo: mondoConcetto, azione: comandiConcetto,
        sx: [
          { t: 'titolo', testo: 'Tre sistemi di coordinate' },
          { t: 'p', size: 38, testo: 'Per dire dove sta un astro servono dei cerchi di riferimento sulla **sfera celeste**: al centro c\'è l\'osservatore. Accendili uno alla volta. {{p. 11}}' },
          { t: 'bottoni', h: 80, size: 32, lista: CERCHI.slice(0, 3).map((x) => ({ id: `c:${x.id}`, testo: x.nome, on: sf.cerchio === x.id })) },
          { t: 'bottoni', h: 80, size: 32, lista: CERCHI.slice(3).map((x) => ({ id: `c:${x.id}`, testo: x.nome, on: sf.cerchio === x.id })) },
          { t: 'riquadro', size: 36, testo: cerchio.testo },
        ],
        dx: [finestra(900), ...scala(), { t: 'nota', testo: 'La sfera non è in scala. Stelle e cerchi calcolati per il luogo e l\'istante del cielo condiviso.' }],
      },
      {
        passo: 0, mondo: mondoConcetto, azione: comandiConcetto,
        sx: [
          { t: 'titolo', testo: 'Lo stesso astro, tre modi' },
          { t: 'p', size: 36, testo: '**Altazimutale**: altezza h e azimut a, dall\'orizzonte. **Locale orario**: declinazione δ e tempo t, dall\'equatore e dal meridiano dell\'osservatore. {{p. 14, tab. 1.1}}' },
          { t: 'p', size: 36, testo: '**Equatoriale uranografico**: declinazione δ e co-ascensione retta 360° − α, dall\'equatore e dal punto γ. {{p. 30}}' },
          sistemi(),
          { t: 'passo', id: 'astro', nome: 'Astro osservato', valore: sf.astro },
          { t: 'riquadro', size: 34, testo: SPIEGA[sf.sistema] },
        ],
        dx: [finestra(900), ...scala(), { t: 'riquadro', size: 34, testo: coordinate(sf.c) }],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il tempo è fermo. Guardi un astro e annoti le sue coordinate; poi la nave si sposta di qualche grado.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Spostando la nave, quali coordinate dell\'astro cambiano?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo: mondoProva, azione: comandiProva, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'astro', nome: 'Astro', valore: sf.astro },
          sistemi(),
          { t: 'passo', id: 'lat', nome: 'Latitudine della nave', valore: Cielo.ang(s.lat, { segno: 'NS' }) },
          { t: 'passo', id: 'lon', nome: 'Longitudine della nave', valore: Cielo.ang(s.lon, { segno: 'EW', tre: true }) },
          { t: 'bottoni', h: 84, lista: [{ id: 'annota', testo: 'Annota', on: true }, { id: 'procida', testo: 'Torna a Procida' }] },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [finestra(700), ...scala(), { t: 'riquadro', size: 34, testo: coordinate(sf.c) }, ...tabella()],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Che cosa è cambiato' },
          ...(p ? [{ t: 'nota', testo: `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          ...tabella(),
        ],
        dx: [
          { t: 'p', size: 38, testo: 'Altezza e azimut si contano dall\'orizzonte e dal meridiano dell\'osservatore; anche il tempo si conta dal suo meridiano. Sono coordinate **locali**: cambiano se l\'osservatore si sposta. {{p. 14}}' },
          { t: 'p', size: 38, testo: 'Declinazione e 360° − α si contano dall\'equatore celeste e dal punto γ, che non dipendono dall\'osservatore: per questo le **effemeridi** danno queste coordinate. {{p. 29}}' },
          { t: 'nota', testo: 'Con il tempo fermo cambiano h, a e t; δ e 360° − α restano uguali.' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Da una forma all\'altra' },
          { t: 'p', size: 36, testo: 'L\'**angolo azimutale** Z (*quadrantale*) va da 0° a 90°, contato da N o da S verso E o W. L\'**angolo al polo** P va da 0° a 180°, E o W. {{p. 14, tab. 1.1}}' },
          { t: 'tabella', col: [50, 50], size: 34, righe: [['Dato', 'Si scrive'], ['a = 036°', 'Z = N36°E'], ['a = 205°', 'Z = S25°W'], ['Z = N15°W', 'a = 345°'], ['Z = S69°E', 'a = 111°']] },
        ],
        dx: [
          { t: 'tabella', col: [50, 50], size: 34, righe: [['Dato', 'Si scrive'], ['t = 136°', 'P = 136°W'], ['t = 320°', 'P = 040°E'], ['P = 006°W', 't = 006°'], ['P = 110°E', 't = 250°']] },
          { t: 'nota', testo: 'Esempi del libro. (p. 17)' },
          { t: 'p', size: 36, testo: 'Tempo minore di 180°: l\'astro è a W del meridiano, P = t. Maggiore: è a E, P = 360° − t.' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Conversioni' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Scrivi solo i gradi: il nome (N, S, E, W) è già nella domanda.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
