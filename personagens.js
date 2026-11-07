/* Turma Turbo — pilotos e karts, montados com formas simples (esferas, caixas, cones) em estilo desenho.
   Convenção: a frente do kart é +Z, o alto é +Y. */
'use strict';

const PILOTOS = [
  { id: 'gabriel',  nome: 'Gabriel',     tipo: 'menino', cor: '#2f7de1', cor2: '#ffffff', letra: 'G',
    pele: '#f6c9a2', cabelo: '#6a4322', camisa: '#2f7de1', topete: 'ponta' },
  { id: 'matheus',  nome: 'Matheus',     tipo: 'menino', cor: '#ff8a1f', cor2: '#ffffff', letra: 'M',
    pele: '#f2c096', cabelo: '#3d2614', camisa: '#ff8a1f', topete: 'cachos' },
  { id: 'davi',     nome: 'Davi',        tipo: 'menino', cor: '#2fb85a', cor2: '#ffe14d', letra: 'D',
    pele: '#e9b48a', cabelo: '#24170d', camisa: '#2fb85a', topete: 'liso' },
  { id: 'rex',      nome: 'Rex',         tipo: 'rex',    cor: '#e53935', cor2: '#ffd23a', letra: 'R', pele: '#57b947' },
  { id: 'tri',      nome: 'Tri',         tipo: 'tri',    cor: '#8e44ad', cor2: '#ffffff', letra: 'T', pele: '#f0a63a' },
  { id: 'pesco',    nome: 'Pesco',       tipo: 'pesco',  cor: '#ffd23a', cor2: '#2f7de1', letra: 'P', pele: '#7fa8e6' },
  { id: 'cachorro', nome: 'Cachorrinho', tipo: 'cao',    cor: '#00a3b4', cor2: '#ffffff', letra: 'C', pele: '#c4884e' },
  { id: 'gato',     nome: 'Gatinho',     tipo: 'gato',   cor: '#ff5fa2', cor2: '#ffffff', letra: 'G', pele: '#f39a3c' },
];

const GEO = {
  esfera: new THREE.SphereGeometry(1, 18, 12),
  bolinha: new THREE.SphereGeometry(1, 10, 7),
  folha: new THREE.IcosahedronGeometry(1, 1),
  pedra: new THREE.IcosahedronGeometry(1, 0),
  tronco: new THREE.CylinderGeometry(0.65, 1, 1, 8),
  caixa: new THREE.BoxGeometry(1, 1, 1),
  cil: new THREE.CylinderGeometry(1, 1, 1, 12),
  cone: new THREE.ConeGeometry(1, 1, 10),
  sorriso: new THREE.TorusGeometry(0.12, 0.026, 5, 10, Math.PI),
  volante: new THREE.TorusGeometry(0.17, 0.035, 5, 14),
};
const MATS = {};
// Materiais com luz realista: "tinta" brilha como carro novo, "metal" reflete, "borracha" é fosca, "folha" fica facetada.
function mat(c, tipo = '') {
  const ch = c + tipo;
  if (!MATS[ch]) {
    const o = { color: c, roughness: 0.62, metalness: 0 };
    if (tipo === 'tinta') { o.roughness = 0.22; o.metalness = 0.35; }
    else if (tipo === 'metal') { o.roughness = 0.2; o.metalness = 1; }
    else if (tipo === 'borracha') { o.roughness = 0.92; }
    else if (tipo === 'pelo') { o.roughness = 0.9; }
    else if (tipo === 'folha') { o.roughness = 0.85; o.flatShading = true; }
    else if (tipo === 'brilho') { o.roughness = 0.08; }
    o.envMapIntensity = tipo === 'tinta' || tipo === 'metal' || tipo === 'brilho' ? 0.9 : 0.3;   // reflexo forte só no que brilha
    MATS[ch] = new THREE.MeshStandardMaterial(o);
  }
  return MATS[ch];
}
const qualMat = c => (typeof c === 'string' ? mat(c) : c);

/* Cores certas na tela: as cores são escritas como no desenho (sRGB) e a luz é calculada em linear.
   Passa uma vez por cada material novo de um objeto já montado. */
