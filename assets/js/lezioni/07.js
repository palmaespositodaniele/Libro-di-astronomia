/* Esperienza 7: il sestante (esperienza pilota). Contenuti da «Fondamenti di Navigazione e Meteorologia
   nautica» vol. 2, cap. 4, pp. 63–67; esempio ed esercizi a pp. 75–76. Concetto e principio ottico usano
   un modello schematico: le sue misure non sono dati e non compaiono mai in pagina. Nella prova c'è il
   sestante vero (sestante3d.js), che segue la lettura. Regole in design.md */
(function () {
  const N = 7;
  const { etichetta, maniglia, pedana } = Tavola;
  const { C } = Pagina;
  const RAD = Math.PI / 180;
  // Correzione d'indice del sestante della prova, in primi: la stessa dell'esempio del libro (p. 75)
  const GAMMA = -5.0;

  const MISSIONI = [
    { id: 'indice', testo: 'Trova la correzione d\'indice.' },
    { id: 'vetrini', testo: 'Abbassa i vetrini colorati.' },
    { id: 'sole', testo: 'Leggi l\'altezza del Sole.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Da dove viene il nome *sestante*?', scelte: ['Dal lembo ampio 60°, 1/6 dell\'angolo giro', 'Dai sei vetrini colorati', 'Misura al massimo 6°'], giusta: 0, perche: 'Il lembo è ampio 60°, cioè 1/6 dell\'angolo giro. L\'ottante era ampio 45°, 1/8. {{p. 63}}' },
    { n: 2, testo: 'Con il nonio a tamburo si legge fino al…', scelte: ['grado', 'primo', 'decimo di primo'], giusta: 2, perche: 'Il nonio a tamburo indica valori con l\'accuratezza del decimo di primo. {{p. 63}}' },
    { n: 3, testo: 'Il lembo è ampio 60°, ma si leggono angoli fino a 120°. Perché?', scelte: ['È graduato con valori raddoppiati', 'L\'alidada fa due giri', 'Il cannocchiale ingrandisce'], giusta: 0, perche: 'Con la doppia riflessione l\'altezza è il doppio dell\'angolo fra gli specchi: il lembo è già graduato così (1° reale = 2° di scala). {{p. 66}}' },
    { n: 4, testo: 'Gli specchi sono paralleli a una lettura di 0°18,4′. A ogni altezza misurata…', scelte: ['aggiungo 18,4′', 'sottraggo 18,4′', 'non faccio niente'], giusta: 1, perche: 'È la correzione d\'indice: in questo caso va sottratta. {{p. 66, fig. 4.11}}' },
    { n: 5, testo: 'Lo specchio piccolo è…', scelte: ['tutto riflettente', 'per metà riflettente e per metà trasparente', 'colorato, per il Sole'], giusta: 1, perche: 'Dalla metà trasparente si vede l\'orizzonte, dall\'altra l\'astro riflesso dallo specchio grande. {{p. 63}}' },
    { n: 6, testo: 'Dove si trova la correzione istrumentale *c*?', scelte: ['Sul lembo, vicino allo zero', 'In un certificato dentro la scatola', 'Nelle Effemeridi nautiche'], giusta: 1, perche: 'Nei sestanti moderni è nulla; se c\'è, è indicata in un certificato incollato dentro la scatola. {{p. 66–67}}' },
  ];
  // Primo passo delle correzioni: hₒ = hᵢ + c + γ, con c nulla. Altezze e correzioni d'indice del libro
  const calc = (n, testo, g, p, sol) => ({ n, testo, campi: [['gradi', g, 0, '°'], ['primi', p, 0.05, '′']], soluzione: sol });
  const CALCOLI = [
    calc(7, '**Venere**: hᵢ = 44°54,7′, correzione d\'indice γ = −05,0′. Quanto vale l\'altezza osservata hₒ? {{p. 75}}', 44, 49.7, 'hₒ = 44°54,7′ − 05,0′ = 44°49,7′.'),
    calc(8, '**Acrux**: hᵢ = 45°18,9′, γ = −10,5′. Quanto vale hₒ? {{p. 76, es. 4a}}', 45, 8.4, 'hₒ = 45°18,9′ − 10,5′ = 45°08,4′.'),
    calc(9, '**Antares**: hᵢ = 13°26,5′, γ = +07,0′. Quanto vale hₒ? {{p. 76, es. 4b}}', 13, 33.5, 'hₒ = 13°26,5′ + 07,0′ = 13°33,5′.'),
    calc(10, '**Mirfak**: hᵢ = 38°41,7′, γ = −00,8′. Quanto vale hₒ? {{p. 76, es. 4c}}', 38, 40.9, 'hₒ = 38°41,7′ − 00,8′ = 38°40,9′.'),
    calc(11, '**Vega**: hᵢ = 68°16,2′, γ = +06,2′. Quanto vale hₒ? {{p. 76, es. 4d}}', 68, 22.4, 'hₒ = 68°16,2′ + 06,2′ = 68°22,4′.'),
    calc(12, '**Hadar**: hᵢ = 20°36,8′, γ = −13,0′. Quanto vale hₒ? {{p. 76, es. 4e}}', 20, 23.8, 'hₒ = 20°36,8′ − 13,0′ = 20°23,8′.'),
  ];

  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* Il sestante in 3D ---------------------------------------------------------------------------
     In metri, nel piano del telaio (x a destra, y in alto, z verso chi guarda il lembo).
     Il perno dell'alidada sta nell'origine; i raggi corrono in un piano davanti al telaio */
  const PARTI = [
    { id: 'telaio', nome: 'Telaio', testo: '**Telaio metallico** (*frame*): regge tutto lo strumento e comprende il lembo graduato. {{p. 63}}' },
    { id: 'lembo', nome: 'Lembo', testo: '**Lembo graduato** (*graduated arc*): arco di circonferenza ampio 60°, su cui scorre l\'alidada. Da qui il nome: 60° è 1/6 dell\'angolo giro. {{p. 63}}' },
    { id: 'alidada', nome: 'Alidada', testo: '**Alidada** (*index arm*): l\'elemento mobile. Si ferma sul lembo con un bloccaggio a molla (*clamp*); il suo indice, la **linea di fede**, segna la misura. {{p. 63}}' },
    { id: 'tamburo', nome: 'Nonio a tamburo', testo: '**Nonio a tamburo** (*micrometer drum*): sull\'alidada, dà la lettura con l\'accuratezza del decimo di primo. {{p. 63}}' },
    { id: 'cannocchiale', nome: 'Cannocchiale', testo: '**Cannocchiale** (*telescope*): da qui l\'osservatore guarda lo specchio piccolo. {{p. 63}}' },
    { id: 'piccolo', nome: 'Specchio piccolo', testo: '**Specchio fisso o piccolo** (*horizon glass and mirror*): fissato al telaio, per metà riflettente e per metà trasparente. {{p. 63}}' },
    { id: 'grande', nome: 'Specchio grande', testo: '**Specchio mobile o grande** (*index mirror*): fissato sull\'alidada, gira con lei e manda allo specchio piccolo l\'immagine dell\'astro. {{p. 63}}' },
    { id: 'vetrini', nome: 'Vetrini colorati', testo: '**Vetri colorati** (*horizon shades / index shades*): di diverse gradazioni, attenuano la luce del Sole e proteggono l\'occhio dell\'osservatore. {{p. 64}}' },
    { id: 'impugnatura', nome: 'Impugnatura', testo: '**Impugnatura**: con i vetrini, la luce di lettura e le viti di rettifica (*adjustment screw*) completa la struttura. {{p. 63}}' },
  ];
  const R = 0.16; const ZO = 0.03;
  const Z = new THREE.Vector3(0, 0, 1);
  const P = new THREE.Vector3(0, 0, ZO); // specchio grande, sul perno
  const G = new THREE.Vector3(-0.06, -0.06, ZO); // specchio piccolo
  const OC = new THREE.Vector3(0.1, -0.06, ZO); // oculare del cannocchiale
  const U1 = new THREE.Vector3().subVectors(G, P).normalize(); // dallo specchio grande al piccolo
  const N_PICCOLO = new THREE.Vector3(1, 0, 0).sub(U1).normalize();
  const N_GRANDE0 = U1.clone().sub(new THREE.Vector3(1, 0, 0)).normalize(); // a 0° i due specchi sono paralleli
  const sulLembo = (phi, r) => new THREE.Vector3(-Math.sin(phi * RAD) * r, -Math.cos(phi * RAD) * r, 0); // phi: dal basso, positivo a sinistra
  const D0 = sulLembo(-30, 1); // direzione dell'alidada con lettura 0°

  const mat = (col, op) => new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: op !== undefined, opacity: op === undefined ? 1 : op, depthWrite: op === undefined });
  const ASSE_Y = new THREE.Vector3(0, 1, 0);
  function asta(r, col) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), mat(col)); m.userData.r = r; return m; }
  function tendi(m, a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(m.userData.r, Math.max(1e-4, d.length()), m.userData.r);
    m.quaternion.setFromUnitVectors(ASSE_Y, d.normalize());
    return m;
  }
  // Piano con la normale n (nel piano del telaio) e il lato «alto» perpendicolare al telaio
  function orienta(o, n) {
    const t = new THREE.Vector3().crossVectors(Z, n).normalize();
    o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, Z, n));
    return o;
  }

  const copie = []; // ogni copia del sestante: { braccio, raggi, vetrini, parti }
  const sc = { lettura: 30, parte: null, sopra: null }; // lettura del modello, in gradi di scala
  const ORO = 0xC9A227; const OCRA = 0xD08A1E;

  /* k: spessore dei tratti; tocca(mesh) per ciò che si punta; centro: perno nel telaio del motore */
  function sestante(k, tocca, centro, opz = {}) {
    const g = new THREE.Group(); const parti = {};
    const metti = (id, m, col) => {
      m.userData.tocco = id; m.userData.colore = col; tocca(m);
      (parti[id] = parti[id] || []).push(m); return m;
    };
    const tubo = (id, a, b, r, col) => g.add(metti(id, tendi(asta(r * k, col), a, b), col));
    // Telaio: due raggi, un arco interno di rinforzo
    const SCURO = 0x2B3440;
    tubo('telaio', new THREE.Vector3(0, 0, 0), sulLembo(-34, R), 0.0042, SCURO);
    tubo('telaio', new THREE.Vector3(0, 0, 0), sulLembo(35, R), 0.0042, SCURO);
    for (let f = -34; f < 35; f += 13.8) tubo('telaio', sulLembo(f, R * 0.56), sulLembo(f + 13.8, R * 0.56), 0.0035, SCURO);
    tubo('telaio', sulLembo(0, R * 0.56), sulLembo(0, R * 0.95), 0.003, SCURO);
    // Lembo: la fascia d'oro con le tacche ogni 10° di scala
    const lembo = new THREE.Mesh(new THREE.RingGeometry(R - 0.014, R + 0.003, 48, 1, (-90 - 35) * RAD, 70 * RAD), mat(ORO));
    lembo.position.z = 0.002; g.add(metti('lembo', lembo, ORO));
    for (let s = 0; s <= 120; s += 10) {
      const f = s / 2 - 30;
      const t = tendi(asta(0.0008 * k, 0x0B2545), sulLembo(f, R - 0.013).setZ(0.004), sulLembo(f, R - (s % 30 ? 0.006 : 0.001)).setZ(0.004));
      g.add(t);
      if (s % 30 === 0) { const e = etichetta(String(s), 0.011 * k); e.position.copy(sulLembo(f, R + 0.014)).setZ(0.004); g.add(e); }
    }
    // Alidada: costruita a 0°, gira attorno al perno
    const braccio = new THREE.Group(); g.add(braccio);
    const GRIGIO = 0x5B6B7C;
    const bA = new THREE.Vector3(0, 0, 0.008); const bB = D0.clone().multiplyScalar(R + 0.004).setZ(0.008);
    braccio.add(metti('alidada', tendi(asta(0.005 * k, GRIGIO), bA, bB), GRIGIO));
    const fede = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.004), mat(0xB23A2E));
    fede.position.copy(D0.clone().multiplyScalar(R - 0.006)).setZ(0.01); fede.rotation.z = Math.atan2(D0.y, D0.x) - Math.PI / 2;
    braccio.add(metti('alidada', fede, 0xB23A2E));
    const tamb = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 24), mat(0xB08A2A));
    tamb.position.copy(D0.clone().multiplyScalar(R - 0.034)).setZ(0.022);
    tamb.quaternion.setFromUnitVectors(ASSE_Y, new THREE.Vector3(-D0.y, D0.x, 0)); // asse lungo il lembo
    braccio.add(metti('tamburo', tamb, 0xB08A2A));
    const spGrande = orienta(new THREE.Mesh(new THREE.PlaneGeometry(0.046, 0.036), mat(0xA9C4DA)), N_GRANDE0);
    spGrande.position.copy(P); braccio.add(metti('grande', spGrande, 0xA9C4DA));
    const retroG = orienta(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.004), mat(0x3B4654)), N_GRANDE0);
    retroG.position.copy(P).addScaledVector(N_GRANDE0, -0.004); braccio.add(metti('grande', retroG, 0x3B4654));
    braccio.add(tendi(asta(0.003 * k, GRIGIO), new THREE.Vector3(0, 0, 0.008), P.clone().setZ(ZO - 0.018)));
    if (centro) {
      const presa = maniglia(0.009 * k, 'alidada');
      presa.position.copy(D0.clone().multiplyScalar(R + 0.022)).setZ(0.012);
      presa.userData.vincolo = { giro: [0, 0, 1], centro };
      braccio.add(presa); tocca(presa);
    }
    // Specchio piccolo: metà riflettente vicino al telaio, metà trasparente più in fuori
    const meta = (dz, col, op) => { const m = orienta(new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.017), mat(col, op)), N_PICCOLO); m.position.copy(G).addScaledVector(Z, dz); return m; };
    g.add(metti('piccolo', meta(-0.0088, 0xA9C4DA), 0xA9C4DA), metti('piccolo', meta(0.0088, 0xDCEBF5, 0.3), 0xDCEBF5));
    tubo('piccolo', G.clone().setZ(0), G.clone().setZ(ZO - 0.018), 0.003, GRIGIO);
    // Cannocchiale, puntato verso lo specchio piccolo
    const cann = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.075, 20).rotateZ(Math.PI / 2), mat(0x1F2731));
    cann.position.set(0.062, -0.06, ZO); g.add(metti('cannocchiale', cann, 0x1F2731));
    tubo('cannocchiale', new THREE.Vector3(0.06, -0.06, 0), new THREE.Vector3(0.06, -0.06, ZO - 0.011), 0.003, GRIGIO);
    // Vetrini colorati: tre fra i due specchi, due davanti allo specchio piccolo
    const COLORI = [0x2F6B3A, 0x8A3A22, 0x2D3A7A];
    const vetrini = [];
    COLORI.forEach((col, i) => {
      const v = orienta(new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.03), mat(col, 0.62)), U1);
      v.userData.giu = P.clone().lerp(G, 0.4 + i * 0.09); v.position.copy(v.userData.giu);
      g.add(metti('vetrini', v, col)); vetrini.push(v);
    });
    [0x2F6B3A, 0x8A3A22].forEach((col, i) => {
      const v = orienta(new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.026), mat(col, 0.62)), new THREE.Vector3(1, 0, 0));
      v.userData.giu = G.clone().add(new THREE.Vector3(-0.026 - i * 0.008, 0, 0)); v.position.copy(v.userData.giu);
      g.add(metti('vetrini', v, col)); vetrini.push(v);
    });
    // Impugnatura, dietro il telaio
    const MANICO = 0x6B4A2E;
    tubo('impugnatura', new THREE.Vector3(0.03, -0.035, -0.035), new THREE.Vector3(0.03, -0.115, -0.035), 0.011, MANICO);
    tubo('impugnatura', new THREE.Vector3(0.03, -0.04, 0), new THREE.Vector3(0.03, -0.04, -0.035), 0.004, SCURO);
    tubo('impugnatura', new THREE.Vector3(0.03, -0.11, 0), new THREE.Vector3(0.03, -0.11, -0.035), 0.004, SCURO);
    // I raggi del principio ottico: in ocra quello dell'astro, in azzurro l'orizzonte diretto
    let raggi = null;
    if (opz.raggi !== false) {
      raggi = { astro: asta(0.0011 * k, OCRA), riflesso: asta(0.0011 * k, OCRA), occhio: asta(0.0011 * k, OCRA), orizzonte: asta(0.0011 * k, 0x2E7DB5) };
      raggi.etAstro = etichetta('astro', 0.014 * k, '#9A5B12'); raggi.etOrizz = etichetta('orizzonte', 0.014 * k, '#2E7DB5');
      Object.values(raggi).forEach((o) => g.add(o));
    }
    const cp = { braccio, raggi, vetrini, parti };
    // Il sestante in mano (VR) segue la prova, non il modello del Concetto
    if (opz.raggi !== false) copie.push(cp);
    g.userData.copia = cp;
    return g;
  }

  // Muove ogni copia: l'alidada gira della metà della lettura, i raggi seguono l'astro
  function posaSestanti(lettura, giu, lista) {
    (lista || copie).forEach((cp) => {
      cp.braccio.rotation.z = (-lettura / 2) * RAD;
      cp.vetrini.forEach((v) => { v.position.copy(v.userData.giu); if (!giu) v.position.z += 0.034; });
      if (!cp.raggi) return;
      const h = lettura * RAD; const lontano = 0.17;
      const astro = P.clone().add(new THREE.Vector3(-Math.cos(h), Math.sin(h), 0).multiplyScalar(lontano));
      tendi(cp.raggi.astro, astro, P); tendi(cp.raggi.riflesso, P, G); tendi(cp.raggi.occhio, G, OC);
      const orizz = G.clone().add(new THREE.Vector3(-lontano, 0, 0));
      tendi(cp.raggi.orizzonte, orizz, G);
      cp.raggi.etAstro.position.copy(astro).add(new THREE.Vector3(0, 0.012, 0));
      cp.raggi.etOrizz.position.copy(orizz).add(new THREE.Vector3(0, -0.014, 0));
    });
  }
  function accendi() {
    copie.forEach((cp) => Object.keys(cp.parti).forEach((id) => cp.parti[id].forEach((m) => {
      m.material.color.set(id === sc.parte || id === sc.sopra ? OCRA : m.userData.colore);
    })));
  }

  const ALTO = 1.3; // a grandezza vera il sestante sta all'altezza del petto
  const prese = { schermo: [], mini: [] };
  let mondoS = null;
  function creaSestante() {
    if (mondoS) return mondoS;
    const radice = new THREE.Group();
    const grande = sestante(1, (o) => prese.schermo.push(o), [0, ALTO, 0]);
    grande.position.y = ALTO; radice.add(grande);
    const mini = new THREE.Group();
    const piccolo = sestante(1.4, (o) => prese.mini.push(o), [0, 0.16, 0]);
    piccolo.scale.setScalar(2); piccolo.position.y = 0.16; mini.add(piccolo);
    const p = pedana(0, 0.6, 'davanti al sestante'); p.scale.set(0.08, 1, 0.08); p.visible = false;
    posaSestanti(sc.lettura, true);
    mondoS = {
      radice, modellino: mini,
      stazioni: [{ pedana: p, pos: new THREE.Vector3(0, 0, 0.55), yaw: 0 }],
      vistaIniziale: () => ({ target: new THREE.Vector3(-0.04, ALTO - 0.07, 0.02), theta: 0.22, phi: 1.36, r: 0.5 }),
      limiti: { phi0: 0.25, phi1: 2.4, r0: 0.25, r1: 2 },
      tocchi: (vista) => (vista === 'mini' ? prese.mini : prese.schermo),
      sopra(ids) {
        const id = ids ? ids.find((x) => PARTI.some((q) => q.id === x)) || null : null;
        if (id === sc.sopra) return false;
        sc.sopra = id; accendi(); return true;
      },
      trascina(id, dx, dy, info) {
        if (id !== 'alidada') return;
        const prima = Math.round(sc.lettura);
        // Alidada girata in senso orario = lettura più grande; il lembo va da −5° a 120° di scala
        sc.lettura = Math.max(-5, Math.min(120, sc.lettura - 2 * (info ? info.ang / RAD : dx * 0.08)));
        posaSestanti(sc.lettura, true);
        if (Math.round(sc.lettura) !== prima) Motore.ridisegna();
      },
      frame() { return false; },
    };
    return mondoS;
  }
  function scegli(id) { sc.parte = id; sc.sopra = null; accendi(); }
  function comandiSestante(id) {
    if (id.startsWith('n:')) scegli(id.slice(2));
    if (id.startsWith('t:')) { const c = id.slice(2).split(',').find((x) => PARTI.some((q) => q.id === x)); if (c) scegli(c); }
    Motore.sporco();
  }
  function righeParti() {
    const out = [];
    for (let i = 0; i < PARTI.length; i += 3) out.push({ t: 'bottoni', h: 72, size: 32, lista: PARTI.slice(i, i + 3).map((p) => ({ id: `n:${p.id}`, testo: p.nome, on: sc.parte === p.id })) });
    return out;
  }

  /* La prova: dal ponte, col Sole vero. Nel cannocchiale a sinistra l'orizzonte diretto,
     a destra quello che manda lo specchio grande, spostato della lettura ------------------------- */
  const pr = { dec: 0, vetrini: false, t: 0, esito: null, sole: null, letto: null, ctrl: null, acc: 0, scatto: false, ridisegno: 0, abbaglio: false, preparato: false };
  // Le misure fatte restano fra una visita e l'altra, per lo Scopri
  const salvate = Libro.stato(N).misure || {};
  if (salvate.sole) pr.sole = salvate.sole;
  if (salvate.gamma !== undefined) pr.gamma = salvate.gamma;
  const salvaMisure = () => Libro.aggiorna(N, { misure: { sole: pr.sole, gamma: pr.gamma } });
  const LW = 1020; const LH = 600;
  const tela = document.createElement('canvas'); tela.width = LW; tela.height = LH;
  const texLente = new THREE.CanvasTexture(tela); texLente.colorSpace = THREE.SRGBColorSpace;
  let soleV = null; let soleHo = 0;
  Cielo.ascolta(() => { soleV = null; });
  function sole() {
    if (!soleV) { soleV = Cielo.vistoDallaNave('Sole'); soleHo = Cielo.altezzaOsservata(soleV, 'inf') * 60; }
    return soleV;
  }
  const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;

  function disegnaLente() {
    const c = tela.getContext('2d'); const s = sole();
    const cx = LW / 2; const cy = LH / 2; const RAG = 282; const K = 6; // 6 px per primo
    const f = Math.min(1, Math.max(0, (s.h + 6) / 16));
    const cielo = mix([10, 19, 34], [141, 184, 222], f); const mare = mix([6, 16, 26], [44, 95, 134], f);
    // Nave e mano si muovono: tutto il campo sale e scende insieme (l'allineamento non cambia)
    const bob = 7 * Math.sin(pr.t * 0.8) + 3 * Math.sin(pr.t * 2.1 + 1);
    const rho = 0.32 * Math.sin(pr.t * 1.25); // il sestante oscilla attorno all'asse del cannocchiale
    const Y = (a) => cy - (a - bob) * K;
    const letta = pr.dec / 10 + GAMMA; // primi: altezza osservata che la lettura mette al centro
    c.fillStyle = '#06080C'; c.fillRect(0, 0, LW, LH);
    c.save(); c.beginPath(); c.arc(cx, cy, RAG, 0, Math.PI * 2); c.clip();
    // Metà trasparente: l'orizzonte vero
    c.fillStyle = cielo; c.fillRect(cx - RAG, 0, RAG, LH);
    c.fillStyle = mare; c.fillRect(cx - RAG, Y(0), RAG, LH);
    // Metà riflettente: il cielo all'altezza letta, un po' più scuro
    c.save(); c.beginPath(); c.rect(cx, 0, RAG, LH); c.clip();
    c.fillStyle = cielo; c.fillRect(cx, 0, RAG, LH);
    const yMare = Y(0 - letta);
    if (yMare < LH) { c.fillStyle = mare; c.fillRect(cx, yMare, RAG, LH); }
    const centro = soleHo + s.sd; // primi: centro del Sole sopra l'orizzonte marino
    const xs = cx + 110 + 40 * K * Math.sin(rho); const ys = Y(centro - letta + 40 * (1 - Math.cos(rho)));
    pr.abbaglio = false;
    if (pr.vetrini) {
      c.fillStyle = 'rgba(20,70,40,0.5)'; c.fillRect(cx, 0, RAG, LH);
      c.fillStyle = '#F08A3C'; c.beginPath(); c.arc(xs, ys, s.sd * K, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#C0571E'; c.lineWidth = 3; c.stroke();
    } else {
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(cx, 0, RAG, LH);
      if (Math.abs(ys - cy) < RAG + 260) {
        pr.abbaglio = true;
        const gr = c.createRadialGradient(xs, ys, s.sd * K * 0.8, xs, ys, 420);
        gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(1, 'rgba(255,250,230,0)');
        c.fillStyle = gr; c.fillRect(cx, 0, RAG, LH);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(xs, ys, s.sd * K, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
    if (pr.abbaglio) { c.fillStyle = 'rgba(255,252,240,0.55)'; c.fillRect(cx - RAG, 0, RAG, LH); }
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(cx - 2, 0, 4, LH); // bordo dell'argentatura
    c.restore();
    c.strokeStyle = '#1B1F26'; c.lineWidth = 16; c.beginPath(); c.arc(cx, cy, RAG, 0, Math.PI * 2); c.stroke();
    c.font = '34px Atkinson, sans-serif'; c.fillStyle = '#9AA7B4';
    c.fillText('trasparente', 18, LH - 24);
    c.textAlign = 'right'; c.fillText('riflettente', LW - 18, LH - 24); c.textAlign = 'left';
    texLente.needsUpdate = true;
  }

  // In VR, a grandezza vera: il sestante nella mano sinistra, con la vista del cannocchiale sopra
  const inMano = new THREE.Group(); inMano.matrixAutoUpdate = false; inMano.visible = false;
  const sestanteMano = sestante(1, () => {}, null, { raggi: false });
  sestanteMano.rotation.y = -Math.PI / 2; sestanteMano.position.set(0, 0.03, -0.04);
  const oculare = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.1), new THREE.MeshBasicMaterial({ map: texLente }));
  oculare.position.set(0, 0.17, -0.12); oculare.rotation.x = -0.35;
  inMano.add(sestanteMano, oculare);

  /* Il sestante vero (sestante3d.js): sul ponte davanti agli occhi, e nel visore nella mano sinistra al posto
     di quello schematico. Si carica alla prima visita della prova; finché non c'è, resta lo schematico */
  const vero = { banco: null, mano: null, chiesto: false };
  const banco = new THREE.Group(); banco.visible = false;
  function caricaVero() {
    if (vero.chiesto || !window.Sestante3D) return;
    vero.chiesto = true;
    Sestante3D.carica().then((nuovo) => {
      vero.banco = nuovo(); banco.add(vero.banco.g); banco.visible = true;
      vero.mano = nuovo();
      // L'impugnatura del modello (dietro il telaio, sotto il perno) va nel pugno, come quella schematica
      vero.mano.g.rotation.y = -Math.PI / 2; vero.mano.g.position.set(0.013, 0.05, -0.01);
      inMano.add(vero.mano.g); sestanteMano.visible = false;
      Motore.ridisegna();
    }).catch(() => { /* senza modello resta il sestante schematico */ });
  }
  // Sul ponte: mezzo metro davanti agli occhi, verso il Sole, con il lembo rivolto a chi guarda
  function posaBanco() {
    const a = sole().a * RAD;
    banco.position.set(0.45 * Math.sin(a), Scene.OCCHIO + 0.01, -0.45 * Math.cos(a));
    banco.rotation.y = -a;
  }

  const PASSO_MIN = -3000; const PASSO_MAX = 72000; // decimi di primo: da −5° a 120°
  function muovi(d) {
    pr.dec = Math.max(PASSO_MIN, Math.min(PASSO_MAX, pr.dec + d));
    pr.ridisegno = 0.12; // la pagina si ridisegna poco dopo: girando il tamburo non serve a ogni passo
  }
  function framaProva(dt) {
    pr.t += dt;
    disegnaLente();
    if (pr.ridisegno > 0) { pr.ridisegno -= dt; if (pr.ridisegno <= 0) Motore.ridisegna(); }
    const vera = Motore.presente() && Motore.scalaVera() && pr.ctrl;
    inMano.visible = !!vera;
    if (vera) {
      inMano.matrix.copy(pr.ctrl.matrixWorld); inMano.matrixWorldNeedsUpdate = true;
      if (vero.mano) vero.mano.poni(pr.dec / 600, pr.vetrini);
      else posaSestanti(pr.dec / 600, pr.vetrini, [sestanteMano.userData.copia]);
    }
    // Il sestante davanti agli occhi è per lo schermo: nel visore c'è quello in mano
    banco.visible = !!vero.banco && !Motore.presente();
    return !!vero.banco && vero.banco.poni(pr.dec / 600, pr.vetrini);
  }
  // Levetta destra: di lato gira il tamburo (più spinta, più veloce), avanti e indietro un grado alla volta
  function levaProva(f, ax, dt, c) {
    if (f.handedness === 'left') { pr.ctrl = c; return false; }
    if (Math.abs(ax[0]) > 0.15) {
      pr.acc += Math.sign(ax[0]) * Math.abs(ax[0]) ** 3 * 300 * dt;
      const n = Math.trunc(pr.acc); if (n) { pr.acc -= n; muovi(n); }
    }
    if (Math.abs(ax[1]) > 0.6 && !pr.scatto) { pr.scatto = true; muovi(-Math.sign(ax[1]) * 600); } else if (Math.abs(ax[1]) < 0.3) pr.scatto = false;
    return true;
  }
  const ponteProva = Scene.ponte({ frame: framaProva, leva: levaProva, extra: (radice) => radice.add(inMano, banco) });
  // Il Sole a 20° di altezza, la mattina del giorno scelto; se lì non ci arriva, al largo di Procida
  function preparaCielo() {
    let t = Cielo.oraColSole(20);
    if (!t) { const l = Cielo.LUOGHI.procida; Cielo.imposta({ lat: l.lat, lon: l.lon, luogo: 'procida' }); t = Cielo.oraColSole(20); }
    if (t) Cielo.imposta({ data: t, corre: false });
  }
  function mondoProva() {
    if (!pr.preparato) { pr.preparato = true; preparaCielo(); }
    caricaVero();
    const m = ponteProva();
    if (!m.lente) {
      m.lente = () => texLente;
      // Dagli occhi verso il Sole, un po' in basso: il sestante in primo piano, dietro l'orizzonte
      m.vistaIniziale = () => { const s = sole(); return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: s.a * RAD, phi: 1.70, r: 32 }; };
    }
    posaBanco();
    disegnaLente();
    return m;
  }

  const leggi = (dec) => Cielo.ang(dec / 600);
  const pr1 = (p) => `${p.toFixed(1).replace('.', ',').padStart(4, '0')}′`; // primi senza segno
  function comandiProva(id) {
    if (id === 'ali-' || id === 'ali+') muovi(id === 'ali+' ? 600 : -600);
    if (id === 'tam-' || id === 'tam+') muovi(id === 'tam+' ? 1 : -1);
    const fr = Lezione.letto(id, 'drum', 0, 599, 1);
    if (fr !== null && fr !== 'fine') { const g = Math.floor(pr.dec / 600); pr.dec = Math.max(PASSO_MIN, Math.min(PASSO_MAX, g * 600 + fr)); }
    if (id === 'vetrini') { pr.vetrini = !pr.vetrini; if (pr.vetrini) lez.completa('vetrini'); }
    if (id === 'leggi') controlla();
    pr.ridisegno = 0;
  }
  function controlla() {
    const letta = pr.dec / 10; // primi
    if (Math.abs(letta) < 60) {
      // Correzione d'indice: l'orizzonte riflesso deve continuare quello vero
      if (Math.abs(letta + GAMMA) <= 0.3) {
        lez.completa('indice'); pr.letto = pr.dec;
        const g = -Math.round(letta * 10) / 10;
        pr.gamma = g; salvaMisure(); // la correzione d'indice misurata dallo studente: è quella che userà
        pr.esito = { tipo: 'giusto', testo: `Gli specchi sono paralleli a ${leggi(pr.dec)}: a ogni altezza dovrai ${g < 0 ? 'sottrarre' : 'aggiungere'} ${pr1(Math.abs(g))}. La correzione d'indice è γ = ${Cielo.primi(g)}.` };
      } else pr.esito = { tipo: 'errato', testo: 'L\'orizzonte è ancora spezzato fra le due metà: gira il tamburo finché la linea è continua.' };
      return;
    }
    if (!lez.fatte.has('indice')) { pr.esito = { tipo: 'errato', testo: 'Prima la correzione d\'indice: porta la lettura vicino a 0° e allinea l\'orizzonte.' }; return; }
    if (!pr.vetrini) { pr.esito = { tipo: 'errato', testo: 'Senza vetrini colorati non si guarda il Sole: abbassali.' }; return; }
    sole();
    const giusta = soleHo - GAMMA; // primi: la lettura che porta il lembo inferiore sull'orizzonte
    const scarto = letta - giusta;
    if (Math.abs(scarto) <= 0.5) {
      lez.completa('sole');
      pr.sole = { hi: pr.dec / 600, hv: soleV.h, quando: Cielo.stato.data, luogo: Cielo.luogo() };
      salvaMisure();
      pr.esito = { tipo: 'giusto', testo: `Letto: hᵢ = ${leggi(pr.dec)} alle ${Cielo.ora().slice(0, 5)} UTC.` };
    } else if (Math.abs(scarto) > 60) pr.esito = { tipo: 'errato', testo: 'Il Sole non è nel campo: cambia l\'alidada di qualche grado finché compare a destra.' };
    else pr.esito = { tipo: 'errato', testo: `Il lembo inferiore è ancora ${scarto > 0 ? 'sotto' : 'sopra'} l'orizzonte: gira il tamburo.` };
  }

  // Lembo e tamburo come si vedono sullo strumento, con la lettura grande sotto
  function disegnaLettura(c, x, y, w, h) {
    const tot = pr.dec / 600; const gradi = Math.floor(tot); const primi = (pr.dec - gradi * 600) / 10;
    const lw = w * 0.56; const cx = x + lw / 2; const yb = y + 26; const hb = 118; const passo = 82;
    c.fillStyle = '#E9DCB0'; c.fillRect(x, yb, lw, hb);
    c.save(); c.beginPath(); c.rect(x, yb, lw, hb); c.clip();
    c.font = '700 34px Atkinson, sans-serif'; c.textAlign = 'center';
    for (let d = gradi - 5; d <= gradi + 5; d++) {
      const xd = cx - (d - tot) * passo; // i gradi crescono verso sinistra, come sul lembo
      c.fillStyle = C.ink; c.fillRect(xd - 2, yb, 4, d % 5 === 0 ? 52 : 34);
      c.fillText(String(d), xd, yb + 96);
    }
    c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(x, yb, lw, hb);
    c.fillStyle = '#B23A2E'; c.beginPath(); c.moveTo(cx, yb + 6); c.lineTo(cx - 15, yb - 20); c.lineTo(cx + 15, yb - 20); c.closePath(); c.fill();
    c.fillRect(cx - 2, yb, 4, 64);
    c.font = '34px Disegno, cursive'; c.fillStyle = C.ink2; c.fillText('lembo', cx, yb + hb + 40);
    // Tamburo: i primi, con l'indice fermo in alto; la posizione fra due tacche dà i decimi
    const tx = x + lw + (w - lw) / 2; const ty = y + 120; const tr = 104;
    c.fillStyle = '#E3C878'; c.beginPath(); c.arc(tx, ty, tr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke();
    for (let m = 0; m < 60; m++) {
      const a = -Math.PI / 2 + ((m - primi) * Math.PI * 2) / 60;
      const r0 = m % 5 ? tr - 14 : tr - 24;
      c.lineWidth = m % 10 ? 2 : 4; c.beginPath();
      c.moveTo(tx + Math.cos(a) * r0, ty + Math.sin(a) * r0); c.lineTo(tx + Math.cos(a) * tr, ty + Math.sin(a) * tr); c.stroke();
      if (m % 10 === 0) { c.fillStyle = C.ink; c.font = '700 34px Atkinson, sans-serif'; c.fillText(String(m), tx + Math.cos(a) * (tr - 50), ty + Math.sin(a) * (tr - 50) + 12); }
    }
    c.fillStyle = '#B23A2E'; c.beginPath(); c.moveTo(tx, ty - tr + 4); c.lineTo(tx - 13, ty - tr - 22); c.lineTo(tx + 13, ty - tr - 22); c.closePath(); c.fill();
    c.textAlign = 'left';
    c.font = '700 60px Bitter, Georgia, serif'; c.fillStyle = C.ink;
    c.fillText(`hᵢ = ${leggi(pr.dec)}`, x, y + h - 14);
  }

  function istruzioni() {
    if (!lez.fatte.has('indice')) return 'Prima la **correzione d\'indice**: lettura vicino a 0°, poi gira il tamburo finché l\'orizzonte a destra continua quello a sinistra. Allora premi **Leggi**. {{p. 66}}';
    if (!lez.fatte.has('sole')) return 'Ora il **Sole**: abbassa i vetrini, poi alza l\'alidada grado per grado finché il Sole compare a destra. Col tamburo appoggia il **lembo inferiore** sull\'orizzonte nel punto più basso dell\'oscillazione, e premi **Leggi**. {{p. 65}}';
    return `Misura fatta: hᵢ = ${Cielo.ang(pr.sole ? pr.sole.hi : pr.dec / 600)}. Vai avanti: che cosa hai misurato davvero?`;
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const bottoneScala = (vr) => (vr ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const SUL_MODELLO = 'Punta la sfera d\'oro, tieni premuto il grilletto e muovi la mano.';
  const RISPOSTE = { si: 'Sì, è l\'altezza vera', no: 'No, va corretta', mare: 'Solo se il mare è calmo' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente();
    const parte = PARTI.find((x) => x.id === sc.parte);
    const ris = pr.sole;
    const gam = pr.gamma === undefined ? GAMMA : pr.gamma;
    const ho = ris ? ris.hi + gam / 60 : null;
    return [
      {
        passo: 0, mondo: creaSestante, azione: comandiSestante,
        sx: [
          { t: 'titolo', testo: 'Il sestante' },
          { t: 'p', size: 40, testo: 'Il **sestante** (*sextant*) misura l\'angolo fra due riferimenti guardati insieme nel mirino: due specchi li fanno vedere sovrapposti. In navigazione astronomica misura l\'**altezza degli astri**. {{p. 63–64}}' },
          ...righeParti(),
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 780, testo: !vr ? '' : Motore.scalaVera() ? 'Il sestante è davanti a te, a grandezza vera. Punta una parte per il nome.' : SUL_MODELLO },
          ...bottoneScala(vr),
          { t: 'riquadro', size: 36, testo: parte ? parte.testo : 'Tocca una parte del sestante o un nome: la parte si colora.' },
          { t: 'nota', testo: 'Disegno schematico: le misure del modello non sono dati.' },
        ],
      },
      {
        passo: 0, mondo: creaSestante, azione: comandiSestante,
        sx: [
          { t: 'titolo', testo: 'Il principio ottico' },
          { t: 'p', size: 40, testo: 'Se la luce si riflette due volte nello stesso piano, l\'angolo fra il raggio che entra e l\'ultimo raggio riflesso è il **doppio** dell\'angolo fra i due specchi. {{p. 65}}' },
          { t: 'p', size: 40, testo: 'Con l\'alidada a 0° gli specchi sono paralleli. Girando l\'alidada, l\'altezza è il doppio dell\'angolo percorso: per questo il lembo, ampio 60°, è graduato con valori raddoppiati e si legge fino a 120°. {{p. 66}}' },
          { t: 'riquadro', size: 40, testo: `Alidada girata di **${Cielo.ang(sc.lettura / 2)}** · lettura sul lembo **${Cielo.ang(sc.lettura)}**` },
          { t: 'nota', testo: 'In ocra il raggio dell\'astro, che si riflette due volte; in azzurro l\'orizzonte, visto attraverso la parte trasparente.' },
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 860, testo: !vr ? '' : Motore.scalaVera() ? 'Tira la sfera d\'oro sull\'alidada: guarda come si muove il raggio dell\'astro.' : SUL_MODELLO },
          ...bottoneScala(vr),
          { t: 'nota', testo: 'Tira la sfera d\'oro: l\'alidada scorre sul lembo. Il raggio che arriva al cannocchiale non cambia.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Dal ponte punti il sestante sul Sole, appoggi il suo lembo sull\'orizzonte e leggi il numero sul lembo e sul tamburo.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quel numero è già l\'altezza vera del Sole?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:si', testo: RISPOSTE.si, on: p === 'si' },
          { t: 'scelta', id: 'p:no', testo: RISPOSTE.no, on: p === 'no' },
          { t: 'scelta', id: 'p:mare', testo: RISPOSTE.mare, on: p === 'mare' },
        ],
      },
      {
        passo: 2, mondo: mondoProva, azione: comandiProva, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'ali', nome: 'Alidada: un grado alla volta', valore: `${Math.floor(pr.dec / 600)}°` },
          { t: 'passo', id: 'tam', nome: 'Tamburo: un decimo di primo alla volta', valore: pr1((pr.dec - Math.floor(pr.dec / 600) * 600) / 10) },
          { t: 'cursore', id: 'drum', nome: 'Tamburo, più svelto', valore: '', f: (pr.dec - Math.floor(pr.dec / 600) * 600) / 599, passi: 599 },
          { t: 'disegno', h: 290, fn: disegnaLettura },
          { t: 'bottoni', h: 88, lista: [{ id: 'vetrini', testo: pr.vetrini ? 'Vetrini abbassati' : 'Vetrini colorati', on: pr.vetrini }, { id: 'leggi', testo: 'Leggi' }] },
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          { t: 'zona', id: 'lente', h: LH },
          { t: 'zona', id: 'finestra', h: 360, testo: !vr ? '' : Motore.scalaVera() ? 'Il sestante è nella mano sinistra. Levetta destra: di lato il tamburo, avanti e indietro un grado.' : 'Vai a grandezza vera: il sestante passa nella tua mano sinistra.' },
          ...bottoneScala(vr),
          { t: 'riquadro', size: 34, testo: istruzioni() },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Che cosa hai misurato' },
          ...(p ? [{ t: 'nota', testo: p === 'no' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          ...(ris ? [
            { t: 'tabella', col: [64, 36], size: 34, righe: [
              ['Grandezza', 'Valore'],
              ['Lettura: altezza istrumentale hᵢ', Cielo.ang(ris.hi)],
              ['Correzione d\'indice γ (misurata)', Cielo.primi(gam)],
              ['Altezza osservata hₒ = hᵢ + γ', Cielo.ang(ho)],
              ['Altezza vera hᵥ del centro del Sole', Cielo.ang(ris.hv)],
              ['Differenza hₒ − hᵥ', Cielo.primi(Math.round((ho - ris.hv) * 600) / 10)],
            ] },
            { t: 'nota', testo: `Sole del ${Cielo.giorno(ris.quando)} alle ${Cielo.ora(ris.quando).slice(0, 5)} UTC, ${ris.luogo || Cielo.luogo()}. Altezza vera calcolata con Astronomy Engine.` },
          ] : [{ t: 'p', testo: 'Non hai ancora letto l\'altezza del Sole: torna alla prova.' }]),
        ],
        dx: [
          { t: 'titolo', testo: 'No: la lettura va corretta' },
          { t: 'p', size: 40, testo: 'Il numero letto è l\'**altezza istrumentale** hᵢ (*sextant altitude*). Corretta per gli errori dello strumento diventa **altezza osservata** hₒ (*observed altitude*): hₒ = hᵢ + c + γ. {{p. 67, formula 4.2}}' },
          { t: 'p', size: 40, testo: 'Poi servono depressione dell\'orizzonte, rifrazione, semidiametro e parallasse: solo dopo si arriva all\'**altezza vera** hᵥ (*true altitude*). È la prossima esperienza. {{pp. 67–70}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'La correzione d\'indice' },
          { t: 'p', size: 40, testo: 'Gli specchi possono risultare paralleli a una lettura diversa da 0°. La differenza è la **correzione d\'indice** γ (*index error*), sommativa o sottrattiva, da applicare a ogni misura. {{p. 66}}' },
          { t: 'riquadro', size: 38, testo: 'Se il parallelismo si ha a 0°18,4′, a ogni altezza misurata bisogna sottrarre 18,4′. {{p. 66, fig. 4.11}}' },
          { t: 'p', size: 40, testo: `Il sestante della prova ha γ = −05,0′, come nell'esempio del libro${pr.gamma === undefined ? '' : `; tu hai misurato ${Cielo.primi(pr.gamma)}`}. {{p. 75}}` },
        ],
        dx: [
          { t: 'titolo', testo: 'La correzione istrumentale' },
          { t: 'p', size: 40, testo: 'La **correzione istrumentale** *c* (*non-adjustable sextant error*) dipende da difetti di costruzione: eccentricità dell\'alidada, graduazione del lembo non esatta, prismatismo degli specchi. {{p. 66}}' },
          { t: 'p', size: 40, testo: 'Nei sestanti moderni è ormai sempre nulla; se c\'è, si trova in un certificato incollato dentro la scatola dello strumento. {{pp. 66–67}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Dall\'altezza istrumentale all\'osservata' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Primo passo delle correzioni: hₒ = hᵢ + c + γ, con c nulla come nei sestanti moderni. Il resto è l\'esperienza 8.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
