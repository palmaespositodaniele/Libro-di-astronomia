/* Esperienza 10: latitudine al passaggio in meridiano. Contenuti da «Fondamenti di Navigazione e Meteorologia
   nautica» vol. 2, cap. 6: altezze meridiane (p. 94), regola del punto sub-astrale (p. 95), istante del transito
   (p. 96), formule 6.4 e 6.5 ed esempio di Nunki (p. 97); esercizi 6–9 a p. 103, senza risultati e con le effemeridi
   del 2015: la declinazione la calcola il motore e la pagina lo dice. Regole in design.md */
(function () {
  const N = 10;
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;

  const MISSIONI = [
    { id: 'culmine', testo: 'Fai scorrere i minuti e fermati quando il Sole è al punto più alto: il passaggio in meridiano.' },
    { id: 'nord', testo: 'Trova un posto dove, al passaggio in meridiano, il Sole è a Nord.' },
    { id: 'mistero', testo: 'Nel posto misterioso misura l\'altezza meridiana e trova la latitudine.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'L\'altezza meridiana è l\'altezza di un astro quando…', scelte: ['sorge', 'il suo tempo locale vale 0° o 180°', 'il suo azimut vale 90°'], giusta: 1, perche: 'È l\'altezza nell\'istante in cui l\'astro transita sul meridiano celeste dell\'osservatore: superiore (t = 000°) o, per i circumpolari, inferiore (t = 180°). {{p. 94}}' },
    { n: 2, testo: 'Al passaggio al meridiano superiore la distanza zenitale vale…', scelte: ['z = φ − δ', 'z = φ + δ', 'z = 90° − δ'], giusta: 0, perche: 'Con cos P = 1 la formula dell\'altezza si riduce a cos z = cos(φ − δ): è la 6.1. {{p. 94}}' },
    { n: 3, testo: 'Un osservatore più a Nord del punto sub-astrale vede l\'astro transitare…', scelte: ['a Nord', 'allo zenit', 'a Sud'], giusta: 2, perche: 'Più a Nord del punto sub-astrale lo vede a Sud (a = 180°), più a Sud lo vede a Nord (a = 000°). {{p. 95}}' },
    { n: 4, testo: 'Un osservatore a φ = 15°S vede transitare un astro con δ = 05°S…', scelte: ['a Nord', 'a Sud', 'allo zenit'], giusta: 0, perche: 'È più a Sud del punto sub-astrale (05°S): lo vede a Nord. È uno degli esempi del libro. {{p. 95}}' },
    { n: 5, testo: 'Nella 6.4, φ = zₘ + δ, zₘ si prende positiva quando…', scelte: ['l\'astro culmina a Nord', 'l\'astro culmina a Sud', 'la declinazione è Nord'], giusta: 1, perche: 'Positiva se l\'astro culmina a Sud (a = 180°), negativa se culmina a Nord (a = 0°). {{p. 97}}' },
    { n: 6, testo: 'Al passaggio al meridiano inferiore di un circumpolare la latitudine vale…', scelte: ['hₘ − p', 'hₘ + p, con lo stesso segno di δ', '90° − hₘ'], giusta: 1, perche: 'La 6.5 si può scrivere φ = hₘ + p, con p distanza polare: φ prende il segno di δ. {{p. 97}}' },
  ];

  /* I calcoli: l'esempio di Nunki (p. 97, con risultato) e gli esercizi 6–9 di p. 103 (risultato del motore) ----- */
  const gp = (x) => { let g = Math.floor(x); let p = Math.round((x - g) * 600) / 10; if (p >= 60) { g += 1; p -= 60; } return [g, p]; };
  const pr1 = (p) => `${p.toFixed(1).replace('.', ',')}′`;
  // Altezza vera di una stella: hᵥ = hᵢ + γ + c₁ + c₂ − 1° (p. 76, come nell'esperienza 8)
  function vera(hi, gam, e) {
    const ho = hi + gam / 60; const c1 = Cielo.c1(e); const c2 = Cielo.c2(ho);
    return { ho, c1, c2, hv: ho + (c1 + c2 - 60) / 60 };
  }
  const ES = [
    { n: 8, nome: 'Kaus Australis', hr: 'Kaus Aust.', data: '2015-04-17T05:00:00Z', hi: G(10, 16.5), e: 8, gam: 1.0, verso: 'S', inf: true, stima: 'φ stimata 65°48,9′S, all\'alba', rif: 'p. 103, es. 6' },
    { n: 9, nome: 'Avior', hr: 'Avior', data: '2015-04-18T18:00:00Z', hi: G(45, 39.5), e: 30, gam: 0, verso: 'S', inf: false, stima: 'φ stimata 15°44,8′S, di sera', rif: 'p. 103, es. 7' },
    { n: 10, nome: 'Procione', hr: 'Procyon', data: '2015-04-17T18:00:00Z', hi: G(29, 34.4), e: 13, gam: 0.6, verso: 'N', inf: false, stima: 'emisfero Sud, di sera', rif: 'p. 103, es. 8' },
    { n: 11, nome: 'Almak', hr: 'Almak', data: '2015-04-16T20:00:00Z', hi: G(15, 11.0), e: 26, gam: -12.0, verso: 'N', inf: true, stima: 'φ stimata 62°43,4′N, di sera', rif: 'p. 103, es. 9' },
  ];
  const CALCOLI = [];
  // Esempio svolto di p. 97: Nunki, hᵥ già corretta
  {
    const hv = G(43, 31.8); const dec = -G(26, 16.4); const zm = 90 - hv; const phi = zm + dec;
    const [g, p] = gp(Math.abs(phi));
    CALCOLI.push({
      n: 7,
      testo: `**Nunki** culmina a Sud con hᵥ = 43°31,8′; δ = 26°16,4′S. Quanto vale φ? Scrivi il valore, il nome N o S lo trovi tu. {{p. 97}}`,
      campi: [['gradi', g, 0, '°'], ['primi', p, 0.15, '′']],
      soluzione: `zₘ = 90° − hᵥ = +${Cielo.ang(zm)} (culmina a Sud, positiva); φ = zₘ + δ = ${Cielo.ang(zm)} − 26°16,4′ = ${Cielo.ang(phi, { segno: 'NS' })}. Come nel libro.`,
    });
  }
  ES.forEach((x) => {
    const s = Cielo.stella(x.hr, Cielo.tempo(Date.parse(x.data)));
    const v = vera(x.hi, x.gam, x.e);
    let phi; let passaggi;
    if (x.inf) {
      const p = 90 - Math.abs(s.dec); phi = Math.sign(s.dec) * (v.hv + p);
      passaggi = `passaggio inferiore: p = 90° − |δ| = ${Cielo.ang(p)}; φ = hᵥ + p = ${Cielo.ang(phi, { segno: 'NS' })}`;
    } else {
      const zm = (90 - v.hv) * (x.verso === 'S' ? 1 : -1); phi = zm + s.dec;
      passaggi = `zₘ = ${x.verso === 'S' ? '+' : '−'}${Cielo.ang(90 - v.hv)} (culmina a ${x.verso === 'S' ? 'Sud' : 'Nord'}); φ = zₘ + δ = ${Cielo.ang(phi, { segno: 'NS' })}`;
    }
    const [g, p] = gp(Math.abs(phi));
    CALCOLI.push({
      n: x.n,
      testo: `**${x.nome}** (${x.stima}), transito a ${x.verso === 'S' ? 'Sud' : 'Nord'}${x.inf ? ' al meridiano inferiore' : ''}: hᵢ = ${Cielo.ang(x.hi)}, e = ${x.e} m, γ = ${x.gam >= 0 ? '+' : '−'}${pr1(Math.abs(x.gam))}; δ = ${Cielo.ang(s.dec, { segno: 'NS' })} (calcolata). Quanto vale φ? {{${x.rif}}}`,
      campi: [['gradi', g, 0, '°'], ['primi', p, 0.25, '′']],
      soluzione: `hₒ = ${Cielo.ang(v.ho)}; c₁ = ${pr1(v.c1)}, c₂ = ${pr1(v.c2)}; hᵥ = ${Cielo.ang(v.hv)}; ${passaggi}. Il libro non dà il risultato: l'ha calcolato il motore.`,
    });
  });
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* I posti della prova: sul meridiano di Procida, alle latitudini degli esempi di p. 95 -------------------- */
  const LP = Cielo.LUOGHI.procida.lon;
  const POSTI = [
    { id: 'n50', testo: '50°N', lat: 50 },
    { id: 'procida', testo: 'Procida', lat: Cielo.LUOGHI.procida.lat },
    { id: 'n15', testo: '15°N', lat: 15 },
    { id: 's15', testo: '15°S', lat: -15 },
    { id: 's30', testo: '30°S', lat: -30 },
    { id: 'mistero', testo: 'Posto misterioso', lat: G(20, 11.8) },
  ];
  const postoAttuale = () => POSTI.find((x) => Math.abs(x.lat - Cielo.stato.lat) < 1e-6);
  const pr = { esito: null, pronto: false, scelte: null, scelta: null };

  // Mezzogiorno vero del giorno civile corrente nel posto della nave
  function mezzodi() {
    const s = Cielo.stato; const oss = new Astronomy.Observer(s.lat, s.lon, 0);
    const d = new Date(s.data); d.setUTCHours(0, 0, 0, 0);
    const ev = Astronomy.SearchHourAngle('Sun', oss, 0, new Date(d.getTime() - 6 * 3600e3));
    return ev ? ev.time.date.getTime() : s.data;
  }
  // Il Sole adesso: altezza vera del centro, azimut, angolo al polo (gradi, + se a Ovest), sale o scende
  function sole() {
    const v = Cielo.vistoDallaNave('Sole');
    const dopo = Cielo.vistoDallaNave('Sole', Cielo.tempo(Cielo.stato.data + 60e3));
    const P = v.t > 180 ? v.t - 360 : v.t;
    // Al culmine il sestante dà l'altezza massima, 90° − |φ − δ|: con il Sole alto anche 2 minuti dal culmine
    // valgono più di un primo d'altezza
    const h = Math.abs(P) <= 0.5 ? 90 - Math.abs(Cielo.stato.lat - v.dec) : v.h;
    return { ...v, h, P, sale: dopo.h > v.h };
  }
  const culminato = (s) => Math.abs(s.P) <= 0.5;

  const ponte = Scene.ponte({ guarda: 180, phi: 1.05 });
  function mondo() {
    const m = ponte();
    if (!pr.pronto) {
      pr.pronto = true;
      const p = POSTI[1]; Cielo.imposta({ lat: p.lat, lon: LP, luogo: 'procida', corre: false });
      Cielo.imposta({ data: mezzodi() - 40 * 60e3 });
      setTimeout(() => Motore.ridisegna(), 0);
      m.vistaIniziale = () => {
        const v = Cielo.vistoDallaNave('Sole');
        return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: v.a * RAD, phi: Math.min(1.5, Math.max(0.3, (80 - Math.max(v.h, 0)) * RAD)), r: 60 };
      };
    }
    return m;
  }

  // Le tre risposte del posto misterioso: la giusta e due errori tipici (segno di zₘ, oppure hₘ al posto di zₘ)
  function scelteMistero(s) {
    const zm = (90 - s.h) * (Math.cos(s.a * RAD) < 0 ? 1 : -1);
    const giusta = zm + s.dec;
    const lista = [giusta, -zm + s.dec, s.h + s.dec].map((x, i) => ({ v: x, giusta: i === 0 }));
    return lista.sort((a, b) => a.v - b.v);
  }
  function controlla() {
    const s = sole(); const posto = postoAttuale();
    pr.scelte = null;
    if (!posto || !culminato(s)) { pr.esito = posto && Math.abs(s.P) < 3 ? { tipo: 'nota', testo: s.sale ? 'Il Sole sale ancora, piano piano.' : 'Il Sole ha cominciato a scendere: torna indietro.' } : null; return; }
    lez.completa('culmine');
    const aSud = Math.cos(s.a * RAD) < 0;
    const zm = (90 - s.h) * (aSud ? 1 : -1);
    if (!aSud) lez.completa('nord');
    if (posto.id === 'mistero') {
      pr.scelte = scelteMistero(s);
      pr.esito = { tipo: 'nota', testo: `Passaggio in meridiano: hₘ = ${Cielo.ang(s.h)}, a ${aSud ? 'Sud' : 'Nord'}; δ☉ = ${Cielo.ang(s.dec, { segno: 'NS' })}. Quanto vale φ?` };
      return;
    }
    pr.esito = { tipo: 'giusto', testo: `Passaggio in meridiano a ${aSud ? 'Sud' : 'Nord'}: hₘ = ${Cielo.ang(s.h)}, zₘ = ${aSud ? '+' : '−'}${Cielo.ang(90 - s.h)}; δ☉ = ${Cielo.ang(s.dec, { segno: 'NS' })}; φ = zₘ + δ = ${Cielo.ang(zm + s.dec, { segno: 'NS' })}.` };
  }
  function comandi(id) {
    const s = Cielo.stato;
    const posto = POSTI.find((x) => `posto:${x.id}` === id);
    if (posto) {
      Cielo.imposta({ lat: posto.lat, lon: LP, luogo: posto.id === 'procida' ? 'procida' : '', corre: false });
      Cielo.imposta({ data: mezzodi() - 40 * 60e3 }); pr.scelta = null;
      if (!vr()) Motore.vista(ponte().vistaIniziale());
    }
    const passo = { 'min-': -1, 'min+': 1, 'dieci-': -10, 'dieci+': 10 }[id];
    if (passo) Cielo.imposta({ data: s.data + passo * 60e3, corre: false });
    if (id.startsWith('fi:') && pr.scelte) {
      const k = Number(id.slice(3)); pr.scelta = k;
      if (pr.scelte[k].giusta) {
        lez.completa('mistero');
        const x = sole(); const aSud = Math.cos(x.a * RAD) < 0;
        pr.esito = { tipo: 'giusto', testo: `Giusto: zₘ = ${aSud ? '+' : '−'}${Cielo.ang(90 - x.h)}, φ = zₘ + δ = ${Cielo.ang(pr.scelte[k].v, { segno: 'NS' })}. Il posto misterioso è a 20°11,8′N, la latitudine dell'esempio di Nunki (p. 97).` };
      } else pr.esito = { tipo: 'errato', testo: 'No: ricorda che zₘ = 90° − hₘ, positiva se il Sole culmina a Sud, e che δ ha il suo segno.' };
      Motore.sporco(); return;
    }
    controlla();
    if (passo && !vr()) Motore.vista(ponte().vistaIniziale());
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  const posti = () => ({ t: 'bottoni', h: 80, size: 30, lista: POSTI.map((x) => ({ id: `posto:${x.id}`, testo: x.testo, on: postoAttuale() === x })) });
  function riquadro() {
    const s = sole(); const posto = postoAttuale();
    const fi = posto && posto.id === 'mistero' ? 'φ ?' : `φ ${Cielo.ang(Cielo.stato.lat, { segno: 'NS' })}`;
    return { t: 'riquadro', size: 32, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · ${fi} · Sole: h ${Cielo.ang(s.h)}, azimut ${Cielo.ang(s.a, { tre: true })} · ${culminato(s) ? 'in meridiano' : s.sale ? 'sale' : 'scende'} · δ☉ ${Cielo.ang(s.dec, { segno: 'NS' })}` };
  }
  const RISPOSTE = { sempre: 'Sì, sempre a Sud', dipende: 'Dipende da dove sono e dalla declinazione', nord: 'No, sempre a Nord' };
  const ESEMPI = [['φ 15°N', 'δ 05°S', 'Sud'], ['φ 15°S', 'δ 05°S', 'Nord'], ['φ 50°N', 'δ 55°N', 'Nord'], ['φ 30°S', 'δ 10°N', 'Nord'], ['φ 30°N', 'δ 10°N', 'Sud']];

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Latitudine al passaggio in meridiano' },
          { t: 'p', size: 38, testo: 'L\'**altezza meridiana** (*meridian altitude*) è l\'altezza di un astro quando transita sul meridiano dell\'osservatore: il suo tempo locale vale 0° (meridiano superiore) o 180° (inferiore, solo per i circumpolari). {{p. 94}}' },
          { t: 'p', size: 38, testo: 'In quell\'istante il triangolo di posizione si schiaccia sul meridiano e la formula dell\'altezza diventa semplicissima. La latitudine si trova con qualsiasi astro di cui si conosca la declinazione. {{p. 94}}' },
          riquadro(),
        ],
        dx: [
          finestra(900, 'Sei in controplancia. Guarda il Sole.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Posizione del Sole calcolata con Astronomy Engine. Altezza vera del centro, senza rifrazione.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco aspetterai il mezzogiorno vero in posti diversi, da 50°N a 30°S.' },
        ],
        dx: [
          { t: 'sotto', testo: 'A mezzogiorno vero il Sole è sempre a Sud?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          posti(),
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'dieci-', testo: '−10 min' }, { id: 'min-', testo: '−1 min' }, { id: 'min+', testo: '+1 min' }, { id: 'dieci+', testo: '+10 min' }] },
          riquadro(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...(pr.scelte ? [{ t: 'bottoni', h: 80, size: 32, lista: pr.scelte.map((x, k) => ({ id: `fi:${k}`, testo: `φ = ${Cielo.ang(x.v, { segno: 'NS' })}`, on: pr.scelta === k })) }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(900, 'Guarda il Sole: sale, si ferma, scende.', 'Vai a grandezza vera: il Sole è davanti a te.'),
          ...scala(),
          { t: 'nota', testo: 'Ogni posto parte 40 minuti prima del mezzogiorno vero. Il punto più alto lo trovi tu.' },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'A Sud o a Nord?' },
          ...(p ? [{ t: 'nota', testo: p === 'dipende' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 36, testo: 'Si confronta l\'osservatore con il **punto sub-astrale**, il punto della Terra che ha l\'astro allo zenit (φ = δ). Chi sta più a Nord vede l\'astro transitare a **Sud** (a = 180°); chi sta più a Sud lo vede a **Nord** (a = 000°). {{p. 95}}' },
          { t: 'formula', testo: 'zₘ = φ − δ' },
          { t: 'nota', testo: 'Formula 6.1 a p. 94: zₘ è positiva se l\'astro culmina a Sud, negativa se a Nord.' },
        ],
        dx: [
          { t: 'tabella', col: [34, 33, 33], size: 30, righe: [['Osservatore', 'Astro', 'Transita a'], ...ESEMPI] },
          { t: 'nota', testo: 'Esempi del libro, p. 95.' },
          finestra(480, 'Guarda il Sole.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Dall\'altezza alla latitudine' },
          { t: 'p', size: 34, testo: 'Misurata l\'altezza, zₘ = 90° − hₘ; la declinazione viene dalle effemeridi. Invertendo la 6.1 e la 6.2: {{p. 97}}' },
          { t: 'formula', testo: 'φ = zₘ + δ' },
          { t: 'nota', testo: 'Formula 6.4, meridiano superiore: si sommano con il loro segno.' },
          { t: 'formula', testo: 'φ = 180° − (zₘ + δ) = hₘ + p' },
          { t: 'nota', testo: 'Formula 6.5, meridiano inferiore (solo circumpolari): zₘ e δ positive, φ con il segno di δ; p è la distanza polare.' },
          { t: 'p', size: 34, testo: 'Al passaggio superiore l\'altezza è la **massima** del giorno, a quello inferiore la **minima**. {{p. 97}}' },
        ],
        dx: [
          { t: 'tabella', col: [55, 45], size: 30, righe: [['Esempio di Nunki, 17/04/2015', 'Valore'], ['hᵢ', '43°39,7′'], ['hᵥ (e = 15 m, γ = 0,0′)', '43°31,8′'], ['δ', '26°16,4′S'], ['zₘ (culmina a Sud)', '+46°28,2′'], ['φ = zₘ + δ', '20°11,8′N']] },
          { t: 'nota', testo: 'Esempio svolto a p. 97.' },
          { t: 'p', size: 34, testo: 'L\'istante del transito si ricava dalle effemeridi, che danno il passaggio al meridiano di Greenwich di Sole, pianeti e Luna. {{p. 96}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sul capitolo 6 del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Latitudine meridiana' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Esercizi 6–9 di p. 103: la δ del 2015 e il risultato sono del motore. Tolleranza ±0,2′.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
