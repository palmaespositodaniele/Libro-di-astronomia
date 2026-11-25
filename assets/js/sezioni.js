/* Copertina, indice, collezione di stelle e planetario: tutto dentro il libro, anche in VR */
(function () {
  const { CAPITOLI, LEZIONI, PRONTE, stato } = Libro;
  const RAD = Math.PI / 180;

  function disegnaCopertina(c, W, H) {
    c.fillStyle = '#0B2545'; c.fillRect(0, 0, W, H);
    // Un cielo di stelle vere: le più luminose del catalogo, in 360° − α e declinazione
    STELLE.stelle.forEach((s) => {
      if (s[3] > 4.2) return;
      const x = 66 + ((360 - s[1]) / 360) * (W - 132); const y = H / 2 - (s[2] / 90) * (H / 2 - 66);
      c.fillStyle = `rgba(238,242,248,${Math.min(1, 1.1 - s[3] * 0.18)})`;
      c.beginPath(); c.arc(x, y, Math.max(1.5, 4.5 - s[3]), 0, Math.PI * 2); c.fill();
    });
    c.strokeStyle = '#C9A227'; c.lineWidth = 7; c.strokeRect(46, 46, W - 92, H - 92);
    c.lineWidth = 2; c.strokeRect(66, 66, W - 132, H - 132);
    c.fillStyle = 'rgba(11,37,69,0.82)'; c.fillRect(120, 170, W - 240, 330);
    c.fillStyle = '#E3C878'; c.textAlign = 'center';
    c.font = '700 120px Bitter, Georgia, serif'; c.fillText('Astronomia', W / 2, 300);
    c.font = '700 96px Bitter, Georgia, serif'; c.fillText('nautica', W / 2, 410);
    c.font = '60px Disegno, cursive'; c.fillText('il cielo dal ponte', W / 2, 480);
    c.drawImage(Stemma.img, W / 2 - 280, 620, 560, 560);
    c.font = '40px Atkinson, sans-serif'; c.fillStyle = '#E3C878'; c.fillText('a cura del prof. Daniele Palma Esposito', W / 2, 1270);
    c.font = '700 44px Atkinson, sans-serif'; c.fillStyle = '#EEF2F8'; c.fillText('Tocca per aprire', W / 2, 1400);
    c.textAlign = 'left';
  }

  Motore.sezione('copertina', {
    spreads: () => [
      { chiuso: true, dx: [{ t: 'fondo', fn: disegnaCopertina, id: 'sez:indice:0' }] },
    ],
  });

  const capitolo = (cap) => [
    { t: 'sotto', testo: `${cap.n}. ${cap.titolo}` },
    ...cap.lezioni.map((n) => ({
      t: 'voce', n, id: `sez:${n}:0`, pronta: PRONTE.includes(n), fatta: stato(n).bandiera,
      testo: PRONTE.includes(n) ? LEZIONI[n] : `${LEZIONI[n]} (in preparazione)`,
    })),
    { t: 'spazio', h: 14 },
  ];

  // Firma in fondo alla pagina destra dell'indice, allineata al margine destro (pagina 1200 × 1640)
  function firma(c) {
    const D = 1110;
    c.strokeStyle = Pagina.C.ink2; c.lineWidth = 2; c.beginPath(); c.moveTo(D - 470, 1392); c.lineTo(D, 1392); c.stroke();
    c.textAlign = 'right'; c.fillStyle = Pagina.C.ink2;
    c.font = '32px Atkinson, sans-serif'; c.fillText('Libro 3D a cura del', D, 1438);
    c.fillStyle = Pagina.C.ink; c.font = '700 38px Atkinson, sans-serif'; c.fillText('prof. Daniele Palma Esposito', D, 1484);
    c.textAlign = 'left';
  }

  Motore.sezione('indice', {
    spreads: () => [{
      sx: [
        { t: 'titolo', testo: 'Indice' },
        ...CAPITOLI.slice(0, 3).flatMap(capitolo),
        { t: 'bottoni', h: 96, lista: [{ id: 'sez:cielo:0', testo: 'Il cielo dal ponte' }, { id: 'sez:cielo:1', testo: 'La sfera celeste' }] },
      ],
      dx: [
        ...CAPITOLI.slice(3).flatMap(capitolo),
        { t: 'sotto', testo: 'Finale' },
        Libro.GUARDIA
          ? { t: 'voce', n: '★', id: 'sez:guardia:0', pronta: true, fatta: stato('guardia').fatta, testo: 'Guardia notturna' }
          : { t: 'voce', n: '★', pronta: false, testo: 'Guardia notturna (in preparazione)' },
        { t: 'spazio', h: 14 },
        { t: 'bottoni', h: 96, lista: [{ id: 'sez:stelle:0', testo: 'Le tue stelle' }, { id: 'sez:crediti:0', testo: 'Fonti e crediti' }] },
        { t: 'disegno', h: 0, fn: firma },
      ],
    }],
  });

  /* Fonti e crediti */
  Motore.sezione('crediti', {
    spreads: () => [{
      sx: [
        { t: 'titolo', testo: 'Fonti e crediti' },
        { t: 'sotto', testo: 'A cura di' },
        { t: 'p', size: 44, testo: '**prof. Daniele Palma Esposito**' },
        { t: 'p', size: 34, testo: 'Tutta l\'esperienza del libro 3D «Astronomia nautica» è a cura del prof. Daniele Palma Esposito: idea, testi, esperienze, esercizi e verifiche. Suoi anche i modelli 3D del sestante e della bussola nella sospensione cardanica.' },
        { t: 'sotto', testo: 'Le fonti' },
        { t: 'p', size: 34, testo: '**Libro di testo**: R. Antola, *Fondamenti di Navigazione e Meteorologia nautica*, vol. 2, Simone, 2016; dal vol. 1 la deviazione della bussola. I rimandi come «p. 97» sono le pagine stampate del vol. 2.' },
        { t: 'p', size: 34, testo: '**Testo di confronto**: A. Vecchia Formisano, *Captain\'s Handbook*, 2ª ed., cap. 5, «Navigazione astronomica – calcolo dell\'errore giro». Definizioni, formule e procedure sono state controllate anche qui.' },
      ],
      dx: [
        { t: 'sotto', testo: 'Dati e tavole' },
        { t: 'p', size: 34, testo: '**Effemeridi nautiche** e **Tavole nautiche** dell\'Istituto Idrografico della Marina: correzioni delle altezze, Polare, amplitudine.' },
        { t: 'p', size: 34, testo: 'Il cielo è calcolato con **Astronomy Engine** di D. Cross (licenza MIT) e con il **Bright Star Catalogue**, 5ª ed., Yale.' },
        { t: 'sotto', testo: 'Le regole del libro' },
        { t: 'p', size: 34, testo: 'Niente dati, formule o esercizi inventati: i testi riassumono il libro di testo e citano la pagina. Quando il libro non dà il risultato, lo calcola il libro 3D e la pagina lo dice, con la tolleranza.' },
      ],
    }],
  });

  let conferma = false;
  Motore.sezione('stelle', {
    spreads: () => {
      const numeri = Object.keys(Libro.PREMI).map(Number);
      const quante = numeri.filter((n) => stato(n).bandiera).length;
      return [{
        sx: [
          { t: 'titolo', testo: 'Le tue stelle' },
          { t: 'p', testo: 'Ogni esperienza completata accende una stella di navigazione sulla tua carta del cielo. Alla fine avrai la tua costellazione.' },
          { t: 'nota', testo: `${quante} ${quante === 1 ? 'stella' : 'stelle'} su ${numeri.length}` },
          { t: 'disegno', h: 560, fn: (c, x, y, w, h) => Libro.carta(c, x, y, w, h) },
          { t: 'nota', testo: 'In orizzontale 360° − α, in verticale la declinazione, come nelle effemeridi.' },
          { t: 'bottoni', lista: [{ id: 'azzera', testo: conferma ? 'Conferma: cancella tutto' : 'Azzera i miei progressi' }] },
        ],
        dx: [{
          t: 'griglia', col: 4, h: 230,
          celle: numeri.map((n) => ({
            fn(c, x, y, w, h) {
              Libro.bandiera(c, n, x, y, w, h - 50, stato(n).bandiera);
              c.font = '36px Disegno, cursive'; c.fillStyle = Pagina.C.ink2; c.textAlign = 'center';
              c.fillText(`esp. ${n}`, x + w / 2, y + h - 10); c.textAlign = 'left';
            },
          })),
        }],
        azione(id) {
          if (id !== 'azzera') return;
          if (conferma) { Libro.azzera(); location.reload(); } else conferma = true;
        },
      }];
    },
  });

  /* Planetario: il cielo condiviso, dal ponte e sulla sfera armillare ---------------------------- */
  const vr = () => Motore.presente();
  const scala = () => (vr() ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  let puntato = null; let nomi = false;
  const ponte = Scene.ponte({ guarda: 180, phi: 1.1 });
  const mondoPonte = () => { const m = ponte(); m.puntato = (n) => { puntato = n; Motore.ridisegna(); }; return m; };

  function descrivi(nome) {
    if (!nome) return 'Punta una stella con nome: qui compaiono le sue coordinate.';
    const v = Cielo.vistoDallaNave(nome);
    return `**${nome}**: T ${Cielo.ang(v.T)}, Dec. ${Cielo.ang(v.dec, { segno: 'NS' })}. Altezza vera ${Cielo.ang(v.h)}, azimut ${Cielo.ang(v.a, { tre: true })}.`;
  }
  function statoCielo() {
    const s = Cielo.stato; const sole = Cielo.vistoDallaNave('Sole');
    return `${Cielo.luogo()} · ${Cielo.giorno()} ore ${Cielo.ora()} UTC · Sole a ${Cielo.ang(sole.h)}`;
  }
  const VEL = [['ferma', 'Fermo', 0], ['1', '×1', 1], ['60', '×60', 60], ['600', '×600', 600]];
  function comandiTempo() {
    const s = Cielo.stato;
    return [
      { t: 'passo', id: 'lat', nome: 'Latitudine', valore: Cielo.ang(s.lat, { segno: 'NS' }) },
      { t: 'bottoni', h: 80, size: 34, lista: Object.keys(Cielo.LUOGHI).map((k) => ({ id: `luogo:${k}`, testo: k === 'procida' ? 'Procida' : k === 'equatore' ? 'Equatore' : 'Polo Nord', on: s.luogo === k && s.lat === Cielo.LUOGHI[k].lat })) },
      { t: 'passo', id: 'giorno', nome: 'Data', valore: Cielo.giorno() },
      { t: 'passo', id: 'ora', nome: 'Ora (UTC)', valore: Cielo.ora().slice(0, 5) },
      { t: 'bottoni', h: 80, size: 34, lista: VEL.map(([id, testo, v]) => ({ id: `vel:${id}`, testo, on: v === 0 ? !s.corre : s.corre && s.velocita === v })) },
    ];
  }
  function comandi(id) {
    const s = Cielo.stato;
    if (id === 'lat-' || id === 'lat+') Cielo.imposta({ lat: s.lat + (id === 'lat+' ? 1 : -1), luogo: '' });
    else if (id.startsWith('luogo:')) { const l = Cielo.LUOGHI[id.slice(6)]; Cielo.imposta({ lat: l.lat, lon: l.lon, luogo: id.slice(6) }); }
    else if (id === 'giorno-' || id === 'giorno+') Cielo.imposta({ data: s.data + (id === 'giorno+' ? 1 : -1) * 864e5 });
    else if (id === 'ora-' || id === 'ora+') Cielo.imposta({ data: s.data + (id === 'ora+' ? 1 : -1) * 6e5 });
    else if (id.startsWith('vel:')) { const v = VEL.find((x) => `vel:${x[0]}` === id); Cielo.imposta(v[2] ? { corre: true, velocita: v[2] } : { corre: false }); }
    else if (id === 'adesso') Cielo.imposta({ data: Date.now(), corre: true, velocita: 1 });
    else if (id === 'occhio-' || id === 'occhio+') Cielo.imposta({ occhio: Math.max(1, Math.min(45, s.occhio + (id === 'occhio+' ? 1 : -1))) });
    else if (id === 'nomi') { nomi = !nomi; ponte().nomi(nomi); }
    else if (id.startsWith('t:')) { const a = id.slice(2).split(',').find((x) => x.startsWith('astro:')); if (a) { puntato = a.slice(6); } }
    Motore.sporco();
  }

  /* Sfera armillare: un astro alla volta, con le sue coordinate */
  const ASTRI = ['Sole', 'Luna', 'Sirio', 'Canopo', 'Arturo', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair', 'Aldebaran', 'Antares', 'Spica', 'Polluce', 'Fomalhaut', 'Deneb', 'Regolo', 'Acrux', 'Polare'];
  const sf = { astro: 'Sirio', sistema: 'altaz', accesi: { orizzonte: true, meridiano: true, equatore: true, eclittica: false, asse: true }, c: null };
  function rifai() {
    const m = mondoSfera(); sf.c = m.sfera.ricostruisci(sf.astro, sf.sistema);
    Object.keys(sf.accesi).forEach((k) => { m.sfera.CERCHI[k].visible = sf.accesi[k]; m.sferaMini.CERCHI[k].visible = sf.accesi[k]; });
    m.sferaMini.ricostruisci(sf.astro, sf.sistema);
  }
  const sferaBase = Scene.sfera({ ogni: () => { rifai(); Motore.ridisegna(); } });
  let pronta = false;
  const mondoSfera = () => { const m = sferaBase(); if (!pronta) { pronta = true; setTimeout(() => { rifai(); Motore.ridisegna(); }, 0); } return m; };
  function coordinate() {
    const c = sf.c; if (!c) return 'Scegli un astro.';
    if (sf.sistema === 'altaz') {
      return `**Altezza** h ${Cielo.ang(c.h)} · distanza zenitale z ${Cielo.ang(90 - c.h)} · **azimut** a ${Cielo.ang(c.a, { tre: true })}`;
    }
    const P = c.t < 180 ? `${Cielo.ang(c.t, { tre: true })} W` : `${Cielo.ang(360 - c.t, { tre: true })} E`;
    return `**Declinazione** δ ${Cielo.ang(c.dec, { segno: 'NS' })} · **tempo** t ${Cielo.ang(c.t, { tre: true })} · angolo al polo P ${P}`;
  }
  function comandiSfera(id) {
    if (id.startsWith('c:')) { const k = id.slice(2); sf.accesi[k] = !sf.accesi[k]; }
    if (id === 'sis:altaz' || id === 'sis:orario') sf.sistema = id.slice(4);
    if (id === 'astro-' || id === 'astro+') { const i = ASTRI.indexOf(sf.astro); sf.astro = ASTRI[(i + (id === 'astro+' ? 1 : ASTRI.length - 1)) % ASTRI.length]; }
    if (id.startsWith('t:')) { const a = id.slice(2).split(',').find((x) => x.startsWith('astro:')); if (a) sf.astro = a.slice(6); }
    rifai(); Motore.sporco();
  }

  Motore.sezione('cielo', {
    spreads: () => [
      {
        mondo: mondoPonte, azione: comandi,
        sx: [
          { t: 'titolo', testo: 'Il cielo dal ponte' },
          { t: 'p', size: 40, testo: 'Il cielo vero, per il luogo e l\'istante che scegli. Tutte le esperienze del libro guardano questo stesso cielo.' },
          { t: 'riquadro', size: 36, testo: statoCielo() },
          ...comandiTempo(),
          { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'adesso', testo: 'Adesso' }, { id: 'nomi', testo: 'Nomi delle stelle', on: nomi }] },
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 820, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei in controplancia. Punta una stella col controller: compare il nome.' : 'Il modellino è la sfera celeste di questo cielo. Vai a grandezza vera per stare sul ponte.' },
          ...scala(),
          { t: 'riquadro', size: 36, testo: descrivi(puntato) },
          { t: 'passo', id: 'occhio', nome: 'Altezza dell\'occhio sul mare', valore: `${Cielo.stato.occhio} m` },
          { t: 'nota', testo: 'Trascina per guardarti intorno, rotella per avvicinare. Posizioni calcolate: Astronomy Engine e Bright Star Catalogue.' },
        ],
      },
      {
        mondo: mondoSfera, azione: (id) => { if (['lat-', 'lat+', 'ora-', 'ora+'].includes(id) || id.startsWith('luogo:') || id.startsWith('vel:')) { comandi(id); rifai(); } else comandiSfera(id); },
        sx: [
          { t: 'titolo', testo: 'La sfera celeste' },
          { t: 'p', size: 38, testo: 'L\'**orizzonte astronomico** (*rational horizon*) divide la sfera in emisfero visibile, con lo **Zenit**, e invisibile, con il **Nadir**. L\'**equatore celeste** (*celestial equator*) è perpendicolare all\'asse del mondo. {{p. 12–13}}' },
          { t: 'bottoni', h: 80, size: 32, lista: [['orizzonte', 'Orizzonte'], ['meridiano', 'Meridiano'], ['equatore', 'Equatore']].map(([k, t]) => ({ id: `c:${k}`, testo: t, on: sf.accesi[k] })) },
          { t: 'bottoni', h: 80, size: 32, lista: [['asse', 'Asse del mondo'], ['eclittica', 'Eclittica']].map(([k, t]) => ({ id: `c:${k}`, testo: t, on: sf.accesi[k] })) },
          { t: 'passo', id: 'astro', nome: 'Astro osservato', valore: sf.astro },
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'sis:altaz', testo: 'Sistema altazimutale', on: sf.sistema === 'altaz' }, { id: 'sis:orario', testo: 'Sistema orario', on: sf.sistema === 'orario' }] },
          { t: 'passo', id: 'lat', nome: 'Latitudine', valore: Cielo.ang(Cielo.stato.lat, { segno: 'NS' }) },
          { t: 'passo', id: 'ora', nome: 'Ora (UTC)', valore: `${Cielo.giorno()} ${Cielo.ora().slice(0, 5)}` },
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 860, testo: !vr() ? '' : Motore.scalaVera() ? 'Sei al centro della sfera, al posto dell\'osservatore.' : 'Punta la sfera e tieni premuto il grilletto per girarla.' },
          ...scala(),
          { t: 'riquadro', size: 36, testo: coordinate() },
          { t: 'nota', testo: 'In ocra l\'astro e le sue coordinate (tabella 1.1, p. 14). La sfera non è in scala.' },
        ],
      },
    ],
  });
})();
