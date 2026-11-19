/* Esperienza 1: il cielo che gira. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2, cap. 1: § 1.1 (p. 12) e § 1.4, moto diurno apparente (pp. 21–24). Regole in design.md */
(function () {
  const N = 1;

  const MISSIONI = [
    { id: 'corre', testo: 'Fai correre il tempo almeno 600 volte più in fretta.' },
    { id: 'polo', testo: 'Punta la stella attorno a cui gira tutto il cielo.' },
    { id: 'circum', testo: 'Punta una stella che non tramonta mai.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Il moto diurno apparente degli astri è…', scelte: ['diretto', 'retrogrado', 'diretto a nord, retrogrado a sud'], giusta: 1, perche: 'È retrogrado (orario): è l\'effetto della rotazione della Terra, che è diretta. {{p. 21}}' },
    { n: 2, testo: 'Perché si dice moto *apparente*?', scelte: ['Perché lo causa la rotazione della Terra', 'Perché le stelle si vedono solo di notte', 'Perché lo si vede solo col sestante'], giusta: 0, perche: 'Sono la Terra e l\'osservatore a girare: le stelle sembrano muoversi in verso opposto. {{p. 21}}' },
    { n: 3, testo: 'Nel moto diurno, ogni stella percorre…', scelte: ['il suo parallelo di declinazione, da E verso W', 'l\'eclittica, da W verso E', 'il meridiano dell\'osservatore'], giusta: 0, perche: 'Ogni stella fissa descrive il suo parallelo di declinazione, sorgendo a Est e tramontando a Ovest. {{p. 21}}' },
    { n: 4, testo: 'Se |φ| + |δ| > 90° e latitudine e declinazione sono *omonime*, l\'astro è…', scelte: ['sorgente e tramontante', 'circumpolare sempre visibile', 'circumpolare mai visibile'], giusta: 1, perche: 'Con φ e δ omonimi (stesso nome, N o S) l\'astro è sempre sopra l\'orizzonte; eteronimi, sempre sotto. {{p. 22, tab. 1.5}}' },
    { n: 5, testo: 'All\'equatore (sfera retta) le stelle…', scelte: ['sono tutte circumpolari', 'sorgono e tramontano tutte, con arco visibile uguale all\'invisibile', 'restano sempre alla stessa altezza'], giusta: 1, perche: 'Nella sfera retta l\'asse del mondo sta sull\'orizzonte: ogni parallelo è tagliato a metà. {{p. 23}}' },
    { n: 6, testo: 'Al polo (sfera parallela)…', scelte: ['tutte le stelle sorgono e tramontano', 'tutte le stelle sono circumpolari e non ci sono punti cardinali', 'si vedono tutte le stelle del cielo'], giusta: 1, perche: 'L\'orizzonte coincide con l\'equatore celeste: le stelle girano parallele all\'orizzonte. {{p. 24, fig. 1.20}}' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  /* Le scie: per le stelle più note si segna la direzione man mano che il tempo corre ---------------- */
  const SCIE = ['Polare', 'Kochab', 'Dubhe', 'Merak', 'Alioth', 'Alkaid', 'Schedar', 'Mirfak', 'Capella', 'Vega', 'Deneb', 'Arturo', 'Altair', 'Alphecca',
    'Sirio', 'Rigel', 'Betelgeuse', 'Bellatrix', 'Alnilam', 'Aldebaran', 'Procyon', 'Polluce', 'Castor', 'Regolo', 'Spica', 'Antares', 'Fomalhaut', 'Canopo', 'Achernar', 'Acrux', 'Hadar'];
  const MAXP = 500; const PASSO_MS = 120000; // un punto ogni 2 minuti di cielo
  const sc = { volta: null, linee: [], ultimo: null, polo: null };
  function creaScie(radice, v) {
    sc.volta = v;
    const mat = new THREE.LineBasicMaterial({ color: 0xE3C878, transparent: true, opacity: 0.75, depthWrite: false });
    SCIE.forEach((nome) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
      geo.setDrawRange(0, 0);
      const l = new THREE.Line(geo, mat); l.frustumCulled = false; l.userData = { nome, n: 0 };
      v.g.add(l); sc.linee.push(l);
    });
    // Il polo celeste Nord: si scrive solo quando lo studente l'ha trovato
    sc.polo = Tavola.etichetta('polo celeste Nord', v.R * 0.03, '#E3C878');
    sc.polo.position.set(0, 0, v.R * 0.97); sc.polo.center.set(-0.06, 1.2); sc.polo.visible = lez.fatte.has('polo');
    v.eq.add(sc.polo);
  }
  function azzeraScie() { sc.linee.forEach((l) => { l.userData.n = 0; l.geometry.setDrawRange(0, 0); }); sc.ultimo = null; }
  const d = new THREE.Vector3();
  function segnaScie() {
    if (!sc.volta) return;
    const ora = Cielo.stato.data;
    if (sc.ultimo !== null && Math.abs(ora - sc.ultimo) < PASSO_MS) return;
    sc.ultimo = ora;
    const R = sc.volta.R * 0.99;
    sc.linee.forEach((l) => {
      const a = l.geometry.attributes.position; const u = l.userData;
      if (u.n === MAXP) { a.array.copyWithin(0, 3); u.n--; }
      sc.volta.dove(u.nome, d).multiplyScalar(R);
      a.setXYZ(u.n++, d.x, d.y, d.z); a.needsUpdate = true;
      l.geometry.setDrawRange(0, u.n);
    });
  }
  // Un salto di luogo o di data cancella le scie; il tempo che scorre no
  Cielo.ascolta((cosa) => { if (cosa && (cosa.lat !== undefined || cosa.lon !== undefined || cosa.data !== undefined)) azzeraScie(); });

  const ponte = Scene.ponte({ guarda: 0, phi: 1.12, extra: creaScie, frame: () => { if (Cielo.stato.corre) segnaScie(); return false; } });
  let pronto = false;
  function mondoProva() {
    const m = ponte();
    if (!pronto) {
      pronto = true;
      // Ci vuole la notte: se il Sole è sopra −12°, si va al prossimo crepuscolo astronomico serale
      if (Cielo.vistoDallaNave('Sole').h > -12) { const t = Cielo.istanteSole(-18, -1); if (t) Cielo.imposta({ data: t, corre: false }); }
      m.puntato = () => Motore.ridisegna();
    }
    return m;
  }

  /* La prova ----------------------------------------------------------------------------------- */
  const pr = { esito: null, ultima: null };
  const VEL = [['ferma', 'Fermo', 0], ['60', '×60', 60], ['600', '×600', 600], ['3600', '×3600', 3600]];
  // Sorge e tramonta, sempre visibile o mai visibile: la regola della tabella 1.5
  function genere(dec, lat) {
    if (Math.abs(lat) + Math.abs(dec) <= 90) return 'sorge e tramonta';
    return Math.sign(lat) === Math.sign(dec) ? 'circumpolare, sempre visibile' : 'circumpolare, mai visibile';
  }
  function comandiProva(id) {
    const v = VEL.find((x) => `vel:${x[0]}` === id);
    if (v) {
      Cielo.imposta(v[2] ? { corre: true, velocita: v[2] } : { corre: false });
      if (v[2] >= 600) lez.completa('corre');
    }
    if (id === 'scie') azzeraScie();
    if (id === 'notte') { const t = Cielo.istanteSole(-18, -1); if (t) Cielo.imposta({ data: t }); }
    if (id.startsWith('t:')) {
      const a = id.slice(2).split(',').find((x) => x.startsWith('astro:'));
      if (a) punta(a.slice(6));
    }
    Motore.sporco();
  }
  function punta(nome) {
    pr.ultima = nome;
    const v = Cielo.vistoDallaNave(nome); const lat = Cielo.stato.lat;
    if (!lez.fatte.has('corre')) { pr.esito = { tipo: 'neutro', testo: `${nome}. Prima fai correre il tempo: guarda come si muove.` }; return; }
    if (nome === 'Polare') {
      lez.completa('polo'); if (sc.polo) sc.polo.visible = true;
      pr.esito = { tipo: 'giusto', testo: `La Polare (δ ${Cielo.ang(v.dec, { segno: 'NS' })}) sta quasi sul polo celeste Nord: la sua scia è un cerchio piccolissimo.` };
      return;
    }
    const g = genere(v.dec, lat);
    if (g === 'circumpolare, sempre visibile') {
      lez.completa('circum');
      pr.esito = { tipo: 'giusto', testo: `${nome}: |φ| + |δ| = ${Cielo.ang(Math.abs(lat) + Math.abs(v.dec))}, più di 90°, e δ ha lo stesso nome della latitudine. Non tramonta mai.` };
    } else pr.esito = { tipo: 'errato', testo: `${nome}: |φ| + |δ| = ${Cielo.ang(Math.abs(lat) + Math.abs(v.dec))}. Questa stella ${g}: segui la sua scia fino all'orizzonte.` };
  }
  function istruzioni() {
    if (!lez.fatte.has('corre')) return 'Guarda verso Nord e fai correre il tempo: ×600 o ×3600. Ogni stella lascia la sua scia.';
    if (!lez.fatte.has('polo')) return 'Le scie sono archi di cerchio, tutti con lo stesso centro. Punta la stella che sta quasi ferma in quel centro.';
    if (!lez.fatte.has('circum')) return 'Ora cerca una stella la cui scia è un cerchio intero sopra il mare: non tramonta mai.';
    return 'Missioni fatte. Prova a cambiare luogo nel planetario: all\'equatore e al polo le scie cambiano. Poi vai avanti.';
  }

  /* Lo Scopri: la sfera armillare, al centro della quale sta l'osservatore ------------------------ */
  const sferaBase = Scene.sfera({});
  let sferaPronta = false;
  function mondoSfera() {
    const m = sferaBase();
    if (!sferaPronta) { sferaPronta = true; setTimeout(() => { m.sfera.ricostruisci('Polare', 'nessuno'); m.sferaMini.ricostruisci('Polare', 'nessuno'); Motore.ridisegna(); }, 0); }
    return m;
  }
  const ESEMPI = ['Polare', 'Dubhe', 'Vega', 'Sirio', 'Canopo', 'Acrux'];
  function tabellaGenere() {
    const lat = Cielo.stato.lat;
    return [['Stella', 'δ', '|φ| + |δ|', 'A questa latitudine'], ...ESEMPI.map((n) => {
      const v = Cielo.stella(n);
      return [n, Cielo.ang(v.dec, { segno: 'NS' }), Cielo.ang(Math.abs(lat) + Math.abs(v.dec)), genere(v.dec, lat)];
    })];
  }
  function comandiSfera(id) {
    if (id.startsWith('luogo:')) { const l = Cielo.LUOGHI[id.slice(6)]; Cielo.imposta({ lat: l.lat, lon: l.lon, luogo: id.slice(6) }); }
    if (id === 'lat-' || id === 'lat+') Cielo.imposta({ lat: Cielo.stato.lat + (id === 'lat+' ? 5 : -5), luogo: '' });
    const v = VEL.find((x) => `vel:${x[0]}` === id);
    if (v) Cielo.imposta(v[2] ? { corre: true, velocita: v[2] } : { corre: false });
    Motore.sporco();
  }
  const luoghi = () => ({ t: 'bottoni', h: 80, size: 34, lista: Object.keys(Cielo.LUOGHI).map((k) => ({ id: `luogo:${k}`, testo: k === 'procida' ? 'Procida' : k === 'equatore' ? 'Equatore' : 'Polo Nord', on: Cielo.stato.luogo === k && Cielo.stato.lat === Cielo.LUOGHI[k].lat })) });
  const velocita = () => ({ t: 'bottoni', h: 80, size: 34, lista: VEL.map(([id, testo, v]) => ({ id: `vel:${id}`, testo, on: v === 0 ? !Cielo.stato.corre : Cielo.stato.corre && Cielo.stato.velocita === v })) });

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  const RISPOSTE = { zenit: 'Sì, attorno allo zenit', polo: 'Sì, attorno a un punto verso Nord', no: 'No, ognuna gira per conto suo' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo: mondoProva, azione: comandiProva,
        sx: [
          { t: 'titolo', testo: 'Il cielo che gira' },
          { t: 'p', size: 40, testo: 'In poche ore di guardia le stelle cambiano posto: sorgono a Est, salgono, tramontano a Ovest. È il **moto diurno apparente** (*apparent diurnal motion*). {{p. 21}}' },
          { t: 'p', size: 40, testo: 'Non sono le stelle a girare: è la Terra che ruota su sé stessa, in senso **diretto**. A noi il cielo sembra girare in senso contrario, **retrogrado**. {{p. 21}}' },
          { t: 'riquadro', size: 36, testo: `${Cielo.luogo()} · ${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC` },
        ],
        dx: [
          finestra(900, 'Sei in controplancia, la prua guarda a Nord. Guardati intorno.', 'Il modellino è la sfera celeste di questo cielo. Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Trascina per guardarti intorno. Posizioni calcolate con Astronomy Engine e Bright Star Catalogue.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco farai correre il tempo: ogni stella lascerà una scia nel cielo.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Le stelle girano tutte attorno allo stesso punto?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo: mondoProva, azione: comandiProva, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Velocità del tempo' },
          velocita(),
          { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'scie', testo: 'Cancella le scie' }, { id: 'notte', testo: 'Vai alla notte' }] },
          { t: 'riquadro', size: 34, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · ${Cielo.luogo()}` },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(900, 'Punta una stella col controller e premi il grilletto.', 'Vai a grandezza vera: le scie ti circondano.'),
          ...scala(),
          { t: 'riquadro', size: 34, testo: istruzioni() },
        ],
      },
      {
        passo: 3, mondo: mondoSfera, azione: comandiSfera, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Tutte attorno al polo' },
          ...(p ? [{ t: 'nota', testo: p === 'polo' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 38, testo: 'Le scie hanno tutte lo stesso centro: il **polo celeste** elevato, dove la Terra punta il suo asse. Ogni stella percorre il suo **parallelo di declinazione**, perpendicolare all\'**asse del mondo**. {{pp. 12, 21}}' },
          { t: 'p', size: 38, testo: 'Il polo elevato sta sopra l\'orizzonte di un arco uguale alla **latitudine**: da Procida, circa 41° sopra il Nord. {{p. 12}}' },
          { t: 'nota', testo: 'La Polare dista dal polo meno di un grado: lo vedrai nell\'esperienza 2.' },
        ],
        dx: [
          finestra(700, 'Sei al centro della sfera, al posto dell\'osservatore.', 'Punta la sfera e tieni premuto il grilletto per girarla.'),
          ...scala(),
          luoghi(),
          velocita(),
          { t: 'nota', testo: 'In rosso l\'equatore celeste, in verde l\'orizzonte, in grigio l\'asse del mondo.' },
        ],
      },
      {
        passo: 3, mondo: mondoSfera, azione: comandiSfera, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Sorgere o non tramontare' },
          { t: 'p', size: 38, testo: 'Se |φ| + |δ| < 90° l\'astro **sorge e tramonta**. Se |φ| + |δ| > 90° è **circumpolare**: sempre visibile se φ e δ hanno lo stesso nome, mai visibile se hanno nome opposto. {{p. 22, tab. 1.5}}' },
          { t: 'tabella', col: [22, 22, 22, 34], size: 32, righe: tabellaGenere() },
          { t: 'nota', testo: `Latitudine ${Cielo.ang(Cielo.stato.lat, { segno: 'NS' })}. Declinazioni calcolate per oggi.` },
        ],
        dx: [
          finestra(560, 'Sei al centro della sfera.', 'Punta la sfera e tieni premuto il grilletto per girarla.'),
          ...scala(),
          luoghi(),
          { t: 'passo', id: 'lat', nome: 'Latitudine, 5° alla volta', valore: Cielo.ang(Cielo.stato.lat, { segno: 'NS' }) },
          { t: 'p', size: 36, testo: 'All\'equatore (**sfera retta**) tutte le stelle sorgono e tramontano. Al polo (**sfera parallela**) sono tutte circumpolari. {{pp. 23–24}}' },
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
