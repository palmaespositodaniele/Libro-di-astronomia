/* Esperienza 13: il punto nave con le stelle. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2: trasporto delle rette e formula 8.2 con due esempi svolti (pp. 121–122), fix con due rette e procedura
   (pp. 122–123), rette di Sole (p. 124); errori del punto nave (pp. 130–131), bisettrice d'altezza (pp. 132–133),
   fix con tre e quattro rette (pp. 133–135). Calcoli dagli esempi di p. 122 e p. 123; il fix dell'esempio di p. 123
   non è stampato: lo calcola il motore e la pagina lo dice. Regole in design.md */
(function () {
  const N = 13;
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;

  const MISSIONI = [
    { id: 'due', testo: 'Fai il punto con due stelle e guarda dove sta davvero la nave.' },
    { id: 'tre', testo: 'Ora tre stelle sparse su tutto l\'orizzonte: trova il FIX nel triangolo.' },
    { id: 'parte', testo: 'Prova tre stelle tutte dalla stessa parte dell\'orizzonte.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Con due sole rette d\'altezza…', scelte: ['si valutano gli errori sistematici', 'non si può valutare la precisione del punto', 'il punto è sempre esatto'], giusta: 1, perche: 'Con due rette non si possono determinare gli errori: un\'informazione qualitativa arriva solo con tre o, meglio, quattro rette. {{p. 130}}' },
    { n: 2, testo: 'Un errore sistematico…', scelte: ['si presenta sempre con la stessa entità e lo stesso segno', 'è casuale', 'esiste solo con il Sole'], giusta: 0, perche: 'Gli errori sistematici si presentano sempre uguali; quelli accidentali rispondono a dinamiche casuali. {{p. 130}}' },
    { n: 3, testo: 'Con tre astri sparsi su tutto l\'orizzonte il fix è…', scelte: ['il vertice più a Nord', 'l\'incentro del triangolo, incrocio delle bisettrici d\'altezza', 'il baricentro del triangolo'], giusta: 1, perche: 'Il punto nave è l\'incentro, equidistante dai tre lati: la distanza dai lati misura l\'errore sistematico. {{p. 133}}' },
    { n: 4, testo: 'La bisettrice d\'altezza giusta è quella fra rette le cui freccette…', scelte: ['si inseguono', 'si guardano o si sguardano', 'sono parallele'], giusta: 1, perche: 'È la bisettrice che biseca anche l\'angolo fra gli azimut: le freccette si «guardano» o si «sguardano», mai si «inseguono». {{p. 132}}' },
    { n: 5, testo: 'Quando le osservazioni non sono simultanee…', scelte: ['si ignora il moto della nave', 'si trasportano i punti determinativi all\'istante dell\'ultima osservazione', 'si rifanno tutte'], giusta: 1, perche: 'Il tempo fra le osservazioni va «annullato» trasportando i punti determinativi all\'istante più recente. {{p. 121}}' },
    { n: 6, testo: 'Di giorno il punto nave astronomico si fa…', scelte: ['con il Sole in due momenti diversi, uno a mezzogiorno', 'con la Polare', 'non si può fare'], giusta: 0, perche: 'Si osserva il Sole in momenti diversi, facendo coincidere un\'osservazione con il mezzogiorno di bordo; l\'altra almeno due ore prima o dopo. {{p. 124}}' },
  ];

  /* I calcoli ----------------------------------------------------------------------------------------- */
  const v1 = (x) => x.toFixed(1).replace('.', ',');
  const CALCOLI = [
    { n: 7, testo: 'Un astro alle Tₘ = 14h12m28s dà Δh = +3,5′ per a = 306°; il FIX si cerca alle 14h18m46s. Nave: Rᵥ = 010°, V = 12,4 nodi. Quanto vale il cammino m e a che distanza dal punto stimato tracciare la retta (Δh′)? {{p. 122}}', campi: [['m', 1.3, 0.05, 'miglia'], ['Δh′', 4.1, 0.05, '′']], soluzione: 'Δt = 6m18s, m = V · Δt = 1,3 miglia; Δh′ = Δh + m cos(Rᵥ − a) = +3,5′ + 1,3 · cos(64°) = +4,1′, verso l\'astro. Come nel libro.' },
    { n: 8, testo: 'Un astro alle Tₘ = 22h42m54s dà Δh = −1,1′ per a = 068°; il FIX si cerca alle 22h47m16s. Nave: Rᵥ = 120°, V = 13,8 nodi. Quanto vale m, e quanto vale Δh′ (scrivi il valore senza segno)? {{p. 122}}', campi: [['m', 1.0, 0.05, 'miglia'], ['Δh′', 0.5, 0.05, '′']], soluzione: 'Δt = 4m22s, m = 1,0 miglia; Δh′ = −1,1′ + 1,0 · cos(52°) = −0,5′: resta negativo, dalla parte opposta all\'astro. Come nel libro.' },
    { n: 9, testo: 'Esempio di p. 123: Giove (Δh = −5,4′, a = 024,7°) osservato 3m09s prima di Alnilam. Nave: Rᵥ = 213°, Vp = 12,4 nodi. Quanto valgono m e Δh′ di Giove (senza segno)? {{p. 123}}', campi: [['m', 0.65, 0.01, 'miglia'], ['Δh′', 6.0, 0.05, '′']], soluzione: 'm = 12,4 · 3m09s = 0,65 miglia; Δh′ = −5,4′ + 0,65 · cos(213° − 24,7°) = −6,0′. Come nel libro.' },
  ];
  // Il fix dell'esempio di p. 123 (non stampato): Giove Δh′ −6,0′ a 024,7°, Alnilam Δh +2,1′ a 295,6°
  {
    const fiS = -G(20, 54.3); const laS = -G(133, 10.6);
    const p = Carteggio.incrocio({ a: 24.7, dh: -6.0 }, { a: 295.6, dh: 2.1 });
    const c = Carteggio.coordinate(p, fiS, laS);
    const dfi = p[1]; const dla = p[0] / Math.cos(fiS * RAD);
    const gp = (x) => { let g = Math.floor(x); let q = Math.round((x - g) * 600) / 10; if (q >= 60) { g += 1; q -= 60; } return [g, q]; };
    const [fg, fp] = gp(Math.abs(c.lat)); const [lg, lp] = gp(Math.abs(c.lon));
    CALCOLI.push({
      n: 10,
      testo: 'Sempre a p. 123: punto stimato 20°54,3′S 133°10,6′W; Giove Δh′ = −6,0′ (a = 024,7°), Alnilam Δh = +2,1′ (a = 295,6°). Trova il FIX (latitudine S, longitudine W).',
      campi: [['φ gradi', fg, 0, '°'], ['φ primi', fp, 0.25, '′'], ['λ gradi', lg, 0, '°'], ['λ primi', lp, 0.25, '′']],
      soluzione: `Incrocio delle due rette: Δφ = ${dfi >= 0 ? '+' : '−'}${v1(Math.abs(dfi))}′ (${dfi >= 0 ? 'verso N' : 'verso S'}), spostamento ${p[0] >= 0 ? 'Est' : 'Ovest'} ${v1(Math.abs(p[0]))} miglia, cioè Δλ = ${v1(Math.abs(dla))}′; FIX ${Cielo.ang(c.lat, { segno: 'NS' })} ${Cielo.ang(c.lon, { segno: 'EW', tre: true })}. Il libro non stampa il risultato: l'ha calcolato il motore.`,
    });
  }
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* La prova: crepuscolo, punto stimato e nave vera come nell'esperienza 12, ma il sestante ha un errore -------------- */
  const STIMATO = { lat: Cielo.LUOGHI.procida.lat, lon: Cielo.LUOGHI.procida.lon };
  const SCARTO = [5, 3];
  const ERRORE = 2.0; // primi in più su ogni altezza, come chi «bagna» l'astro (p. 130): scelta del libro 3D per la prova
  const VERO = Carteggio.coordinate(SCARTO, STIMATO.lat, STIMATO.lon);
  const COLORI = ['#B3362B', '#2E7DB5', '#2E8B57', '#9A5B12'];
  const CANDIDATE = ['Polare', 'Kochab', 'Vega', 'Arturo', 'Capella', 'Sirio', 'Altair', 'Deneb', 'Aldebaran', 'Betelgeuse', 'Rigel', 'Procyon', 'Regolo', 'Spica', 'Antares', 'Polluce', 'Fomalhaut', 'Dubhe', 'Alphecca', 'Hamal', 'Markab', 'Enif', 'Rasalhague', 'Denebola', 'Mirfak', 'Alpheratz', 'Diphda', 'Menkar', 'Alkaid', 'Eltanin', 'Nunki', 'Alnilam', 'Bellatrix'];
  const nomeIt = (n) => (n === 'Procyon' ? 'Procione' : n);
  const pr = { rette: [], esito: null, pronto: false, fix: null, vertici: null };

  function retta(nome) {
    const s = Cielo.stella(nome);
    const st = Cielo.altazimut(s.T, s.dec, STIMATO.lat, STIMATO.lon);
    const ve = Cielo.altazimut(s.T, s.dec, VERO.lat, VERO.lon);
    return { nome, a: st.a, hs: st.h, hv: ve.h + ERRORE / 60, dh: (ve.h - st.h) * 60 + ERRORE };
  }
  const visibili = () => CANDIDATE.filter((n) => Cielo.hrDi[n] !== undefined).map((n) => ({ n, v: Cielo.altazimut(Cielo.stella(n).T, Cielo.stella(n).dec, STIMATO.lat, STIMATO.lon) }))
    .filter((x) => x.v.h > 15 && x.v.h < 75).sort((a, b) => a.v.a - b.v.a).map((x) => x.n);
  const azimutDi = (n) => Cielo.altazimut(Cielo.stella(n).T, Cielo.stella(n).dec, STIMATO.lat, STIMATO.lon).a;

  const carta = Scene.carta({
    disegna: (ctx, W, H) => Carteggio.disegna(ctx, W, H, {
      phi: STIMATO.lat, scala: 70, centro: [W / 2, H / 2],
      rette: pr.rette.map((r, k) => ({ ...r, nome: nomeIt(r.nome), col: COLORI[k % COLORI.length] })),
      fix: pr.fix, vero: pr.fix ? SCARTO : null, vertici: pr.vertici,
      titolo: `Crepuscolo · punto stimato ${Cielo.ang(STIMATO.lat, { segno: 'NS' })} ${Cielo.ang(STIMATO.lon, { segno: 'EW', tre: true })} · ${Cielo.giorno()} ${Cielo.ora().slice(0, 5)} UTC`,
    }),
  });
  function mondo() {
    const m = carta();
    if (!pr.pronto) {
      pr.pronto = true;
      // Crepuscolo nautico serale: Sole a −9°, stelle e orizzonte si vedono insieme (p. 33)
      Cielo.imposta({ lat: VERO.lat, lon: VERO.lon, luogo: '', corre: false });
      const t = Cielo.istanteSole(-9, -1); if (t) Cielo.imposta({ data: t });
      m.ridisegna();
      setTimeout(() => Motore.ridisegna(), 0);
    }
    return m;
  }

  const v2 = (x) => x.toFixed(1).replace('.', ',');
  function fai() {
    pr.fix = null; pr.vertici = null;
    const r = pr.rette;
    if (r.length < 2) { pr.esito = { tipo: 'errato', testo: 'Servono almeno due rette.' }; return; }
    if (r.length === 2) {
      const d = Carteggio.da(r[0].a, r[1].a);
      if (d < 30 || d > 150) { pr.esito = { tipo: 'errato', testo: `Differenza d'azimut ${Math.round(d)}°: fuori da 30°–150° (p. 131).` }; return; }
      pr.fix = Carteggio.incrocio(r[0], r[1]);
      const err = Math.hypot(pr.fix[0] - SCARTO[0], pr.fix[1] - SCARTO[1]);
      lez.completa('due');
      pr.esito = { tipo: 'giusto', testo: `Le due rette si incrociano in un punto e sembra tutto a posto. Ma la nave vera (in arancio) è a ${v2(err)} miglia: con due rette l'errore non si vede.` };
      return;
    }
    const tre = r.slice(-3);
    const f = Carteggio.fixTre(tre);
    pr.fix = f.p; pr.vertici = f.vertici;
    const err = Math.hypot(f.p[0] - SCARTO[0], f.p[1] - SCARTO[1]);
    if (f.modo === 'incentro') {
      lez.completa('tre');
      pr.esito = { tipo: 'giusto', testo: `Le tre rette non passano per un punto: fanno un triangolo. Il FIX è l'incentro, a ${v2(Math.abs(f.d))}′ da ogni lato: è l'errore sistematico (le altezze erano ${f.d >= 0 ? 'troppo grandi' : 'troppo piccole'}). Dalla nave vera: ${v2(err)} miglia.` };
    } else {
      lez.completa('parte');
      pr.esito = { tipo: 'giusto', testo: `Astri tutti in metà orizzonte: le bisettrici non bastano. Si traccia la bisettrice della coppia più divergente (${nomeIt(tre[f.coppia[0]].nome)}–${nomeIt(tre[f.coppia[1]].nome)}) e la si incrocia con la retta intermedia (${nomeIt(tre[f.media].nome)}), fig. 9.8. Dalla nave vera: ${v2(err)} miglia.` };
    }
  }
  function comandi(id) {
    if (id.startsWith('retta:')) {
      const nome = id.slice(6);
      if (pr.rette.find((r) => r.nome === nome)) pr.rette = pr.rette.filter((r) => r.nome !== nome);
      else { pr.rette.push(retta(nome)); if (pr.rette.length > 3) pr.rette.shift(); }
      pr.fix = null; pr.vertici = null;
      const r = pr.rette.find((x) => x.nome === nome);
      pr.esito = r ? { tipo: 'nota', testo: `${nomeIt(nome)}: azimut ${Cielo.ang(r.a, { tre: true })}, Δh ${r.dh >= 0 ? '+' : ''}${v2(r.dh)}′.` } : null;
    }
    if (id === 'fai-fix') fai();
    if (id === 'azzera') { pr.rette = []; pr.fix = null; pr.vertici = null; pr.esito = null; }
    if (id === 'giorno+' || id === 'giorno-') {
      // Il crepuscolo del giorno dopo o prima: il cielo cambia poco, ma cambia
      const da = Cielo.stato.data + (id === 'giorno+' ? 1 : -1) * 864e5 - 6 * 3600e3;
      const t = Cielo.istanteSole(-9, -1, da); if (t) Cielo.imposta({ data: t });
      pr.rette = pr.rette.map((x) => retta(x.nome)); pr.fix = null; pr.vertici = null;
    }
    carta().ridisegna();
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  // Al massimo 12 bottoni, presi a intervalli regolari d'azimut perché ci sia tutto l'orizzonte
  const dodici = () => { const v = visibili(); const k = Math.ceil(v.length / 12); return v.filter((x, i) => i % k === 0); };
  // Due file di bottoni, al massimo sei per fila
  const stelle = () => {
    const lista = dodici().map((n) => ({ id: `retta:${n}`, testo: `${nomeIt(n)} ${Math.round(azimutDi(n))}°`, on: !!pr.rette.find((r) => r.nome === n) }));
    const meta = Math.ceil(lista.length / 2);
    return [lista.slice(0, meta), lista.slice(meta)].filter((x) => x.length).map((l) => ({ t: 'bottoni', h: 74, size: 26, lista: l }));
  };
  const RISPOSTE = { errore: 'Per scoprire l\'errore delle misure', scorta: 'Per avere una retta di scorta', basta: 'Ne bastano due: la terza non serve' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Il punto nave con le stelle' },
          { t: 'p', size: 38, testo: 'Un tempo si facevano tre punti nave al giorno: ai due **crepuscoli** e al mezzogiorno di bordo. Per questo si è studiato a fondo come valutarne la precisione. {{p. 130}}' },
          { t: 'p', size: 38, testo: 'Al crepuscolo si vedono insieme le stelle e l\'orizzonte: si misurano più astri in pochi minuti, si tracciano le rette, si cerca l\'incrocio. {{pp. 122–123}}' },
        ],
        dx: [
          finestra(900, 'Sei al tavolo di carteggio.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'nota', testo: 'Stesso punto stimato e stessa nave vera dell\'esperienza 12. Ora il sestante sbaglia: ogni altezza ha 2,0′ in più.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Due rette bastano a fare un incrocio. Eppure al crepuscolo si osservano tre o quattro stelle.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Perché tre rette e non due?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Stelle al crepuscolo, con l\'azimut (al massimo tre rette)' },
          ...stelle(),
          { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'fai-fix', testo: 'Cerca il FIX' }, { id: 'azzera', testo: 'Foglio pulito' }, { id: 'giorno+', testo: 'Crepuscolo dopo' }] },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(860, 'Guarda il foglio sul tavolo.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'nota', testo: 'Errore di 2,0′ messo dal libro 3D, uguale per tutte le altezze: è un errore sistematico, come quello di chi «bagna» l\'astro.' },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Tre rette, un triangolo' },
          ...(p ? [{ t: 'nota', testo: p === 'errore' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 34, testo: 'Le altezze hanno errori: depressione e rifrazione variabili, errori del sestante, l\'**errore personale** di chi «bagna» l\'astro, il mare. Un errore sposta la retta verso l\'astro (altezza misurata troppo grande) o dalla parte opposta. {{pp. 130–131}}' },
          { t: 'p', size: 34, testo: 'Con due rette non si vede nulla. Con tre si forma un triangolo: se gli astri sono sparsi su tutto l\'orizzonte il fix è l\'**incentro**, e la sua distanza dai lati misura l\'errore sistematico. {{p. 133, fig. 9.7}}' },
        ],
        dx: [
          finestra(520, 'Guarda il foglio sul tavolo.', 'Vai a grandezza vera per stare al tavolo.'),
          ...scala(),
          { t: 'p', size: 32, testo: 'La **bisettrice d\'altezza** è quella fra rette le cui freccette si «guardano» o si «sguardano»: elimina l\'errore sistematico. Se gli astri stanno in metà orizzonte si usa la bisettrice migliore incrociata con la retta intermedia. {{pp. 132–134}}' },
          { t: 'p', size: 32, testo: 'Con **quattro rette**, a coppie opposte, si stima anche l\'errore accidentale. {{p. 134}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'La nave si muove' },
          { t: 'p', size: 34, testo: 'Per misurare un\'altezza servono minuti. Se le osservazioni non sono simultanee, i punti determinativi si **trasportano** all\'istante dell\'ultima: con il punto stimato relativo, con il trasporto grafico lungo la rotta (come il *running fix* costiero) o con il trasporto analitico. {{p. 121}}' },
          { t: 'formula', testo: 'Δh′ = Δh + m cos(Rᵥ − a)' },
          { t: 'nota', testo: 'Formula 8.2 a p. 121: m è il cammino percorso fra le due osservazioni, Δh in primi.' },
        ],
        dx: [
          { t: 'p', size: 34, testo: 'Di giorno c\'è solo il **Sole**: un\'osservazione al mezzogiorno di bordo e un\'altra almeno due ore prima o dopo, con almeno 30° di differenza d\'azimut. Le due rette si calcolano ognuna con il suo punto stimato. {{p. 124}}' },
          { t: 'tabella', col: [40, 30, 30], size: 30, righe: [['Esempi di p. 122', 'Primo', 'Secondo'], ['Δh, azimut', '+3,5′, 306°', '−1,1′, 068°'], ['Rᵥ, V', '010°, 12,4 kn', '120°, 13,8 kn'], ['Δt, m', '6m18s, 1,3 mg', '4m22s, 1,0 mg'], ['Δh′', '+4,1′', '−0,5′']] },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sui capitoli 8 e 9 del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Trasporto e fix' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Esempi di p. 122 e p. 123. Tolleranza ±0,05 miglia e ±0,05′; sul fix ±0,2′.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
