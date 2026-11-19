/* Esperienza 2: la Polare e la latitudine. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2: § 1.1 (p. 12) e § 6.3, latitudine con la stella Polare (pp. 98–101). Regole in design.md */
(function () {
  const N = 2;

  const MISSIONI = [
    { id: 'misure', testo: 'Misura l\'altezza della Polare a tre latitudini diverse.' },
    { id: 'nord', testo: 'Misurala anche oltre 55°N.' },
    { id: 'croce', testo: 'Passa l\'equatore e punta Acrux, nella Croce del Sud.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'La latitudine dell\'osservatore è uguale…', scelte: ['all\'arco di orizzonte fra Nord e Est', 'all\'arco fra l\'orizzonte e il polo elevato', 'alla declinazione dello zenit meno 90°'], giusta: 1, perche: 'La latitudine è l\'arco fra l\'equatore celeste e lo zenit, uguale all\'arco fra l\'orizzonte e il polo elevato. {{p. 12}}' },
    { n: 2, testo: 'L\'azimut della Polare…', scelte: ['è sempre circa 000°: oscilla fra 358° e 002°', 'cambia di 15° ogni ora', 'è 000° solo a mezzanotte'], giusta: 0, perche: 'La Polare indica il Nord; l\'azimut preciso è in una tabella delle effemeridi e si può usare per controllare la bussola. {{p. 98}}' },
    { n: 3, testo: 'La Polare si vede…', scelte: ['da tutta la Terra', 'solo dall\'emisfero Nord', 'solo oltre il circolo polare'], giusta: 1, perche: 'Sta quasi sul polo celeste Nord, che per l\'emisfero Sud è sotto l\'orizzonte. {{p. 98}}' },
    { n: 4, testo: 'Perché all\'altezza vera della Polare si applicano le correzioni I, II e III?', scelte: ['Perché la Polare ha un piccolo moto diurno attorno al polo', 'Per la rifrazione', 'Per la depressione dell\'orizzonte'], giusta: 0, perche: 'La Polare non è esattamente sul polo: il suo moto diurno, seppur piccolo, esiste. Rifrazione e depressione sono già nell\'altezza vera. {{p. 98}}' },
    { n: 5, testo: 'Con quale valore si entra nella tabella della correzione I?', scelte: ['Il tempo sidereo locale tₛ', 'L\'altezza dell\'occhio', 'Il mese dell\'anno'], giusta: 0, perche: 'La I, la più grande, si trova col tempo sidereo locale; la II con l\'altezza vera, la III col mese. {{pp. 99–100}}' },
    { n: 6, testo: 'Alla fine del calcolo si sottrae 1°. Perché?', scelte: ['Le correzioni I, II e III sono state rese positive aggiungendo in tutto 1°', 'Per la declinazione della Polare', 'È la correzione d\'indice'], giusta: 0, perche: 'Come c₁ e c₂, anche I, II e III sono rese sempre positive: in tutto si è aggiunto 1°, che va tolto. {{p. 101}}' },
  ];
  const calc = (n, testo, g, p, sol) => ({ n, testo, campi: [['gradi', g, 0, '°'], ['primi', p, 0.05, '′']], soluzione: sol });
  const CALCOLI = [
    calc(7, 'Esempio del libro: hᵥ della Polare = 38°17,2′; I = 1°04,4′, II = 0,9′, III = 1,4′. Quanto vale la latitudine φ? {{p. 101}}', 38, 23.9, 'φ = 38°17,2′ + 1°04,4′ + 0,9′ + 1,4′ − 1° = 38°23,9′N.'),
    calc(8, 'Stesso esempio: tₛ = 141°39,6′. Nella tabella I vale 1°03,9′ per 141° e 1°04,7′ per 142°. Interpola: quanto vale I? {{p. 101}}', 1, 4.4, 'La differenza è 0,8′ per 60′; per 39,6′ sono circa 0,5′: I = 1°03,9′ + 0,5′ = 1°04,4′.'),
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* La prova ------------------------------------------------------------------------------------- */
  const pr = { esito: null };
  const salvate = Libro.stato(N).misure || [];
  pr.misure = salvate;
  const salva = () => Libro.aggiorna(N, { misure: pr.misure });

  const ponte = Scene.ponte({ guarda: 0, phi: 1.2 });
  let pronto = false;
  function notte() { if (Cielo.vistoDallaNave('Sole').h > -12) { const t = Cielo.istanteSole(-18, -1); if (t) Cielo.imposta({ data: t }); } }
  function mondo() {
    const m = ponte();
    if (!pronto) { pronto = true; Cielo.imposta({ corre: false }); notte(); m.puntato = () => Motore.ridisegna(); }
    return m;
  }
  function naviga(gradi) {
    const lat = Math.max(-60, Math.min(70, Math.round(Cielo.stato.lat + gradi)));
    Cielo.imposta({ lat, luogo: '' });
    pr.esito = null;
  }
  function misura() {
    const v = Cielo.vistoDallaNave('Polare'); const lat = Cielo.stato.lat;
    if (Cielo.vistoDallaNave('Sole').h > -6) { pr.esito = { tipo: 'errato', testo: 'C\'è troppa luce: le stelle non si vedono. Premi «Vai alla notte».' }; return; }
    if (v.h < 0) { pr.esito = { tipo: 'errato', testo: `La Polare è sotto l'orizzonte (h ${Cielo.ang(v.h)}): da qui non si vede.` }; return; }
    const lp = Math.round(lat * 60) / 60;
    pr.misure = pr.misure.filter((x) => Math.abs(x.lat - lp) > 0.01).concat([{ lat: lp, h: v.h, a: v.a }]).sort((a, b) => b.lat - a.lat).slice(0, 6);
    salva();
    if (pr.misure.length >= 3) lez.completa('misure');
    if (lp >= 55) lez.completa('nord');
    pr.esito = { tipo: 'giusto', testo: `Polare: altezza vera ${Cielo.ang(v.h)}, azimut ${Cielo.ang(v.a, { tre: true })}. Latitudine della nave ${Cielo.ang(lat, { segno: 'NS' })}.` };
  }
  function comandi(id) {
    if (id === 'lat-' || id === 'lat+') naviga(id === 'lat+' ? 1 : -1);
    if (id === 'nord10' || id === 'sud10') naviga(id === 'nord10' ? 10 : -10);
    if (id === 'procida') { const l = Cielo.LUOGHI.procida; Cielo.imposta({ lat: l.lat, lon: l.lon, luogo: 'procida' }); }
    if (id === 'notte') { const t = Cielo.istanteSole(-18, -1); if (t) Cielo.imposta({ data: t }); }
    if (id === 'misura') misura();
    if (id.startsWith('t:')) {
      const a = id.slice(2).split(',').find((x) => x.startsWith('astro:'));
      if (a) punta(a.slice(6));
    }
    Motore.sporco();
  }
  function punta(nome) {
    const v = Cielo.vistoDallaNave(nome);
    if (nome === 'Polare') { misura(); return; }
    if (nome === 'Acrux' && Cielo.stato.lat < 0 && v.h > 0) {
      lez.completa('croce');
      pr.esito = { tipo: 'giusto', testo: `Acrux, la stella più brillante della Croce del Sud: altezza ${Cielo.ang(v.h)}, azimut ${Cielo.ang(v.a, { tre: true })}. Da qui la Polare non si vede.` };
      return;
    }
    if (nome === 'Acrux') { pr.esito = { tipo: 'errato', testo: Cielo.stato.lat >= 0 ? 'Acrux è lei, ma la missione chiede di passare prima l\'equatore.' : 'Acrux è sotto l\'orizzonte. Scendi ancora verso sud: oltre i 30°S non tramonta mai (esperienza 1).' }; return; }
    pr.esito = { tipo: 'neutro', testo: `${nome}: altezza ${Cielo.ang(v.h)}, azimut ${Cielo.ang(v.a, { tre: true })}.` };
  }
  function tabellaMisure(righe) {
    if (!pr.misure.length) return [{ t: 'p', size: 36, testo: 'Nessuna misura: premi **Misura la Polare**.' }];
    return [{ t: 'tabella', col: [36, 34, 30], size: 32, righe: [['Latitudine φ', 'Altezza della Polare', 'h − φ'], ...pr.misure.slice(0, righe).map((x) => [Cielo.ang(x.lat, { segno: 'NS' }), Cielo.ang(x.h), Cielo.primi(Math.round((x.h - x.lat) * 600) / 10)])] }];
  }
  function istruzioni() {
    const v = Cielo.vistoDallaNave('Polare');
    if (!lez.fatte.has('misure') || !lez.fatte.has('nord')) return `Guarda a Nord: la Polare è a ${Cielo.ang(v.h)} di altezza. Naviga di qualche grado e misurala di nuovo: confronta l'altezza con la latitudine.`;
    if (!lez.fatte.has('croce')) return 'Ora verso sud: passa l\'equatore. Che fine fa la Polare? Poi girati a Sud e cerca Acrux: se non c\'è, scendi ancora verso sud.';
    return 'Missioni fatte. Vai avanti.';
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : 'Vai a grandezza vera per stare sul ponte.' });
  const RISPOSTE = { sale: 'Sale', scende: 'Scende', uguale: 'Resta alla stessa altezza' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const s = Cielo.stato;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'La Polare e la latitudine' },
          { t: 'p', size: 40, testo: 'La **latitudine** dell\'osservatore è l\'arco fra l\'equatore celeste e lo zenit: è uguale all\'arco fra l\'orizzonte e il **polo elevato**. {{p. 12}}' },
          { t: 'p', size: 40, testo: 'La **stella Polare** sta quasi sul polo celeste Nord (δ = 89°20,1′N all\'inizio del 2016): ha sempre azimut di circa 000° e la sua altezza è circa la latitudine. {{p. 98}}' },
          { t: 'riquadro', size: 36, testo: `${Cielo.luogo()} · ${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC` },
        ],
        dx: [
          finestra(900, 'Sei in controplancia. Punta la Polare, a Nord.'),
          ...scala(),
          { t: 'nota', testo: 'Posizioni calcolate con Astronomy Engine e Bright Star Catalogue.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'La nave parte da Procida e naviga verso sud, verso l\'equatore.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Andando verso sud, la Polare sale o scende?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'lat', nome: 'Naviga: un grado alla volta', valore: Cielo.ang(s.lat, { segno: 'NS' }) },
          { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'nord10', testo: '10° a Nord' }, { id: 'sud10', testo: '10° a Sud' }, { id: 'procida', testo: 'Procida' }] },
          { t: 'bottoni', h: 84, lista: [{ id: 'misura', testo: 'Misura la Polare', on: true }, { id: 'notte', testo: 'Vai alla notte' }] },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...tabellaMisure(4),
          ...lez.missioni(),
        ],
        dx: [
          finestra(900, 'Punta una stella col controller e premi il grilletto.'),
          ...scala(),
          { t: 'riquadro', size: 34, testo: istruzioni() },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Scende con la latitudine' },
          ...(p ? [{ t: 'nota', testo: p === 'scende' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          ...tabellaMisure(6),
          { t: 'nota', testo: 'Altezze vere calcolate con Astronomy Engine per l\'istante della misura.' },
        ],
        dx: [
          { t: 'p', size: 40, testo: 'L\'altezza della Polare segue la latitudine: andando verso sud **scende**, all\'equatore tocca l\'orizzonte, nell\'emisfero Sud non si vede più. {{pp. 12, 98}}' },
          { t: 'p', size: 40, testo: 'La differenza h − φ non è mai zero: la Polare non sta esattamente sul polo e gli gira intorno in un giorno. Per questo servono le correzioni I, II e III delle effemeridi. {{p. 98}}' },
          { t: 'nota', testo: 'La Polare non è sempre stata sul polo e non ci resterà: nell\'anno 3000 la sua declinazione sarà intorno a 85°N. (p. 98)' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'La latitudine con la Polare' },
          { t: 'p', size: 38, testo: 'Le effemeridi danno tre correzioni da sommare all\'altezza vera: la **I**, la più grande, si trova col **tempo sidereo locale** tₛ; la **II**, dell\'ordine di 1′, con l\'altezza vera; la **III** col **mese** di osservazione. {{pp. 99–100}}' },
          { t: 'p', size: 38, testo: 'Anche I, II e III sono rese positive aggiungendo in tutto 1°: alla fine va sottratto. {{p. 101}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'L\'esempio del libro' },
          { t: 'tabella', col: [55, 45], size: 34, righe: [['Passo', 'Valore'], ['hᵥ', '38°17,2′'], ['+ I', '1°04,4′'], ['+ II', '0,9′'], ['+ III', '1,4′'], ['− 1°', '−1°00,0′'], ['φ', '38°23,9′N']] },
          { t: 'nota', testo: '18/04/2015, posizione stimata 38°25,6′N 038°10,3′W, e = 22 m, γ = +0,2′. Azimut della Polare 359,1°. (p. 101)' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Il calcolo della latitudine' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Le tabelle I, II e III sono nelle pagine colorate delle effemeridi.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
