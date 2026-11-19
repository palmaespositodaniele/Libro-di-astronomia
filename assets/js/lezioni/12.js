/* Esperienza 12: la retta d'altezza (Marcq Saint-Hilaire). Contenuti da «Fondamenti di Navigazione e Meteorologia
   nautica» vol. 2, cap. 8: linearizzazione e punto determinativo (p. 118), Δh = hᵥ − hₛ e verso della retta
   (p. 119, fig. 8.4 e 8.5), tracciamento sulla carta di Mercatore approssimata (p. 120, fig. 8.6), procedura (p. 122);
   calcoli dall'esempio di Giove e Alnilam a p. 123, con i risultati del libro. Regole in design.md */
(function () {
  const N = 12;
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;

  const MISSIONI = [
    { id: 'retta', testo: 'Scegli una stella e traccia la sua retta d\'altezza sul foglio.' },
    { id: 'segni', testo: 'Traccia una retta con Δh positivo e una con Δh negativo.' },
    { id: 'fix', testo: 'Con due rette ben incrociate trova il punto nave (FIX).' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Vicino al punto stimato la circonferenza d\'altezza si può sostituire con…', scelte: ['un parallelo', 'una retta sulla carta di Mercatore', 'il meridiano stimato'], giusta: 1, perche: 'In una zona limitata si approssima con un circolo massimo, poi con un arco di lossodromia: sulla carta di Mercatore una retta. {{p. 118}}' },
    { n: 2, testo: 'Nel metodo di Saint-Hilaire il punto determinativo sta…', scelte: ['sul meridiano stimato', 'sul parallelo stimato', 'sulla direzione dell\'azimut dell\'astro'], giusta: 2, perche: 'È l\'intersezione della circonferenza d\'altezza con la direzione dell\'azimut: il punto della circonferenza più vicino al punto stimato. {{p. 118}}' },
    { n: 3, testo: 'Δh è…', scelte: ['hᵥ − hₛ, altezza vera meno altezza stimata', 'hₛ − hᵥ', 'la differenza di latitudine'], giusta: 0, perche: 'È la differenza fra altezza vera e altezza stimata, presa sulla direzione d\'azimut (formula 8.1). {{p. 119}}' },
    { n: 4, testo: 'La retta d\'altezza è…', scelte: ['parallela all\'azimut', 'perpendicolare alla direzione d\'azimut', 'sempre orientata Nord-Sud'], giusta: 1, perche: 'Si traccia per il punto determinativo, perpendicolare alla direzione d\'azimut. {{p. 120}}' },
    { n: 5, testo: 'Δh si riporta sulla carta…', scelte: ['sulla scala delle longitudini', 'sulla scala delle latitudini: 1′ = 1 miglio', 'in gradi'], giusta: 1, perche: 'Sulla carta di Mercatore i punti determinativi si trovano misurando il Δh sulla scala delle latitudini. {{p. 120}}' },
    { n: 6, testo: 'In alto mare, senza carta a grande scala, si usa…', scelte: ['un globo', 'una carta di Mercatore approssimata su un foglio qualsiasi', 'la carta del porto più vicino'], giusta: 1, perche: 'Si costruisce su un foglio qualsiasi con la scala della latitudine stimata; il fix si legge come Δφ e Δλ dal punto stimato. {{p. 120}}' },
  ];

  /* I calcoli: l'esempio di p. 123 (16/04/2015, φₛ 20°54,3′S), con i risultati stampati nel libro ------------------- */
  const gp = (x) => { let g = Math.floor(x); let p = Math.round((x - g) * 600) / 10; if (p >= 60) { g += 1; p -= 60; } return [g, p]; };
  const fiS = -G(20, 54.3);
  function altezza(fi, P, dec) { // P positivo a Ovest
    const sh = Math.sin(fi * RAD) * Math.sin(dec * RAD) + Math.cos(fi * RAD) * Math.cos(dec * RAD) * Math.cos(P * RAD);
    return Math.asin(sh) / RAD;
  }
  const ESE = [
    { n: 7, nome: 'Giove', P: -G(17, 9.7), Ptxt: '17°09,7′E', dec: G(17, 54.0), dectxt: '17°54,0′N', hs: G(47, 42.4), a: 24.7, hv: G(47, 37.0) },
    { n: 8, nome: 'Alnilam', P: G(34, 49.5), Ptxt: '34°49,5′W', dec: -G(1, 11.9), dectxt: '01°11,9′S', hs: G(50, 43.7), a: 295.6, hv: G(50, 45.8) },
  ];
  const CALCOLI = [];
  ESE.forEach((x) => {
    const [g, p] = gp(x.hs);
    CALCOLI.push({
      n: x.n,
      testo: `**${x.nome}** dal punto stimato φₛ = 20°54,3′S: P = ${x.Ptxt}, δ = ${x.dectxt}. Calcola l'altezza stimata hₛ. {{p. 123}}`,
      campi: [['gradi', g, 0, '°'], ['primi', p, 0.25, '′']],
      soluzione: `sin hₛ = sin φ sin δ + cos φ cos δ cos P = ${Math.sin(x.hs * RAD).toFixed(3).replace('.', ',')}…, hₛ = ${Cielo.ang(x.hs)} (il motore trova ${Cielo.ang(altezza(fiS, x.P, x.dec))}); azimut a = ${x.a.toFixed(1).replace('.', ',')}°.`,
    });
  });
  ESE.forEach((x, k) => {
    const dh = Math.round((x.hv - x.hs) * 600) / 10;
    const verso = dh >= 0 ? x.a : (x.a + 180) % 360;
    CALCOLI.push({
      n: 9 + k,
      testo: `**${x.nome}**: hₛ = ${Cielo.ang(x.hs)}, hᵥ = ${Cielo.ang(x.hv)}, azimut ${x.a.toFixed(1).replace('.', ',')}°. A quante miglia dal punto stimato, e in che direzione, sta il punto determinativo? {{p. 123}}`,
      campi: [['miglia', Math.abs(dh), 0.05, ''], ['direzione', Math.round(verso * 10) / 10, 0.15, '°']],
      soluzione: `Δh = hᵥ − hₛ = ${dh > 0 ? '+' : '−'}${Math.abs(dh).toFixed(1).replace('.', ',')}′: ${dh >= 0 ? 'positivo, verso l\'astro' : 'negativo, dalla parte opposta all\'astro'}, quindi ${Math.abs(dh).toFixed(1).replace('.', ',')} miglia per ${verso.toFixed(1).replace('.', ',')}°.`,
    });
  });
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* La prova: punto stimato al largo di Procida; la nave vera sta qualche miglio più in là ------------------------- */
  const STIMATO = { lat: Cielo.LUOGHI.procida.lat, lon: Cielo.LUOGHI.procida.lon };
  const SCARTO = [5, 3]; // miglia verso Est e verso Nord: scelta del libro 3D per la prova, non dati del libro
  const VERO = Carteggio.coordinate(SCARTO, STIMATO.lat, STIMATO.lon);
  const COLORI = ['#B3362B', '#2E7DB5', '#2E8B57', '#9A5B12'];
  const CANDIDATE = ['Polare', 'Vega', 'Arturo', 'Capella', 'Sirio', 'Altair', 'Deneb', 'Aldebaran', 'Betelgeuse', 'Rigel', 'Procyon', 'Regolo', 'Spica', 'Antares', 'Polluce', 'Fomalhaut', 'Dubhe', 'Alphecca'];
  const nomeIt = (n) => (n === 'Procyon' ? 'Procione' : n);
  const pr = { rette: [], esito: null, pronto: false, fix: null };

  // Una stella: hₛ e azimut dal punto stimato, hᵥ dalla posizione vera (stesso istante)
  function retta(nome) {
    const s = Cielo.stella(nome);
    const st = Cielo.altazimut(s.T, s.dec, STIMATO.lat, STIMATO.lon);
    const ve = Cielo.altazimut(s.T, s.dec, VERO.lat, VERO.lon);
    return { nome, a: st.a, hs: st.h, hv: ve.h, dh: (ve.h - st.h) * 60 };
  }
  const visibili = () => CANDIDATE.map((n) => ({ n, v: Cielo.altazimut(Cielo.stella(n).T, Cielo.stella(n).dec, STIMATO.lat, STIMATO.lon) })).filter((x) => x.v.h > 15 && x.v.h < 75).sort((a, b) => a.v.a - b.v.a).map((x) => x.n);

  const carta = Scene.carta({
    disegna: (ctx, W, H) => Carteggio.disegna(ctx, W, H, {
      phi: STIMATO.lat, scala: 70, centro: [W / 2, H / 2],
      rette: pr.rette.map((r, k) => ({ ...r, nome: nomeIt(r.nome), col: COLORI[k % COLORI.length] })),
      fix: pr.fix, vero: pr.fix ? SCARTO : null,
      titolo: `Punto stimato ${Cielo.ang(STIMATO.lat, { segno: 'NS' })} ${Cielo.ang(STIMATO.lon, { segno: 'EW', tre: true })} · ${Cielo.giorno()} ${Cielo.ora().slice(0, 5)} UTC`,
    }),
  });
  function mondo() {
    const m = carta();
    if (!pr.pronto) {
      pr.pronto = true;
      Cielo.imposta({ lat: VERO.lat, lon: VERO.lon, luogo: '', corre: false });
      if (Cielo.vistoDallaNave('Sole').h > -12) { const t = Cielo.istanteSole(-12, -1); if (t) Cielo.imposta({ data: t + 3600e3 }); }
      m.ridisegna();
      setTimeout(() => Motore.ridisegna(), 0);
    }
    return m;
  }

  function cercaFix() {
    pr.fix = null;
    if (pr.rette.length < 2) return null;
    // La coppia più incrociata (differenza d'azimut più vicina a 90°)
    let best = null;
    for (let i = 0; i < pr.rette.length; i++) for (let j = i + 1; j < pr.rette.length; j++) {
      const d = Carteggio.da(pr.rette[i].a, pr.rette[j].a);
      if (!best || Math.abs(d - 90) < Math.abs(best.d - 90)) best = { i, j, d };
    }
    return best;
  }
  function comandi(id) {
    if (id.startsWith('retta:')) {
      const nome = id.slice(6);
      if (pr.rette.find((r) => r.nome === nome)) pr.rette = pr.rette.filter((r) => r.nome !== nome);
      else { pr.rette.push(retta(nome)); if (pr.rette.length > 4) pr.rette.shift(); }
      const r = pr.rette.find((x) => x.nome === nome);
      if (r) {
        lez.completa('retta');
        const dh = r.dh.toFixed(1).replace('.', ',');
        pr.esito = { tipo: 'giusto', testo: `${nomeIt(nome)}: hₛ ${Cielo.ang(r.hs)}, hᵥ ${Cielo.ang(r.hv)}, Δh ${r.dh >= 0 ? '+' : ''}${dh}′, azimut ${Cielo.ang(r.a, { tre: true })}. ${r.dh >= 0 ? 'Altezza vera maggiore: la retta va verso l\'astro.' : 'Altezza vera minore: la retta va dalla parte opposta.'}` };
      } else pr.esito = null;
      if (pr.rette.some((x) => x.dh > 0.05) && pr.rette.some((x) => x.dh < -0.05)) lez.completa('segni');
      pr.fix = null;
    }
    if (id === 'fai-fix') {
      const b = cercaFix();
      if (!b) pr.esito = { tipo: 'errato', testo: 'Servono almeno due rette.' };
      else if (b.d < 30 || b.d > 150) pr.esito = { tipo: 'errato', testo: `Le rette si tagliano male: differenza d'azimut ${Math.round(b.d)}°. Il libro accetta da 30° a 150° (p. 131).` };
      else {
        const p = Carteggio.incrocio(pr.rette[b.i], pr.rette[b.j]); pr.fix = p;
        const c = Carteggio.coordinate(p, STIMATO.lat, STIMATO.lon);
        const err = Math.hypot(p[0] - SCARTO[0], p[1] - SCARTO[1]);
        if (err < 0.3) lez.completa('fix');
        pr.esito = { tipo: 'giusto', testo: `FIX: Δφ ${p[1] >= 0 ? '+' : '−'}${Math.abs(p[1]).toFixed(1).replace('.', ',')}′, Δλ ${p[0] >= 0 ? '+' : '−'}${Math.abs(p[0] / Math.cos(STIMATO.lat * RAD)).toFixed(1).replace('.', ',')}′ dal punto stimato: ${Cielo.ang(c.lat, { segno: 'NS' })} ${Cielo.ang(c.lon, { segno: 'EW', tre: true })}. La nave vera (in arancio) è a ${err.toFixed(2).replace('.', ',')} miglia.` };
      }
    }
    if (id === 'azzera') { pr.rette = []; pr.fix = null; pr.esito = null; }
    carta().ridisegna();
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  const stelle = () => ({ t: 'bottoni', h: 76, size: 26, lista: visibili().map((n) => ({ id: `retta:${n}`, testo: nomeIt(n), on: !!pr.rette.find((r) => r.nome === n) })) });
  const RISPOSTE = { verso: 'Verso l\'astro', lontano: 'Lontano dall\'astro', dipende: 'Dipende dall\'azimut' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'La retta d\'altezza' },
          { t: 'p', size: 38, testo: 'Le circonferenze d\'altezza sono troppo grandi per la carta. Ma se si conosce un **punto stimato** abbastanza preciso, nell\'area vicina la circonferenza diventa una **retta d\'altezza** (*position line*). {{p. 118}}' },
          { t: 'p', size: 38, testo: 'La retta passa per il **punto determinativo** (*intercept terminal position*), il punto della circonferenza più vicino al punto stimato. Il metodo più usato è quello di **Marcq Saint-Hilaire**, comandante di navi. {{p. 118}}' },
        ],
        dx: [
          finestra(900, 'Sei al tavolo di carteggio.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'nota', testo: 'Il foglio è una carta di Mercatore approssimata attorno al punto stimato (fig. 8.6, p. 120).' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Dal punto stimato calcoli l\'altezza che dovrebbe avere una stella: l\'altezza stimata hₛ. Il sestante ti dà l\'altezza vera hᵥ.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Se l\'altezza vera è maggiore di quella stimata, la retta è verso l\'astro o lontano?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Stelle visibili, da Nord in senso orario' },
          stelle(),
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'fai-fix', testo: 'Cerca il FIX' }, { id: 'azzera', testo: 'Foglio pulito' }] },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(860, 'Guarda il foglio sul tavolo.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'nota', testo: 'Le altezze vere sono calcolate da una nave messa dal libro 3D 5 miglia a Est e 3 a Nord del punto stimato: senza errori di misura.' },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Verso l\'astro o lontano' },
          ...(p ? [{ t: 'nota', testo: p === 'verso' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 36, testo: 'Se il sestante dà un\'altezza maggiore di quella attesa, la circonferenza vera è **più piccola** di quella stimata: il punto determinativo sta verso il punto sub-astrale, cioè **verso l\'astro**. Se è minore, dalla parte opposta. {{p. 119, fig. 8.4 e 8.5}}' },
          { t: 'formula', testo: 'Δh = hᵥ − hₛ' },
          { t: 'nota', testo: 'Formula 8.1 a p. 119. In inglese il Δh si chiama intercept.' },
        ],
        dx: [
          finestra(560, 'Guarda il foglio sul tavolo.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'p', size: 34, testo: 'Dal punto stimato si traccia la direzione d\'azimut; sopra si riporta il Δh, misurato sulla **scala delle latitudini** (1′ = 1 miglio), verso l\'astro se positivo. Per quel punto, la retta **perpendicolare** all\'azimut. {{p. 120}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Il foglio di carteggio' },
          { t: 'p', size: 34, testo: 'In alto mare non ci sono carte a grande scala: si costruisce una **carta di Mercatore approssimata** su un foglio qualsiasi, con la scala della latitudine stimata. Il punto stimato si mette dove conviene; il fix si legge come Δφ e Δλ da lui. {{p. 120}}' },
          { t: 'p', size: 34, testo: 'Alle estremità di ogni retta si disegnano due **freccette verso l\'astro**: si capisce subito a quale astro si riferisce. Serviranno nell\'esperienza 13. {{p. 120}}' },
          { t: 'p', size: 34, testo: 'Con due astri il miglior incrocio si ha con azimut a 90° fra loro; vicino a 0° o 180° il fix è pessimo. {{p. 123}}' },
        ],
        dx: [
          { t: 'tabella', col: [40, 30, 30], size: 30, righe: [['Esempio, 16/04/2015', 'Giove', 'Alnilam'], ['hₛ', '47°42,4′', '50°43,7′'], ['azimut', '024,7°', '295,6°'], ['hᵥ', '47°37,0′', '50°45,8′'], ['Δh', '−5,4′', '+2,1′']] },
          { t: 'nota', testo: 'Esempio svolto a p. 123, dal punto stimato 20°54,3′S 133°10,6′W.' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sul capitolo 8 del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Le rette dell\'esempio' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Risultati stampati a p. 123. Tolleranza ±0,2′ sulle altezze, ±0,1° sulle direzioni.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
