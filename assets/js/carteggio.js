/* Il foglio di carteggio delle esperienze del punto nave: carta di Mercatore approssimata attorno al punto stimato
   («Fondamenti» vol. 2, § 8.4, fig. 8.6). Coordinate in miglia: x verso Est, y verso Nord, punto stimato in (0, 0).
   Una retta d'altezza è { a: azimut in gradi, dh: Δh in primi (= miglia), col, nome }. Regole in design.md */
window.Carteggio = (function () {
  const RAD = Math.PI / 180;
  const n = (a) => [Math.sin(a * RAD), Math.cos(a * RAD)]; // verso l'astro

  // Punto determinativo: sul verso dell'azimut, a Δh dal punto stimato (verso l'astro se positivo)
  const determinativo = (r) => { const [s, c] = n(r.a); return [r.dh * s, r.dh * c]; };

  // Incrocio di due rette (8.5): n1·p = dh1, n2·p = dh2
  function incrocio(r1, r2) {
    const [a, b] = n(r1.a); const [c, d] = n(r2.a);
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-6) return null;
    return [(r1.dh * d - b * r2.dh) / det, (a * r2.dh - c * r1.dh) / det];
  }
  // Retta generica { n: [nx, ny], k }: n·p = k
  const comeRetta = (r) => ({ n: n(r.a), k: r.dh });
  function incrocioG(p, q) {
    const det = p.n[0] * q.n[1] - p.n[1] * q.n[0];
    if (Math.abs(det) < 1e-9) return null;
    return [(p.k * q.n[1] - p.n[1] * q.k) / det, (p.n[0] * q.k - q.n[0] * p.k) / det];
  }
  // Bisettrice d'altezza di due rette (§ 9.2): i punti dove le due rette hanno lo stesso errore, (n1 − n2)·p = dh1 − dh2
  function bisettrice(r1, r2) {
    const [a, b] = n(r1.a); const [c, d] = n(r2.a);
    const m = Math.hypot(a - c, b - d);
    return { n: [(a - c) / m, (b - d) / m], k: (r1.dh - r2.dh) / m };
  }
  // Differenza d'azimut fra 0° e 180°
  const da = (x, y) => { const d = Math.abs((((x - y) % 360) + 360) % 360); return d > 180 ? 360 - d : d; };
  // Gli astri stanno tutti in un semicerchio d'orizzonte?
  function daUnaParte(az) {
    const s = az.map((x) => ((x % 360) + 360) % 360).sort((x, y) => x - y);
    for (let i = 0; i < s.length; i++) { const gap = i === s.length - 1 ? s[0] + 360 - s[i] : s[i + 1] - s[i]; if (gap >= 180) return true; }
    return false;
  }

  /* Fix con tre rette (§ 9.3). Astri sparsi su tutto l'orizzonte: incentro del triangolo, cioè il punto dove le tre
     rette hanno lo stesso errore d (errore sistematico). Astri da una parte sola: bisettrice della coppia con la
     differenza d'azimut maggiore, incrociata con la retta intermedia (fig. 9.8) */
  function fixTre(r) {
    const vertici = [incrocio(r[1], r[2]), incrocio(r[0], r[2]), incrocio(r[0], r[1])];
    if (daUnaParte(r.map((x) => x.a))) {
      let best = [0, 1]; let max = -1;
      [[0, 1], [0, 2], [1, 2]].forEach(([i, j]) => { const d = da(r[i].a, r[j].a); if (d > max) { max = d; best = [i, j]; } });
      const m = [0, 1, 2].find((k) => !best.includes(k));
      return { p: incrocioG(bisettrice(r[best[0]], r[best[1]]), comeRetta(r[m])), vertici, modo: 'ibrido', coppia: best, media: m };
    }
    // Tre equazioni n_k·p + ε = Δh_k nelle incognite x, y, ε: con ε > 0 le altezze misurate sono troppo grandi (9.1)
    const M = r.map((x) => [...n(x.a), 1]); const v = r.map((x) => x.dh);
    const det3 = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    const D = det3(M);
    const col = (k) => M.map((riga, i) => riga.map((x, j) => (j === k ? v[i] : x)));
    return { p: [det3(col(0)) / D, det3(col(1)) / D], d: det3(col(2)) / D, vertici, modo: 'incentro' };
  }

  // Trasporto analitico (8.2): Δh' = Δh + m cos(Rv − a)
  const trasporto = (dh, m, rv, a) => dh + m * Math.cos((rv - a) * RAD);

  // Da miglia a coordinate: Δφ in primi, Δλ = spostamento Est / cos φ
  const coordinate = (p, lat, lon) => ({ lat: lat + p[1] / 60, lon: lon + p[0] / 60 / Math.cos(lat * RAD) });

  /* Il disegno. opz: { phi, scala (pixel per miglio), centro: [px, py] del punto stimato, rette, fix, vero, titolo, note } */
  function disegna(ctx, W, H, opz) {
    const s = opz.scala || 60; const [cx, cy] = opz.centro || [W / 2, H / 2];
    const X = (p) => cx + p[0] * s; const Y = (p) => cy - p[1] * s;
    ctx.fillStyle = '#FBFAF4'; ctx.fillRect(0, 0, W, H);
    // Reticolo: un primo di latitudine = un miglio; i primi di longitudine sono più corti (× cos φ)
    const k = Math.cos((opz.phi || 0) * RAD);
    ctx.lineWidth = 2; ctx.strokeStyle = '#D8E0EC';
    for (let y = cy % s; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = cx % (s * k); x < W; x += s * k) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.strokeStyle = '#9FB1C8'; ctx.lineWidth = 3;
    for (let y = cy % (5 * s); y < H; y += 5 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = cx % (5 * s * k); x < W; x += 5 * s * k) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.font = '34px Atkinson'; ctx.fillStyle = '#5B6B7C';
    ctx.fillText('Righe orizzontali: ogni 1′ di latitudine (1 miglio). Verticali: ogni 1′ di longitudine (× cos φ, più fitte)', 24, H - 24);
    // Le rette d'altezza: direzione d'azimut tratteggiata, punto determinativo, retta perpendicolare con le freccette verso l'astro
    (opz.rette || []).forEach((r) => {
      const [sa, ca] = n(r.a); const D = determinativo(r);
      ctx.strokeStyle = r.col; ctx.fillStyle = r.col;
      ctx.setLineDash([18, 14]); ctx.lineWidth = 3;
      const lung = Math.max(Math.abs(r.dh) + 3, 6);
      ctx.beginPath(); ctx.moveTo(X([0, 0]), Y([0, 0])); ctx.lineTo(X([sa * lung, ca * lung]), Y([sa * lung, ca * lung])); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '38px Atkinson';
      ctx.fillText(`${r.nome} ${Math.round(r.a)}°`, X([sa * lung, ca * lung]) + 10, Y([sa * lung, ca * lung]) - 10);
      ctx.beginPath(); ctx.arc(X(D), Y(D), 9, 0, Math.PI * 2); ctx.fill();
      const L = opz.lunghezza || 9; const t = [ca, -sa];
      const A = [D[0] - t[0] * L, D[1] - t[1] * L]; const B = [D[0] + t[0] * L, D[1] + t[1] * L];
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X(A), Y(A)); ctx.lineTo(X(B), Y(B)); ctx.stroke();
      [A, B].forEach((E) => {
        const F = [E[0] + sa * 0.9, E[1] + ca * 0.9];
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(E), Y(E)); ctx.lineTo(X(F), Y(F)); ctx.stroke();
        const ang = Math.atan2(-(ca), sa); ctx.beginPath();
        ctx.moveTo(X(F), Y(F)); ctx.lineTo(X(F) - 22 * Math.cos(ang - 0.45), Y(F) - 22 * Math.sin(ang - 0.45));
        ctx.lineTo(X(F) - 22 * Math.cos(ang + 0.45), Y(F) - 22 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
      });
    });
    // Triangolo delle tre rette
    if (opz.vertici) {
      ctx.fillStyle = 'rgba(179,54,43,0.12)'; ctx.beginPath();
      opz.vertici.forEach((v, i) => (i ? ctx.lineTo(X(v), Y(v)) : ctx.moveTo(X(v), Y(v)))); ctx.closePath(); ctx.fill();
    }
    // Punto stimato
    ctx.strokeStyle = '#0B2545'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 26, cy); ctx.lineTo(cx + 26, cy); ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy + 26); ctx.stroke();
    ctx.font = '700 40px Atkinson'; ctx.fillStyle = '#0B2545'; ctx.fillText('punto stimato', cx + 24, cy + 52);
    if (opz.vero) {
      ctx.fillStyle = '#D08A1E'; ctx.beginPath(); ctx.arc(X(opz.vero), Y(opz.vero), 14, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 38px Atkinson'; ctx.fillText('nave vera', X(opz.vero) + 20, Y(opz.vero) - 18);
    }
    if (opz.fix) {
      const f = opz.fix; ctx.strokeStyle = '#B3362B'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(X(f), Y(f), 20, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(f), Y(f), 5, 0, Math.PI * 2); ctx.fillStyle = '#B3362B'; ctx.fill();
      ctx.font = '700 42px Atkinson'; ctx.fillText('FIX', X(f) + 26, Y(f) + 46);
    }
    // Rosa: il Nord in alto
    ctx.fillStyle = '#0B2545'; ctx.font = '700 46px Atkinson'; ctx.fillText('N', W - 70, 70);
    ctx.lineWidth = 4; ctx.strokeStyle = '#0B2545'; ctx.beginPath(); ctx.moveTo(W - 56, 170); ctx.lineTo(W - 56, 86); ctx.stroke();
    if (opz.titolo) { ctx.font = '700 44px Atkinson'; ctx.fillText(opz.titolo, 24, 60); }
    (opz.note || []).forEach((t, i) => { ctx.font = '36px Atkinson'; ctx.fillStyle = '#0B2545'; ctx.fillText(t, 24, 112 + i * 46); });
  }

  return { determinativo, incrocio, bisettrice, fixTre, daUnaParte, trasporto, coordinate, disegna, da };
})();