function corReal(obj) {
  obj.traverse(o => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      if (m.userData.corReal) continue;
      m.userData.corReal = true;
      if (m.color && !m.vertexColors) m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear();
      if (m.map) { m.map.encoding = THREE.sRGBEncoding; m.map.needsUpdate = true; }
    }
  });
  return obj;
}

function malha(geo, c, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, qualMat(c));
  m.position.set(x, y, z);
  m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  return m;
}
const bola = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => malha(r < 0.16 || r > 1.5 ? GEO.bolinha : GEO.esfera, c, x, y, z, r * sx, r * sy, r * sz);
const bloco = (w, h, d, c, x, y, z) => malha(GEO.caixa, c, x, y, z, w, h, d);

// Cilindro (ou cone) esticado entre dois pontos.
const _cima = new THREE.Vector3(0, 1, 0);
function entre(a, b, r, c, geo = GEO.cil) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const m = new THREE.Mesh(geo, qualMat(c));
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_cima, d.clone().normalize());
  m.scale.set(r, d.length(), r);
  return m;
}
function chifre(base, ponta, r, c) { return entre(base, ponta, r, c, GEO.cone); }

function olhos(g, y, z, sep, r = 0.11, olhar = 0.09) {
  for (const s of [-1, 1]) {
    g.add(bola(r, '#ffffff', s * sep, y, z));
    g.add(bola(r * 0.55, mat('#1c1c28', 'brilho'), s * sep, y + r * 0.05, z + olhar));
    g.add(bola(r * 0.18, '#ffffff', s * sep + r * 0.2, y + r * 0.3, z + olhar + r * 0.4));
  }
}
function boca(g, y, z, c = '#7a2a1a', esc = 1) {
  const m = new THREE.Mesh(GEO.sorriso, mat(c));
  m.position.set(0, y, z); m.rotation.z = Math.PI; m.scale.setScalar(esc);
  g.add(m);
}
// Bracinhos do ombro até o volante.
function bracos(g, cor, mao, ombroY = 0.98, largura = 0.3) {
  for (const s of [-1, 1]) {
    g.add(entre([s * largura, ombroY, -0.12], [s * 0.15, 0.86, 0.36], 0.075, cor));
    g.add(bola(0.085, mao, s * 0.15, 0.86, 0.38));
  }
}

function criaPiloto(p) {
  const g = new THREE.Group();
  const corpo = p.tipo === 'menino' ? p.camisa : p.pele;
  g.add(bola(0.34, corpo, 0, 0.86, -0.15, 1, 1.05, 0.85));
  if (p.tipo === 'menino') menino(g, p);
  else if (p.tipo === 'rex') rex(g, p);
  else if (p.tipo === 'tri') tri(g, p);
  else if (p.tipo === 'pesco') pesco(g, p);
  else if (p.tipo === 'cao') cao(g, p);
  else gato(g, p);
  return g;
}

function menino(g, p) {
  g.add(bola(0.18, '#ffffff', 0, 0.9, 0.12, 1, 0.9, 0.5));         // letra/peito claro
  bracos(g, p.camisa, p.pele);
  g.add(bola(0.42, p.pele, 0, 1.45, -0.05));                        // cabeça grande, de desenho
  for (const s of [-1, 1]) g.add(bola(0.1, p.pele, s * 0.41, 1.44, -0.06, 0.6, 1, 1));
  const cab = mat(p.cabelo, 'pelo');
  g.add(bola(0.45, cab, 0, 1.56, -0.17, 1, 0.86, 1));               // cabelo
  if (p.topete === 'ponta') {
    g.add(chifre([0.02, 1.86, 0.05], [0.12, 2.08, 0.18], 0.12, cab));
    g.add(chifre([-0.12, 1.84, 0.08], [-0.2, 2.02, 0.24], 0.09, cab));
  } else if (p.topete === 'cachos') {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      g.add(bola(0.15, cab, Math.cos(a) * 0.3, 1.82 + Math.sin(a * 2) * 0.03, -0.12 + Math.sin(a) * 0.3));
    }
    g.add(bola(0.16, cab, 0, 1.95, -0.1));
  } else {
    g.add(bola(0.3, cab, 0, 1.72, 0.14, 1.2, 0.35, 0.7));      // franjinha
  }
  olhos(g, 1.5, 0.33, 0.15);
  g.add(bola(0.055, '#e09a72', 0, 1.42, 0.42));
  for (const s of [-1, 1]) g.add(bola(0.07, '#ff9d9d', s * 0.25, 1.35, 0.32, 1, 0.7, 0.5));
  boca(g, 1.31, 0.37);
}

