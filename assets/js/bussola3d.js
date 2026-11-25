/* La bussola magnetica nella sospensione cardanica (assets/modelli/sospensione_cardanica.glb, modello del docente).
   Si legge con il lettore GLB del sestante (Sestante3D.leggi): va caricato dopo sestante3d.js.
   Il modello ha la sua animazione «Rollio_e_Beccheggio» (8 s): la base si muove con la nave, i due anelli
   cardanici la compensano e il mortaio con la rosa resta orizzontale.
   Bussola3D.carica() → Promise di un costruttore: nuovo() dà una copia { g, poni(prora, variazione), frame(dt) }.
   Nel modello: y in alto, prua verso +z, rosa con il Nord verso −z e l'Est verso +x. Misure in metri */
window.Bussola3D = (function () {
  const RAD = Math.PI / 180;
  const URL_MODELLO = 'assets/modelli/sospensione_cardanica.glb';
  const PRUA = 180; // azimut della prua nel sistema del modello (−z = 0°, +x = 90°)

  let pronto = null;
  function carica(url = URL_MODELLO) {
    if (!pronto) {
      pronto = Sestante3D.leggi(url).then((modello) => () => {
        const copia = modello.clone();
        const g = new THREE.Group(); g.add(copia);
        const rosa = copia.getObjectByName('Rosa');
        // Nel modello la linea di fede sta verso +x, di lato; la targhetta «Prua», i montanti di dritta (−x) e di
        // sinistra (+x) e il beccheggio attorno a x dicono che la prua è +z: la porto lì, girandola nel mortaio
        const fede = copia.getObjectByName('Linea_di_Fede');
        if (fede) fede.rotation.set(0, -Math.PI / 2, 0);
        const clip = modello.animazioni[0];
        const mixer = new THREE.AnimationMixer(copia);
        if (clip) mixer.clipAction(clip).play();
        return {
          g,
          /* La prua verso la prora vera Rv; la rosa con il suo Nord verso il Nord bussola, a V = d + δ dal Nord vero
             (positiva verso Est). Sotto la linea di fede si legge allora la prora bussola Rv − V */
          poni(prora, variazione) {
            // Una rotazione ψ attorno a y toglie ψ all'azimut: prua → PRUA − ψ = Rv; Nord rosa → −ρ − ψ = V
            g.rotation.y = (PRUA - prora) * RAD;
            rosa.rotation.set(0, (prora - variazione - PRUA) * RAD, 0);
          },
          frame(dt) { if (!clip) return false; mixer.update(dt); return true; },
        };
      });
    }
    return pronto;
  }
  return { carica };
})();
