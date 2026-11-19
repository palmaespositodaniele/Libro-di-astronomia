/* Il cielo in 3D, comune a tutte le scene: volta celeste vera, ponte di notte, sfera armillare.
   Convenzione del mondo: y verso lo zenit, Nord verso −z, Est verso +x. Regole in design.md */
window.Volta = (function () {
  const { COL, tratto, segmento, etichetta, cuoci, compatta } = Tavola;
  const RAD = Math.PI / 180;
  const ST = window.STELLE.stelle;

  /* Matrice che porta l'equatore della data nel riferimento dell'orizzonte (latitudine e tempo siderale locale) */
  function matriceLocale(m, lat, lst) {
    const f = lat * RAD; const L = lst * RAD;
    const cf = Math.cos(f); const sf = Math.sin(f); const cL = Math.cos(L); const sL = Math.sin(L);
    m.set(
      -sL, cL, 0, 0,
      cf * cL, cf * sL, sf, 0,
      sf * cL, sf * sL, -cf, 0,
      0, 0, 0, 1,
    );
    return m;
  }
  // Direzione nel mondo da altezza e azimut (gradi)
  function direzione(h, a, v) {
    const ch = Math.cos(h * RAD);
    return (v || new THREE.Vector3()).set(ch * Math.sin(a * RAD), Math.sin(h * RAD), -ch * Math.cos(a * RAD));
  }
  // Vettore dell'equatore della data da ascensione retta e declinazione (gradi)
  const versore = (ra, dec) => new THREE.Vector3(Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD));

  // Colore della stella dall'indice B−V
  function tinta(bv) {
    const c = new THREE.Color();
    if (bv < 0.3) return c.setRGB(0.72, 0.82, 1).lerp(new THREE.Color(1, 0.98, 0.94), Math.max(0, (bv + 0.3) / 0.6));
    return c.setRGB(1, 0.98, 0.94).lerp(new THREE.Color(1, 0.72, 0.48), Math.min(1, (bv - 0.3) / 1.4));
  }

  /* Stelle come punti: almeno 2 px sul visore, più grandi per le più luminose (design.md, «Notte leggibile») */
  function materialeStelle(k) {
    return new THREE.ShaderMaterial({
      uniforms: { uLimite: { value: 6.5 }, uPx: { value: k || 1 } },
      vertexShader: `attribute float mag; attribute vec3 tinta; uniform float uLimite; uniform float uPx;
        varying vec3 vT; varying float vA;
        void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          float s = clamp(5.5 - mag, 0.0, 7.0);
          gl_PointSize = max(2.0, (1.7 + s * 1.05) * uPx);
          vA = clamp((uLimite - mag) * 0.7, 0.0, 1.0); vT = tinta; }`,
      fragmentShader: `varying vec3 vT; varying float vA;
        void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5 || vA <= 0.0) discard;
          gl_FragColor = vec4(vT, vA * smoothstep(0.5, 0.22, r)); }`,
      transparent: true, depthWrite: false,
    });
  }
  function puntiStelle(vettori, R, magMax, k) {
    const pos = []; const mag = []; const col = [];
    ST.forEach((s, i) => {
      if (s[3] > magMax) return;
      const v = vettori[i]; pos.push(v[0] * R, v[1] * R, v[2] * R); mag.push(s[3]);
      const c = tinta(s[4]); col.push(c.r, c.g, c.b);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('mag', new THREE.Float32BufferAttribute(mag, 1));
    g.setAttribute('tinta', new THREE.Float32BufferAttribute(col, 3));
    const p = new THREE.Points(g, materialeStelle(k));
    p.frustumCulled = false;
    return p;
  }
  function riposiziona(punti, vettori, R, magMax) {
    const a = punti.geometry.attributes.position; let j = 0;
    ST.forEach((s, i) => { if (s[3] > magMax) return; const v = vettori[i]; a.setXYZ(j++, v[0] * R, v[1] * R, v[2] * R); });
    a.needsUpdate = true;
  }

  // Disco della Luna con la fase, disegnato su tela; la parte illuminata guarda verso +x
  function telaLuna(frazione, c) {
    const S = 128; const x = c.getContext('2d'); x.clearRect(0, 0, S, S);
    x.fillStyle = 'rgba(70,74,84,0.9)'; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#F2EEDF'; x.beginPath();
    x.arc(S / 2, S / 2, S / 2 - 2, -Math.PI / 2, Math.PI / 2);
    const e = (1 - 2 * frazione) * (S / 2 - 2); // semiasse del terminatore
    x.ellipse(S / 2, S / 2, Math.abs(e), S / 2 - 2, 0, Math.PI / 2, -Math.PI / 2, e > 0);
    x.fill();
  }

  /* La volta celeste: stelle, Sole, Luna e pianeti, al posto giusto per luogo e istante del cielo condiviso.
     opz: { R, magMax, k (spessore dei punti), toccabili: [] (vi aggiunge le sfere invisibili delle stelle con nome),
            cupola: true (fondo del cielo), corpi: true } */
  function volta(opz) {
    const R = opz.R || 850; const magMax = opz.magMax || 6;
    const g = new THREE.Group();
    const eq = new THREE.Group(); eq.matrixAutoUpdate = false; g.add(eq);
    let quando = Cielo.stato.data;
    let vettori = Cielo.vettoriStelle(Cielo.tempo());
    const punti = puntiStelle(vettori, R, magMax, opz.k);
    eq.add(punti);

    // Cupola: dal blu del giorno al nero della notte, secondo l'altezza del Sole
    let cupola = null;
    if (opz.cupola !== false) {
      cupola = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 24), new THREE.ShaderMaterial({
        uniforms: { uSole: { value: new THREE.Vector3(0, -1, 0) } },
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 uSole; varying vec3 vD;
          void main(){ float hs = uSole.y; float giorno = smoothstep(-0.2, 0.12, hs);
            vec3 notte = mix(vec3(0.03,0.045,0.09), vec3(0.015,0.02,0.045), clamp(vD.y*1.5,0.0,1.0));
            vec3 chiaro = mix(vec3(0.62,0.76,0.9), vec3(0.24,0.47,0.78), clamp(vD.y*1.4,0.0,1.0));
            vec3 c = mix(notte, chiaro, giorno);
            float alba = smoothstep(-0.25, 0.0, hs) * (1.0 - smoothstep(0.05, 0.25, hs));
            float verso = max(0.0, dot(normalize(vec3(vD.x,0.0,vD.z)), normalize(vec3(uSole.x,0.0,uSole.z)+1e-5)));
            c += vec3(0.55,0.28,0.1) * alba * pow(verso, 3.0) * (1.0 - clamp(vD.y*3.0,0.0,1.0));
            gl_FragColor = vec4(c, 1.0); }`,
        side: THREE.BackSide, depthWrite: false,
      }));
      cupola.renderOrder = -10;
      g.add(cupola);
    }

    // Sole, Luna e pianeti
    const corpi = {};
    if (opz.corpi !== false) {
      const sole = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0xFFF4C8, depthWrite: false, transparent: true }));
      const alone = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tavola.tela(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,190,0.8)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false }));
      const telaL = document.createElement('canvas'); telaL.width = 128; telaL.height = 128;
      const texL = new THREE.CanvasTexture(telaL); texL.colorSpace = THREE.SRGBColorSpace;
      const luna = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: texL, transparent: true, depthWrite: false }));
      corpi.Sole = { m: sole, alone }; corpi.Luna = { m: luna, tela: telaL, tex: texL, frazione: -1 };
      eq.add(sole, alone, luna);
      const colori = { Venere: [1, 1, 0.92], Marte: [1, 0.62, 0.45], Giove: [1, 0.95, 0.85], Saturno: [1, 0.9, 0.7] };
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(12).fill(0), 3));
      pg.setAttribute('mag', new THREE.Float32BufferAttribute([-4, 0.5, -2, 0.5], 1));
      pg.setAttribute('tinta', new THREE.Float32BufferAttribute(Object.values(colori).flat(), 3));
      const pianeti = new THREE.Points(pg, materialeStelle((opz.k || 1) * 1.15)); pianeti.frustumCulled = false;
      corpi.pianeti = pianeti; eq.add(pianeti);
    }

    // Stelle con nome: sfere invisibili da puntare, ed etichette che si accendono
    const nomi = {}; const etichette = new THREE.Group(); eq.add(etichette);
    const invisibile = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    Object.keys(Cielo.hrDi).forEach((nome) => {
      const i = Cielo.perHR[Cielo.hrDi[nome]]; const v = vettori[i];
      const s = new THREE.Mesh(new THREE.SphereGeometry(R * 0.012, 8, 6), invisibile);
      s.position.set(v[0] * R, v[1] * R, v[2] * R); s.userData.tocco = `astro:${nome}`;
      eq.add(s); if (opz.toccabili) opz.toccabili.push(s);
      nomi[nome] = { sfera: s, i, et: null };
    });
    function nomeVisibile(nome, si) {
      const n = nomi[nome] || corpi[nome]; if (!n) return;
      if (si && !n.et) {
        n.et = etichetta(nome, opz.etichetta || R * 0.024, '#E9EEF6');
        etichette.add(n.et);
      }
      if (n.et) {
        n.et.visible = si;
        const p = n.sfera ? n.sfera.position : n.m.position;
        n.et.position.copy(p).multiplyScalar(0.985).add(new THREE.Vector3(0, 0, 0));
        n.et.center.set(-0.08, 0.5);
      }
    }

    const m = new THREE.Matrix4(); const sole = new THREE.Vector3(); const tmp = new THREE.Vector3();
    let ultimoCorpi = -1e15;
    const stato = { sole: new THREE.Vector3(0, -1, 0), altSole: -90 };
    function aggiorna(forza) {
      const s = Cielo.stato; const t = Cielo.tempo();
      // Precessione: si ricalcolano le stelle se la data cambia di più di un giorno
      if (Math.abs(s.data - quando) > 864e5) {
        quando = s.data; vettori = Cielo.vettoriStelle(t); riposiziona(punti, vettori, R, magMax);
        Object.values(nomi).forEach((n) => { const v = vettori[n.i]; n.sfera.position.set(v[0] * R, v[1] * R, v[2] * R); });
      }
      const lst = Cielo.tGamma(t) + s.lon;
      matriceLocale(eq.matrix, s.lat, lst); eq.matrixWorldNeedsUpdate = true;
      if (opz.corpi !== false && (forza || Math.abs(s.data - ultimoCorpi) > 20000)) {
        ultimoCorpi = s.data;
        const oss = new Astronomy.Observer(s.lat, s.lon, 0);
        const pos = (nome) => { const e = Astronomy.Equator(nome, t, oss, true, true); return { v: versore(e.ra * 15, e.dec), km: e.dist * 149597870.7 }; };
        // Sole
        const ps = pos('Sun'); const rs = R * 0.98;
        const sdS = Math.asin(695700 / ps.km);
        corpi.Sole.m.position.copy(ps.v).multiplyScalar(rs); corpi.Sole.m.lookAt(0, 0, 0);
        corpi.Sole.m.scale.setScalar(Math.max(rs * Math.tan(sdS), rs * 0.0035 * (opz.k || 1)));
        corpi.Sole.alone.position.copy(corpi.Sole.m.position); corpi.Sole.alone.scale.setScalar(rs * 0.06);
        // Luna con la fase, la parte chiara verso il Sole
        const pl = pos('Moon'); const rl = R * 0.97;
        corpi.Luna.m.position.copy(pl.v).multiplyScalar(rl);
        corpi.Luna.m.scale.setScalar(Math.max(rl * Math.tan(Math.asin(1737.4 / pl.km)), rl * 0.004 * (opz.k || 1)));
        corpi.Luna.m.lookAt(0, 0, 0);
        const fr = Astronomy.Illumination('Moon', t).phase_fraction;
        if (Math.abs(fr - corpi.Luna.frazione) > 0.01) { corpi.Luna.frazione = fr; telaLuna(fr, corpi.Luna.tela); corpi.Luna.tex.needsUpdate = true; }
        const verso = tmp.copy(ps.v).sub(pl.v.clone().multiplyScalar(ps.v.dot(pl.v)));
        const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(corpi.Luna.m.quaternion);
        const ay = new THREE.Vector3(0, 1, 0).applyQuaternion(corpi.Luna.m.quaternion);
        corpi.Luna.m.rotateZ(Math.atan2(verso.dot(ay), verso.dot(ax)));
        // Pianeti
        const a = corpi.pianeti.geometry.attributes.position;
        ['Venus', 'Mars', 'Jupiter', 'Saturn'].forEach((n, i) => { const p = pos(n).v.multiplyScalar(R * 0.995); a.setXYZ(i, p.x, p.y, p.z); });
        a.needsUpdate = true;
        corpi.posSole = ps.v;
      }
      if (corpi.posSole) {
        sole.copy(corpi.posSole).applyMatrix4(eq.matrix).normalize();
        stato.sole.copy(sole); stato.altSole = Math.asin(sole.y) / RAD;
        if (cupola) cupola.material.uniforms.uSole.value.copy(sole);
        // Di giorno le stelle spariscono: prima le deboli, poi le brillanti
        const luce = Math.min(1, Math.max(0, (-stato.altSole - 0.5) / 12));
        const lim = -1.6 + luce * 8.1;
        punti.material.uniforms.uLimite.value = lim;
        corpi.pianeti.material.uniforms.uLimite.value = lim + 1.2;
      }
    }
    aggiorna(true);
    // Posizione nel mondo di un astro con nome (per puntare la vista o il sestante)
    function dove(nome, v) {
      const out = v || new THREE.Vector3();
      if (nomi[nome]) return out.copy(nomi[nome].sfera.position).applyMatrix4(eq.matrix).normalize();
      if (corpi[nome]) return out.copy(corpi[nome].m.position).applyMatrix4(eq.matrix).normalize();
      return out.set(0, 1, 0);
    }
    return { g, eq, punti, corpi, nomi, aggiorna, nomeVisibile, dove, stato, R };
  }

  /* Il mare sotto l'orizzonte marino, depresso dell'angolo i delle effemeridi; e la linea dell'orizzonte */
  function mare(R, opz = {}) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x07131F, side: THREE.BackSide });
    let geo = null; const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); g.add(mesh);
    const linea = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x5B7FA6 }));
    g.add(linea);
    let ultimo = null;
    function aggiorna(altSole) {
      const dip = Cielo.depressione(Cielo.stato.occhio) / 60 * RAD;
      if (dip !== ultimo) {
        ultimo = dip;
        if (geo) geo.dispose();
        geo = new THREE.SphereGeometry(R, 64, 12, 0, Math.PI * 2, Math.PI / 2 + dip, Math.PI / 2 - dip);
        mesh.geometry = geo;
        linea.geometry.dispose();
        linea.geometry = new THREE.TorusGeometry(R * Math.cos(dip), R * 0.0011 * (opz.k || 1), 4, 160);
        linea.rotation.x = Math.PI / 2; linea.position.y = -R * Math.sin(dip);
      }
      // Il mare è più chiaro di giorno
      const f = Math.min(1, Math.max(0, (altSole + 6) / 16));
      // Valori già in sRGB, come quelli della cupola: così mare e cielo restano nello stesso tono
      mat.color.setRGB(0.035 + 0.12 * f, 0.06 + 0.24 * f, 0.1 + 0.32 * f, THREE.SRGBColorSpace);
      // A notte fonda l'orizzonte non si distingue più: la linea sfuma nel mare sotto i −12° di Sole
      // (crepuscolo nautico, p. 32 del libro di testo)
      const o = Math.min(1, Math.max(0, (altSole + 13) / 5));
      linea.material.color.setRGB(0.035 + (0.3 - 0.035) * o + 0.3 * f, 0.06 + (0.42 - 0.06) * o + 0.3 * f, 0.1 + (0.56 - 0.1) * o + 0.25 * f, THREE.SRGBColorSpace);
    }
    return { g, aggiorna };
  }

  // Punti cardinali sull'orizzonte
  function cardinali(R, alto) {
    const g = new THREE.Group();
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a]) => {
      const e = etichetta(t, alto, '#E9EEF6'); direzione(1.2, a, e.position).multiplyScalar(R); g.add(e);
    });
    return g;
  }

  /* Controplancia: pavimento, battagliola e un tratto di prua davanti, a grandezza vera (metri).
     Lo studente sta in piedi a (0, 0, 0); la prua guarda a Nord (−z) */
  function controplancia() {
    const g = new THREE.Group();
    const tinte = (y) => (y > 0 ? '#3C4C5E' : '#2A3644');
    const pavimento = new THREE.Mesh(cuoci(new THREE.BoxGeometry(7, 0.2, 5), tinte), new THREE.MeshBasicMaterial({ vertexColors: true }));
    pavimento.position.set(0, -0.1, 0.5); g.add(pavimento);
    const ferri = new THREE.Group();
    const c = 0x8796A8;
    [-3.4, -1.7, 0, 1.7, 3.4].forEach((x) => ferri.add(segmento(new THREE.Vector3(x, 0, -2), new THREE.Vector3(x, 1.1, -2), 0.025, c)));
    [-3.4, 3.4].forEach((x) => { ferri.add(segmento(new THREE.Vector3(x, 0, -2), new THREE.Vector3(x, 0, 3), 0.02, c)); ferri.add(segmento(new THREE.Vector3(x, 1.1, -2), new THREE.Vector3(x, 1.1, 3), 0.025, c)); });
    ferri.add(segmento(new THREE.Vector3(-3.4, 1.1, -2), new THREE.Vector3(3.4, 1.1, -2), 0.03, c));
    ferri.add(segmento(new THREE.Vector3(-3.4, 0.55, -2), new THREE.Vector3(3.4, 0.55, -2), 0.02, c));
    g.add(compatta(ferri));
    // La coperta di prua, più in basso, che si allunga verso la prua
    const prua = new THREE.Shape(); prua.moveTo(-9, 0); prua.lineTo(9, 0); prua.lineTo(7, -60); prua.lineTo(0, -82); prua.lineTo(-7, -60); prua.closePath();
    const coperta = new THREE.Mesh(cuoci(new THREE.ShapeGeometry(prua).rotateX(Math.PI / 2), '#23303D'), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    coperta.position.set(0, -14, -6);
    g.add(coperta);
    return g;
  }

  /* Sfera armillare: i cerchi della sfera celeste, accesi uno alla volta. Raggio R, tratti spessi k volte */
  function sfera(R, k, toccabili) {
    const g = new THREE.Group();
    const v = volta({ R, magMax: 4, k: k > 1 ? 1.4 : 1, cupola: false, toccabili, etichetta: R * 0.06 * Math.min(k, 2) });
    g.add(v.g);
    const r = 0.022 * R * Math.sqrt(k) * 0.5;
    const cerchio = (piano, colore) => {
      const p = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; p.push(piano(Math.cos(a), Math.sin(a)).multiplyScalar(R)); }
      return tratto(p, r, colore, true);
    };
    const CERCHI = {};
    // Nel riferimento dell'orizzonte
    const loc = new THREE.Group(); g.add(loc);
    CERCHI.orizzonte = cerchio((c, s) => new THREE.Vector3(c, 0, s), 0x2F7A55);
    CERCHI.meridiano = cerchio((c, s) => new THREE.Vector3(0, s, c), 0x7A3B8F);
    loc.add(CERCHI.orizzonte, CERCHI.meridiano);
    // Emisfero invisibile, più scuro (figura 1.4 del libro)
    const sotto = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 48, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0B2545, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    const sopra = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9FC3E6, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
    loc.add(sotto, sopra);
    const punto = (testo, pos, colore) => { const e = etichetta(testo, R * 0.07 * Math.min(k, 2), colore || '#0B2545'); e.position.copy(pos); return e; };
    loc.add(punto('Zenit', new THREE.Vector3(0, R * 1.1, 0)), punto('Nadir', new THREE.Vector3(0, -R * 1.1, 0)));
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a]) => loc.add(punto(t, direzione(0, a).multiplyScalar(R * 1.1))));
    // Nel riferimento dell'equatore della data
    CERCHI.equatore = cerchio((c, s) => new THREE.Vector3(c, s, 0), 0xB3362B);
    const asse = segmento(new THREE.Vector3(0, 0, -R * 1.15), new THREE.Vector3(0, 0, R * 1.15), r * 0.8, 0x5B6B7C);
    CERCHI.asse = asse;
    v.eq.add(CERCHI.equatore, asse);
    v.eq.add(punto('PN', new THREE.Vector3(0, 0, R * 1.22), '#5B6B7C'), punto('PS', new THREE.Vector3(0, 0, -R * 1.22), '#5B6B7C'));
    // Eclittica della data, calcolata
    const rot = Astronomy.Rotation_ECT_EQD(Cielo.tempo());
    const ecl = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; const w = Astronomy.RotateVector(rot, new Astronomy.Vector(Math.cos(a), Math.sin(a), 0, Cielo.tempo())); ecl.push(new THREE.Vector3(w.x, w.y, w.z).multiplyScalar(R)); }
    CERCHI.eclittica = tratto(ecl, r, 0xC07A1A, true); v.eq.add(CERCHI.eclittica);
    // L'osservatore al centro: un puntino e la sua verticale
    loc.add(segmento(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, R, 0), r * 0.5, 0x5B6B7C));
    const centro = new THREE.Mesh(new THREE.SphereGeometry(R * 0.035, 16, 10), new THREE.MeshBasicMaterial({ color: COL.inchiostro })); loc.add(centro);

    // L'astro osservato, in ocra, con le sue coordinate
    const segno = new THREE.Mesh(new THREE.SphereGeometry(R * 0.035 * Math.min(k, 2), 16, 10), new THREE.MeshBasicMaterial({ color: COL.ocra }));
    g.add(segno);
    const archi = new THREE.Group(); g.add(archi);
    const DUE = { orario: new THREE.Group(), altaz: new THREE.Group() };
    archi.add(DUE.orario, DUE.altaz);
    function arco(lista, colore, spessore) { return tratto(lista, r * (spessore || 1.6), colore === undefined ? COL.ocra : colore); }
    function ricostruisci(astro, sistema) {
      [DUE.orario, DUE.altaz].forEach((x) => { x.children.forEach((c) => c.geometry.dispose()); x.clear(); });
      const d = v.dove(astro); segno.position.copy(d).multiplyScalar(R);
      const h = Math.asin(d.y) / RAD; const a = Cielo.norm(Math.atan2(d.x, -d.z) / RAD);
      // Altazimutale: verticale dell'astro (circolo), altezza e azimut (in ocra)
      const vert = []; for (let i = 0; i <= 64; i++) vert.push(direzione(-90 + (i / 64) * 180, a).multiplyScalar(R));
      DUE.altaz.add(arco(vert, 0x4A76A8, 0.8));
      const alt = []; for (let i = 0; i <= 24; i++) alt.push(direzione((h * i) / 24, a).multiplyScalar(R * 1.004));
      DUE.altaz.add(arco(alt));
      const az = []; for (let i = 0; i <= 48; i++) az.push(direzione(0, (a * i) / 48).multiplyScalar(R * 1.004));
      if (a > 1) DUE.altaz.add(arco(az, COL.ocra, 1.1));
      // Orario: cerchio orario dell'astro, declinazione e tempo (angolo orario locale, verso W)
      const inv = new THREE.Matrix4().copy(v.eq.matrix).invert();
      const e = d.clone().applyMatrix4(inv).normalize();
      const ra = Math.atan2(e.y, e.x); const dec = Math.asin(e.z);
      const lst = (Cielo.tGamma(Cielo.tempo()) + Cielo.stato.lon) * RAD;
      const pe = (de, al) => new THREE.Vector3(Math.cos(de) * Math.cos(al), Math.cos(de) * Math.sin(al), Math.sin(de)).applyMatrix4(v.eq.matrix);
      const ora = []; for (let i = 0; i <= 64; i++) ora.push(pe(-Math.PI / 2 + (i / 64) * Math.PI, ra).multiplyScalar(R));
      DUE.orario.add(arco(ora, 0x4A76A8, 0.8));
      const de = []; for (let i = 0; i <= 24; i++) de.push(pe((dec * i) / 24, ra).multiplyScalar(R * 1.004));
      DUE.orario.add(arco(de));
      let t = ((lst - ra) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const tt = []; for (let i = 0; i <= 48; i++) tt.push(pe(0, lst - (t * i) / 48).multiplyScalar(R * 1.004));
      if (t > 0.02) DUE.orario.add(arco(tt, COL.ocra, 1.1));
      DUE.orario.visible = sistema === 'orario'; DUE.altaz.visible = sistema === 'altaz';
      return { h, a, t: t / RAD, dec: dec / RAD, sha: Cielo.norm(360 - ra / RAD) };
    }
    return { g, v, CERCHI, ricostruisci, segno };
  }

  return { volta, mare, cardinali, controplancia, sfera, direzione, matriceLocale };
})();
