/* La Terra vista dallo spazio, per le esperienze del tempo e della Luna.
   Riferimento: l'equatore della data (y verso il polo celeste Nord). La Terra gira del tempo sidereo di Greenwich;
   Sole e Luna stanno dove li mette Astronomy Engine. Distanze e dimensioni non in scala. Regole in design.md */
window.Globo = (function () {
  const { tratto, etichetta } = Tavola;
  const RAD = Math.PI / 180;
  // Dall'equatore della data (x verso γ, z verso il polo) al mondo di three (y in alto)
  const daEq = (x, y, z) => new THREE.Vector3(x, z, -y);
  const versoEq = (ra, dec) => daEq(Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD));
  // Punto della Terra (latitudine, longitudine positiva a Est) nel riferimento della Terra stessa
  const sullaTerra = (lat, lon, r) => daEq(Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)).multiplyScalar(r);

  const vertice = 'varying vec3 vP; varying vec3 vN; void main(){ vP = normalize(position); vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
  // Fusi orari a strisce alterne, notte più scura dove il Sole non arriva
  const frammentoTerra = `uniform vec3 uSole; varying vec3 vP; varying vec3 vN;
    void main(){
      float lon = degrees(atan(-vP.z, vP.x));
      float fuso = floor((lon + 7.5) / 15.0);
      float pari = mod(fuso, 2.0);
      vec3 c = mix(vec3(0.62,0.76,0.86), vec3(0.50,0.66,0.80), pari);
      float g = smoothstep(-0.08, 0.08, dot(normalize(vN), uSole));
      c *= mix(0.32, 1.0, g);
      gl_FragColor = vec4(c, 1.0); }`;
  const frammentoLuna = `uniform vec3 uSole; varying vec3 vP; varying vec3 vN;
    void main(){ float g = smoothstep(-0.05, 0.05, dot(normalize(vN), uSole)); vec3 c = mix(vec3(0.16,0.17,0.2), vec3(0.93,0.91,0.84), g); gl_FragColor = vec4(c, 1.0); }`;

  /* R: raggio della Terra; k: spessore dei tratti; opz: { luna: true } per Luna, orbita, eclittica e maree */
  function terra(R, k, opz = {}) {
    const g = new THREE.Group();
    const r = 0.012 * R * Math.sqrt(k);
    const sole = { value: new THREE.Vector3(1, 0, 0) };
    // La Terra e quello che gira con lei
    const fisso = new THREE.Group(); g.add(fisso);
    fisso.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48), new THREE.ShaderMaterial({ uniforms: { uSole: sole }, vertexShader: vertice, fragmentShader: frammentoTerra })));
    const meridiano = (lon, col, sp) => { const p = []; for (let i = 0; i <= 48; i++) p.push(sullaTerra(-90 + (i * 180) / 48, lon, R * 1.004)); return tratto(p, r * (sp || 1), col); };
    const parallelo = (lat, col, sp) => { const p = []; for (let i = 0; i <= 96; i++) p.push(sullaTerra(lat, (i * 360) / 96, R * 1.004)); return tratto(p, r * (sp || 1), col, true); };
    fisso.add(meridiano(0, 0xB3362B, 1.6), meridiano(180, 0xC07A1A, 1.6), parallelo(0, 0x2B3440, 1));
    [23.45, -23.45].forEach((l) => fisso.add(parallelo(l, 0x5B6B7C, 0.6)));
    [66.55, -66.55].forEach((l) => fisso.add(parallelo(l, 0x5B6B7C, 0.6)));
    const et = (t, h, c) => etichetta(t, R * 0.085 * h * Math.min(k, 2), c || '#0B2545');
    // Con la Luna la Terra si vede piccola: le scritte dei fusi e dei meridiani si tolgono
    const scritta = (e) => { if (opz.luna) e.visible = false; return e; };
    for (let f = -11; f <= 12; f++) {
      const e = scritta(et(f === 0 ? '0' : `${f > 0 ? '+' : '−'}${Math.abs(f)}`, 1)); e.position.copy(sullaTerra(4, f * 15, R * 1.06)); fisso.add(e);
    }
    const eG = scritta(et('Greenwich', 1, '#B3362B')); eG.position.copy(sullaTerra(30, 0, R * 1.08)); fisso.add(eG);
    const e180 = scritta(et('180°', 1, '#9A5B12')); e180.position.copy(sullaTerra(30, 180, R * 1.08)); fisso.add(e180);
    // La nave
    const nave = new THREE.Group(); fisso.add(nave);
    nave.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.055, 16, 10), new THREE.MeshBasicMaterial({ color: 0xD08A1E })));
    const asta = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, R * 0.22, 6), new THREE.MeshBasicMaterial({ color: 0xD08A1E }));
    asta.position.y = R * 0.11; nave.add(asta);
    const eN = scritta(et('nave', 1.1, '#9A5B12')); eN.position.y = R * 0.3; nave.add(eN);
    // Il meridiano dove il Sole è a mezzogiorno vero, e quello opposto dove è mezzanotte (linea mobile della data)
    const mezzodi = new THREE.Group(); g.add(mezzodi);
    const mezzo = (lon, col) => { const p = []; for (let i = 0; i <= 48; i++) p.push(daEq(Math.cos((-90 + i * 3.75) * RAD) * Math.cos(lon * RAD), Math.cos((-90 + i * 3.75) * RAD) * Math.sin(lon * RAD), Math.sin((-90 + i * 3.75) * RAD)).multiplyScalar(R * 1.012)); return tratto(p, r * 1.3, col); };
    mezzodi.add(mezzo(0, 0xE3B23C), mezzo(180, 0x3B4654));
    // Le scritte stanno a Sud, lontane da Greenwich e dalla nave (che a Procida sta a Nord)
    const eM = scritta(et('mezzogiorno vero', 0.9, '#9A6B12')); eM.position.copy(daEq(1, 0, 0).multiplyScalar(R * 1.15).add(new THREE.Vector3(0, -R * 0.62, 0))); mezzodi.add(eM);
    const eMn = scritta(et('mezzanotte', 0.9, '#3B4654')); eMn.position.copy(daEq(-1, 0, 0).multiplyScalar(R * 1.15).add(new THREE.Vector3(0, -R * 0.62, 0))); mezzodi.add(eMn);
    // Il Sole, lontano: una sfera gialla nella sua direzione
    const astroSole = new THREE.Mesh(new THREE.SphereGeometry(R * 0.28, 24, 12), new THREE.MeshBasicMaterial({ color: 0xFFD45A }));
    const eS = et('verso il Sole', 1, '#9A6B12'); g.add(astroSole, eS);
    const DS = opz.luna ? R * 6.2 : R * 2.6;

    // Luna, orbita, eclittica e maree
    const L = {};
    if (opz.luna) {
      L.luna = new THREE.Mesh(new THREE.SphereGeometry(R * 0.27, 32, 16), new THREE.ShaderMaterial({ uniforms: { uSole: sole }, vertexShader: vertice, fragmentShader: frammentoLuna }));
      L.et = et('Luna', 1, '#3B4654'); g.add(L.luna, L.et);
      L.orbita = new THREE.Group(); g.add(L.orbita);
      L.nodi = new THREE.Group(); g.add(L.nodi);
      // Eclittica della data: il piano dove si muove il Sole
      const rot = Astronomy.Rotation_ECT_EQD(Cielo.tempo());
      const ecl = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; const w = Astronomy.RotateVector(rot, new Astronomy.Vector(Math.cos(a), Math.sin(a), 0, Cielo.tempo())); ecl.push(daEq(w.x, w.y, w.z).multiplyScalar(R * 4.6)); }
      g.add(tratto(ecl, r * 0.9, 0xC07A1A, true));
      const eE = et('eclittica', 1, '#9A5B12'); eE.position.copy(ecl[24]).multiplyScalar(1.06); g.add(eE);
      // Ellissoidi di marea: della Luna (blu) e del Sole (rosso, circa metà effetto)
      const ell = (col, f) => { const m = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false })); m.userData.f = f; return m; };
      L.mareaL = ell(0x2E7DB5, 0.16); L.mareaS = ell(0xB3362B, 0.07);
      L.mareaL.visible = false; L.mareaS.visible = false; g.add(L.mareaL, L.mareaS);
      L.quando = null;
    }
    const DL = (km) => R * 3.6 * (km / 384400);

    const tmp = new THREE.Vector3(); const X = new THREE.Vector3(1, 0, 0);
    function allunga(m, dir) {
      const f = m.userData.f;
      m.scale.set(1 + f, 1 - f * 0.35, 1 - f * 0.35);
      m.quaternion.setFromUnitVectors(X, dir);
    }
    function orbita(t0) {
      L.orbita.children.forEach((c) => c.geometry.dispose()); L.orbita.clear();
      L.nodi.children.forEach((c) => { if (c.geometry) c.geometry.dispose(); }); L.nodi.clear();
      const pts = []; const lat = [];
      for (let i = -56; i <= 56; i++) {
        const ms = t0 + i * 6 * 3600e3; const t = Cielo.tempo(ms); const c = Cielo.corpo('Luna', t);
        pts.push(versoEq(c.ra, c.dec).multiplyScalar(DL(c.km)));
        lat.push(Astronomy.EclipticGeoMoon(t).lat);
      }
      L.orbita.add(tratto(pts, r * 0.7, 0x5B6B7C));
      // I nodi: dove l'orbita attraversa l'eclittica
      for (let i = 1; i < lat.length; i++) {
        if (Math.sign(lat[i]) !== Math.sign(lat[i - 1])) {
          const f = lat[i - 1] / (lat[i - 1] - lat[i]); const p = pts[i - 1].clone().lerp(pts[i], f);
          const n = new THREE.Mesh(new THREE.SphereGeometry(R * 0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xC07A1A }));
          n.position.copy(p); L.nodi.add(n);
          const e = et(lat[i] > lat[i - 1] ? 'nodo ascendente' : 'nodo discendente', 0.8, '#9A5B12'); e.position.copy(p).add(new THREE.Vector3(0, R * 0.25, 0)); L.nodi.add(e);
        }
      }
    }

    function aggiorna() {
      const s = Cielo.stato; const t = Cielo.tempo();
      fisso.rotation.y = Cielo.tGamma(t) * RAD;
      const cs = Cielo.corpo('Sole', t); const ds = versoEq(cs.ra, cs.dec);
      sole.value.copy(ds);
      mezzodi.rotation.y = cs.ra * RAD;
      astroSole.position.copy(ds).multiplyScalar(DS); eS.position.copy(ds).multiplyScalar(DS + R * 0.6);
      nave.position.copy(sullaTerra(s.lat, s.lon, R));
      nave.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.copy(nave.position).normalize());
      if (opz.luna) {
        const cl = Cielo.corpo('Luna', t); const dl = versoEq(cl.ra, cl.dec);
        L.luna.position.copy(dl).multiplyScalar(DL(cl.km)); L.et.position.copy(L.luna.position).add(new THREE.Vector3(0, R * 0.5, 0));
        allunga(L.mareaL, dl); allunga(L.mareaS, ds);
        if (L.quando === null || Math.abs(s.data - L.quando) > 2 * 864e5) { L.quando = s.data; orbita(s.data); }
      }
    }
    aggiorna();
    /* Per le esperienze del punto nave: un cerchio sulla Terra (centro lat0, lon0, raggio sferico rho in gradi)
       e un punto segnato. Si aggiungono al gruppo che gira con la Terra (fisso) */
    function cerchio(lat0, lon0, rho, col, sp) {
      const c = sullaTerra(lat0, lon0, 1);
      const u = new THREE.Vector3().crossVectors(c, Math.abs(c.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
      const w = new THREE.Vector3().crossVectors(c, u);
      const p = [];
      for (let i = 0; i < 144; i++) {
        const a = (i / 144) * Math.PI * 2;
        p.push(c.clone().multiplyScalar(Math.cos(rho * RAD)).addScaledVector(u, Math.sin(rho * RAD) * Math.cos(a)).addScaledVector(w, Math.sin(rho * RAD) * Math.sin(a)).multiplyScalar(R * 1.01));
      }
      return tratto(p, r * (sp || 1.6), col, true);
    }
    function punto(lat, lon, col, dim) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(R * (dim || 0.045), 14, 8), new THREE.MeshBasicMaterial({ color: col }));
      m.position.copy(sullaTerra(lat, lon, R * 1.01));
      return m;
    }
    return {
      g, aggiorna, fisso, R, cerchio, punto, etichetta: et,
      marea(si) { if (L.mareaL) { L.mareaL.visible = si; L.mareaS.visible = si; } },
    };
  }
  return { terra, versoEq, sullaTerra };
})();
