/* Esperienza 14: controllo della bussola con un astro. Contenuti da «Fondamenti di Navigazione e Meteorologia
   nautica» vol. 2, cap. 7: correzione gyro e variazione (7.1, 7.2, p. 105), quando osservare e la formula 7.3 con
   l'esempio di Marte (p. 106), amplitudine marina 7.5 e 7.6 con l'esempio del 18/04/2015 (p. 107), tavola 17
   (p. 108); esercizi 5–10 a p. 110. Dal vol. 1, p. 144: la deviazione cambia con la prora. Il libro non dà i
   risultati degli esercizi: li calcola il motore e la pagina lo dice. La bussola magnetica nella sospensione
   cardanica (modello 3D del docente) con il vol. 1, pp. 155–156. Regole in design.md */
(function () {
  const N = 14;
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;
  const v1 = (x) => x.toFixed(1).replace('.', ',');
  const az = (x) => { const r = Math.round((((x % 360) + 360) % 360) * 10) / 10; const g = Math.floor(r); return `${String(g % 360).padStart(3, '0')},${Math.round((r - g) * 10)}°`; };
  const segnoEW = (x) => `${v1(Math.abs(x))}°${x >= 0 ? 'E' : 'W'}`;

  const MISSIONI = [
    { id: 'esempio', testo: 'Esempio del libro: aspetta che il lembo superiore del Sole sorga e controlla la gyro.' },
    { id: 'es5', testo: 'Esercizio 5: un\'altra nave, un\'altra prora. Controlla gyro e bussola magnetica al sorgere.' },
    { id: 'es6', testo: 'Esercizio 6: fai lo stesso al tramonto.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'La correzione gyro vale…', scelte: ['c_g = a_v − a_g', 'c_g = a_g − a_v', 'c_g = a_v − a_b'], giusta: 0, perche: 'Si confronta l\'azimut vero calcolato con quello letto alla girobussola: formula 7.1. {{p. 105}}' },
    { n: 2, testo: 'La variazione V = a_v − a_b è…', scelte: ['la sola deviazione', 'declinazione magnetica più deviazione', 'la correzione gyro'], giusta: 1, perche: 'La variazione è la somma algebrica di declinazione magnetica d e deviazione δ: formula 7.2. {{p. 105}}' },
    { n: 3, testo: 'Il momento migliore per il controllo è…', scelte: ['il mezzogiorno', 'il sorgere o il tramonto del Sole', 'la mezzanotte'], giusta: 1, perche: 'L\'astro deve essere basso: il Sole al sorgere o al tramonto, oppure stelle con altezza sotto i 30°. {{p. 105}}' },
    { n: 4, testo: 'Quando il lembo superiore del Sole tocca l\'orizzonte, il centro del Sole è…', scelte: ['a h = 0°', 'a circa h = −55′, sotto l\'orizzonte', 'a h = +20′'], giusta: 1, perche: 'Per la rifrazione il Sole appare più alto di dove è: osservando il lembo superiore il Sole è in realtà a circa −55′. {{p. 107}}' },
    { n: 5, testo: 'L\'amplitudine marina è…', scelte: ['ampl_m = ampl_a + c_a', 'ampl_m = ampl_a − 1°', 'uguale all\'astronomica'], giusta: 0, perche: 'All\'amplitudine astronomica (7.4) si somma la correzione c_a, dalle tavole o dalla 7.6: formula 7.5. {{p. 107}}' },
    { n: 6, testo: 'La deviazione della bussola magnetica…', scelte: ['è la stessa per ogni prora', 'cambia con la prora: si legge sulla tabella delle deviazioni', 'si trova sulle carte nautiche'], giusta: 1, perche: 'La deviazione nasce a bordo e varia con la prora: non è sulle carte, ma sulla tabella delle deviazioni di ogni bussola. {{vol. 1, p. 144}}' },
  ];

  /* L'amplitudine (7.4) corretta per il lembo superiore (7.5, 7.6), e l'azimut vero che ne viene --------------- */
  function amplitudine(fi, dec, verso) {
    const s = Math.sin(Math.abs(dec) * RAD) / Math.cos(fi * RAD);
    const aa = Math.asin(s) / RAD;
    const ca = (0.9 * Math.sin(Math.abs(fi) * RAD)) / Math.sqrt(Math.cos(fi * RAD) ** 2 - Math.sin(dec * RAD) ** 2);
    // Verso Nord con il suo segno: la correzione sposta sempre verso il polo elevato
    const nordA = dec >= 0 ? aa : -aa; const nordM = nordA + (fi >= 0 ? ca : -ca);
    const av = verso > 0 ? 90 - nordM : 270 + nordM;
    const nome = (x) => `${verso > 0 ? 'E' : 'W'}${v1(Math.abs(x))}°${x >= 0 ? 'N' : 'S'}`;
    return { s, aa, ca, nordA, nordM, av: ((av % 360) + 360) % 360, testoA: nome(nordA), testoM: nome(nordM) };
  }

  /* I calcoli: esercizi 7–10 di p. 110 (δ data dal libro) ---------------------------------------------------- */
  const ES = [
    { n: 7, fi: G(8, 45.1), dec: -G(15, 17.2), verso: -1, ag: 254.6, data: '07/02/2015, φ = 08°45,1′N', rif: 'p. 110, es. 7' },
    { n: 8, fi: -G(11, 5.1), dec: -G(23, 1.4), verso: 1, ag: 112.6, data: '12/12/2015, φ = 11°05,1′S', rif: 'p. 110, es. 8' },
    { n: 9, fi: G(23, 48.3), dec: -G(18, 37.3), verso: -1, ag: 249.2, ab: 230.4, d: 16.2, dev: 3.3, data: '15/11/2015, φ = 23°48,3′N', rif: 'p. 110, es. 9' },
    { n: 10, fi: G(7, 25.5), dec: G(19, 32.8), verso: 1, ab: 70.5, d: -2.4, dev: 2.0, data: '26/07/2015, φ = 07°25,5′N', rif: 'p. 110, es. 10' },
  ];
  const CALCOLI = ES.map((x) => {
    const r = amplitudine(x.fi, x.dec, x.verso);
    const av = Math.round(r.av * 10) / 10;
    const campi = [['a_v', av, 0.15, '°']];
    const passi = [`sin ampl = ${r.s.toFixed(4).replace('.', ',')}, ampl_a = ${r.testoA}; c_a = ${v1(r.ca)}° verso il polo elevato; ampl_m = ${r.testoM}; a_v = ${az(av)}`];
    let chiede = 'l\'azimut vero a_v';
    if (x.ag !== undefined) {
      const cg = Math.round((av - x.ag) * 10) / 10;
      campi.push(['|c_g|', Math.abs(cg), 0.15, '°']);
      passi.push(`c_g = a_v − a_g = ${cg >= 0 ? '+' : '−'}${v1(Math.abs(cg))}°`);
      chiede += ' e la correzione gyro (senza segno)';
    }
    if (x.ab !== undefined) {
      const am = av - x.d; const dev = Math.round((am - x.ab) * 10) / 10;
      campi.push(['|δ|', Math.abs(dev), 0.15, '°']);
      passi.push(`a_m = a_v − d = ${az(am)}; δ = a_m − a_b = ${segnoEW(dev)}, contro ${segnoEW(x.dev)} dei dati di bordo`);
      chiede += ' e la deviazione trovata (senza segno)';
    }
    const letture = [x.ag !== undefined ? `a_g = ${az(x.ag)}` : '', x.ab !== undefined ? `a_b = ${az(x.ab)}, d = ${segnoEW(x.d)}` : ''].filter(Boolean).join(', ');
    return {
      n: x.n,
      testo: `${x.data}: Sole al ${x.verso > 0 ? 'sorgere' : 'tramonto'} del lembo superiore, δ = ${Cielo.ang(x.dec, { segno: 'NS' })}; ${letture}. Calcola ${chiede}. {{${x.rif}}}`,
      campi,
      soluzione: `${passi.join('; ')}. Il libro non dà il risultato: l'ha calcolato il motore.`,
    };
  });
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* La prova: tre situazioni del libro, il Sole vero calcolato per quel giorno e quel posto -------------------- */
  const CASI = [
    { id: 'esempio', testo: 'Esempio p. 107', lat: G(15, 25.9), lon: G(85, 2.4), da: '2015-04-17T18:00:00Z', verso: 1, ag: 79.2, ab: 79.0, rv: 62, d: -1.5, dev: 5.4, libro: 'il libro trova a_v = 078,8°, c_g = −0,4°, δ = 1,3°E' },
    { id: 'es5', testo: 'Esercizio 5', lat: -G(19, 18.2), lon: -G(96, 14.5), da: '2015-04-17T06:00:00Z', verso: 1, ag: 79.5, ab: 82.6, rv: 285, d: -5.8, dev: 6.4, libro: 'p. 110, senza risultato' },
    { id: 'es6', testo: 'Esercizio 6', lat: G(5, 8.4), lon: -G(128, 19.8), da: '2015-04-15T20:00:00Z', verso: -1, ag: 281.3, ab: 286.4, rv: 290, d: -5.8, dev: -0.5, libro: 'p. 110, senza risultato' },
  ];
  const H0 = -55 / 60; // centro del Sole quando il lembo superiore tocca l'orizzonte (p. 107)
  const pr = { caso: null, esito: null, pronto: false };
  const sole = () => Cielo.vistoDallaNave('Sole');
  const gira = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
  function vai(c) {
    pr.caso = c;
    Cielo.imposta({ lat: c.lat, lon: c.lon, luogo: '', corre: false });
    const t = Cielo.istanteSole(H0, c.verso, Date.parse(c.da));
    if (t) {
      // La variazione della bussola di bordo, dalle letture del libro: V = a_v − a_b (7.2), con a_v del motore
      Cielo.imposta({ data: t }); pr.V = gira(sole().a - c.ab);
      Cielo.imposta({ data: t - 12 * 60e3 + 17e3 });
    }
  }

  /* La bussola magnetica nella sospensione cardanica (modello del docente, bussola3d.js): davanti a te, verso
     la prua. La controplancia gira con la prora vera del caso; la rosa è girata della variazione V */
  const bordo = { bussola: null, chiesto: false, ponte: null, fermo: false, chiave: '' };
  const bussola = new THREE.Group();
  const POSTO = { d: 0.55, giu: 0.4 }; // davanti agli occhi e sotto, in metri: si vede la rosa dall'alto
  function caricaBussola() {
    if (bordo.chiesto) return;
    bordo.chiesto = true;
    Bussola3D.carica().then((nuovo) => { bordo.bussola = nuovo(); bussola.add(bordo.bussola.g); bordo.chiave = ''; Motore.sporco(); }).catch(() => {});
  }
  function posaBordo() {
    const c = pr.caso || CASI[0]; const k = `${c.id}|${!!bordo.bussola}`;
    if (k === bordo.chiave) return false;
    bordo.chiave = k;
    const a = c.rv * RAD;
    if (bordo.ponte) bordo.ponte.rotation.y = -a;
    bussola.position.set(POSTO.d * Math.sin(a), Scene.OCCHIO - POSTO.giu, -POSTO.d * Math.cos(a));
    if (bordo.bussola) bordo.bussola.poni(c.rv, pr.V || 0);
    return true;
  }
  function frameBordo(dt) {
    let mosso = posaBordo();
    if (bordo.bussola && !bordo.fermo && bordo.bussola.frame(dt)) mosso = true;
    return mosso;
  }
  const versoBussola = () => {
    const c = pr.caso || CASI[0];
    return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: c.rv * RAD, phi: Math.PI / 2 + Math.atan2(POSTO.giu, POSTO.d), r: 34 };
  };
  // extra: l'ultimo figlio della radice è la controplancia, appena aggiunta da Scene.ponte
  const ponte = Scene.ponte({ guarda: 90, phi: 1.45, frame: frameBordo, extra: (radice) => { bordo.ponte = radice.children[radice.children.length - 1]; radice.add(bussola); } });
  function mondo() {
    const m = ponte();
    caricaBussola();
    if (!pr.pronto) {
      pr.pronto = true;
      m.limiti = { ...m.limiti, phi1: 2.3 }; // si può guardare giù, fino alla bussola
      vai(CASI[0]);
      setTimeout(() => Motore.ridisegna(), 0);
      m.vistaIniziale = () => {
        const v = sole();
        return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: v.a * RAD, phi: 1.38, r: 40 };
      };
    }
    // Tornando da un'altra esperienza il posto può essere cambiato: si rimette quello del caso scelto
    if (pr.caso && Math.abs(Cielo.stato.lat - pr.caso.lat) > 1e-6) vai(pr.caso);
    return m;
  }
  function controlla() {
    const c = pr.caso; if (!c) return;
    const v = sole(); const dh = (v.h - H0) * 60;
    if (Math.abs(dh) > 4) {
      pr.esito = { tipo: 'nota', testo: (dh < 0) === (c.verso > 0) ? `Il lembo superiore non è ancora ${c.verso > 0 ? 'sorto' : 'tramontato'}: il centro è a ${Cielo.ang(v.h)}, deve arrivare a −55′.` : `Il centro è a ${Cielo.ang(v.h)}: sei oltre il −55′, torna indietro.` };
      return;
    }
    lez.completa(c.id);
    const r = amplitudine(c.lat, v.dec, c.verso);
    const cg = v.a - c.ag; const am = v.a - c.d; const dev = am - c.ab;
    pr.esito = { tipo: 'giusto', testo: `Lembo superiore sull'orizzonte. Il motore dà a_v = ${az(v.a)} (con la 7.4–7.6: ampl_a ${r.testoA}, ampl_m ${r.testoM}, a_v ${az(r.av)}). Gyro a_g = ${az(c.ag)}: c_g = ${cg >= 0 ? '+' : '−'}${v1(Math.abs(cg))}°. Bussola a_b = ${az(c.ab)}, d = ${segnoEW(c.d)}: a_m = ${az(am)}, δ = ${segnoEW(dev)}; la tabella per Rᵥ ${String(c.rv).padStart(3, '0')}° dice ${segnoEW(c.dev)} (${c.libro}).` };
  }
  function comandi(id) {
    const c = CASI.find((x) => `caso:${x.id}` === id);
    if (c) { vai(c); if (!vr()) Motore.vista(ponte().vistaIniziale()); }
    if (id === 'guarda:bussola' && !vr()) Motore.vista(versoBussola());
    if (id === 'guarda:sole' && !vr()) Motore.vista(ponte().vistaIniziale());
    if (id === 'mare') bordo.fermo = !bordo.fermo;
    const passo = { 'min-': -60, 'min+': 60, 'sec-': -10, 'sec+': 10, 'dieci+': 600, 'dieci-': -600 }[id];
    if (passo) Cielo.imposta({ data: Cielo.stato.data + passo * 1000, corre: false });
    controlla();
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  function riquadro() {
    const c = pr.caso || CASI[0]; const v = sole();
    return { t: 'riquadro', size: 30, testo: `${Cielo.giorno()} ${Cielo.ora()} UTC · ${Cielo.luogo()} · Rᵥ ${String(c.rv).padStart(3, '0')}° · Sole: centro a ${Cielo.ang(v.h)}, azimut ${az(v.a)} · gyro ${az(c.ag)} · bussola ${az(c.ab)}` };
  }
  const RISPOSTE = { si: 'Sì, cambia con la prora', no: 'No, è sempre la stessa', luogo: 'Cambia solo con il luogo' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Controllo della bussola con un astro' },
          { t: 'p', size: 38, testo: 'L\'azimut vero di un astro si calcola; quello della girobussola o della bussola magnetica si legge. Il confronto dice se le bussole funzionano. {{p. 105}}' },
          { t: 'formula', testo: 'c_g = a_v − a_g      V = a_v − a_b' },
          { t: 'nota', testo: 'Formule 7.1 e 7.2 a p. 105: la variazione V è declinazione magnetica d più deviazione δ.' },
          riquadro(),
        ],
        dx: [
          finestra(900, 'Sei in controplancia, all\'alba. Guarda il Sole.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Il Sole è calcolato per il giorno e il posto dell\'esempio del libro. Le letture delle bussole sono quelle del libro.' },
        ],
      },
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'La bussola magnetica' },
          { t: 'p', size: 34, testo: 'Il **mortaio**, con la rosa dentro, sta su una **sospensione cardanica**: due anelli con i perni ad angolo retto lo tengono quasi dritto mentre la nave rolla e beccheggia. Il metodo è di Girolamo Cardano, applicato alla bussola dal 1550. {{vol. 1, pp. 155–156}}' },
          { t: 'p', size: 34, testo: 'La **rosa** resta orientata verso il Nord bussola; il mortaio è legato alla nave e le gira intorno. La **linea di fede**, sull\'asse longitudinale, segna sulla rosa la **prora bussola**. {{vol. 1, p. 156}}' },
          { t: 'p', size: 34, testo: 'Con l\'astro sull\'orizzonte è nullo anche l\'errore dovuto all\'inclinazione del mortaio. {{p. 105}}' },
          { t: 'bottoni', h: 80, size: 28, lista: [{ id: 'guarda:bussola', testo: 'Guarda la bussola' }, { id: 'guarda:sole', testo: 'Guarda il Sole' }, { id: 'mare', testo: bordo.fermo ? 'Rimetti il mare' : 'Ferma il mare', on: bordo.fermo }] },
        ],
        dx: [
          finestra(900, 'Guarda giù, verso la prua: la base va con la nave, il mortaio resta dritto.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Modello 3D del prof. Daniele Palma Esposito. La rosa è girata della variazione data dalle letture del libro, V = a_v − a_b, con a_v calcolato dal motore: sotto la linea di fede leggi la prora bussola.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco confronterai la bussola magnetica con il Sole su navi con prore diverse.' },
        ],
        dx: [
          { t: 'sotto', testo: 'La deviazione cambia se cambio prora?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'bottoni', h: 80, size: 30, lista: CASI.map((x) => ({ id: `caso:${x.id}`, testo: x.testo, on: pr.caso === x })) },
          { t: 'bottoni', h: 80, size: 26, lista: [{ id: 'dieci-', testo: '−10 min' }, { id: 'min-', testo: '−1 min' }, { id: 'sec-', testo: '−10 s' }, { id: 'sec+', testo: '+10 s' }, { id: 'min+', testo: '+1 min' }, { id: 'dieci+', testo: '+10 min' }] },
          riquadro(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(900, 'Guarda il Sole sull\'orizzonte.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Ogni caso parte circa 12 minuti prima. Il lembo superiore tocca l\'orizzonte quando il centro è a −55′ (p. 107): tolleranza ±4′.' },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Perché all\'alba' },
          ...(p ? [{ t: 'nota', testo: p === 'si' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 34, testo: 'L\'astro deve essere **basso**: il Sole al sorgere o al tramonto, o stelle sotto i 30°. Per un astro qualsiasi l\'azimut si calcola con la 7.3; per il Sole che sorge basta l\'**amplitudine**. {{pp. 105–106}}' },
          { t: 'formula', testo: 'tan Z = sin P / (tan δ cos φ − sin φ cos P)' },
          { t: 'nota', testo: 'Formula 7.3; esempio di Marte a p. 106: Z = N76,3°W, a_v = 283,7°, a_g = 283,6°.' },
          { t: 'p', size: 34, testo: 'La deviazione nasce a bordo e **cambia con la prora**: ogni bussola ha la sua tabella delle deviazioni. Il controllo con il Sole serve a verificarla. {{vol. 1, p. 144}}' },
        ],
        dx: [
          finestra(560, 'Guarda il Sole sull\'orizzonte.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'tabella', col: [55, 45], size: 28, righe: [['Esempio di p. 107', 'Valore'], ['δ☉', '10°38,2′N'], ['ampl_a', 'E11,0°N'], ['ampl_m = ampl_a + c_a', 'E11,2°N'], ['a_v', '078,8°'], ['c_g = a_v − a_g', '−0,4°'], ['δ = a_m − a_b', '1,3°E (dati di bordo 5,4°E)']] },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Il lembo superiore' },
          { t: 'p', size: 34, testo: 'Per la rifrazione il Sole appare più alto: con il centro sull\'orizzonte astronomico il lembo inferiore sembra già 20′ sopra. Osservando il sorgere del **lembo superiore** il Sole è in realtà a circa **−55′**: si usa l\'**amplitudine marina**. {{p. 107}}' },
          { t: 'formula', testo: 'ampl_m = ampl_a + c_a' },
          { t: 'formula', testo: 'c_a = 0,9 sin φ / √(cos²φ − sin²δ)' },
          { t: 'nota', testo: 'Formule 7.5 e 7.6 a p. 107; c_a si trova anche nella tavola 17 delle tavole nautiche (p. 108). Sposta l\'amplitudine verso il polo elevato.' },
        ],
        dx: [
          { t: 'p', size: 34, testo: 'Per la Luna non serve: al sorgere del lembo superiore la rifrazione e la parallasse si compensano. {{p. 107}}' },
          { t: 'tabella', col: [55, 45], size: 28, righe: [['Tavola 17, esempio di p. 108', 'Valore'], ['φ, δ', '53°40′N, 17°24′S'], ['ampl_a', 'E30,3°S'], ['c_a', '−1,2°'], ['ampl_m, azimut', 'E29,1°S, 119,1°']] },
          { t: 'nota', testo: 'Con la 7.6 c_a vale 1,4°: la tavola e la formula danno valori un po\' diversi.' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sul capitolo 7 del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Controlla le bussole' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Esercizi 7–10 di p. 110 con le formule 7.4–7.6. Tolleranza ±0,1°.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
