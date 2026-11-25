/* Il sestante vero (assets/modelli/sestante.glb, copia leggera fatta con strumenti/alleggerisci-glb.ps1).
   Un lettore GLB minimo, senza dipendenze: il libro usa script classici e three.js r158 non ha più il
   GLTFLoader classico. I materiali sono matcap: il libro non ha luci, e nel visore costano poco.
   Sestante3D.carica() → Promise di un costruttore: nuovo() dà una copia { g, poni(lettura, vetriniGiu) }.
   Nella copia: piano del telaio = xy, perno dell'alidada nell'origine, lembo in basso, strumenti verso +z
   (come il sestante schematico dell'esperienza 7). Misure in metri */
window.Sestante3D = (function () {
  const RAD = Math.PI / 180;
  const URL_MODELLO = 'assets/modelli/sestante.glb';
  // Angolo dell'alidada (attorno al perno, nel telaio del modello) per la lettura 0: la tacca lunga dello 0.
  // Misurato sulla geometria del lembo: tacche lunghe ogni 5° di arco da 26,55° (0) a −33,45° (120)
  const ZERO = 26.55;

  /* Matcap disegnati su tela: una sfera illuminata dall'alto a sinistra */
  function matcap(base, luce, ombra, lucido) {
    const S = 256; const t = document.createElement('canvas'); t.width = S; t.height = S;
    const c = t.getContext('2d');
    const g = c.createRadialGradient(S * 0.36, S * 0.32, S * 0.02, S * 0.5, S * 0.5, S * 0.52);
    g.addColorStop(0, luce); g.addColorStop(lucido ? 0.18 : 0.45, base); g.addColorStop(1, ombra);
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(t); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  let MC = null;
  const mc = () => MC || (MC = {
    neutro: matcap('#C9C4BA', '#FFFFFF', '#4A4640', false),
    metallo: matcap('#9A9A9A', '#FFFFFF', '#2A2A2A', true),
    scuro: matcap('#2A2B2E', '#8A8D94', '#060607', false),
  });

  function materiale(def, mappe) {
    const pbr = def.pbrMetallicRoughness || {};
    const f = pbr.baseColorFactor || [1, 1, 1, 1];
    const col = new THREE.Color().setRGB(f[0], f[1], f[2]); // fattori glTF: lineari, come lo spazio di lavoro
    const ext = def.extensions || {};
    const lato = THREE.DoubleSide;
    if (ext.KHR_materials_transmission) {
      // Vetri: trasparenti; i vetrini colorati più pieni, così si vede che sono abbassati
      const vetrino = /^Shade_/.test(def.name);
      return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: vetrino ? 0.62 : 0.18, depthWrite: false, side: lato });
    }
    const mappa = pbr.baseColorTexture ? mappe[pbr.baseColorTexture.index] : null;
    const metallico = pbr.metallicFactor === undefined ? 1 : pbr.metallicFactor;
    const scuro = !mappa && Math.max(f[0], f[1], f[2]) < 0.05;
    if (scuro) return new THREE.MeshMatcapMaterial({ matcap: mc().scuro, side: lato });
    const m = new THREE.MeshMatcapMaterial({ matcap: metallico > 0.5 && !mappa ? mc().metallo : mc().neutro, side: lato });
    if (mappa) m.map = mappa; else m.color = col.convertLinearToSRGB().lerp(new THREE.Color(1, 1, 1), 0.1).convertSRGBToLinear();
    return m;
  }

  async function leggiGlb(url) {
    const buf = await (await fetch(url)).arrayBuffer();
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('non è un GLB');
    const lj = dv.getUint32(12, true);
    const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, lj)));
    const bin = 20 + lj + 8;
    const fetta = (i) => { const v = j.bufferViews[i]; const da = bin + (v.byteOffset || 0); return buf.slice(da, da + v.byteLength); };
    const TIPI = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
    const DIM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    const acc = (i) => {
      const a = j.accessors[i]; const T = TIPI[a.componentType];
      const v = j.bufferViews[a.bufferView]; const da = bin + (v.byteOffset || 0) + (a.byteOffset || 0);
      return { arr: new T(buf.slice(da, da + a.count * DIM[a.type] * T.BYTES_PER_ELEMENT)), n: DIM[a.type] };
    };
    // Immagini → texture (glTF: niente capovolgimento)
    const immagini = await Promise.all((j.images || []).map(async (im) => {
      const blob = new Blob([fetta(im.bufferView)], { type: im.mimeType });
      const bmp = await createImageBitmap(blob);
      const t = new THREE.Texture(bmp); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
      return t;
    }));
    const mappe = (j.textures || []).map((t) => immagini[t.source]);
    const materiali = (j.materials || []).map((d) => materiale(d, mappe));
    const geometrie = j.meshes.map((me) => me.primitives.map((p) => {
      const g = new THREE.BufferGeometry();
      const A = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv' };
      Object.keys(A).forEach((k) => { if (p.attributes[k] !== undefined) { const a = acc(p.attributes[k]); g.setAttribute(A[k], new THREE.BufferAttribute(a.arr, a.n)); } });
      if (p.indices !== undefined) g.setIndex(new THREE.BufferAttribute(acc(p.indices).arr, 1));
      return { g, m: materiali[p.material] || materiali[0] };
    }));
    const nodi = j.nodes.map((n) => {
      let o;
      if (n.mesh !== undefined) {
        const ps = geometrie[n.mesh];
        if (ps.length === 1) o = new THREE.Mesh(ps[0].g, ps[0].m);
        else { o = new THREE.Group(); ps.forEach((p) => o.add(new THREE.Mesh(p.g, p.m))); }
      } else o = new THREE.Group();
      o.name = n.name || '';
      if (n.matrix) new THREE.Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale);
      if (n.translation) o.position.fromArray(n.translation);
      if (n.rotation) o.quaternion.fromArray(n.rotation);
      if (n.scale) o.scale.fromArray(n.scale);
      return o;
    });
    j.nodes.forEach((n, i) => (n.children || []).forEach((c) => nodi[i].add(nodi[c])));
    const radice = new THREE.Group();
    j.scenes[j.scene || 0].nodes.forEach((i) => radice.add(nodi[i]));
    // Animazioni → AnimationClip con le tracce per nome di nodo (i nodi animati non devono avere punti nel nome).
    // Stanno fuori da userData: clone() non le copierebbe
    const TRACCE = { rotation: ['quaternion', THREE.QuaternionKeyframeTrack], translation: ['position', THREE.VectorKeyframeTrack], scale: ['scale', THREE.VectorKeyframeTrack] };
    radice.animazioni = (j.animations || []).map((an) => new THREE.AnimationClip(an.name || 'anim', -1, an.channels.filter((ch) => TRACCE[ch.target.path]).map((ch) => {
      const s = an.samplers[ch.sampler]; const [prop, T] = TRACCE[ch.target.path];
      return new T(`${j.nodes[ch.target.node].name}.${prop}`, acc(s.input).arr, acc(s.output).arr, s.interpolation === 'STEP' ? THREE.InterpolateDiscrete : THREE.InterpolateLinear);
    })));
    return radice;
  }

  // Centro e asse (il lato più lungo) di un perno cilindrico, nel sistema del genitore p
  function asse(mesh, p) {
    mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox; const d = new THREE.Vector3(); b.getSize(d);
    const loc = d.x >= d.y && d.x >= d.z ? new THREE.Vector3(1, 0, 0) : d.y >= d.z ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    p.updateMatrixWorld(true);
    const m = new THREE.Matrix4().copy(p.matrixWorld).invert().multiply(mesh.matrixWorld);
    const centro = b.getCenter(new THREE.Vector3()).applyMatrix4(m);
    const dir = loc.transformDirection(m);
    return { centro, dir };
  }
  // Un perno nel punto c con asse dir: un gruppo orientato (asse x lungo dir) e dentro quello che gira
  // (rotation.x); i pezzi passano sotto il secondo senza muoversi
  function perno(genitore, c, dir, pezzi) {
    const q = new THREE.Group(); q.position.copy(c);
    q.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
    const giro = new THREE.Group(); q.add(giro);
    genitore.add(q); q.updateMatrixWorld(true);
    pezzi.forEach((o) => giro.attach(o));
    return giro;
  }

  function prepara(g) {
    g.updateMatrixWorld(true);
    const braccio = g.getObjectByName('Index_Arm');
    // Tamburo: gira attorno all'asse x del braccio, nel centro della sua scala
    const scala = g.getObjectByName('Drum_Scale'); scala.geometry.computeBoundingBox();
    const cs = scala.geometry.boundingBox.getCenter(new THREE.Vector3());
    const parti = []; braccio.children.forEach((o) => { if (/^Drum(Num|_Graduations|_Knurl|_Scale)/.test(o.name)) parti.push(o); });
    const tamburo = perno(braccio, new THREE.Vector3(0, cs.y, cs.z), new THREE.Vector3(1, 0, 0), parti);
    // Vetrini: girano a ventaglio attorno al loro perno. Nel modello alcuni sono abbassati e altri no:
    // ogni vetrino ha il suo angolo; «giù» è l'angolo del vetrino 0 (davanti allo specchio), «su» 100° più in là,
    // dalla parte lontana dal telaio
    const ribalte = [];
    ['Index_Shades', 'Horizon_Shades'].forEach((nome) => {
      const gr = g.getObjectByName(nome);
      const ax = gr.children.find((o) => /_Axle$/.test(o.name));
      const { centro, dir } = asse(ax, gr);
      const lastre = gr.children.filter((o) => /_Shade_\d+$/.test(o.name));
      const pezzi = lastre.map((l) => {
        const giro = perno(gr, centro, dir, [l]);
        const vetro = l.children.find((o) => /_Glass$/.test(o.name)) || l;
        vetro.geometry.computeBoundingBox();
        const c = vetro.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(vetro.matrixWorld);
        giro.updateMatrixWorld(true); c.applyMatrix4(new THREE.Matrix4().copy(giro.matrixWorld).invert());
        return { giro, vetro, a0: Math.atan2(c.z, c.y) };
      });
      const giu = pezzi[0].a0;
      // Il verso che allontana dal telaio: quello che fa salire il vetro (y del modello)
      const { giro: prova, vetro } = pezzi[0];
      const centroVetro = () => { gr.updateMatrixWorld(true); return vetro.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(vetro.matrixWorld); };
      prova.rotation.x = 0.3; const v0 = centroVetro();
      prova.rotation.x = -0.3; const v1 = centroVetro(); prova.rotation.x = 0;
      const verso = new THREE.Vector3().subVectors(v0, v1).applyQuaternion(gr.getWorldQuaternion(new THREE.Quaternion()).invert()).y >= 0 ? 1 : -1;
      pezzi.forEach((p) => ribalte.push({ giro: p.giro, giu: giu - p.a0, su: giu + verso * 100 * RAD - p.a0 }));
    });
    let ultimo = null;
    return {
      braccio, tamburo, ribalte,
      poni(lettura, giu) {
        const k = `${lettura}|${giu}`; if (k === ultimo) return false; ultimo = k;
        braccio.rotation.y = (ZERO - lettura / 2) * RAD;
        tamburo.rotation.x = -lettura * 2 * Math.PI; // un giro di tamburo = 1° di lettura
        ribalte.forEach((r) => { r.giro.rotation.x = giu ? r.giu : r.su; });
        return true;
      },
    };
  }

  let pronto = null;
  function carica(url = URL_MODELLO) {
    if (!pronto) {
      pronto = leggiGlb(url).then((modello) => () => {
        const copia = modello.clone();
        // Il telaio del modello sta nel piano xz: lo porto nel piano xy, strumenti verso +z
        const s = copia.getObjectByName('Sextant'); s.rotation.set(Math.PI / 2, 0, 0);
        const g = new THREE.Group(); g.add(copia);
        const ctrl = prepara(copia);
        return { g, poni: ctrl.poni, ctrl };
      });
    }
    return pronto;
  }
  // leggi: il lettore GLB, usato anche dalla bussola (bussola3d.js)
  return { carica, ZERO, leggi: leggiGlb };
})();
