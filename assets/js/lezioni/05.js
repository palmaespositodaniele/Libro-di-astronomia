/* Esperienza 5: che ora è? Contenuti da «Fondamenti di Navigazione e Meteorologia nautica» vol. 2, cap. 2:
   tempo locale e di Greenwich (p. 43), giorni e Sole medio (pp. 45–46), fusi e date (pp. 47–49), cronometro
   (pp. 50–51). Esempi di p. 49 ed esercizi 1–3 di p. 51 (senza risultati: si calcolano). Regole in design.md */
(function () {
  const N = 5;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'mezzodi', testo: 'Porta il Sole sul meridiano della nave: è il suo mezzogiorno vero.' },
    { id: 'cronometro', testo: 'Metti il cronometro sulle 12:00 e guarda dove è mezzogiorno vero.' },
    { id: 'data', testo: 'Porta la nave oltre il meridiano dei 180° e guarda la data del fuso.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Con la longitudine Est positiva e Ovest negativa, il tempo locale t di un astro è…', scelte: ['t = T − λ', 't = T + λ', 't = λ − T'], giusta: 1, perche: 'Dalla relazione t − T = λ (2.2) vengono t = T + λ (2.3) e T = t − λ (2.4). {{p. 43}}' },
    { n: 2, testo: 'Per il tempo civile si usa il Sole medio equatoriale perché il Sole vero…', scelte: ['non passa mai al meridiano', 'è troppo luminoso', 'si muove sull\'eclittica con velocità variabile'], giusta: 2, perche: 'Il moto del Sole vero cambia velocità durante l\'anno e avviene su un piano inclinato sull\'equatore: i giorni veri non sono tutti uguali. {{p. 45}}' },
    { n: 3, testo: 'L\'equazione del tempo εᵥ è…', scelte: ['la differenza fra tempo medio e tempo vero', 'la differenza fra tempo fuso e tempo medio', 'il ritardo del Sole medio'], giusta: 0, perche: 'εᵥ = tₘ − tᵥ: la differenza fra il tempo del Sole medio equatoriale e quello del Sole vero (2.10). {{p. 46}}' },
    { n: 4, testo: '24 ore medie corrispondono a…', scelte: ['23h56m04,09s sideree', '24h03m56,56s sideree', '24 ore sideree esatte'], giusta: 1, perche: 'La differenza di 3m56,56s è l\'accelerazione delle stelle fisse; 24 ore sideree valgono 23h56m04,09s medie. {{p. 46}}' },
    { n: 5, testo: 'Navigando verso Est si supera l\'antimeridiano di Greenwich. La data…', scelte: ['cresce di un giorno', 'cala di un giorno', 'non cambia'], giusta: 1, perche: '«Rotta a levante data calante, rotta a ponente data crescente». {{p. 49}}' },
    { n: 6, testo: 'Lo stato assoluto K del cronometro è…', scelte: ['la correzione da dare all\'ora letta per avere quella esatta', 'la correzione fuso', 'l\'ambiguità di 12 ore del quadrante'], giusta: 0, perche: 'Il cronometro accumula errori: K si ricava dai segnali orari e si somma all\'ora letta Tc. {{p. 50}}' },
  ];

  /* Esempi di p. 49 ed esercizi di p. 51 ---------------------------------------------------------- */
  const due = (n) => String(n).padStart(2, '0');
  const hms = (s) => { s = ((Math.round(s) % 86400) + 86400) % 86400; return `${due(Math.floor(s / 3600))}h${due(Math.floor((s % 3600) / 60))}m${due(s % 60)}s`; };
  const hm = (min) => { min = ((Math.round(min) % 1440) + 1440) % 1440; return `${due(Math.floor(min / 60))}h${due(min % 60)}m`; };
  // Longitudine in tempo: 4 minuti ogni grado, arrotondata al minuto come nel libro
  const lonMin = (g, p) => Math.round((g + p / 60) * 4);
  const FUSI = [
    { n: 7, cosa: 'tm', lon: -lonMin(34, 52), lonT: '034°52′W', Tm: 22 * 60 + 39 },
    { n: 8, cosa: 'tf', lon: -lonMin(34, 52), lonT: '034°52′W', Tm: 22 * 60 + 39 },
    { n: 9, cosa: 'da tf', lon: lonMin(140, 16), lonT: '140°16′E', tf: 14 * 60 + 22 },
  ];
  const CALCOLI = FUSI.map((x) => {
    const lf = Math.round(x.lon / 60) * 60; // λ fuso in minuti: ore intere
    const sgn = (m) => `(${m < 0 ? '−' : '+'})${hm(Math.abs(m))}`;
    if (x.cosa === 'da tf') {
      const tm = x.tf - (lf - x.lon);
      return {
        n: x.n, testo: `Longitudine λ = ${x.lonT}, tempo fuso tf = ${hm(x.tf)}. Trova il tempo medio locale tₘ. {{p. 49}}`,
        campi: [['ore', Math.floor(tm / 60) % 24, 0, 'h'], ['minuti', tm % 60, 0, 'm']],
        soluzione: `λ = ${sgn(x.lon)}, λf = ${sgn(lf)}, cf = λf − λ = ${(lf - x.lon) < 0 ? '−' : '+'}${Math.abs(lf - x.lon)}m; tₘ = tf − cf = ${hm(tm)}.`,
      };
    }
    const tm = x.Tm + x.lon; const tf = x.Tm + lf;
    const v = x.cosa === 'tm' ? tm : tf;
    return {
      n: x.n,
      testo: x.cosa === 'tm' ? `Longitudine λ = ${x.lonT}, a Greenwich Tₘ = ${hm(x.Tm)}. Trova il tempo medio locale tₘ. {{p. 49}}` : `Stessa nave: λ = ${x.lonT}, Tₘ = ${hm(x.Tm)}. Trova il tempo fuso tf. {{p. 49}}`,
      campi: [['ore', Math.floor(((v % 1440) + 1440) % 1440 / 60), 0, 'h'], ['minuti', ((v % 60) + 60) % 60, 0, 'm']],
      soluzione: x.cosa === 'tm' ? `λ = ${sgn(x.lon)}; tₘ = Tₘ + λ = ${hm(tm)}.` : `Fuso del meridiano 30°W, λf = ${sgn(lf)}; tf = Tₘ + λf = ${hm(tf)}; cf = λf − λ = +${lf - x.lon}m.`,
    };
  });
  // Cronometro: ora approssimata, longitudine, lettura Tc e stato K (secondi)
  const CRONO = [
    { n: 10, circa: 11, lon: -(168 + 29 / 60), lonT: '168°29′W', tc: [10, 14, 14], k: 12 },
    { n: 11, circa: 14, lon: 49 + 42 / 60, lonT: '049°42′E', tc: [10, 42, 14], k: -8 },
    { n: 12, circa: 23, lon: -(38 + 41 / 60), lonT: '038°41′W', tc: [1, 33, 40], k: 112 },
  ];
  CRONO.forEach((x) => {
    const T = x.circa * 3600 - x.lon * 240; // tempo di Greenwich approssimato, in secondi
    const tc12 = x.tc[0] * 3600 + x.tc[1] * 60 + x.tc[2];
    // Il quadrante ha 12 ore: si sceglie la lettura (Tc più un multiplo di 12h) più vicina a T
    const tc = tc12 + Math.round((T - tc12) / 43200) * 43200;
    const tm = tc + x.k; const dopo = tm >= 86400; const s = ((tm % 86400) + 86400) % 86400;
    const kT = `${x.k < 0 ? '−' : '+'}${Math.floor(Math.abs(x.k) / 60)}m${due(Math.abs(x.k) % 60)}s`;
    CALCOLI.push({
      n: x.n,
      testo: `Intorno alle ore ${x.circa}h, in λ = ${x.lonT}, il cronometro segna Tc = ${hms(tc12)}; K = ${kT}. Trova Tₘ. {{p. 51, es. ${x.n - 9}}}`,
      campi: [['ore', Math.floor(s / 3600), 0, 'h'], ['minuti', Math.floor((s % 3600) / 60), 0, 'm'], ['secondi', s % 60, 0, 's']],
      soluzione: `T ≈ ${x.circa}h − λ = ${hm(T / 60)}${T >= 86400 ? ' del giorno dopo' : ''}; Tc = ${hms(tc)}; Tₘ = Tc + K = ${hms(tm)}${dopo ? ' del giorno dopo' : ''}.`,
    });
  });
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* Il tempo della nave: medio, vero, fuso; equazione del tempo (tutto in minuti) -------------------- */
  function tempi(ms) {
    const s = Cielo.stato; ms = ms === undefined ? s.data : ms;
    const d = new Date(ms);
    const Tm = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    const sole = Cielo.corpo('Sole', Cielo.tempo(ms));
    const tvG = sole.T * 4 + 720; // tempo vero di Greenwich: angolo orario del Sole + 12h
    let eps = ((Tm - tvG) % 1440 + 1440) % 1440; if (eps > 720) eps -= 1440; // εᵥ = tₘ − tᵥ
    const lam = s.lon * 4; const fuso = Math.round(s.lon / 15);
    const tSole = Cielo.norm(sole.T + s.lon); // angolo orario locale del Sole, gradi
    return { Tm, eps, lam, fuso, tm: Tm + lam, tv: Tm + lam - eps, tf: Tm + fuso * 60, tSole, msFuso: ms + fuso * 3600e3 };
  }
  const minuti = (m) => `${m < 0 ? '−' : '+'}${Math.floor(Math.abs(m))}m${due(Math.round((Math.abs(m) % 1) * 60) % 60)}s`;
  const segnoFuso = (f) => (f === 0 ? '0' : `${f > 0 ? '+' : '−'}${Math.abs(f)}h`);

  /* La prova: la Terra dallo spazio --------------------------------------------------------------- */
  const pr = { esito: null, pronto: false };
  const globo = Scene.globo({ ogni: () => { if (controlla()) Motore.ridisegna(); } });
  function guardaNave() {
    const ra = (Cielo.tGamma(Cielo.tempo()) + Cielo.stato.lon) * RAD;
    return { target: new THREE.Vector3(0, 0, 0), theta: Math.atan2(Math.cos(ra), -Math.sin(ra)), phi: (90 - Cielo.stato.lat * 0.6) * RAD, r: 50 };
  }
  function mondo() {
    const m = globo();
    if (!pr.pronto) {
      pr.pronto = true;
      Cielo.imposta({ corre: false });
      m.vistaIniziale = guardaNave;
      setTimeout(() => Motore.ridisegna(), 0);
    }
    return m;
  }
  // Mezzogiorno vero sulla nave: il Sole a meno di 1,5° (6 minuti) dal meridiano superiore
  function controlla() {
    if (lez.fatte.has('mezzodi')) return false;
    const t = tempi();
    if (Math.min(t.tSole, 360 - t.tSole) < 1.5) {
      lez.completa('mezzodi');
      pr.esito = { tipo: 'giusto', testo: `Mezzogiorno vero sulla nave: tᵥ ≈ 12h. Il cronometro segna Tₘ = ${hm(t.Tm)}; il tempo medio locale è tₘ = Tₘ + λ = ${hm(t.tm)}. La differenza con 12h è l'equazione del tempo, εᵥ = ${minuti(t.eps)}.` };
      return true;
    }
    return false;
  }
  function comandi(id) {
    const s = Cielo.stato;
    if (id === 'ora-' || id === 'ora+') Cielo.imposta({ data: s.data + (id === 'ora+' ? 1 : -1) * 3600e3 });
    if (id === 'min-' || id === 'min+') Cielo.imposta({ data: s.data + (id === 'min+' ? 10 : -10) * 60e3 });
    if (id === 'crono12') {
      const d = new Date(s.data); d.setUTCHours(12, 0, 0, 0); Cielo.imposta({ data: d.getTime(), corre: false });
      // Il Sole vero è al meridiano superiore dove T + λ = 0
      const t = tempi(); const lonM = 180 - Cielo.norm(Cielo.corpo('Sole').T + 180);
      lez.completa('cronometro');
      pr.esito = { tipo: 'giusto', testo: `Cronometro sulle 12h00m: a Greenwich è mezzogiorno medio, ma il Sole vero è sul meridiano ${Cielo.ang(Math.abs(lonM), { tre: true })}${lonM >= 0 ? 'E' : 'W'}, non su Greenwich. Lo scarto, in tempo, è εᵥ = ${minuti(t.eps)}.` };
    }
    if (id === 'lon-' || id === 'lon+') {
      const prima = s.lon; const dopo = prima + (id === 'lon+' ? 15 : -15);
      const fusoPrima = tempi().fuso;
      Cielo.imposta({ lon: dopo, luogo: '' });
      const t = tempi();
      // Passaggio dal 180°: la longitudine cambia nome restando lontana da Greenwich
      if (Math.sign(prima) !== Math.sign(Cielo.stato.lon) && Math.abs(prima) > 150) {
        lez.completa('data');
        const verso = id === 'lon+' ? 'a levante' : 'a ponente';
        pr.esito = { tipo: 'giusto', testo: `Rotta ${verso}: il fuso passa da ${segnoFuso(fusoPrima)} a ${segnoFuso(t.fuso)} e la data del fuso diventa ${Cielo.giorno(t.msFuso)}. Rotta a levante data calante, rotta a ponente data crescente.` };
      } else pr.esito = null;
    }
    if (id === 'nave:procida') Cielo.imposta({ lat: Cielo.LUOGHI.procida.lat, lon: Cielo.LUOGHI.procida.lon, luogo: 'procida' });
    if (id === 'nave:greenwich') Cielo.imposta({ lon: 0, luogo: '' });
    if (id === 'gira') Cielo.imposta({ corre: !s.corre, velocita: 3600 });
    if (id.startsWith('nave:') || id === 'lon-' || id === 'lon+') { if (!vr()) Motore.vista(guardaNave()); }
    controlla();
    Motore.sporco();
  }

  /* L'equazione del tempo nell'anno: curva calcolata, un punto ogni 3 giorni a mezzogiorno medio ---------- */
  const curva = { anno: null, punti: [] };
  function punti() {
    const anno = new Date(Cielo.stato.data).getUTCFullYear();
    if (curva.anno !== anno) {
      curva.anno = anno; curva.punti = [];
      const t0 = Date.UTC(anno, 0, 1, 12); const t1 = Date.UTC(anno + 1, 0, 1, 12);
      for (let t = t0; t <= t1; t += 3 * 864e5) curva.punti.push([(t - t0) / (t1 - t0), tempi(t).eps]);
    }
    return curva;
  }
  function graficoEps(c, x, y, w, h) {
    const { punti: P, anno } = punti();
    const L = 70; const B = 50; const gx = x + L; const gw = w - L - 20; const gy = y + 20; const gh = h - B - 20;
    const Y = (e) => gy + gh / 2 - (e / 18) * (gh / 2);
    c.save();
    c.strokeStyle = '#C9D3DD'; c.lineWidth = 2; c.font = '26px Atkinson, sans-serif'; c.fillStyle = '#5B6B7C'; c.textAlign = 'right';
    [-15, -10, -5, 0, 5, 10, 15].forEach((e) => { c.beginPath(); c.moveTo(gx, Y(e)); c.lineTo(gx + gw, Y(e)); c.stroke(); c.fillText(`${e > 0 ? '+' : e < 0 ? '−' : ''}${Math.abs(e)}m`, gx - 10, Y(e) + 9); });
    c.textAlign = 'center';
    'GFMAMGLASOND'.split('').forEach((l, i) => c.fillText(l, gx + ((i + 0.5) / 12) * gw, gy + gh + 36));
    c.strokeStyle = '#0B2545'; c.lineWidth = 4; c.beginPath();
    P.forEach(([f, e], i) => { const px = gx + f * gw; if (i) c.lineTo(px, Y(e)); else c.moveTo(px, Y(e)); });
    c.stroke();
    // Oggi
    const t0 = Date.UTC(anno, 0, 1, 12); const t1 = Date.UTC(anno + 1, 0, 1, 12);
    const f = (Cielo.stato.data - t0) / (t1 - t0); const e = tempi().eps;
    if (f >= 0 && f <= 1) { c.fillStyle = '#B3362B'; c.beginPath(); c.arc(gx + f * gw, Y(e), 10, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#0B2545'; c.textAlign = 'left'; c.font = '700 28px Atkinson, sans-serif'; c.fillText(`εᵥ = tₘ − tᵥ, anno ${anno}`, gx + 10, gy + 28);
    c.restore();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei nello spazio: la Terra gira davanti a te.' : 'Il modellino è la Terra vista dallo spazio.' });
  function tabellaTempi() {
    const t = tempi(); const s = Cielo.stato;
    return [['Tempo', 'Valore'],
      ['Cronometro, Greenwich: Tₘ', `${hm(t.Tm)} del ${Cielo.giorno()}`],
      [`Longitudine della nave λ`, `${Cielo.ang(Math.abs(s.lon), { tre: true })}${s.lon >= 0 ? 'E' : 'W'} = ${t.lam < 0 ? '−' : '+'}${hm(Math.abs(t.lam))}`],
      ['Tempo medio locale tₘ = Tₘ + λ', hm(t.tm)],
      ['Tempo vero locale tᵥ', hm(t.tv)],
      [`Tempo fuso tf (fuso ${segnoFuso(t.fuso)})`, `${hm(t.tf)} del ${Cielo.giorno(t.msFuso)}`],
    ];
  }
  const RISPOSTE = { si: 'Sì, il Sole è sul meridiano di Procida', prima: 'No: sul meridiano di Procida c\'è passato prima', dopo: 'No: sul meridiano di Procida ci passerà dopo' };
  const comandiTempo = () => [
    { t: 'passo', id: 'ora', nome: 'Cronometro, un\'ora alla volta', valore: `${Cielo.ora().slice(0, 5)} del ${Cielo.giorno()}` },
    { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'min-', testo: '−10 min' }, { id: 'min+', testo: '+10 min' }, { id: 'crono12', testo: 'Cronometro 12:00' }] },
  ];
  const comandiNave = () => [
    { t: 'passo', id: 'lon', nome: 'Longitudine della nave, 15° alla volta', valore: `${Cielo.ang(Math.abs(Cielo.stato.lon), { tre: true })}${Cielo.stato.lon >= 0 ? 'E' : 'W'}` },
    { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'nave:procida', testo: 'Procida', on: Cielo.stato.luogo === 'procida' }, { id: 'nave:greenwich', testo: 'Greenwich', on: Cielo.stato.lon === 0 }, { id: 'gira', testo: Cielo.stato.corre ? 'Ferma' : 'Fai girare', on: Cielo.stato.corre }] },
  ];

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Che ora è?' },
          { t: 'p', size: 36, testo: 'Un orologio preciso a bordo ha permesso ai naviganti di trovare la **longitudine**. {{p. 41}}' },
          { t: 'p', size: 36, testo: 'Il **tempo** di un astro è il suo angolo orario: **t** minuscola per l\'osservatore (*LHA*), **T** maiuscola per Greenwich (*GHA*). Fra i due c\'è la longitudine, Est positiva e Ovest negativa: {{p. 43}}' },
          { t: 'formula', testo: 't = T + λ        T = t − λ' },
          { t: 'p', size: 36, testo: 'Sul globo, in oro il meridiano dove ora il Sole è a **mezzogiorno vero**; in grigio quello opposto, dove è mezzanotte. {{p. 49}}' },
        ],
        dx: [
          finestra(760), ...scala(),
          { t: 'tabella', col: [55, 45], size: 30, righe: tabellaTempi() },
          { t: 'nota', testo: 'Fusi a strisce, con il loro numero. In rosso Greenwich, in arancio il 180°. Dimensioni non in scala.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il cronometro di bordo segna l\'ora di Greenwich. La nave è al largo di Procida, a 13°55′E.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quando sul cronometro è mezzogiorno, il Sole è sul meridiano di Procida?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          ...comandiTempo(),
          ...comandiNave(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(700), ...scala(),
          { t: 'tabella', col: [55, 45], size: 30, righe: tabellaTempi() },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Sole vero e Sole medio' },
          ...(p ? [{ t: 'nota', testo: p === 'prima' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 34, testo: 'Procida è a Est di Greenwich: il Sole ci passa circa 56 minuti prima (13°55′ × 4 minuti). E nemmeno a Greenwich il Sole vero passa alle 12:00 in punto. {{p. 43}}' },
          { t: 'p', size: 34, testo: 'Il Sole vero va sull\'eclittica a velocità variabile: i giorni veri non sono uguali. Si usa allora il **Sole medio equatoriale**, che va sull\'equatore a velocità costante. Il suo tempo è il **tempo medio** tₘ (*LMT*); quello del Sole vero è il **tempo vero** tᵥ (*LAT*). {{pp. 45–46}}' },
          { t: 'formula', testo: 'εᵥ = tₘ − tᵥ' },
          { t: 'nota', testo: 'Equazione del tempo, formula 2.10 a p. 46.' },
        ],
        dx: [
          { t: 'disegno', h: 460, fn: graficoEps },
          { t: 'nota', testo: `Calcolata con Astronomy Engine. Oggi (punto rosso) εᵥ = ${minuti(tempi().eps)}.` },
          { t: 'p', size: 34, testo: 'Il giorno medio comincia quando il Sole medio passa al meridiano inferiore. 24 ore medie valgono 24h03m56,56s sideree; 24 ore sideree valgono 23h56m04,09s medie. {{pp. 45–46}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Fusi, date, cronometro' },
          { t: 'p', size: 32, testo: 'La Terra è divisa in 24 **fusi orari** di 15°: in tutto il fuso vale il **tempo fuso** tf del meridiano centrale. Il numero del fuso λf è la longitudine diviso 15, arrotondata all\'ora intera. {{p. 48}}' },
          { t: 'formula', testo: 'tf = Tₘ + λf     cf = λf − λ     tₘ = tf − cf' },
          { t: 'p', size: 32, testo: 'Dove il Sole è a mezzogiorno vero, all\'antimeridiano è mezzanotte: è la **linea mobile** di cambiamento di data. L\'antimeridiano di Greenwich è la **linea fissa**. Rotta a levante data calante, rotta a ponente data crescente. {{p. 49}}' },
        ],
        dx: [
          { t: 'p', size: 32, testo: 'Il **cronometro** dà l\'ora di Greenwich, ma con un errore: lo **stato assoluto** K, dai segnali orari, la corregge. Il quadrante ha 12 ore: si stima T col tempo locale approssimato e la longitudine, e si sceglie la lettura più vicina. {{pp. 50–51}}' },
          { t: 'tabella', col: [50, 50], size: 30, righe: [['Esempio del libro', 'Valore'],['Ora locale circa', '19h'], ['λ = 79°45,2′E', '(+)5h20m'], ['T ≈ 19h − 5h20m', '13h40m'], ['Cronometro Tc', '13h42m54s'], ['Tₘ = Tc + K (+0m12s)', '13h43m06s']] },
          { t: 'nota', testo: 'Esempio di p. 51.' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Fusi e cronometro' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Longitudine in tempo: 4 minuti ogni grado. Ore 0–23.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
