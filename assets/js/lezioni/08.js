/* Esperienza 8: dall'altezza istrumentale all'altezza vera. Contenuti da «Fondamenti di Navigazione e
   Meteorologia nautica» vol. 2, cap. 4, §§ 4.4–4.7 (pp. 67–74); esempio ed esercizi a pp. 75–76.
   Correzioni c1 e c2 dalle tavole delle Effemeridi nautiche IIM (cielo.js). Regole in design.md */
(function () {
  const N = 8;
  const GAMMA_LIBRO = -5.0; // correzione d'indice dell'esempio del libro (p. 75), se lo studente non l'ha misurata

  const MISSIONI = [
    { id: 'albero', testo: 'Sali sull\'albero: occhio ad almeno 30 m sul mare.' },
    { id: 'scaletta', testo: 'Correggi l\'altezza di una stella, passo per passo.' },
    { id: 'bassa', testo: 'Punta una stella più bassa di 10°.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Rispetto all\'orizzonte astronomico, l\'orizzonte marino è…', scelte: ['depresso, di un angolo che cresce con l\'elevazione dell\'occhio', 'sollevato dalla rifrazione', 'sempre coincidente'], giusta: 0, perche: 'È la depressione apparente *i* (*dip*): funzione dell\'elevazione dell\'occhio, è una correzione sottrattiva. {{p. 68}}' },
    { n: 2, testo: 'La rifrazione astronomica…', scelte: ['è nulla allo zenit e massima vicino all\'orizzonte', 'è uguale a tutte le altezze', 'è massima allo zenit'], giusta: 0, perche: 'Per questo non conviene osservare astri più bassi di 10°. È una correzione sottrattiva. {{p. 68}}' },
    { n: 3, testo: 'Per la rifrazione, l\'astro si vede…', scelte: ['più alto di dove è', 'più basso di dove è', 'spostato verso Nord'], giusta: 0, perche: 'Il raggio si curva attraversando strati d\'aria sempre più densi: l\'osservatore lo vede arrivare dalla tangente, più in alto. {{p. 68}}' },
    { n: 4, testo: 'Di quali astri conta la parallasse diurna?', scelte: ['Sole, Luna, Marte e Venere', 'di tutte le stelle', 'solo di Giove e Saturno'], giusta: 0, perche: 'È rilevante solo per gli astri vicini; per la Luna vale circa 1°. È una correzione sommativa. {{p. 69}}' },
    { n: 5, testo: 'Osservando il **lembo inferiore** del Sole, il semidiametro è una correzione…', scelte: ['sommativa', 'sottrattiva', 'nulla'], giusta: 0, perche: 'Il centro sta più in alto del lembo inferiore: si aggiunge. Per il lembo superiore si sottrae. {{p. 70}}' },
    { n: 6, testo: 'Perché alla fine si sottrae 1°?', scelte: ['Le tavole aggiungono 20′ alla depressione e 40′ alla rifrazione', 'È la parallasse media', 'È la correzione d\'indice'], giusta: 0, perche: 'i non supera 20′ e r non supera 40′: aggiungendo queste quantità le correzioni diventano positive. In tutto 60′. {{p. 71}}' },
  ];
  // Esempio (Deneb) ed esercizio 4 del libro: soluzioni con le tavole c1 e c2 delle effemeridi
  const ES = [
    { n: 7, nome: 'Deneb', g: 44, p: 6.5, e: 16, gam: -5.0, rif: 'p. 75, esempio' },
    { n: 8, nome: 'Acrux', g: 45, p: 18.9, e: 36, gam: -10.5, rif: 'p. 76, es. 4a' },
    { n: 9, nome: 'Antares', g: 13, p: 26.5, e: 18, gam: 7.0, rif: 'p. 76, es. 4b' },
    { n: 10, nome: 'Mirfak', g: 38, p: 41.7, e: 22, gam: -0.8, rif: 'p. 76, es. 4c' },
    { n: 11, nome: 'Vega', g: 68, p: 16.2, e: 15, gam: 6.2, rif: 'p. 76, es. 4d' },
    { n: 12, nome: 'Hadar', g: 20, p: 36.8, e: 8, gam: -13.0, rif: 'p. 76, es. 4e' },
  ];
  const pr1 = (p) => `${p.toFixed(1).replace('.', ',').padStart(4, '0')}′`;
  const CALCOLI = ES.map((x) => {
    const hi = x.g * 60 + x.p; const ho = hi + x.gam;
    const c1 = Cielo.c1(x.e); const c2 = Cielo.c2(ho / 60);
    const hv = Math.round((ho + c1 + c2 - 60) * 10) / 10;
    const g = Math.floor(hv / 60); const p = Math.round((hv - g * 60) * 10) / 10;
    return {
      n: x.n,
      testo: `**${x.nome}**: hᵢ = ${Cielo.ang(hi / 60)}, e = ${x.e} m, γ = ${Cielo.primi(x.gam)}. Quanto vale l'altezza vera hᵥ? {{${x.rif}}}`,
      campi: [['gradi', g, 0, '°'], ['primi', p, 0.15, '′']],
      soluzione: `hₒ = ${Cielo.ang(ho / 60)}; c₁ = ${pr1(c1)} (e = ${x.e} m); c₂ = ${pr1(c2)}; hᵥ = hₒ + c₁ + c₂ − 1° = ${Cielo.ang(hv / 60)}.`,
    };
  });
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* La stella da correggere e la scaletta --------------------------------------------------------- */
  const PASSI = [
    { id: 'gamma', testo: '+ γ', nome: 'correzione d\'indice γ' },
    { id: 'c1', testo: '+ c₁', nome: 'c₁: depressione (con e)' },
    { id: 'c2', testo: '+ c₂', nome: 'c₂: rifrazione (con hₒ)' },
    { id: 'meno', testo: '− 1°', nome: 'meno 1°' },
  ];
  const pr = { stella: null, fatti: [], esito: null, preparato: false, hi: null };
  const gamma = () => { const g = (Libro.stato(7).misure || {}).gamma; return g === undefined ? GAMMA_LIBRO : g; };
  // La lettura che il sestante darebbe per questa stella, ora, con quest'occhio (in gradi)
  function lettura(nome) { const v = Cielo.vistoDallaNave(nome); return Cielo.altezzaOsservata(v, null) - gamma() / 60; }
  function scegli(nome) { pr.stella = nome; pr.fatti = []; pr.hi = Math.round(lettura(nome) * 600) / 600; }
  function sceltaAutomatica() {
    const nomi = Object.keys(Cielo.hrDi).map((n) => ({ n, v: Cielo.vistoDallaNave(n) })).filter((x) => x.v.h > 20 && x.v.h < 60 && x.v.mag < 1.6);
    nomi.sort((a, b) => a.v.mag - b.v.mag);
    return nomi.length ? nomi[0].n : 'Vega';
  }
  // Valori della scaletta (in primi), fin dove è arrivato lo studente
  function scaletta() {
    const hi = pr.hi * 60; const g = gamma(); const ho = hi + g;
    const c1 = Cielo.c1(Cielo.stato.occhio); const c2 = Cielo.c2(ho / 60);
    const righe = [['hᵢ (lettura)', hi]];
    let h = hi;
    pr.fatti.forEach((id) => {
      if (id === 'gamma') { h += g; righe.push([`+ γ ${Cielo.primi(g)} → hₒ`, h]); }
      if (id === 'c1') { h += c1; righe.push([`+ c₁ ${pr1(c1)}`, h]); }
      if (id === 'c2') { h += c2; righe.push([`+ c₂ ${pr1(c2)}`, h]); }
      if (id === 'meno') { h -= 60; righe.push(['− 1° → hᵥ', h]); }
    });
    return { righe, ho, c1, c2, hv: hi + g + c1 + c2 - 60 };
  }
  function passo(id) {
    if (!pr.stella) { pr.esito = { tipo: 'errato', testo: 'Prima punta una stella.' }; return; }
    const atteso = PASSI[pr.fatti.length];
    if (!atteso) return;
    if (id !== atteso.id) {
      pr.esito = { tipo: 'errato', testo: pr.fatti.length === 0 ? 'Si parte dagli errori dello strumento: prima la correzione d\'indice.' : `Non ancora: ora tocca a ${atteso.nome}.` };
      return;
    }
    const s = scaletta();
    if (id === 'c2' && s.c2 === null) { pr.esito = { tipo: 'errato', testo: 'La tavola di c₂ parte da 4°23′: questa stella è troppo bassa per correggerla.' }; return; }
    pr.fatti.push(id);
    if (pr.fatti.length === PASSI.length) {
      const fine = scaletta(); const v = Cielo.vistoDallaNave(pr.stella);
      lez.completa('scaletta');
      pr.esito = { tipo: 'giusto', testo: `hᵥ = ${Cielo.ang(fine.hv / 60)}. Calcolata da Astronomy Engine: ${Cielo.ang(v.h)}. La differenza viene dagli arrotondamenti delle tavole.` };
    } else pr.esito = null;
  }

  /* La lente: a sinistra l'orizzonte, a destra la stella. Disegno schematico, misure calcolate --------- */
  const LW = 1020; const LH = 600;
  const tela = document.createElement('canvas'); tela.width = LW; tela.height = LH;
  const tex = new THREE.CanvasTexture(tela); tex.colorSpace = THREE.SRGBColorSpace;
  function disegnaLente() {
    const c = tela.getContext('2d');
    c.fillStyle = '#0A1322'; c.fillRect(0, 0, LW, LH);
    c.font = '700 34px Atkinson, sans-serif'; c.fillStyle = '#E9EEF6';
    // Sinistra: orizzonte apparente (all'altezza dell'occhio) e orizzonte marino, depresso di i
    const i = Cielo.depressione(Cielo.stato.occhio); const K = 16; // 16 px per primo
    const x0 = 30; const w = 470; const y0 = 190;
    c.fillText('Orizzonte', x0, 50);
    c.fillStyle = '#123456'; c.fillRect(x0, y0 + i * K, w, LH - 40 - (y0 + i * K));
    c.strokeStyle = '#E9EEF6'; c.setLineDash([14, 10]); c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + w, y0); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#7FB0DA'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0 + i * K); c.lineTo(x0 + w, y0 + i * K); c.stroke();
    c.font = '30px Atkinson, sans-serif'; c.fillStyle = '#E9EEF6';
    c.fillText('apparente', x0 + 8, y0 - 12); c.fillStyle = '#7FB0DA'; c.fillText('marino', x0 + 8, y0 + i * K + 36);
    c.strokeStyle = '#E3C878'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 + w - 70, y0); c.lineTo(x0 + w - 70, y0 + i * K); c.stroke();
    c.fillStyle = '#E3C878'; c.font = '700 34px Atkinson, sans-serif'; c.textAlign = 'right';
    c.fillText(`i = ${pr1(i)}`, x0 + w - 84, y0 + (i * K) / 2 + 12);
    c.textAlign = 'left';
    c.font = '30px Atkinson, sans-serif'; c.fillStyle = '#9AA7B4'; c.fillText(`occhio a ${Cielo.stato.occhio} m · 16 px = 1′`, x0, LH - 10);
    // Destra: la stella dove si vede e dove è davvero (rifrazione r)
    const x1 = 540; const w1 = 450;
    c.font = '700 34px Atkinson, sans-serif'; c.fillStyle = '#E9EEF6'; c.fillText(pr.stella || 'Stella', x1, 50);
    if (pr.stella) {
      const v = Cielo.vistoDallaNave(pr.stella); const ho = Cielo.altezzaOsservata(v, null);
      // Scala: almeno 40 px per primo, di più per le stelle alte (r piccola), così i due punti non si sovrappongono
      const r = Cielo.rifrazione(ho); const K2 = r ? Math.min(Math.max(40, Math.ceil(80 / r / 10) * 10), Math.floor(300 / r)) : 40;
      const ya = 230; const xs = x1 + w1 / 2;
      c.fillStyle = '#FFF4C8'; c.beginPath(); c.arc(xs, ya, 12, 0, Math.PI * 2); c.fill();
      c.font = '30px Atkinson, sans-serif'; c.fillText('si vede qui', xs + 24, ya + 10);
      if (r !== null) {
        const yv = ya + r * K2;
        c.strokeStyle = '#E9EEF6'; c.lineWidth = 3; c.beginPath(); c.arc(xs, yv, 12, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#9AA7B4'; c.fillText('è qui', xs + 24, yv + 10);
        c.strokeStyle = '#E3C878'; c.lineWidth = 4; c.beginPath(); c.moveTo(xs - 40, ya); c.lineTo(xs - 40, yv); c.stroke();
        c.fillStyle = '#E3C878'; c.font = '700 34px Atkinson, sans-serif'; c.textAlign = 'right'; c.fillText(`r = ${pr1(r)}`, xs - 54, (ya + yv) / 2 + 12); c.textAlign = 'left';
      } else { c.fillStyle = '#E3C878'; c.fillText('troppo bassa: c₂ non c\'è', x1, ya + 90); }
      c.font = '30px Atkinson, sans-serif'; c.fillStyle = '#9AA7B4'; c.fillText(`hₒ ≈ ${Cielo.ang(ho)} · ${K2} px = 1′`, x1, LH - 10);
    } else { c.font = '30px Atkinson, sans-serif'; c.fillStyle = '#9AA7B4'; c.fillText('Punta una stella nel cielo.', x1, 120); }
    c.strokeStyle = '#2B3440'; c.lineWidth = 6; c.beginPath(); c.moveTo(515, 20); c.lineTo(515, LH - 20); c.stroke();
    tex.needsUpdate = true;
  }
  Cielo.ascolta(() => { if (pr.stella) disegnaLente(); });

  const ponte = Scene.ponte({ phi: 1.25 });
  function mondo() {
    const m = ponte();
    if (!pr.preparato) {
      pr.preparato = true;
      // Al crepuscolo nautico: si vedono le stelle e l'orizzonte {{p. 32}}
      const t = Cielo.istanteSole(-9, -1); if (t) Cielo.imposta({ data: t, corre: false });
      scegli(sceltaAutomatica());
      m.lente = () => tex;
      m.puntato = () => Motore.ridisegna();
      m.vistaIniziale = () => { const v = Cielo.vistoDallaNave(pr.stella || 'Vega'); return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: v.a * Math.PI / 180, phi: Math.max(0.5, (90 - v.h * 0.5) * Math.PI / 180), r: 62 }; };
    }
    disegnaLente();
    return m;
  }
  function comandi(id) {
    const s = Cielo.stato;
    if (id === 'occhio-' || id === 'occhio+') {
      Cielo.imposta({ occhio: Math.max(1, Math.min(45, s.occhio + (id === 'occhio+' ? 1 : -1))) });
      if (Cielo.stato.occhio >= 30) lez.completa('albero');
      if (pr.stella) { pr.hi = Math.round(lettura(pr.stella) * 600) / 600; pr.fatti = []; }
    }
    if (id === 'ponte' || id === 'albero') { Cielo.imposta({ occhio: id === 'albero' ? 35 : 15 }); if (id === 'albero') lez.completa('albero'); if (pr.stella) { pr.hi = Math.round(lettura(pr.stella) * 600) / 600; pr.fatti = []; } }
    if (PASSI.some((x) => `s:${x.id}` === id)) passo(id.slice(2));
    if (id === 'daccapo') { pr.fatti = []; pr.esito = null; }
    if (id.startsWith('t:')) {
      const a = id.slice(2).split(',').find((x) => x.startsWith('astro:'));
      if (a) {
        const nome = a.slice(6); const v = Cielo.vistoDallaNave(nome);
        if (v.h <= 0) pr.esito = { tipo: 'errato', testo: `${nome} è sotto l'orizzonte.` };
        else {
          scegli(nome);
          if (v.h < 10) {
            lez.completa('bassa');
            const r = Cielo.rifrazione(Cielo.altezzaOsservata(v, null));
            pr.esito = { tipo: 'giusto', testo: r === null ? `${nome} è a ${Cielo.ang(v.h)}: così bassa che la tavola della rifrazione non c'è. Non conviene osservarla.` : `${nome} è a ${Cielo.ang(v.h)}: la rifrazione vale ${pr1(r)}. Sotto i 10° è grande e poco sicura.` };
          } else pr.esito = { tipo: 'neutro', testo: `Stella scelta: ${nome}. Ora la scaletta.` };
        }
      }
    }
    disegnaLente();
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei in controplancia, al crepuscolo. Punta una stella col controller.' : 'Vai a grandezza vera per stare sul ponte.' });
  const RISPOSTE = { giu: 'Si abbassa', su: 'Si alza', fermo: 'Resta dove è' };
  function tabellaScaletta() {
    if (!pr.stella) return [];
    const s = scaletta();
    return [{ t: 'tabella', col: [58, 42], size: 32, righe: [[pr.stella, 'Altezza'], ...s.righe.map(([n, h]) => [n, Cielo.ang(h / 60)])] }];
  }
  function tabellaOcchio() {
    return [['Occhio e', 'c₁', 'Depressione i = 20′ − c₁'], ...[2, 5, 10, 15, 20, 30, 45].map((e) => [`${e} m`, pr1(Cielo.c1(e)), pr1(Cielo.depressione(e))])];
  }
  function soleLuna() {
    const s = Cielo.vistoDallaNave('Sole'); const l = Cielo.vistoDallaNave('Luna');
    return [['Astro', 'Semidiametro', 'Parallasse orizzontale'], ['Sole', pr1(s.sd), pr1(s.par)], ['Luna', pr1(l.sd), `${Cielo.ang(l.par / 60)}`]];
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const s = Cielo.stato;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Dall\'altezza istrumentale all\'altezza vera' },
          { t: 'p', size: 38, testo: 'L\'altezza è l\'angolo fra l\'astro e l\'**orizzonte astronomico**. Ma col sestante si vede l\'**orizzonte marino**, più basso dell\'**orizzonte apparente** che passa per l\'occhio: la differenza è la **depressione apparente** *i* (*dip*). {{pp. 67–68}}' },
          { t: 'p', size: 38, testo: 'Poi l\'atmosfera piega la luce: la **rifrazione astronomica** *r* fa vedere l\'astro più alto di dove è. {{p. 68}}' },
          { t: 'passo', id: 'occhio', nome: 'Altezza dell\'occhio sul mare', valore: `${s.occhio} m` },
        ],
        dx: [
          { t: 'zona', id: 'lente', h: LH },
          finestra(560), ...scala(),
          { t: 'nota', testo: 'Lente schematica: le scale sono ingrandite, i valori vengono dalle tavole delle effemeridi.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Dal ponte, a 15 m sul mare, guardi l\'orizzonte. Poi sali in cima all\'albero, a 35 m.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Salendo sull\'albero, l\'orizzonte si abbassa o si alza?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'occhio', nome: 'Altezza dell\'occhio sul mare', valore: `${s.occhio} m` },
          { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'ponte', testo: 'Sul ponte', on: s.occhio === 15 }, { id: 'albero', testo: 'Sull\'albero', on: s.occhio === 35 }] },
          { t: 'bottoni', h: 84, size: 36, lista: PASSI.map((x) => ({ id: `s:${x.id}`, testo: x.testo, off: pr.fatti.includes(x.id) })) },
          ...tabellaScaletta(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          { t: 'zona', id: 'lente', h: LH },
          finestra(500), ...scala(),
          { t: 'riquadro', size: 32, testo: `γ = ${Cielo.primi(gamma())}${(Libro.stato(7).misure || {}).gamma === undefined ? ', come nell\'esempio del libro' : ', quella che hai misurato col sestante'}. Tocca una stella nel cielo per cambiarla.` },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Più in alto, più in basso' },
          ...(p ? [{ t: 'nota', testo: p === 'giu' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 38, testo: 'Salendo, l\'orizzonte marino **si abbassa**: la depressione apparente cresce con l\'elevazione dell\'occhio. È una correzione **sottrattiva**. {{p. 68}}' },
          { t: 'tabella', col: [28, 24, 48], size: 32, righe: tabellaOcchio() },
          { t: 'nota', testo: 'Valori dalla tavola delle Effemeridi nautiche IIM.' },
        ],
        dx: [
          { t: 'p', size: 38, testo: 'La **rifrazione** è nulla allo zenit e massima vicino all\'orizzonte: le formule sono affidabili sopra i 10°. {{p. 68}}' },
          { t: 'p', size: 38, testo: 'Le effemeridi rendono positive le correzioni: c₁ = 20′ − i dipende dall\'occhio, c₂ = 40′ − r dall\'altezza osservata. Alla fine si toglie 1°. {{pp. 71–72}}' },
          { t: 'formula', testo: 'hᵥ = hᵢ + γ + c₁ + c₂ − 1°' },
          { t: 'nota', testo: 'Scaletta per le stelle, tabella 4.1. (p. 71)' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Sole, Luna, pianeti vicini' },
          { t: 'p', size: 38, testo: 'La **parallasse diurna** è l\'angolo sotto cui dall\'astro si vede il raggio terrestre: conta solo per Sole, Luna, Marte e Venere. È sommativa e massima con l\'astro sull\'orizzonte. {{pp. 69–70}}' },
          { t: 'p', size: 38, testo: 'Di Sole e Luna si porta sull\'orizzonte il **lembo** inferiore o superiore: il **semidiametro** si aggiunge o si toglie. {{p. 70}}' },
        ],
        dx: [
          { t: 'tabella', col: [26, 37, 37], size: 34, righe: soleLuna() },
          { t: 'nota', testo: `Oggi, ${Cielo.giorno()}, dal centro della Terra: calcolati con Astronomy Engine.` },
          { t: 'p', size: 38, testo: 'Per loro la scaletta ha una terza correzione, c₃: hᵥ = hᵢ + γ + c₁ + c₂ + c₃ − 1°. {{p. 71, tab. 4.1}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Correggi le altezze' }, ...lez.calcoloSx(), { t: 'nota', testo: 'c₁ e c₂ dalle tavole delle effemeridi. Tolleranza ±0,1′.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
