/* Esperienza 4: il cammino del Sole. Contenuti da «Fondamenti di Navigazione e Meteorologia nautica»
   vol. 2, cap. 1, § 1.6: eclittica e stagioni (pp. 27–29), amplitudine (pp. 30–31); esercizi 3 e 4 a p. 39,
   senza risultati nel libro: le soluzioni si calcolano con la formula 1.9. Regole in design.md */
(function () {
  const N = 4;
  const RAD = Math.PI / 180;
  const G = (g, p) => g + p / 60;

  const MISSIONI = [
    { id: 'zenit', testo: 'All\'equatore, trova un giorno in cui il Sole a mezzogiorno è allo zenit.' },
    { id: 'solstizio', testo: 'A Procida, trova il giorno in cui il Sole a mezzogiorno sale più in alto.' },
    { id: 'mezzanotte', testo: 'Oltre il Circolo polare, fai vedere il Sole a mezzanotte.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Nel suo moto apparente annuale il Sole percorre la sfera celeste con una velocità di circa…', scelte: ['1° al giorno', '15° all\'ora', '1° all\'ora'], giusta: 0, perche: 'Un giro, 360°, in un anno di 365 giorni: circa 1° al giorno, in senso diretto (antiorario). {{p. 27}}' },
    { n: 2, testo: 'L\'eclittica è…', scelte: ['il parallelo di declinazione del Sole', 'il circolo massimo dove il piano dell\'orbita terrestre taglia la sfera celeste', 'l\'orizzonte dell\'osservatore al polo'], giusta: 1, perche: 'È la traccia delle posizioni del Sole durante l\'anno, inclinata sull\'equatore celeste di circa 23°27′. {{p. 27}}' },
    { n: 3, testo: 'Nei punti equinoziali il Sole…', scelte: ['ha declinazione nulla e cambia emisfero', 'ha la declinazione massima', 'è sempre allo zenit di Procida'], giusta: 0, perche: 'Sono i nodi, le intersezioni dell\'eclittica con l\'equatore celeste; nei punti solstiziali la declinazione è massima. {{p. 28}}' },
    { n: 4, testo: 'Al solstizio estivo il Sole culmina allo zenit per chi si trova…', scelte: ['all\'equatore', 'a 23°27′N, sul tropico del Cancro', 'a 66°33′N, sul Circolo polare artico'], giusta: 1, perche: 'Agli equinozi culmina allo zenit all\'equatore; al solstizio estivo sul tropico del Cancro; al solstizio invernale sul tropico del Capricorno. {{pp. 28–29}}' },
    { n: 5, testo: 'Il Circolo polare artico ha latitudine 66°33′N perché…', scelte: ['è il doppio di 33°16′', 'è dove l\'eclittica taglia l\'equatore', 'è il complemento di 23°27′'], giusta: 2, perche: 'I circoli polari stanno a 90° − 23°27′ = 66°33′: oltre, nei giorni vicini al solstizio, il Sole diventa circumpolare. {{p. 29}}' },
    { n: 6, testo: 'Un astro con declinazione Nord…', scelte: ['sorge fra E e S e tramonta fra W e S', 'sorge sempre esattamente a Est', 'sorge fra E e N e tramonta fra W e N'], giusta: 2, perche: 'L\'amplitudine ortiva si conta dall\'E, l\'occasa dal W, verso il nome della declinazione. {{p. 31}}' },
  ];

  /* Esercizi 3 e 4 di p. 39: azimut al sorgere e al tramonto con la formula 1.9 ------------------------- */
  const ES = [
    { lat: G(22, 14.7), dec: [[45, 58.0, 1], [28, 38.8, -1], [5, 19.1, 1], [18, 45.8, -1], [56, 29.7, 1]], rif: 'p. 39, es. 3' },
    { lat: -G(63, 8.3), dec: [[15, 55.0, 1], [22, 21.3, -1], [6, 12.1, -1], [18, 5.8, 1], [10, 22.7, -1]], rif: 'p. 39, es. 4' },
  ];
  const uno = (x) => x.toFixed(1).replace('.', ',');
  const quattro = (x) => x.toFixed(4).replace('.', ',');
  // Amplitudine (gradi, positiva) e azimut di sorgere e tramonto
  function amplitudine(lat, dec) {
    const s = Math.sin(Math.abs(dec) * RAD) / Math.cos(lat * RAD);
    const a = Math.asin(Math.min(1, s)) / RAD;
    const nord = dec >= 0;
    return { s, a, sorge: nord ? 90 - a : 90 + a, tramonta: nord ? 270 + a : 270 - a, suf: nord ? 'N' : 'S' };
  }
  const CALCOLI = [];
  ES.forEach((e, k) => e.dec.forEach(([g, p, segno], i) => {
    const dec = segno * G(g, p); const r = amplitudine(e.lat, dec);
    const zs = Math.round(r.sorge * 10) / 10; const zt = Math.round(r.tramonta * 10) / 10;
    CALCOLI.push({
      n: 7 + k * 5 + i,
      testo: `Osservatore a φ = ${Cielo.ang(e.lat, { segno: 'NS' })}, astro con δ = ${Cielo.ang(dec, { segno: 'NS' })}. Calcola l'azimut al sorgere e al tramonto. {{${e.rif}}}`,
      campi: [['sorge', zs, 0.15, '°'], ['tramonta', zt, 0.15, '°']],
      soluzione: `sin ampl = sin δ / cos φ = ${quattro(r.s)}, ampl = ${uno(r.a)}°: sorge a E${uno(r.a)}°${r.suf}, azimut ${uno(zs)}°; tramonta a W${uno(r.a)}°${r.suf}, azimut ${uno(zt)}°.`,
    });
  }));
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* I luoghi della prova: tutti sullo stesso meridiano di Procida ------------------------------------ */
  const LP = Cielo.LUOGHI.procida.lon;
  const POSTI = [
    { id: 'equatore', testo: 'Equatore', lat: 0, lon: LP },
    { id: 'procida', testo: 'Procida', lat: Cielo.LUOGHI.procida.lat, lon: LP },
    { id: 'circolo', testo: 'Circolo polare', lat: G(66, 33), lon: LP },
    { id: 'polo', testo: 'Polo Nord', lat: 89.99, lon: LP },
  ];
  const postoAttuale = () => POSTI.find((x) => Math.abs(x.lat - Cielo.stato.lat) < 1e-6);

  // Il Sole del giorno: declinazione e altezze alle due culminazioni (dal centro della Terra)
  function soleDelGiorno() {
    const c = Cielo.corpo('Sole'); const f = Cielo.stato.lat;
    return { dec: c.dec, alto: 90 - Math.abs(f - c.dec), basso: Math.abs(f + c.dec) - 90 };
  }
  // Porta l'ora al mezzogiorno vero (angolo orario 0) o alla mezzanotte (12h) dello stesso giorno civile
  function culmina(quale) {
    const s = Cielo.stato; const oss = new Astronomy.Observer(s.lat, s.lon, 0);
    const d = new Date(s.data); d.setUTCHours(0, 0, 0, 0);
    const da = d.getTime() - (quale === 'mezzanotte' ? -6 : 6) * 3600e3;
    const ev = Astronomy.SearchHourAngle('Sun', oss, quale === 'mezzanotte' ? 12 : 0, new Date(da));
    return ev ? ev.time.date.getTime() : s.data;
  }
  function stagioni(anno) {
    const s = Astronomy.Seasons(anno);
    return [
      { id: 'mar', testo: '21 marzo', nome: 'Equinozio primaverile', t: s.mar_equinox.date.getTime() },
      { id: 'giu', testo: '21 giugno', nome: 'Solstizio estivo', t: s.jun_solstice.date.getTime() },
      { id: 'set', testo: '23 settembre', nome: 'Equinozio autunnale', t: s.sep_equinox.date.getTime() },
      { id: 'dic', testo: '22 dicembre', nome: 'Solstizio invernale', t: s.dec_solstice.date.getTime() },
    ];
  }
  const anno = () => new Date(Cielo.stato.data).getUTCFullYear();

  /* Il parallelo del Sole: dove lo porterà il moto diurno oggi (in oro), e i tropici ------------------ */
  function parallelo(R, dec, r, col) {
    const p = []; const z = Math.sin(dec * RAD) * R; const q = Math.cos(dec * RAD) * R;
    for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2; p.push(new THREE.Vector3(q * Math.cos(a), q * Math.sin(a), z)); }
    return Tavola.tratto(p, r, col, true);
  }
  // Un disegnatore per ogni volta (ponte, sfera, modellini): rifà il parallelo quando la declinazione cambia
  const disegnatori = [];
  function aggancia(v, r, tropici) {
    const d = { v, r, linea: null, dec: null };
    if (tropici) [23.44, -23.44].forEach((x) => v.eq.add(parallelo(v.R * 0.995, x, r * 0.5, 0x5B6B7C)));
    disegnatori.push(d); rifaiParallelo(d);
  }
  function rifaiParallelo(d) {
    const dec = Cielo.corpo('Sole').dec;
    if (d.dec !== null && Math.abs(dec - d.dec) < 0.02) return;
    if (d.linea) { d.v.eq.remove(d.linea); d.linea.geometry.dispose(); }
    d.dec = dec; d.linea = parallelo(d.v.R * 0.99, dec, d.r, 0xE3B23C); d.v.eq.add(d.linea);
  }
  Cielo.ascolta((cosa) => { if (cosa && !cosa.tempo) disegnatori.forEach(rifaiParallelo); });

  /* La prova: il ponte, a mezzogiorno o a mezzanotte, giorno dopo giorno ---------------------------- */
  const pr = { esito: null, quando: 'mezzodi', pronto: false };
  const ponte = Scene.ponte({
    guarda: 180, phi: 1.05,
    extra: (radice, v) => aggancia(v, 2.2, false),
    frame: () => { if (Cielo.stato.corre) disegnatori.forEach(rifaiParallelo); return false; },
  });
  function mondoProva() {
    const m = ponte();
    if (!pr.pronto) {
      pr.pronto = true;
      aggancia(m.sferaMini.v, 0.06, true);
      // Si parte da Procida, oggi, a mezzogiorno vero
      const p = POSTI[1]; Cielo.imposta({ lat: p.lat, lon: p.lon, luogo: 'procida', corre: false });
      Cielo.imposta({ data: culmina('mezzodi') });
      setTimeout(() => Motore.ridisegna(), 0);
      m.vistaIniziale = () => {
        const v = Cielo.vistoDallaNave('Sole');
        return { target: new THREE.Vector3(0, Scene.OCCHIO, 0), theta: v.a * RAD, phi: Math.min(1.5, Math.max(0.3, (80 - Math.max(v.h, 0)) * RAD)), r: 60 };
      };
    }
    return m;
  }
  function controlla() {
    const s = soleDelGiorno(); const posto = postoAttuale();
    if (!posto) return;
    if (pr.quando === 'mezzodi' && posto.id === 'equatore' && s.alto > 89.6) {
      lez.completa('zenit');
      pr.esito = { tipo: 'giusto', testo: `Sole allo zenit: altezza a mezzogiorno ${Cielo.ang(s.alto)}, declinazione ${Cielo.ang(s.dec, { segno: 'NS' })}. Siamo vicini a un equinozio.` };
    } else if (pr.quando === 'mezzodi' && posto.id === 'procida' && s.dec > 23.35) {
      lez.completa('solstizio');
      pr.esito = { tipo: 'giusto', testo: `Il Sole più alto dell'anno: ${Cielo.ang(s.alto)} = 90° − φ + δ, con δ = ${Cielo.ang(s.dec, { segno: 'NS' })}. È il solstizio estivo.` };
    } else if (pr.quando === 'mezzanotte' && Cielo.stato.lat > 66 && s.basso > -0.27) {
      lez.completa('mezzanotte');
      const somma = Cielo.ang(Math.abs(Cielo.stato.lat) + Math.abs(s.dec));
      pr.esito = { tipo: 'giusto', testo: s.basso >= 0
        ? `Mezzanotte e il Sole è ancora lì: altezza ${Cielo.ang(s.basso)}. φ + δ = ${somma}, più di 90°: il Sole è circumpolare.`
        : `Mezzanotte: φ + δ = ${somma}, appena meno di 90°. Il centro del Sole sfiora l'orizzonte (${Cielo.ang(s.basso)}), il suo lembo superiore resta sopra. Più a Nord non tramonta affatto.` };
    } else pr.esito = null;
  }
  function comandiProva(id, sullaSfera) {
    const s = Cielo.stato;
    const posto = POSTI.find((x) => `posto:${x.id}` === id);
    if (posto) Cielo.imposta({ lat: posto.lat, lon: posto.lon, luogo: posto.id === 'procida' || posto.id === 'equatore' ? posto.id : '' });
    const st = stagioni(anno()).find((x) => `st:${x.id}` === id);
    if (st) Cielo.imposta({ data: st.t });
    if (id === 'giorno-' || id === 'giorno+') Cielo.imposta({ data: s.data + (id === 'giorno+' ? 1 : -1) * 864e5 });
    if (id === 'dieci-' || id === 'dieci+') Cielo.imposta({ data: s.data + (id === 'dieci+' ? 10 : -10) * 864e5 });
    if (id === 'ora:mezzodi' || id === 'ora:mezzanotte') pr.quando = id.slice(4);
    if (id === 'gira') { pr.quando = null; Cielo.imposta({ corre: !s.corre, velocita: 1800 }); } else if (pr.quando && (posto || st || id.startsWith('giorno') || id.startsWith('dieci') || id.startsWith('ora:'))) {
      Cielo.imposta({ corre: false });
      Cielo.imposta({ data: culmina(pr.quando) });
      // Sul ponte lo sguardo va al Sole del nuovo giorno
      if (!sullaSfera && !vr()) Motore.vista(ponte().vistaIniziale());
    }
    controlla();
    Motore.sporco();
  }

  /* Lo Scopri: la sfera armillare col parallelo del Sole e i tropici -------------------------------- */
  const sferaBase = Scene.sfera({});
  let sferaPronta = false;
  function mondoSfera() {
    const m = sferaBase();
    if (!sferaPronta) {
      sferaPronta = true;
      aggancia(m.sfera.v, 0.11, true); aggancia(m.sferaMini.v, 0.11, true);
      m.sfera.CERCHI.eclittica.visible = true;
      setTimeout(() => { m.sfera.ricostruisci('Sole', 'nessuno'); m.sferaMini.ricostruisci('Sole', 'nessuno'); Motore.ridisegna(); }, 0);
    }
    return m;
  }
  function comandiSfera(id) {
    comandiProva(id, true);
    const m = sferaBase(); m.sfera.v.aggiorna(true); m.sferaMini.v.aggiorna(true);
    m.sfera.ricostruisci('Sole', 'nessuno'); m.sferaMini.ricostruisci('Sole', 'nessuno');
  }
  function tabellaStagioni() {
    const f = Cielo.stato.lat;
    return [['Evento (data del libro)', 'Quest\'anno', 'δ☉', 'Sole a mezzogiorno'], ...stagioni(anno()).map((x) => {
      const dec = Cielo.corpo('Sole', Cielo.tempo(x.t)).dec;
      return [`${x.nome} (${x.testo})`, Cielo.giorno(x.t), Cielo.ang(dec, { segno: 'NS' }), Cielo.ang(90 - Math.abs(f - dec))];
    })];
  }
  function tabellaAmpl() {
    const f = Cielo.stato.lat;
    if (Math.abs(f) > 66) return [];
    return [['Oggi qui', 'δ☉', 'Amplitudine', 'Sorge / tramonta'], (() => {
      const dec = Cielo.corpo('Sole').dec; const r = amplitudine(f, dec);
      return [Cielo.giorno(), Cielo.ang(dec, { segno: 'NS' }), `E/W ${uno(r.a)}°${r.suf}`, `${uno(r.sorge)}° / ${uno(r.tramonta)}°`];
    })()];
  }

  /* Le pagine ---------------------------------------------------------------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const finestra = (h, vero, mini) => ({ t: 'zona', id: 'finestra', h, testo: !vr() ? '' : Motore.scalaVera() ? vero : mini });
  const posti = () => ({ t: 'bottoni', h: 80, size: 32, lista: POSTI.map((x) => ({ id: `posto:${x.id}`, testo: x.testo, on: postoAttuale() === x })) });
  const date = () => ({ t: 'bottoni', h: 80, size: 30, lista: stagioni(anno()).map((x) => ({ id: `st:${x.id}`, testo: x.testo })) });
  const quando = () => ({ t: 'bottoni', h: 80, size: 32, lista: [{ id: 'ora:mezzodi', testo: 'A mezzogiorno', on: pr.quando === 'mezzodi' }, { id: 'ora:mezzanotte', testo: 'A mezzanotte', on: pr.quando === 'mezzanotte' }, { id: 'gira', testo: Cielo.stato.corre ? 'Ferma' : 'Fai girare', on: Cielo.stato.corre }] });
  function riquadro() {
    const s = soleDelGiorno(); const v = Cielo.vistoDallaNave('Sole');
    return { t: 'riquadro', size: 32, testo: `${Cielo.giorno()} ore ${Cielo.ora().slice(0, 5)} UTC · φ ${Cielo.ang(Cielo.stato.lat, { segno: 'NS' })} · δ☉ ${Cielo.ang(s.dec, { segno: 'NS' })} · Sole ora a ${Cielo.ang(v.h)} · a mezzogiorno ${Cielo.ang(s.alto)} · a mezzanotte ${Cielo.ang(s.basso)}` };
  }
  const RISPOSTE = { sempre: 'Sì, ogni giorno', equinozi: 'Solo in due giorni dell\'anno', mai: 'Mai: allo zenit c\'è solo ai poli' };

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    return [
      {
        passo: 0, mondo: mondoProva, azione: comandiProva,
        sx: [
          { t: 'titolo', testo: 'Il cammino del Sole' },
          { t: 'p', size: 38, testo: 'Oltre al moto diurno, il Sole fa un giro completo della sfera celeste in un anno: circa **1° al giorno**, in senso diretto. {{p. 27}}' },
          { t: 'p', size: 38, testo: 'Il suo percorso è l\'**eclittica** (*ecliptic*): un circolo massimo inclinato sull\'equatore celeste di circa **23°27′**, la stessa inclinazione dell\'asse terrestre che fa le stagioni. {{p. 27}}' },
          { t: 'p', size: 38, testo: 'Ogni giorno il moto diurno porta il Sole lungo il suo parallelo di declinazione: in oro nel cielo. {{p. 28, fig. 1.29}}' },
          riquadro(),
        ],
        dx: [
          finestra(900, 'Sei in controplancia a mezzogiorno. Guarda il Sole.', 'Vai a grandezza vera per stare sul ponte.'),
          ...scala(),
          { t: 'nota', testo: 'Posizioni del Sole calcolate con Astronomy Engine. Il parallelo in oro è quello di oggi.' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Fra poco farai scorrere i giorni, all\'equatore, a Procida, al Circolo polare e al Polo.' },
        ],
        dx: [
          { t: 'sotto', testo: 'All\'equatore il Sole a mezzogiorno è sempre allo zenit?' },
          { t: 'spazio', h: 20 },
          ...Object.keys(RISPOSTE).map((k) => ({ t: 'scelta', id: `p:${k}`, testo: RISPOSTE[k], on: p === k })),
        ],
      },
      {
        passo: 2, mondo: mondoProva, azione: comandiProva, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente stella.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          posti(),
          { t: 'passo', id: 'giorno', nome: 'Giorno', valore: Cielo.giorno() },
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'dieci-', testo: '−10 giorni' }, { id: 'dieci+', testo: '+10 giorni' }] },
          date(),
          quando(),
          ...(pr.esito ? [{ t: 'esito', ...pr.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          finestra(840, 'Guarda il Sole e il suo parallelo, in oro.', 'Vai a grandezza vera: il Sole è sopra di te.'),
          ...scala(),
          riquadro(),
        ],
      },
      {
        passo: 3, mondo: mondoSfera, azione: comandiSfera, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Equinozi e solstizi' },
          ...(p ? [{ t: 'nota', testo: p === 'equinozi' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', size: 36, testo: 'L\'eclittica taglia l\'equatore nei **punti equinoziali** (nodi): lì il Sole ha δ = 0 e cambia emisfero. Nei **punti solstiziali** ha la declinazione massima, 23°27′N o S. {{p. 28}}' },
          { t: 'p', size: 36, testo: 'Agli equinozi il Sole culmina allo zenit per chi sta all\'equatore; al solstizio estivo per chi sta a 23°27′N. {{p. 28}}' },
          { t: 'tabella', col: [38, 20, 20, 22], size: 28, righe: tabellaStagioni() },
          { t: 'nota', testo: `Date del libro, tab. 1.6 a p. 28: sono indicative. Istanti e δ calcolati; altezza a mezzogiorno a φ ${Cielo.ang(Cielo.stato.lat, { segno: 'NS' })}.` },
        ],
        dx: [
          finestra(620, 'Sei al centro della sfera.', 'Punta la sfera e tieni premuto il grilletto per girarla.'),
          ...scala(),
          posti(),
          date(),
          { t: 'nota', testo: 'In oro il parallelo del Sole, in grigio i due tropici, in arancio l\'eclittica.' },
        ],
      },
      {
        passo: 3, mondo: mondoSfera, azione: comandiSfera, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [
          { t: 'titolo', testo: 'Tropici, circoli polari, amplitudine' },
          { t: 'p', size: 34, testo: 'Così la Terra si divide in zona torrida, temperate e calotte: **tropici** del Cancro e del Capricorno a 23°27′N e S, **circoli polari** a 66°33′N e S, complemento di 23°27′. {{p. 29}}' },
          { t: 'p', size: 34, testo: 'Un astro con δ Nord sorge fra E e N e tramonta fra W e N; con δ Sud, fra E e S e fra W e S. L\'arco dall\'E al punto dove sorge è l\'**amplitudine ortiva**; dal W al punto dove tramonta, l\'**occasa**. {{p. 31}}' },
          { t: 'formula', testo: 'sin ampl = sin δ / cos φ' },
          { t: 'nota', testo: 'Formula 1.9 a p. 31: prefisso E o W, suffisso il nome di δ.' },
        ],
        dx: [
          { t: 'tabella', col: [34, 33, 33], size: 30, righe: [['Esempio del libro', 'Amplitudine', 'Azimut'], ['φ 52°54,4′N, δ 08°12,0′S, al sorgere', 'E13,7°S', '103,7°'], ['φ 14°22,1′S, δ 35°45,5′S, al tramonto', 'W37,1°S', '232,9°']] },
          { t: 'nota', testo: 'Esempi svolti a p. 31.' },
          ...(tabellaAmpl().length ? [{ t: 'tabella', col: [25, 25, 25, 25], size: 30, righe: tabellaAmpl() }] : [{ t: 'p', size: 34, testo: 'Oltre i circoli polari, vicino ai solstizi, il Sole non sorge o non tramonta: l\'amplitudine non c\'è.' }]),
          finestra(380, 'Sei al centro della sfera.', 'Punta la sfera e tieni premuto il grilletto per girarla.'),
          ...scala(),
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni del libro. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente stella.',
        sx: [{ t: 'titolo', testo: 'Sorgere e tramonto' }, ...lez.calcoloSx(), { t: 'nota', testo: 'Formula 1.9. Azimut in gradi, tolleranza ±0,1°.' }],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ.map((q) => q.n), ...CALCOLI.map((q) => q.n)])),
    ];
  });
})();