function dinoOlhos(g, y, z, sep) { olhos(g, y, z, sep, 0.1, 0.07); }

function rex(g, p) {
  const claro = '#c9eca0';
  bracos(g, p.pele, p.pele, 0.9, 0.26);
  g.add(bola(0.22, claro, 0, 0.84, 0.08, 1, 1.2, 0.5));
  g.add(bola(0.36, p.pele, 0, 1.45, 0.0, 1, 0.92, 1.05));           // cabeça
  g.add(bola(0.3, p.pele, 0, 1.4, 0.3, 0.95, 0.66, 1.0));           // focinho
  g.add(bola(0.27, claro, 0, 1.25, 0.26, 0.9, 0.42, 1.0));          // queixo
  for (let i = 0; i < 4; i++) for (const s of [-1, 1])
    g.add(malha(GEO.cone, '#ffffff', s * (0.08 + i * 0.05), 1.3, 0.52 - i * 0.07, 0.03, -0.07, 0.03));
  for (const s of [-1, 1]) g.add(bola(0.03, '#2b5d22', s * 0.08, 1.48, 0.58));
  dinoOlhos(g, 1.68, 0.12, 0.16);
  for (let i = 0; i < 5; i++)                                      // espinhos nas costas
    g.add(malha(GEO.cone, '#ff9a2f', 0, 1.74 - i * 0.22, -0.22 - i * 0.07, 0.07, 0.18, 0.07));
  g.add(chifre([0, 0.62, -0.6], [0, 0.75, -1.55], 0.22, p.pele));   // rabo para fora do kart
}

function tri(g, p) {
  const babado = '#d8432f';
  bracos(g, p.pele, p.pele, 0.9, 0.26);
  g.add(bola(0.36, p.pele, 0, 1.4, 0.02, 1, 0.9, 1.1));
  g.add(chifre([0, 1.3, 0.3], [0, 1.25, 0.62], 0.13, '#f7d27a'));    // bico
  const f = malha(GEO.cil, babado, 0, 1.62, -0.22, 0.55, 0.06, 0.55);
  f.rotation.x = -1.1; g.add(f);                                   // babado da cabeça
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.1 + i * 0.8 / 6);
    const b = bola(0.08, '#ffd23a', Math.cos(a) * 0.5, 1.62 + Math.sin(a) * 0.47, -0.22 - Math.sin(a) * 0.2);
    g.add(b);
  }
  for (const s of [-1, 1]) g.add(chifre([s * 0.15, 1.66, 0.2], [s * 0.2, 2.0, 0.55], 0.06, '#fff6dc'));
  g.add(chifre([0, 1.48, 0.42], [0, 1.62, 0.55], 0.05, '#fff6dc'));
  dinoOlhos(g, 1.55, 0.3, 0.17);
  boca(g, 1.26, 0.38, '#7a2a1a', 0.9);
  g.add(chifre([0, 0.62, -0.6], [0, 0.68, -1.4], 0.2, p.pele));
}

function pesco(g, p) {
  const claro = '#cfe0ff';
  bracos(g, p.pele, p.pele, 0.9, 0.26);
  g.add(bola(0.2, claro, 0, 0.86, 0.1, 1, 1.2, 0.5));
  g.add(entre([0, 1.0, -0.12], [0, 2.15, 0.12], 0.14, p.pele));     // pescoção
  for (let i = 0; i < 4; i++) g.add(bola(0.06, '#5d86c8', 0, 1.2 + i * 0.25, -0.2 + i * 0.05));
  g.add(bola(0.23, p.pele, 0, 2.25, 0.18, 1, 0.85, 1.3));
  dinoOlhos(g, 2.34, 0.3, 0.12);
  for (const s of [-1, 1]) g.add(bola(0.05, '#ff9d9d', s * 0.15, 2.18, 0.38, 1, 0.7, 0.5));
  boca(g, 2.16, 0.45, '#2c3d6a', 0.6);
  g.add(chifre([0, 0.62, -0.6], [0, 0.95, -1.7], 0.2, p.pele));
}

