/* Esperienza 6: la Luna. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica» vol. 2: moto della
   Luna, § 1.8 (pp. 32–33); maree teoriche, cap. 22 (pp. 373–377). Le eclissi nel libro non ci sono: date e tipi
   si calcolano con Astronomy Engine, la spiegazione usa solo l'orbita inclinata e i nodi (p. 33). Regole in design.md */
(function () {
  const N = 6;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'fasi', testo: 'Porta la Luna al novilunio e al plenilunio.' },
    { id: 'eclissi', testo: 'Salta di novilunio in plenilunio fino a trovare un\'eclissi.' },
    { id: 'quadratura', testo: 'Accendi le maree e porta la Luna a un quarto.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Il periodo di rotazione della Luna è uguale alla sua rivoluzione…', scelte: ['sinodica', 'siderea', 'draconitica'], giusta: 1, perche: 'Rivoluzione siderea e rotazione durano entrambe 27d07h43m: per questo la Luna ci mostra sempre la stessa faccia. {{p. 33, tab. 1.9}}' },
    { n: 2, testo: 'Le fasi lunari dipendono dalla rivoluzione…', scelte: ['siderea', 'draconitica', 'sinodica'], giusta: 2, perche: 'La rivoluzione sinodica, circa 29,53 giorni, riporta la Luna in congiunzione col Sole: è più lunga della siderea perché intanto il Sole si sposta. {{p. 33}}' },
    { n: 3, testo: 'Al plenilunio la Luna…', scelte: ['sorge quando il Sole tramonta', 'sorge e tramonta con il Sole', 'è al primo quarto'], giusta: 0, perche: 'Il plenilunio corrisponde all\'opposizione; al novilunio, in congiunzione, Luna e Sole sorgono e tramontano insieme. {{p. 33}}' },
    { n: 4, testo: 'L\'orbita della Luna è inclinata sull\'eclittica di…', scelte: ['23°27′', '5°09′', '28°36′'], giusta: 1, perche: 'I nodi dell\'orbita retrocedono in 18 anni e 8 mesi: la declinazione massima della Luna va da 18°18′ a 28°36′. {{p. 33}}' },
    { n: 5, testo: 'In un giorno lunare, nella maggior parte dei luoghi, si hanno…', scelte: ['due alte e due basse maree, a circa 6h12m l\'una dall\'altra', 'una sola alta e una sola bassa marea', 'quattro alte maree'], giusta: 0, perche: 'Ruotando, ogni punto della Terra passa due volte sotto i rigonfiamenti dell\'ellissoide di marea e due volte fra di essi. {{p. 374}}' },
    { n: 6, testo: 'Le maree sizigiali, di ampiezza massima, si hanno…', scelte: ['ai quarti', 'agli ottanti', 'a Luna nuova e Luna piena'], giusta: 2, perche: 'Con Sole e Luna in congiunzione o in opposizione gli effetti si sommano; ai quarti si sottraggono: maree di quadratura. {{p. 376}}' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  /* Fase, latitudine eclittica, eclissi: tutto calcolato ------------------------------------------- */
  const FASI = ['novilunio', 'primo ottante', 'primo quarto', 'secondo ottante', 'plenilunio', 'terzo ottante', 'ultimo quarto', 'quarto ottante'];
  function luna(ms) {
    const t = Cielo.tempo(ms);
    const el = Astronomy.MoonPhase(t); // 0 novilunio, 90 primo quarto, 180 plenilunio, 270 ultimo quarto
    const ill = Astronomy.Illumination('Moon', t).phase_fraction;
    const beta = Astronomy.EclipticGeoMoon(t).lat;
    const c = Cielo.corpo('Luna', t);
    return { el, ill, beta, dec: c.dec, km: c.km, fase: FASI[Math.round(el / 45) % 8] };
  }
  const TIPI = { penumbral: 'di penombra', partial: 'parziale', total: 'totale', annular: 'anulare' };
  // C'è un'eclissi entro 12 ore dall'istante dato? (di Luna al plenilunio, di Sole al novilunio)
  function eclissiVicina(ms, quale) {
    const da = new Date(ms - 2 * 864e5);
    const e = quale === 'Luna' ? Astronomy.SearchLunarEclipse(da) : Astronomy.SearchGlobalSolarEclipse(da);
    return e && Math.abs(e.peak.date.getTime() - ms) < 12 * 3600e3 ? e : null;
  }
  function prossimeEclissi(ms, quante) {
    const out = [];
    let el = Astronomy.SearchLunarEclipse(new Date(ms)); let es = Astronomy.SearchGlobalSolarEclipse(new Date(ms));
    while (out.length < quante) {
      if (el.peak.date < es.peak.date) { out.push({ chi: 'Luna', tipo: TIPI[el.kind] || el.kind, t: el.peak.date.getTime() }); el = Astronomy.NextLunarEclipse(el.peak); } else { out.push({ chi: 'Sole', tipo: TIPI[es.kind] || es.kind, t: es.peak.date.getTime() }); es = Astronomy.NextGlobalSolarEclipse(es.peak); }
    }
    return out;
  }
  const faseSucc = (ang, ms) => { const t = Astronomy.SearchMoonPhase(ang, new Date(ms + 3600e3), 40); return t ? t.date.getTime() : ms; };

  /* La prova: la Terra, la Luna e la sua orbita ------------------------------------------------------ */
  const pr = { esito: null, pronto: false, viste: new Set(), maree: false };
  const globo = Scene.globo({ luna: true });
  function mondo() {
    const m = globo();
    if (!pr.pronto) {
      pr.pronto = true;
      Cielo.imposta({ corre: false });
      m.vistaIniziale = () => ({ target: new THREE.Vector3(0, 0, 0), theta: 0.6, phi: 1.05, r: 125 });
      setTimeout(() => Motore.ridisegna(), 0);
    }
    m.terra.marea(pr.maree); m.terraMini.marea(pr.maree);
    return m;
  }
  const beta = (b) => `${Cielo.ang(Math.abs(b))} a ${b >= 0 ? 'Nord' : 'Sud'}`;
  function arrivo(quale) {
    const l = luna(); const giorno = Cielo.giorno();
    if (quale === 'nuova' || quale === 'piena') {
      pr.viste.add(quale);
      if (pr.viste.has('nuova') && pr.viste.has('piena')) lez.completa('fasi');
      const e = eclissiVicina(Cielo.stato.data, quale === 'piena' ? 'Luna' : 'Sole');
      if (e) {
        lez.completa('eclissi');
        pr.esito = { tipo: 'giusto', testo: `${giorno}: ${quale === 'piena' ? 'plenilunio' : 'novilunio'} con la Luna a ${beta(l.beta)} dell'eclittica, vicino a un nodo. Sole, Terra e Luna sono allineati: eclissi ${quale === 'piena' ? 'di Luna' : 'di Sole'} ${TIPI[e.kind] || e.kind}.` };
      } else pr.esito = { tipo: 'neutro', testo: `${giorno}: ${quale === 'piena' ? 'plenilunio' : 'novilunio'}, ma la Luna passa a ${beta(l.beta)} dell'eclittica: niente eclissi. Continua a saltare.` };
    } else if (quale === 'quarto') {
      if (pr.maree) {
        lez.completa('quadratura');
        pr.esito = { tipo: 'giusto', testo: `${giorno}: ${l.fase}. I due ellissoidi di marea, della Luna (blu) e del Sole (rosso), sono a 90°: gli effetti si sottraggono. Maree di quadratura.` };
      } else pr.esito = { tipo: 'neutro', testo: `${giorno}: ${l.fase}. Accendi le maree per vedere i due ellissoidi.` };
    }
  }
  function comandi(id) {
    const s = Cielo.stato;
    if (id === 'giorno-' || id === 'giorno+') { Cielo.imposta({ data: s.data + (id === 'giorno+' ? 1 : -1) * 864e5 }); pr.esito = null; }
    if (id === 'f:nuova') { Cielo.imposta({ data: faseSucc(0, s.data), corre: false }); arrivo('nuova'); }
    if (id === 'f:piena') { Cielo.imposta({ data: faseSucc(180, s.data), corre: false }); arrivo('piena'); }
    if (id === 'f:quarto') {
      const a = faseSucc(90, s.data); const b = faseSucc(270, s.data);
      Cielo.imposta({ data: Math.min(a, b), corre: false }); arrivo('quarto');
    }
    if (id === 'maree') {
      pr.maree = !pr.maree; const m = globo(); m.terra.marea(pr.maree); m.terraMini.marea(pr.maree);
      const l = luna(); if (pr.maree && /quarto/.test(l.fase)) arrivo('quarto');
    }
    if (id === 'gira') Cielo.imposta({ corre: !s.corre, velocita: 7200 });
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei nello spazio, fuori dall\'orbita della Luna.' : 'Il modellino: Terra, Luna e la sua orbita.' });
  function riquadro() {
    const l = luna();
    return { t: 'riquadro', size: 32, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · ${l.fase}, illuminata al ${Math.round(l.ill * 100)}% · δ ${Cielo.ang(l.dec, { segno: 'NS' })} · dall'eclittica ${beta(l.beta)} · ${Math.round(l.km).toLocaleString('it-IT')} km` };
  }
  const comandiLuna = () => [
    { t: 'passo', id: 'giorno', nome: 'Un giorno alla volta', valore: Cielo.giorno() },
    { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'f:nuova', testo: 'Novilunio' }, { id: 'f:quarto', testo: 'Quarto' }, { id: 'f:piena', testo: 'Plenilunio' }] },
    { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'maree', testo: pr.maree ? 'Spegni le maree' : 'Accendi le maree', on: pr.maree }, { id: 'gira', testo: Cielo.stato.corre ? 'Ferma' : 'Fai girare', on: Cielo.stato.corre }] },
  ];
  function tabellaFasi() {
    const ms = Cielo.stato.data;
    const righe = [[0, 'Novilunio'], [90, 'Primo quarto'], [180, 'Plenilunio'], [270, 'Ultimo quarto']].map(([a, n]) => [faseSucc(a, ms), n]);
    righe.sort((x, y) => x[0] - y[0]);
    return [['Prossime fasi', 'Data (UTC)'], ...righe.map(([t, n]) => [n, `${Cielo.giorno(t)} ${Cielo.ora(t).slice(0, 5)}`])];
  }
  function tabellaEclissi() {
    return [['Eclissi', 'Tipo', 'Data (UTC)'], ...prossimeEclissi(Cielo.stato.data, 6).map((e) => [`di ${e.chi}`, e.tipo, Cielo.giorno(e.t)])];
  }
  const RISPOSTE = { orbita: 'L\'orbita della Luna è inclinata: di solito passa sopra o sotto', lontana: 'La Luna a volte è troppo lontana', veloce: 'La Luna va troppo veloce per coprire il Sole' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'La Luna' },
          { t: 'p', size: 36, testo: 'La Luna è facile da riconoscere, si vede anche di giorno e la sua luce può illuminare l\'orizzonte di notte. Ha un raggio di circa ¼ di quello terrestre. {{pp. 32–33}}' },
          { t: 'tabella', col: [40, 60], size: 30, righe: [['Rivoluzione', 'Durata'], ['siderea, 360° attorno alla Terra', '27d07h43m, come la rotazione'], ['draconitica, da nodo ascendente a nodo ascendente', '27d05h06m'], ['sinodica, da congiunzione a congiunzione col Sole', 'circa 29,53 d']] },
          { t: 'nota', testo: 'Tabella 1.9 a p. 33.' },
        ],
        dx: [
          finestra(780), ...scala(),
          riquadro(),
          { t: 'nota', testo: 'In grigio l\'orbita della Luna, in arancio l\'eclittica. Distanze e dimensioni non in scala.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Al novilunio la Luna passa fra la Terra e il Sole; al plenilunio, dalla parte opposta. Succede ogni mese.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Perché non c\'è un\'eclissi ogni mese?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          ...comandiLuna(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(760), ...scala(),
          riquadro(),
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Fasi e nodi' },
          ...(p ? [{ t: 'nota', testo: p === 'orbita' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 33, testo: '**Novilunio** in congiunzione, quando Luna e Sole sorgono e tramontano insieme; **plenilunio** in opposizione, quando la Luna sorge al tramonto del Sole. In mezzo i **quarti** (quadrature) e gli **ottanti**. {{p. 33}}' },
          { t: 'p', size: 33, testo: 'L\'orbita è inclinata di **5°09′** sull\'eclittica. I **nodi** retrocedono e fanno il giro in 18 anni e 8 mesi: così la declinazione massima della Luna va da 18°18′ a 28°36′. {{p. 33}}' },
          { t: 'p', size: 33, testo: 'Perché la Luna copra il Sole, o entri nell\'ombra della Terra, non basta il novilunio o il plenilunio: deve essere anche vicina a un nodo, cioè sull\'eclittica.' },
        ],
        dx: [
          finestra(560), ...scala(),
          ...comandiLuna(),
          { t: 'tabella', col: [55, 45], size: 30, righe: tabellaFasi() },
        ],
      },
      {
        passo: 3, mondo, azione: comandi, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Le maree' },
          { t: 'p', size: 32, testo: 'Attrazione della Luna e forza centrifuga del sistema Terra-Luna spingono le acque verso l\'esterno nel punto sotto la Luna e nel suo antipodo: è l\'**ellissoide di marea** (*tidal ellipsoid*), che segue la Luna. {{pp. 373–374}}' },
          { t: 'p', size: 32, testo: 'La Terra gira sotto l\'ellissoide: quasi ovunque, in un giorno lunare, **due alte e due basse maree**, a circa 6h12m l\'una dall\'altra. {{p. 374}}' },
          { t: 'p', size: 32, testo: 'Il Sole fa lo stesso, con circa il **45%** dell\'effetto della Luna. A Luna nuova e piena gli effetti si sommano: **maree sizigiali** (*spring tides*). Ai quarti si sottraggono: **maree di quadratura** (*neap tides*). {{p. 376}}' },
        ],
        dx: [
          finestra(560), ...scala(),
          ...comandiLuna(),
          { t: 'p', size: 32, testo: 'Agli ottanti gli ellissoidi sono inclinati fra loro: l\'alta marea anticipa o ritarda sul passaggio della Luna fino a circa 44 minuti, è l\'**ineguaglianza di fase**. {{p. 377}}' },
          { t: 'nota', testo: 'Ellissoidi molto esagerati: in blu la Luna, in rosso il Sole.' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Le prossime eclissi' },
          { t: 'p', size: 34, testo: 'Un\'eclissi capita quando un novilunio o un plenilunio cade con la Luna vicino a un nodo. Guarda le date: le eclissi arrivano a gruppi, quando il Sole passa vicino alla linea dei nodi.' },
          { t: 'tabella', col: [30, 30, 40], size: 32, righe: tabellaEclissi() },
          { t: 'nota', testo: 'Eclissi calcolate con Astronomy Engine: il libro non le tratta. Quelle di Sole si vedono solo da una parte della Terra.' },
        ],
        dx: [
          { t: 'p', size: 34, testo: 'Le maree dipendono anche dalla distanza: con la Luna al **perigeo**, più vicina, si hanno maree perigeali; all\'**apogeo** maree apogeali. {{p. 376}}' },
          { t: 'p', size: 34, testo: 'Con la Luna fuori dall\'equatore le due alte maree del giorno non sono uguali: è l\'**ineguaglianza diurna**, minima quando la Luna è ai nodi. {{pp. 375–376}}' },
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
