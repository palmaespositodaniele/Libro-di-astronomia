/* Esperienza 11: il cerchio d'altezza. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica» vol. 2,
   cap. 8: circonferenza d'altezza e cono d'osservazione (p. 117, fig. 8.1), due circonferenze e la scelta del punto
   (p. 118), ampiezza della circonferenza e altezza (p. 119). Il libro non ha esercizi numerici su questo:
   solo domande. Regole in design.md */
(function () {
  const N = 11;
  const RAD = Math.PI / 180;

  const MISSIONI = [
    { id: 'uno', testo: 'Scegli una stella: guarda dove la sua altezza mette la nave sulla Terra.' },
    { id: 'due', testo: 'Aggiungi una seconda stella: due cerchi si tagliano in due punti.' },
    { id: 'quale', testo: 'Fra i due punti, scegli quello dove sei davvero.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'La circonferenza d\'altezza è il luogo degli osservatori che…', scelte: ['hanno la stessa latitudine', 'vedono lo stesso astro alla stessa altezza nello stesso istante', 'vedono l\'astro allo stesso azimut'], giusta: 1, perche: 'È il luogo di posizione di tutti gli osservatori che osservano la stessa altezza dello stesso astro nello stesso istante. {{p. 117}}' },
    { n: 2, testo: 'Il centro della circonferenza d\'altezza è…', scelte: ['il punto sub-astrale', 'il polo Nord', 'il punto stimato'], giusta: 0, perche: 'Il cono d\'osservazione taglia la superficie terrestre in una circonferenza che ha per centro il punto sub-astrale. {{p. 117}}' },
    { n: 3, testo: 'Il raggio sferico della circonferenza d\'altezza è…', scelte: ['l\'altezza dell\'astro', 'la declinazione', 'la distanza zenitale, 90° − h'], giusta: 2, perche: 'Sulla sfera celeste è la circonferenza dei punti zenitali, con centro l\'astro e raggio sferico pari alla distanza zenitale. {{p. 117}}' },
    { n: 4, testo: 'Due circonferenze d\'altezza si incontrano in due punti. Quale si sceglie?', scelte: ['Sempre quello più a Nord', 'Quello vicino al punto stimato: le circonferenze sono enormi, i due punti lontanissimi', 'Non si può scegliere: serve una terza stella'], giusta: 1, perche: 'Il dato è ambiguo come per i luoghi circolari costieri, ma per le enormi dimensioni delle circonferenze è sempre possibile scegliere il punto corretto. {{p. 118}}' },
    { n: 5, testo: 'Più l\'astro è alto, la sua circonferenza d\'altezza è…', scelte: ['più piccola', 'più grande', 'sempre uguale'], giusta: 0, perche: 'L\'ampiezza della circonferenza è inversamente proporzionale all\'altezza: il raggio è 90° − h. {{p. 119}}' },
    { n: 6, testo: 'Perché le circonferenze d\'altezza non si tracciano su un globo in plancia?', scelte: ['Perché non sono circonferenze', 'Per una precisione adeguata servirebbe un globo di circa 7 metri di diametro', 'Perché cambiano ogni secondo'], giusta: 1, perche: 'Lo dice il libro: per una precisione adeguata il globo dovrebbe avere un diametro di circa 7 metri. {{p. 117}}' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  /* Geometria sulla sfera: vettori unitari (x verso Greenwich all'equatore, z verso il polo Nord) -------------------- */
  const vet = (lat, lon) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const latLon = (v) => ({ lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, lon: Math.atan2(v[1], v[0]) / RAD });
  const dist = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(vet(a.lat, a.lon), vet(b.lat, b.lon))))) / RAD;
  // Le due intersezioni di due circonferenze (centro c, raggio sferico r in gradi)
  function incroci(c1, r1, c2, r2) {
    const u = vet(c1.lat, c1.lon); const w = vet(c2.lat, c2.lon); const q = dot(u, w);
    const k1 = Math.cos(r1 * RAD); const k2 = Math.cos(r2 * RAD);
    const a = (k1 - q * k2) / (1 - q * q); const b = (k2 - q * k1) / (1 - q * q);
    const n = cross(u, w); const nn = dot(n, n);
    const t2 = (1 - (a * a + b * b + 2 * a * b * q)) / nn;
    if (t2 < 0) return [];
    const t = Math.sqrt(t2);
    return [1, -1].map((s) => latLon([0, 1, 2].map((i) => a * u[i] + b * w[i] + s * t * n[i])));
  }

  /* Le stelle scelte e i loro cerchi ---------------------------------------------------------------------------- */
  const CANDIDATE = ['Polare', 'Vega', 'Arturo', 'Capella', 'Sirio', 'Altair', 'Deneb', 'Aldebaran', 'Betelgeuse', 'Rigel', 'Procyon', 'Regolo', 'Spica', 'Antares', 'Polluce', 'Fomalhaut', 'Canopo', 'Acrux', 'Achernar'];
  const pr = { scelte: [], esito: null, pronto: false, punti: [], scelto: null };
  const visibili = () => CANDIDATE.map((n) => ({ n, v: Cielo.vistoDallaNave(n) })).filter((x) => x.v.h > 12 && x.v.h < 80).sort((a, b) => b.v.h - a.v.h).slice(0, 6).map((x) => x.n);
  // Una stella adesso: punto sub-astrale (φ = δ, λ = −T) e raggio z = 90° − h
  function cerchioDi(nome) {
    const v = Cielo.vistoDallaNave(nome);
    let lon = -v.T; if (lon <= -180) lon += 360; if (lon > 180) lon -= 360;
    return { nome, h: v.h, z: 90 - v.h, sub: { lat: v.dec, lon } };
  }
  const COLORI = [0xB3362B, 0x2E7DB5];
  const segni = [];
  function disegna() {
    const m = globo();
    [m.terra, m.terraMini].forEach((t, i) => {
      if (segni[i]) { t.fisso.remove(segni[i]); segni[i].traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      const g = new THREE.Group(); segni[i] = g; t.fisso.add(g);
      pr.scelte.forEach((nome, k) => {
        const c = cerchioDi(nome);
        g.add(t.cerchio(c.sub.lat, c.sub.lon, c.z, COLORI[k], 1.8));
        g.add(t.punto(c.sub.lat, c.sub.lon, COLORI[k], 0.06));
        if (i === 0) { const e = t.etichetta(`${nome} allo zenit`, 0.9, k ? '#1F5F8B' : '#8E2A21'); e.position.copy(Globo.sullaTerra(c.sub.lat, c.sub.lon, t.R * 1.12)); g.add(e); }
      });
      pr.punti.forEach((p, k) => {
        g.add(t.punto(p.lat, p.lon, 0x0B2545, 0.05));
        if (i === 0) { const e = t.etichetta(k ? 'B' : 'A', 1.1, '#0B2545'); e.position.copy(Globo.sullaTerra(p.lat, p.lon, t.R * 1.1)); g.add(e); }
      });
    });
  }
  function ricalcola() {
    pr.punti = [];
    if (pr.scelte.length === 2) {
      const [a, b] = pr.scelte.map(cerchioDi);
      pr.punti = incroci(a.sub, a.z, b.sub, b.z);
    }
  }

  const globo = Scene.globo({});
  function mondo() {
    const m = globo();
    if (!pr.pronto) {
      pr.pronto = true;
      // Di notte, dal largo di Procida: il cielo si ferma
      const L = Cielo.LUOGHI.procida; Cielo.imposta({ lat: L.lat, lon: L.lon, luogo: 'procida', corre: false });
      if (Cielo.vistoDallaNave('Sole').h > -12) { const t = Cielo.istanteSole(-12, -1); if (t) Cielo.imposta({ data: t + 3600e3 }); }
      m.vistaIniziale = () => {
        // La Terra è girata del tempo siderale: la nave sta all'azimut λ + Tγ; la camera le si mette davanti
        const s = Cielo.stato; const L = s.lon + Cielo.tGamma(Cielo.tempo());
        return { target: new THREE.Vector3(0, 0, 0), theta: (90 + L) * RAD, phi: (90 - s.lat * 0.8) * RAD, r: 46 };
      };
      setTimeout(() => { disegna(); Motore.ridisegna(); }, 0);
    }
    return m;
  }
  Cielo.ascolta((cosa) => { if (pr.pronto && cosa && !cosa.tempo && pr.scelte.length) { ricalcola(); disegna(); } });

  function comandi(id) {
    if (id.startsWith('cerchio:')) {
      const nome = id.slice(8);
      if (pr.scelte.includes(nome)) pr.scelte = pr.scelte.filter((x) => x !== nome);
      else { pr.scelte.push(nome); if (pr.scelte.length > 2) pr.scelte.shift(); }
      pr.scelto = null; ricalcola(); disegna();
      const c = pr.scelte.length ? cerchioDi(pr.scelte[pr.scelte.length - 1]) : null;
      if (pr.scelte.length === 1) {
        lez.completa('uno');
        pr.esito = { tipo: 'giusto', testo: `${c.nome}: altezza ${Cielo.ang(c.h)}, quindi raggio z = 90° − h = ${Cielo.ang(c.z)}, cioè ${Math.round(c.z * 60)} miglia dal punto sub-astrale. La nave è da qualche parte su quel cerchio.` };
      } else if (pr.scelte.length === 2) {
        lez.completa('due');
        pr.esito = pr.punti.length ? { tipo: 'giusto', testo: `Due cerchi, due punti: A e B. Dove sei davvero? Il punto stimato dice circa ${Cielo.ang(Math.round(Cielo.stato.lat), { segno: 'NS' })}, ${Cielo.ang(Math.round(Cielo.stato.lon), { segno: 'EW', tre: true })}.` } : { tipo: 'errato', testo: 'I due cerchi non si toccano: prova un\'altra coppia.' };
      } else pr.esito = null;
    }
    if (id === 'punto:A' || id === 'punto:B') {
      const k = id === 'punto:A' ? 0 : 1; pr.scelto = k;
      const p = pr.punti[k]; const d = dist(p, Cielo.stato);
      if (d < 0.5) {
        lez.completa('quale');
        const o = pr.punti[1 - k];
        pr.esito = { tipo: 'giusto', testo: `Sì: ${Cielo.ang(p.lat, { segno: 'NS' })}, ${Cielo.ang(p.lon, { segno: 'EW', tre: true })}. L'altro punto è a ${Math.round(dist(p, o) * 60)} miglia: impossibile confonderli.` };
      } else pr.esito = { tipo: 'errato', testo: `No: quel punto è a ${Math.round(d * 60)} miglia dal punto stimato. Scegli quello vicino.` };
    }
    if (id === 'azzera') { pr.scelte = []; pr.punti = []; pr.scelto = null; pr.esito = null; disegna(); }
    Motore.sporco();
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  // Sei bottoni in una fila sono troppo stretti per i nomi lunghi: due file da tre
  const dueFile = (b) => { const m = Math.ceil(b.lista.length / 2); return b.lista.length > 4 ? [{ ...b, lista: b.lista.slice(0, m) }, { ...b, lista: b.lista.slice(m) }] : [b]; };
  const stelle = () => dueFile({ t: 'bottoni', h: 80, size: 30, lista: visibili().map((n) => ({ id: `cerchio:${n}`, testo: n === 'Procyon' ? 'Procione' : n, on: pr.scelte.includes(n) })) });
  function riquadro() {
    const righe = pr.scelte.map(cerchioDi).map((c) => `${c.nome === 'Procyon' ? 'Procione' : c.nome}: h ${Cielo.ang(c.h)}, raggio ${Cielo.ang(c.z)}, centro ${Cielo.ang(c.sub.lat, { segno: 'NS' })} ${Cielo.ang(c.sub.lon, { segno: 'EW', tre: true })}`);
    return { t: 'riquadro', size: 30, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · nave ${Cielo.luogo()}${righe.length ? ` · ${righe.join(' · ')}` : ''}` };
  }
  const RISPOSTE = { si: 'Sì, so dove sono', cerchio: 'No: so solo che sono su un cerchio', lat: 'So solo la latitudine' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Il cerchio d\'altezza' },
          { t: 'p', size: 38, testo: 'Ogni osservatore, in un certo istante, ha la sua sfera celeste: lo stesso cielo lo vede, in tempi diversi, chi sta sul suo stesso parallelo. Per questo ora e longitudine sono legate. {{p. 117}}' },
          { t: 'p', size: 38, testo: 'Come nel punto costiero, il punto nave è l\'incrocio di almeno due **luoghi di posizione**. In astronomia sono **circonferenze d\'altezza** (*position circle*). {{p. 117}}' },
          riquadro(),
        ],
        dx: [
          finestra(900, 'Sei nello spazio, davanti alla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          { t: 'nota', testo: 'Stelle calcolate dal catalogo BSC5, Terra orientata con il tempo siderale. Il pallino arancio è la nave.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco misurerai l\'altezza di una stella e vedrai cosa vuol dire sulla Terra.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Con una sola altezza sai dove sei?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo, azione: comandi, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Stelle alte sull\'orizzonte, adesso' },
          ...stelle(),
          ...(pr.punti.length ? [{ t: 'bottoni', h: 80, size: 32, lista: [{ id: 'punto:A', testo: 'Sono in A', on: pr.scelto === 0 }, { id: 'punto:B', testo: 'Sono in B', on: pr.scelto === 1 }, { id: 'azzera', testo: 'Ricomincia' }] }] : []),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(840, 'Guarda i cerchi sulla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          riquadro(),
        ],
      },
      {
        passo: 3, mondo, azione: comandi, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Dalla sfera celeste alla Terra' },
          ...(p ? [{ t: 'nota', testo: p === 'cerchio' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 36, testo: 'L\'altezza misurata disegna sulla sfera celeste una circonferenza minore con centro l\'astro e raggio sferico pari alla **distanza zenitale**: è il luogo degli zenit di tutti gli osservatori che vedono l\'astro a quell\'altezza. {{p. 117}}' },
          { t: 'p', size: 36, testo: 'Unendo quei punti al centro della Terra si ha il **cono d\'osservazione**: taglia la superficie terrestre nella circonferenza d\'altezza, con centro il **punto sub-astrale**. {{p. 117, fig. 8.1}}' },
          { t: 'formula', testo: 'raggio = z = 90° − h' },
        ],
        dx: [
          finestra(700, 'Guarda i cerchi sulla Terra.', 'Vai a grandezza vera.'),
          ...scala(),
          { t: 'p', size: 34, testo: 'Più l\'astro è alto, più il cerchio è piccolo: l\'ampiezza della circonferenza è inversamente proporzionale all\'altezza. {{p. 119}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Due cerchi, due punti' },
          { t: 'p', size: 36, testo: 'Con due astri si hanno due circonferenze che si incontrano in due punti. Il dato è ambiguo, come per i luoghi circolari costieri; ma le circonferenze sono così grandi che il punto giusto si sceglie sempre. {{p. 118}}' },
          { t: 'p', size: 36, testo: 'Tracciarle su un globo? Per una precisione adeguata servirebbe un globo di circa 7 metri di diametro: impossibile in plancia. {{p. 117}}' },
        ],
        dx: [
          { t: 'p', size: 36, testo: 'Così, vicino al **punto stimato**, la circonferenza d\'altezza si confonde con un circolo massimo e poi con un arco di lossodromia: sulla carta di Mercatore, una **retta**. È la **retta d\'altezza** (*position line*): l\'esperienza 12. {{p. 118}}' },
          { t: 'nota', testo: 'Il libro ricorda i metodi di Borda, Johnson e Sumner; il più usato è quello di Marcq Saint-Hilaire (p. 118).' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sul § 8.1 del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
