/* Dati del libro, progressi dello studente, collezione di stelle. Regole in design.md */
(function () {
  // Capitoli ed esperienze di PIANO.md
  const CAPITOLI = [
    { n: 1, titolo: 'La sfera celeste', lezioni: [1, 2, 3] },
    { n: 2, titolo: 'Sole, tempo e Luna', lezioni: [4, 5, 6] },
    { n: 3, titolo: 'Gli strumenti', lezioni: [7, 8, 9] },
    { n: 4, titolo: 'Il punto nave', lezioni: [10, 11, 12, 13, 14] },
    // La 16 (navigazione polinesiana) è tolta: nessuno dei due volumi ne parla (decisione del docente, 18/11/2026)
    { n: 5, titolo: 'Storia', lezioni: [15] },
  ];
  const LEZIONI = {
    1: 'Il cielo che gira', 2: 'La Polare e la latitudine', 3: 'Tre sistemi di coordinate',
    4: 'Il cammino del Sole', 5: 'Che ora è?', 6: 'La Luna',
    7: 'Il sestante', 8: 'Dall\'altezza strumentale all\'altezza vera', 9: 'Riconoscere le stelle',
    10: 'Latitudine al passaggio in meridiano', 11: 'Il cerchio d\'altezza', 12: 'La retta d\'altezza',
    13: 'Il punto nave con le stelle', 14: 'Controllo della bussola con un astro',
    15: 'La sfida della longitudine',
  };

  /* Collezione: ogni esperienza completata accende una stella di navigazione (PIANO.md, «Collezione»).
     La magnitudine viene dal catalogo, il nome dalle Effemeridi nautiche */
  const PREMI = {
    1: 'Dubhe', 2: 'Polare', 3: 'Vega', 4: 'Regolo', 5: 'Sirio', 6: 'Spica', 7: 'Arturo', 8: 'Canopo',
    9: 'Betelgeuse', 10: 'Acrux', 11: 'Capella', 12: 'Rigel', 13: 'Deneb', 14: 'Antares', 15: 'Aldebaran',
  };
  const catalogo = (nome) => {
    const hr = Object.keys(STELLE.nomi).find((k) => STELLE.nomi[k] === nome);
    return STELLE.stelle.find((s) => s[0] === Number(hr));
  };
  const magnitudine = (nome) => catalogo(nome)[3].toFixed(2).replace('.', ',');
  // Per lezione.js: nome del premio e frase che lo accompagna
  const BANDIERE = {};
  Object.keys(PREMI).forEach((n) => { BANDIERE[n] = { nome: PREMI[n], significato: `stella di navigazione, magnitudine ${magnitudine(PREMI[n])}` }; });
  const TESTI = {
    premio: 'Stella', nota: 'Stella di navigazione delle Effemeridi nautiche', collezione: 'Le tue stelle', sezione: 'stelle',
  };

  const CHIAVE = 'libroAstro.v1';
  let memoria = { lezioni: {} };
  try {
    const salvato = localStorage.getItem(CHIAVE);
    if (salvato) memoria = JSON.parse(salvato);
  } catch (e) { /* il browser non salva: si resta in memoria */ }

  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(memoria)); } catch (e) { /* vedi sopra */ }
  }
  function stato(n) { return memoria.lezioni[n] || (memoria.lezioni[n] = {}); }
  function aggiorna(n, modifica) { Object.assign(stato(n), modifica); salva(); }
  function azzera() { memoria = { lezioni: {} }; salva(); }
  function letteraDi(n) { return PREMI[n]; }

  // Stella a cinque punte di raggio r
  function stellina(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.42 : r; c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
    c.closePath();
  }
  // La carta della stella guadagnata, o ancora spenta
  function bandiera(c, n, x, y, w, h, guadagnata) {
    const nome = PREMI[n];
    const size = Math.max(36, Math.round(h * 0.13));
    if (guadagnata) {
      c.fillStyle = '#0B2545'; c.fillRect(x, y, w, h);
      c.fillStyle = '#E3C878'; stellina(c, x + w / 2, y + h * 0.42, Math.min(w, h) * 0.26); c.fill();
      c.strokeStyle = '#C9A227'; c.lineWidth = 3; c.strokeRect(x + 6, y + 6, w - 12, h - 12);
      c.font = `700 ${size}px Bitter, Georgia, serif`; c.fillStyle = '#FBFAF4'; c.textAlign = 'center';
      c.fillText(nome, x + w / 2, y + h * 0.86); c.textAlign = 'left';
      return;
    }
    c.setLineDash([12, 9]); c.strokeStyle = '#5B6B7C'; c.lineWidth = 3; c.strokeRect(x, y, w, h); c.setLineDash([]);
    stellina(c, x + w / 2, y + h * 0.42, Math.min(w, h) * 0.22); c.stroke();
    c.font = `${size}px Disegno, cursive`; c.fillStyle = '#5B6B7C'; c.textAlign = 'center';
    c.fillText(nome, x + w / 2, y + h * 0.86); c.textAlign = 'left';
  }

  /* Carta celeste personale: le stelle dei premi sulla griglia di 360° − α e declinazione */
  function carta(c, x, y, w, h) {
    c.fillStyle = '#0B2545'; c.fillRect(x, y, w, h);
    const X = (sha) => x + 30 + ((360 - sha) / 360) * (w - 60); const Y = (dec) => y + h / 2 - (dec / 75) * (h / 2 - 20);
    c.strokeStyle = 'rgba(227,200,120,0.25)'; c.lineWidth = 2; c.beginPath();
    for (let s = 0; s <= 360; s += 30) { c.moveTo(X(s), y); c.lineTo(X(s), y + h); }
    for (let d = -60; d <= 60; d += 30) { c.moveTo(x, Y(d)); c.lineTo(x + w, Y(d)); }
    c.stroke();
    c.strokeStyle = 'rgba(227,200,120,0.6)'; c.beginPath(); c.moveTo(x, Y(0)); c.lineTo(x + w, Y(0)); c.stroke();
    Object.keys(PREMI).forEach((n) => {
      const nome = PREMI[n]; const s = catalogo(nome); const fatta = stato(n).bandiera;
      const sha = (360 - s[1]) % 360; const px = X(sha); const py = Y(Math.max(-72, Math.min(72, s[2])));
      if (fatta) { c.fillStyle = '#E3C878'; stellina(c, px, py, 14 + Math.max(0, 2.2 - s[3]) * 6); c.fill(); } else { c.strokeStyle = 'rgba(238,242,248,0.55)'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 8, 0, Math.PI * 2); c.stroke(); }
      c.font = fatta ? '700 36px Atkinson, sans-serif' : '36px Disegno, cursive';
      c.fillStyle = fatta ? '#FBFAF4' : 'rgba(238,242,248,0.6)';
      const lw = c.measureText(nome).width; const dx = px + 20 + lw > x + w ? -lw - 20 : 20;
      c.fillText(nome, px + dx, py + 12);
    });
  }

  /* Passi della lezione: rail in testa alla pagina sinistra */
  const PASSI = ['Concetto', 'Prevedi', 'Prova', 'Scopri', 'Stella'];
  function rail(n, spreads, attuale) {
    const primi = {};
    spreads.forEach((s, i) => { if (primi[s.passo] === undefined) primi[s.passo] = i; });
    return {
      t: 'rail',
      lista: PASSI.map((nome, k) => ({ id: `sez:${n}:${primi[k]}`, testo: nome, on: k === attuale })),
    };
  }

  window.Libro = { CAPITOLI, LEZIONI, BANDIERE, PREMI, TESTI, PRONTE: [], stato, aggiorna, azzera, letteraDi, bandiera, carta, stellina, rail, magnitudine };
})();
