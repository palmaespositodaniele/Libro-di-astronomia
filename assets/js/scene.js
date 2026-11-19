/* Le scene del cielo condiviso, pronte per il motore: ponte di notte e sfera armillare.
   Ogni scena legge lo stesso stato del cielo (Cielo.stato): cambiandolo in una, le altre lo seguono */
window.Scene = (function () {
  const { pedana } = Tavola;
  const RAD = Math.PI / 180;
  const OCCHIO = 1.6; // occhi sopra il pavimento della controplancia, in metri
  const SC_MINI = 0.022;

  // Il cielo è cambiato? Ogni scena lo sa al suo fotogramma dopo (una bandierina per scena:
  // una lezione può avere un suo ponte accanto a quello del planetario)
  function vedetta() {
    const v = { cambiato: true };
    Cielo.ascolta(() => { v.cambiato = true; });
    return v;
  }

  // Camera dentro la scena: guarda dal punto target nella direzione theta (azimut) e phi (dallo zenit); r è il campo visivo
  function camOcchio(cam, o) {
    cam.position.copy(o.target);
    const s = Math.sin(o.phi);
    cam.lookAt(o.target.x + s * Math.sin(o.theta), o.target.y + Math.cos(o.phi), o.target.z - s * Math.cos(o.theta));
    if (Math.abs(cam.fov - o.r) > 0.01) { cam.fov = o.r; cam.updateProjectionMatrix(); }
  }
  // Camera normale, che gira attorno al modello (come nel libro «La nave»), con il campo visivo di sempre
  function camGiro(cam, o) {
    const s = Math.sin(o.phi);
    cam.position.set(o.target.x + o.r * s * Math.sin(o.theta), o.target.y + o.r * Math.cos(o.phi), o.target.z + o.r * s * Math.cos(o.theta));
    cam.lookAt(o.target);
    if (cam.fov !== 34) { cam.fov = 34; cam.updateProjectionMatrix(); }
  }

  function modellino(prese) {
    const mini = new THREE.Group();
    const s = Volta.sfera(10, 5, prese);
    mini.add(s.g); mini.scale.setScalar(SC_MINI); mini.position.set(0, 0.05, 0);
    return { mini, s };
  }

  /* Ponte di notte: il cielo vero sopra il mare, dalla controplancia, a grandezza vera.
     opz: { guarda: azimut iniziale, phi, frame(dt), extra(radice), leva } */
  function ponte(opz = {}) {
    let m = null;
    return () => {
      if (m) return m;
      const prese = { schermo: [], mini: [] };
      const radice = new THREE.Group();
      const occhi = new THREE.Group(); occhi.position.y = OCCHIO; radice.add(occhi);
      const v = Volta.volta({ R: 850, toccabili: prese.schermo });
      const mare = Volta.mare(800);
      occhi.add(v.g, mare.g, Volta.cardinali(780, 26));
      radice.add(Volta.controplancia());
      if (opz.extra) opz.extra(radice, v);
      const { mini, s } = modellino(prese.mini);
      const p = pedana(0, 1.4, 'controplancia'); p.scale.set(0.2, 1, 0.2); p.visible = false;
      let sopra = null; let nomi = false;
      const vd = vedetta();
      m = {
        radice, modellino: mini, volta: v, sferaMini: s, OCCHIO,
        stazioni: [{ pedana: p, pos: new THREE.Vector3(0, 0, 0), yaw: 0 }],
        vistaIniziale: () => ({ target: new THREE.Vector3(0, OCCHIO, 0), theta: (opz.guarda || 0) * RAD, phi: opz.phi || 1.2, r: 62 }),
        limiti: { phi0: 0.06, phi1: 1.72, r0: 6, r1: 95 },
        camera: camOcchio,
        tocchi: (vista) => (vista === 'mini' ? prese.mini : prese.schermo),
        sopra(ids) {
          const id = ids && ids.find((x) => x.startsWith('astro:'));
          const nome = id ? id.slice(6) : null;
          if (nome === sopra) return false;
          if (sopra && !nomi) v.nomeVisibile(sopra, false);
          sopra = nome; if (nome) v.nomeVisibile(nome, true);
          if (m.puntato) m.puntato(nome);
          return true;
        },
        nomi(si) { nomi = si; Object.keys(v.nomi).forEach((n) => v.nomeVisibile(n, si || n === sopra)); },
        leva: opz.leva,
        frame(dt) {
          const corre = Cielo.scorri();
          let mosso = false;
          if (corre || vd.cambiato) { vd.cambiato = false; v.aggiorna(); mare.aggiorna(v.stato.altSole); s.v.aggiorna(); mosso = true; }
          if (opz.frame && opz.frame(dt)) mosso = true;
          return mosso;
        },
      };
      mare.aggiorna(v.stato.altSole);
      return m;
    };
  }

  /* Sfera armillare: dal di fuori, come modellino. Gli stessi cerchi si accendono uno alla volta */
  function sfera(opz = {}) {
    let m = null;
    return () => {
      if (m) return m;
      const prese = { schermo: [], mini: [] };
      const radice = new THREE.Group();
      const s = Volta.sfera(10, 1, prese.schermo); radice.add(s.g);
      const { mini, s: s2 } = modellino(prese.mini);
      const p = pedana(0, 26, 'fuori dalla sfera'); p.scale.set(0.3, 1, 0.3); p.visible = false;
      let conto = 0;
      const vd = vedetta();
      m = {
        radice, modellino: mini, sfera: s, sferaMini: s2,
        // A grandezza vera la sfera è grande come un'aula: lo studente sta al centro, dove sta l'osservatore
        stazioni: [{ pedana: p, pos: new THREE.Vector3(0, -1.6, 0), yaw: 0 }],
        vistaIniziale: () => ({ target: new THREE.Vector3(0, 0, 0), theta: 0.75, phi: 1.12, r: 44 }),
        camera: camGiro,
        tocchi: (vista) => (vista === 'mini' ? prese.mini : prese.schermo),
        frame(dt) {
          const corre = Cielo.scorri();
          let mosso = false;
          if (corre || vd.cambiato) { vd.cambiato = false; s.v.aggiorna(); s2.v.aggiorna(); mosso = true; }
          conto += dt;
          if (mosso && opz.ogni && conto > 0.3) { conto = 0; opz.ogni(); }
          return mosso;
        },
      };
      return m;
    };
  }

  /* La Terra dallo spazio (globo.js): fusi, meridiano del mezzogiorno vero, la nave; con opz.luna anche Luna,
     orbita, eclittica e maree. opz: { luna, ogni() } */
  function globo(opz = {}) {
    let m = null;
    return () => {
      if (m) return m;
      const R = 8;
      const radice = new THREE.Group();
      const t = window.Globo.terra(R, 1, opz); radice.add(t.g);
      const mini = new THREE.Group(); const t2 = window.Globo.terra(10, 5, opz); mini.add(t2.g);
      mini.scale.setScalar(opz.luna ? SC_MINI * 0.32 : SC_MINI * 0.7); mini.position.set(0, opz.luna ? 0.25 : 0.3, 0);
      const dist = opz.luna ? 150 : 50;
      const p = pedana(0, dist * 0.4, 'nello spazio'); p.scale.set(0.3, 1, 0.3); p.visible = false;
      const vd = vedetta(); let conto = 0;
      m = {
        radice, modellino: mini, terra: t, terraMini: t2,
        stazioni: [{ pedana: p, pos: new THREE.Vector3(0, -1.6, dist * 0.4), yaw: 0 }],
        vistaIniziale: () => ({ target: new THREE.Vector3(0, 0, 0), theta: 0.5, phi: 1.2, r: dist }),
        limiti: { r0: R * 2.2, r1: dist * 1.8 },
        camera: camGiro,
        tocchi: () => [],
        frame(dt) {
          const corre = Cielo.scorri();
          let mosso = false;
          if (corre || vd.cambiato) { vd.cambiato = false; t.aggiorna(); t2.aggiorna(); mosso = true; }
          conto += dt;
          if (mosso && opz.ogni && conto > 0.3) { conto = 0; opz.ogni(); }
          return mosso;
        },
      };
      return m;
    };
  }

  /* Il tavolo di carteggio: un foglio (carta di Mercatore approssimata) disegnato dalla lezione su una tela.
     opz: { disegna(ctx, W, H) }. m.ridisegna() rifà il foglio dopo un cambio. Foglio di 1 m × 0,7 m */
  function carta(opz = {}) {
    let m = null;
    return () => {
      if (m) return m;
      const W = 2048; const H = 1434;
      const tela = document.createElement('canvas'); tela.width = W; tela.height = H;
      const ctx = tela.getContext('2d');
      const tex = new THREE.CanvasTexture(tela); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const foglio = () => {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(1, H / W), new THREE.MeshBasicMaterial({ map: tex }));
        f.rotation.x = -Math.PI / 2; return f;
      };
      const radice = new THREE.Group();
      const tavolo = Tavola.scatola(-0.62, 0.62, 0, 0.96, -0.44, 0.44, 0.006);
      const f1 = foglio(); f1.position.y = 0.962;
      radice.add(tavolo, f1);
      const mini = new THREE.Group(); const f2 = foglio(); mini.add(f2); mini.scale.setScalar(0.3); mini.position.set(0, 0.06, 0);
      const p = pedana(0, 1.2, 'tavolo di carteggio'); p.scale.set(0.15, 1, 0.15); p.visible = false;
      const ridisegna = () => { ctx.save(); opz.disegna(ctx, W, H); ctx.restore(); tex.needsUpdate = true; };
      ridisegna();
      m = {
        radice, modellino: mini, ridisegna,
        stazioni: [{ pedana: p, pos: new THREE.Vector3(0, 0, 0.75), yaw: 0 }],
        vistaIniziale: () => ({ target: new THREE.Vector3(0, 0.96, 0), theta: 0, phi: 0.12, r: 1.0 }),
        limiti: { phi0: 0.02, phi1: 1.2, r0: 0.4, r1: 3 },
        camera: camGiro,
        tocchi: () => [],
        frame() { return false; },
      };
      return m;
    };
  }

  return { ponte, sfera, globo, carta, camOcchio, camGiro, OCCHIO };
})();
