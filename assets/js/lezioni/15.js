/* Esperienza 15: la sfida della longitudine. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2: il Board of Longitude e il premio (p. 41), 4 minuti per grado di longitudine (p. 48, a margine), John
   Harrison e il suo quarto orologio (p. 50, a margine), ora e longitudine e il cronometro del XVIII secolo (p. 117),
   l'errore sul tempo sposta la circonferenza d'altezza a Est o a Ovest (p. 130, a margine). Il libro non ha esercizi
   numerici su questo: solo domande. Regole in design.md */
(function () {
  const N = 15;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'grado', testo: 'Sbaglia l\'orologio di 4 minuti: di quanto sbagli la longitudine?' },
    { id: 'premio', testo: 'Porta l\'errore a 2 minuti, il limite del premio del Board of Longitude.' },
    { id: 'harrison', testo: 'Ora l\'errore del quarto orologio di Harrison: 5 secondi.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Un minuto di tempo corrisponde a…', scelte: ['1′ di longitudine', '15′ di longitudine', '1° di longitudine'], giusta: 1, perche: 'La Terra gira di 360° in 24 ore: 15° all\'ora, 1° ogni 4 minuti, 15′ ogni minuto. {{p. 48}}' },
    { n: 2, testo: 'Perché per la longitudine serve un orologio?', scelte: ['Perché lo stesso cielo lo vedono, in tempi diversi, tutti gli osservatori sullo stesso parallelo', 'Perché le stelle si muovono', 'Non serve: basta il sestante'], giusta: 0, perche: 'Ora e longitudine sono strettamente legate: serve uno strumento che dia l\'istante preciso, cosa non possibile fino al cronometro marino del XVIII secolo. {{p. 117}}' },
    { n: 3, testo: 'Per la latitudine, invece…', scelte: ['serve un cronometro preciso al secondo', 'basta il sestante: un\'altezza meridiana', 'serve la Luna'], giusta: 1, perche: 'Con il solo sestante la latitudine è facile da trovare (capitolo 6); la longitudine fu un «problema». {{p. 117}}' },
    { n: 4, testo: 'Il Board of Longitude fu istituito nel…', scelte: ['1492', '1714', '1884'], giusta: 1, perche: 'Nel 1714 il Parlamento inglese istituì il Board of Longitude, con premi fino a 20 000 sterline per un orologio abbastanza preciso. {{p. 41}}' },
    { n: 5, testo: 'L\'orologio del premio doveva sbagliare, in una traversata atlantica, meno di…', scelte: ['2 minuti', '2 secondi', '2 ore'], giusta: 0, perche: 'Meno di 2 minuti in una traversata dell\'Atlantico: mezzo grado di longitudine. {{p. 41}}' },
    { n: 6, testo: 'Un errore sul tempo del cronometro sposta la circonferenza d\'altezza…', scelte: ['verso Nord o verso Sud', 'verso Est o verso Ovest', 'non la sposta'], giusta: 1, perche: 'L\'errore sul tempo cronometro sposta la circonferenza d\'altezza verso Est o verso Ovest. {{p. 130}}' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  /* La prova: la nave vera e la nave «calcolata» con l'orologio sbagliato -------------------------------------- */
  const pr = { errore: 0, esito: null, pronto: false }; // secondi: positivo = orologio avanti
  // Con l'orologio avanti si crede che sia più tardi: T più grande, λ = t − T più a Ovest. 1 s = 15″ di longitudine
  const lonCalcolata = () => Cielo.stato.lon - (pr.errore * 15) / 3600;
  const segni = [];
  function disegna() {
    const m = globo();
    [m.terra, m.terraMini].forEach((t, i) => {
      if (segni[i]) { t.fisso.remove(segni[i]); segni[i].traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      const g = new THREE.Group(); segni[i] = g; t.fisso.add(g);
      if (!pr.errore) return;
      const s = Cielo.stato; const lc = lonCalcolata();
      g.add(t.punto(s.lat, lc, 0xB3362B, 0.06));
      // L'arco di parallelo fra le due navi
      const p = []; const n = 24;
      for (let k = 0; k <= n; k++) p.push(Globo.sullaTerra(s.lat, s.lon + ((lc - s.lon) * k) / n, t.R * 1.012));
      g.add(Tavola.tratto(p, t.R * 0.012, 0xB3362B));
      if (i === 0) { const e = t.etichetta('dove credi di essere', 0.9, '#8E2A21'); e.position.copy(Globo.sullaTerra(s.lat - 6, lc, t.R * 1.12)); g.add(e); }
    });
  }
  const globo = Scene.globo({});
  function mondo() {
    const m = globo();
    if (!pr.pronto) {
      pr.pronto = true;
      const L = Cielo.LUOGHI.procida; Cielo.imposta({ lat: L.lat, lon: L.lon, luogo: 'procida', corre: false });
      m.vistaIniziale = () => {
        const s = Cielo.stato; const A = s.lon + Cielo.tGamma(Cielo.tempo());
        return { target: new THREE.Vector3(0, 0, 0), theta: (90 + A) * RAD, phi: (90 - s.lat * 0.7) * RAD, r: 46 };
      };
      setTimeout(() => { disegna(); Motore.ridisegna(); }, 0);
    }
    return m;
  }
  Cielo.ascolta((cosa) => { if (pr.pronto && cosa && !cosa.tempo) disegna(); });

  const primi = (x) => `${x.toFixed(2).replace('.', ',').replace(/,?0+$/, '')}′`;
  function controlla() {
    const e = Math.abs(pr.errore); const dl = (e * 15) / 60; // primi di longitudine
    const miglia = dl * Math.cos(Cielo.stato.lat * RAD);
    if (!e) { pr.esito = null; return; }
    const quanto = `${e >= 60 ? `${Math.floor(e / 60)} min ` : ''}${e % 60 ? `${e % 60} s` : ''}`.trim();
    let testo = `Orologio ${pr.errore > 0 ? 'avanti' : 'indietro'} di ${quanto}: la longitudine sbaglia di ${dl >= 60 ? Cielo.ang(dl / 60) : primi(dl)}, verso ${pr.errore > 0 ? 'Ovest' : 'Est'}. A questa latitudine sono ${miglia.toFixed(1).replace('.', ',')} miglia.`;
    if (e === 240) { lez.completa('grado'); testo += ' 4 minuti, 1 grado.'; }
    if (e === 120) { lez.completa('premio'); testo += ' È mezzo grado: il limite del premio del 1714.'; }
    if (e === 5) { lez.completa('harrison'); testo += ' Il quarto orologio di Harrison, fra la Gran Bretagna e la Giamaica.'; }
    pr.esito = { tipo: e === 240 || e === 120 || e === 5 ? 'giusto' : 'nota', testo };
  }
  function comandi(id) {
    const d = { 'orologio-4m': -240, 'orologio-1m': -60, 'orologio-5s': -5, 'orologio+5s': 5, 'orologio+1m': 60, 'orologio+4m': 240 }[id];
    if (d) pr.errore = Math.max(-1200, Math.min(1200, pr.errore + d));
    if (id === 'orologio:giusto') pr.errore = 0;
    controlla(); disegna();
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  function orologio() {
    const e = pr.errore; const a = Math.abs(e);
    return `${e > 0 ? '+' : e < 0 ? '−' : ''}${Math.floor(a / 60)} min ${a % 60} s`;
  }
  function riquadro() {
    return { t: 'riquadro', size: 32, testo: `Nave vera: ${Cielo.luogo()} · errore dell'orologio ${orologio()} · longitudine calcolata ${Cielo.ang(lonCalcolata(), { segno: 'EW', tre: true })}` };
  }
  const RISPOSTE = { ora: 'Perché la Terra gira: ora e longitudine sono legate', notte: 'Per sapere quando è notte', non: 'Non serve: basta il sestante' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'La sfida della longitudine' },
          { t: 'p', size: 38, testo: 'Con il solo sestante la latitudine è facile. La longitudine fu invece un «problema»: per risolverlo il Parlamento inglese istituì il **Board of Longitude**. {{p. 117}}' },
          { t: 'p', size: 38, testo: 'Nel **1714** il Board definì premi fino a **20 000 sterline** per chi avesse costruito un orologio capace di non sbagliare più di **2 minuti** in una traversata dell\'Atlantico. {{p. 41}}' },
          riquadro(),
        ],
        dx: [
          finestra(900, 'Sei nello spazio, davanti alla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          { t: 'nota', testo: 'Il pallino arancio è la nave vera, al largo di Procida.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco navigherai con un orologio che sbaglia, e vedrai dove credi di essere.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Perché per la longitudine serve un orologio?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'L\'errore dell\'orologio di bordo' },
          { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'orologio-4m', testo: '−4 min' }, { id: 'orologio-1m', testo: '−1 min' }, { id: 'orologio-5s', testo: '−5 s' }, { id: 'orologio+5s', testo: '+5 s' }, { id: 'orologio+1m', testo: '+1 min' }, { id: 'orologio+4m', testo: '+4 min' }] },
          { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'orologio:giusto', testo: 'Orologio giusto', on: !pr.errore }] },
          riquadro(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(900, 'Guarda le due navi sulla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          { t: 'nota', testo: 'Il pallino rosso è dove ti mettono i calcoli con l\'orologio sbagliato: stessa latitudine, longitudine diversa.' },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Ora e longitudine' },
          ...(p ? [{ t: 'nota', testo: p === 'ora' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 36, testo: 'Ogni osservatore, in un istante, ha la sua sfera celeste; la stessa sfera la vedono, in tempi diversi, gli osservatori sullo stesso parallelo a longitudini diverse. Per questo serve a bordo uno strumento che dia l\'istante preciso: fu possibile solo con il **cronometro marino**, nel XVIII secolo. {{p. 117}}' },
          { t: 'formula', testo: '4 min = 1°      1 min = 15′' },
          { t: 'nota', testo: 'A margine di p. 48.' },
        ],
        dx: [
          finestra(560, 'Guarda le due navi sulla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          { t: 'p', size: 34, testo: 'Un errore sul tempo del cronometro sposta la circonferenza d\'altezza verso **Est o Ovest**: la latitudine resta, la longitudine sbaglia. {{p. 130}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'John Harrison' },
          { t: 'p', size: 36, testo: '**John Harrison**, carpentiere dello Yorkshire, presentò i suoi prototipi di orologio dal **1735**. Il quarto sbagliò di soli **5 secondi** fra la Gran Bretagna e la Giamaica. {{p. 50}}' },
          { t: 'p', size: 36, testo: 'Il premio lo ebbe soltanto nel **1772**. {{p. 50}}' },
        ],
        dx: [
          { t: 'tabella', col: [50, 25, 25], size: 30, righe: [['Errore dell\'orologio', 'Longitudine', 'Fonte'], ['4 minuti', '1°', 'p. 48'], ['2 minuti (limite del premio)', '30′', 'p. 41'], ['5 secondi (Harrison)', '1,25′', 'p. 50']] },
          { t: 'nota', testo: 'Le longitudini della tabella vengono dalla regola di p. 48: 1 minuto = 15′.' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle pagine di storia del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