function cao(g, p) {
  const escuro = '#7a4a24', focinho = '#f6e2c6';
  bracos(g, p.pele, focinho);
  g.add(bola(0.18, focinho, 0, 0.86, 0.1, 1, 1.2, 0.5));
  g.add(bola(0.4, p.pele, 0, 1.45, -0.05));
  g.add(bola(0.21, focinho, 0, 1.33, 0.27, 1.25, 0.85, 1));
  g.add(bola(0.075, '#1c1c28', 0, 1.42, 0.47, 1.2, 0.9, 1));
  g.add(bola(0.075, '#ff6f91', 0, 1.2, 0.4, 1, 0.55, 0.9));          // linguinha
  g.add(bola(0.16, escuro, 0.15, 1.56, 0.25, 1, 1, 0.5));           // mancha no olho
  dinoOlhos(g, 1.56, 0.29, 0.15);
  for (const s of [-1, 1]) {                                       // orelhas caídas
    const o = bola(0.17, escuro, s * 0.4, 1.38, -0.05, 0.55, 1.5, 0.9);
    o.rotation.z = s * 0.35; g.add(o);
  }
  g.add(chifre([0, 0.7, -0.62], [0, 1.15, -1.05], 0.08, p.pele));   // rabinho abanando
}

function gato(g, p) {
  const branco = '#fff6ea', rosa = '#ff9db5';
  bracos(g, p.pele, branco);
  g.add(bola(0.18, branco, 0, 0.86, 0.1, 1, 1.2, 0.5));
  g.add(bola(0.4, p.pele, 0, 1.45, -0.05, 1.05, 0.95, 1));
  for (const s of [-1, 1]) {
    g.add(chifre([s * 0.22, 1.72, -0.05], [s * 0.34, 2.02, -0.05], 0.14, p.pele));
    g.add(chifre([s * 0.22, 1.74, 0.0], [s * 0.32, 1.95, 0.02], 0.07, rosa));
  }
  for (let i = 0; i < 3; i++) g.add(bloco(0.08, 0.04, 0.2, '#c96f1c', -0.12 + i * 0.12, 1.8, -0.1));   // listrinhas
  g.add(bola(0.18, branco, 0, 1.32, 0.28, 1.3, 0.75, 0.8));
  g.add(bola(0.05, rosa, 0, 1.39, 0.42, 1.3, 0.8, 1));
  dinoOlhos(g, 1.53, 0.3, 0.16);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {           // bigodes
    const b = bloco(0.32, 0.012, 0.012, '#4a3020', s * 0.32, 1.33 + (i - 1) * 0.05, 0.33);
    b.rotation.z = s * (i - 1) * -0.25; g.add(b);
  }
  boca(g, 1.25, 0.39, '#7a2a1a', 0.7);
  for (let i = 0; i < 6; i++)                                      // rabo enrolado para cima
    g.add(bola(0.08, i % 2 ? '#c96f1c' : p.pele, 0, 0.7 + i * 0.13, -0.7 - Math.sin(i * 0.5) * 0.3));
}

/* Junta todas as pecinhas paradas de um grupo em uma malha por cor: o celular desenha bem menos vezes por quadro.
   Só posição e normal (as peças juntadas não usam textura). */
function junta(grupo) {
  grupo.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grupo.matrixWorld).invert();
  const porMat = new Map();
  grupo.traverse(o => { if (o.isMesh) { if (!porMat.has(o.material)) porMat.set(o.material, []); porMat.get(o.material).push(o); } });
  const saida = new THREE.Group();
  saida.position.copy(grupo.position); saida.rotation.copy(grupo.rotation); saida.scale.copy(grupo.scale);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(), mt = new THREE.Matrix4();
  for (const [material, lista] of porMat) {
    let nv = 0, ni = 0;
    for (const o of lista) { const g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const o of lista) {
      const g = o.geometry, p = g.attributes.position, n = g.attributes.normal;
      mt.multiplyMatrices(inv, o.matrixWorld);
      nm.getNormalMatrix(mt);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(mt); pos[(ov + i) * 3] = v.x; pos[(ov + i) * 3 + 1] = v.y; pos[(ov + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor[(ov + i) * 3] = v.x; nor[(ov + i) * 3 + 1] = v.y; nor[(ov + i) * 3 + 2] = v.z;
      }
      const ci = g.index ? g.index.count : p.count;
      for (let i = 0; i < ci; i++) idx[oi + i] = (g.index ? g.index.getX(i) : i) + ov;
      if (mt.determinant() < 0) for (let i = oi; i < oi + ci; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      ov += p.count; oi += ci;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    saida.add(new THREE.Mesh(g, material));
  }
  return saida;
}

// Textura com a letra do piloto (vai na asa traseira, aparece para a câmera de trás).
function texLetra(letra, cor) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = cor; x.fillRect(0, 0, 128, 64);
  x.fillStyle = '#fff'; x.font = 'bold 54px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(letra, 64, 36);
  return new THREE.CanvasTexture(c);
}

function criaKart(p) {
  const k = new THREE.Group(), corpo = new THREE.Group();
  const cor = mat(p.cor, 'tinta'), cor2 = mat(p.cor2, 'tinta'), cromo = mat('#cfd6e0', 'metal');
  corpo.add(bloco(1.25, 0.22, 1.9, cor, 0, 0.36, 0));
  corpo.add(bola(0.5, cor, 0, 0.47, 0.72, 1.05, 0.42, 0.95));
  corpo.add(bloco(1.05, 0.18, 0.3, cor2, 0, 0.33, 1.07));
  for (const s of [-1, 1]) corpo.add(bloco(0.24, 0.3, 1.0, cor2, s * 0.62, 0.48, -0.05));
  corpo.add(bloco(0.78, 0.6, 0.14, '#2b2b36', 0, 0.76, -0.56));
  corpo.add(bloco(0.72, 0.36, 0.42, '#5b5f6b', 0, 0.58, -0.86));
  for (const s of [-1, 1]) {
    const e = malha(GEO.cil, cromo, s * 0.2, 0.62, -1.12, 0.075, 0.35, 0.075);
    e.rotation.x = Math.PI / 2; corpo.add(e);
    corpo.add(bloco(0.06, 0.42, 0.06, '#2b2b36', s * 0.42, 0.88, -0.95));
  }
  corpo.add(bloco(1.35, 0.08, 0.34, cor, 0, 1.1, -0.95));
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.32), new THREE.MeshBasicMaterial({ map: texLetra(p.letra, p.cor) }));
  placa.position.set(0, 0.92, -1.14); placa.rotation.y = Math.PI; k.add(placa);
  const v = new THREE.Mesh(GEO.volante, mat('#2b2b36'));
  v.position.set(0, 0.86, 0.38); v.rotation.x = -0.55; corpo.add(v);
  corpo.add(bola(0.05, '#ffd23a', 0, 0.86, 0.39));
  k.add(junta(corpo));

  const rodas = [], frente = [];
  for (const [x, z, r] of [[0.7, 0.68, 0.28], [-0.7, 0.68, 0.28], [0.72, -0.7, 0.34], [-0.72, -0.7, 0.34]]) {
    const apoio = new THREE.Group(); apoio.position.set(x, r, z);
    const giro = new THREE.Group(); apoio.add(giro);
    const pneu = malha(GEO.cil, mat('#1e1e24', 'borracha'), 0, 0, 0, r, 0.27, r); pneu.rotation.z = Math.PI / 2;
    const roda = malha(GEO.cil, cromo, Math.sign(x) * 0.02, 0, 0, r * 0.5, 0.29, r * 0.5); roda.rotation.z = Math.PI / 2;
    giro.add(pneu, roda);
    k.add(apoio); rodas.push(giro);
    if (z > 0) frente.push(apoio);
  }
  const piloto = junta(criaPiloto(p));
  k.add(piloto);
  k.userData = { rodas, frente, piloto };
  return k;
}
