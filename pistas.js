/* Turma Turbo — as pistas: traçado, asfalto, enfeites e objetos (caixas de presente, moedas, turbo, rampas). */
'use strict';

const PISTAS = [
  { id: 'floresta', nome: 'Floresta Dino', emoji: '🌳', c1: '#9be36b', c2: '#2f7a24',
    ceu: ['#5fb4ff', '#d7f0ff'], neblina: '#cfeaff', chao: '#6cc04a', fora: '#58a83a', larg: 15, cerca: '#8a5a2b',
    pontos: [[0, 0], [60, -12], [112, 8], [132, 58], [104, 102], [54, 92], [22, 132], [-40, 142], [-92, 112], [-104, 52], [-62, 18]],
    caixas: [0.16, 0.48, 0.76], turbos: [0.3, 0.62, 0.9], rampas: [0.4], moedas: [0.08, 0.24, 0.55, 0.7, 0.85] },
  { id: 'praia', nome: 'Praia do Sol', emoji: '🏖️', c1: '#ffe9a8', c2: '#2aa7d8',
    ceu: ['#3aa0ff', '#fff0c8'], neblina: '#e8f6ff', chao: '#f2d48a', fora: '#e8c477', larg: 15, cerca: '#ffffff',
    pontos: [[0, 0], [80, 0], [140, 30], [152, 90], [112, 122], [72, 92], [30, 112], [-20, 152], [-82, 132], [-112, 72], [-82, 20]],
    caixas: [0.14, 0.45, 0.74], turbos: [0.06, 0.36, 0.66], rampas: [0.56, 0.92], moedas: [0.1, 0.28, 0.5, 0.62, 0.84] },
  { id: 'neve', nome: 'Montanha de Neve', emoji: '⛄', c1: '#ffffff', c2: '#7fb6dc',
    ceu: ['#7fb2e6', '#f0f7ff'], neblina: '#eef5ff', chao: '#f4f9ff', fora: '#dde9f6', larg: 15, cerca: '#d84a4a',
    pontos: [[0, 0], [70, -20], [122, 20], [102, 70], [142, 110], [102, 162], [30, 152], [2, 102], [-50, 132], [-112, 102], [-102, 30], [-52, -10]],
    caixas: [0.12, 0.42, 0.72], turbos: [0.25, 0.55, 0.85], rampas: [0.34, 0.65], moedas: [0.06, 0.2, 0.48, 0.6, 0.8, 0.94] },
  { id: 'ceu', nome: 'Estrada do Céu', emoji: '☁️', c1: '#ffc8f0', c2: '#6b5bff', ceuPista: true,
    ceu: ['#4b3bd6', '#ffb8e8'], neblina: '#e8c8ff', larg: 14,
    pontos: [[0, 0, 0], [70, 0, 6], [132, 40, 14], [132, 112, 24], [72, 152, 30], [2, 132, 24], [-30, 82, 14], [-92, 92, 20], [-132, 42, 12], [-82, -10, 3]],
    caixas: [0.14, 0.44, 0.74], turbos: [0.05, 0.22, 0.52, 0.82], rampas: [0.32, 0.62, 0.9], moedas: [0.1, 0.27, 0.4, 0.58, 0.7, 0.86] },
];

const ESPACO = 1.5;   // distância entre as amostras do traçado

function texCanvas(w, h, desenha, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenha(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function texAsfalto(ceu) {
  return texCanvas(128, 128, (x, w, h) => {
    x.fillStyle = ceu ? '#5146b8' : '#55585f'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      x.fillStyle = ceu ? `rgba(255,255,255,${Math.random() * 0.35})` : `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},255,0.05)`;
      x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    x.fillStyle = ceu ? '#ffe9ff' : '#f3f3f3';
    x.fillRect(w / 2 - 3, 0, 6, h / 2);                             // faixa do meio tracejada
    x.fillStyle = ceu ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.75)';
    x.fillRect(4, 0, 3, h); x.fillRect(w - 7, 0, 3, h);
  });
}
function texZebra(ceu) {
  return texCanvas(16, 64, (x, w, h) => {
    const cores = ceu ? ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ddc84', '#3aa0ff', '#8e6bff', '#ff6bd6', '#ffffff']
                      : ['#e53935', '#ffffff'];
    const n = cores.length, faixa = h / n;
    cores.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * faixa, w, faixa + 1); });
  });
}
function texArcoIris() {
  return texCanvas(64, 8, (x, w, h) => {
    ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ddc84', '#3aa0ff', '#8e6bff'].forEach((c, i) => {
      x.fillStyle = c; x.fillRect(i * w / 6, 0, w / 6 + 1, h);
    });
  });
}
function texXadrez() {
  return texCanvas(64, 16, (x) => {
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) {
      x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 4, j * 4, 4, 4);
    }
  });
}
function texTurbo() {
  return texCanvas(64, 64, (x, w, h) => {
    x.fillStyle = '#ff7a00'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#fff36b'; x.lineWidth = 9; x.lineJoin = 'round';
    for (const y of [12, 36]) { x.beginPath(); x.moveTo(8, y + 18); x.lineTo(32, y); x.lineTo(56, y + 18); x.stroke(); }
  });
}
function texRampa() {
  return texCanvas(64, 64, (x, w, h) => {
    for (let i = -4; i < 8; i++) {
      x.fillStyle = i % 2 ? '#ffd23a' : '#2b2b36';
      x.beginPath(); x.moveTo(i * 12, 0); x.lineTo(i * 12 + 12, 0); x.lineTo(i * 12 + 12 + 24, h); x.lineTo(i * 12 + 24, h); x.fill();
    }
  });
}
function texFaixa(texto, fundo, cor) {
  const t = texCanvas(512, 96, (x, w, h) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h);
    x.fillStyle = cor; x.font = 'italic 900 64px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(texto, w / 2, h / 2 + 4);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texCeu(c1, c2) {
  const t = texCanvas(4, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c1); g.addColorStop(0.75, c2); g.addColorStop(1, c2);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texSombra() {
  const t = texCanvas(64, 64, (x, w, h) => {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

const lamb = {};
function mL(c) { return lamb[c] || (lamb[c] = new THREE.MeshLambertMaterial({ color: c })); }

/* Amostras do traçado: posição, direção (tx,tz), lado (lx,lz: para a esquerda do piloto) e distância. */
function amostra(def) {
  const v = def.pontos.map(p => new THREE.Vector3(p[0], p[2] || 0, p[1]));
  const curva = new THREE.CatmullRomCurve3(v, true, 'centripetal');
  const comp = curva.getLength();
  const N = Math.round(comp / ESPACO);
  const ps = curva.getSpacedPoints(N).slice(0, N);
  const pts = ps.map((p, i) => ({ x: p.x, y: p.y, z: p.z }));
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N], p = pts[i];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1;
    p.tx = tx / l; p.tz = tz / l; p.lx = p.tz; p.lz = -p.tx;
    p.incl = (b.y - a.y) / (2 * ESPACO);
    p.d = i * comp / N;
  }
  return { pts, N, comp };
}

/* Fita ao longo do traçado entre dois afastamentos laterais (a,b) e duas alturas (ya,yb). */
function fita(P, a, b, ya, yb, material, vEsc, i0 = 0, i1 = P.N, extraY) {
  const pos = [], uv = [], idx = [];
  const fechado = i0 === 0 && i1 === P.N;
  const n = fechado ? P.N + 1 : i1 - i0 + 1;
  for (let k = 0; k < n; k++) {
    const i = (i0 + k) % P.N, p = P.pts[i];
    const ey = extraY ? extraY(k, n) : 0;
    pos.push(p.x + p.lx * a, p.y + ya + ey, p.z + p.lz * a, p.x + p.lx * b, p.y + yb + ey, p.z + p.lz * b);
    const v = (fechado ? k * P.comp / P.N : k * ESPACO) / vEsc;
    uv.push(0, v, 1, v);
    if (k < n - 1) { const q = k * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  return m;
}

/* Monta a pista inteira dentro de "cena" e devolve os dados que a corrida usa. */
function montaPista(def, cena) {
  const P = amostra(def);
  P.def = def; P.larg = def.larg; P.meia = def.larg / 2;
  P.limite = def.ceuPista ? P.meia - 0.6 : P.meia + 6;   // até onde o kart pode ir (muro/grade)
  const ceu = !!def.ceuPista;

  cena.background = texCeu(def.ceu[0], def.ceu[1]);
  cena.fog = new THREE.Fog(def.neblina, 90, ceu ? 420 : 330);
  cena.add(new THREE.HemisphereLight(0xffffff, ceu ? 0xb48cff : 0x7f9a5a, 0.85));
  const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(60, 120, 40); cena.add(sol);

  const tAsf = texAsfalto(ceu);
  const mAsf = new THREE.MeshLambertMaterial({ map: tAsf, side: THREE.DoubleSide });
  const mZeb = new THREE.MeshLambertMaterial({ map: texZebra(ceu), side: THREE.DoubleSide });
  cena.add(fita(P, P.meia, -P.meia, 0.03, 0.03, mAsf, 12));
  cena.add(fita(P, P.meia + 1.3, P.meia, 0.06, 0.06, mZeb, 8));
  cena.add(fita(P, -P.meia, -P.meia - 1.3, 0.06, 0.06, mZeb, 8));

  if (ceu) {
    // Estrada flutuando: lateral grossa por baixo e grade de arco-íris dos dois lados.
    const mLado = new THREE.MeshLambertMaterial({ color: '#8e7bff', side: THREE.DoubleSide });
    for (const s of [1, -1]) cena.add(fita(P, s * (P.meia + 1.3), s * (P.meia + 1.3), 0.06, -2.2, mLado, 10));
    cena.add(fita(P, P.meia + 1.3, -P.meia - 1.3, -2.2, -2.2, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide }), 10));
    const mGrade = new THREE.MeshBasicMaterial({ map: texArcoIris(), side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    for (const s of [1, -1]) cena.add(fita(P, s * (P.meia + 1.1), s * (P.meia + 1.1), 0.06, 1.1, mGrade, 6));
  } else {
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), mL(def.chao));
    chao.rotation.x = -Math.PI / 2; chao.position.y = -0.05; cena.add(chao);
    const mFora = mL(def.fora);
    cena.add(fita(P, P.limite + 1, P.meia + 1.3, 0.01, 0.01, mFora, 10));
    cena.add(fita(P, -P.meia - 1.3, -P.limite - 1, 0.01, 0.01, mFora, 10));
    const mCerca = new THREE.MeshLambertMaterial({ color: def.cerca, side: THREE.DoubleSide });
    for (const s of [1, -1]) cena.add(fita(P, s * (P.limite + 0.8), s * (P.limite + 0.8), 0, 0.9, mCerca, 10));
  }

  // Linha de chegada e pórtico com a marca.
  const p0 = P.pts[0];
  const chegada = fita(P, P.meia, -P.meia, 0.07, 0.07, new THREE.MeshBasicMaterial({ map: texXadrez(), side: THREE.DoubleSide }), 3, 0, 2);
  chegada.geometry.attributes.uv.array.forEach((v, i, arr) => { if (i % 2 === 0) arr[i] = v * 4; });
  cena.add(chegada);
  const portico = new THREE.Group();
  for (const s of [1, -1]) portico.add(bloco(0.8, 8, 0.8, '#2b2b36', s * (P.meia + 2), 4, 0));
  const faixa = new THREE.Mesh(new THREE.PlaneGeometry(P.larg + 4.8, 2.4),
    new THREE.MeshBasicMaterial({ map: texFaixa('EG GAMER X', '#111', '#fb6d02'), side: THREE.DoubleSide }));
  faixa.position.y = 7.4; faixa.rotation.y = Math.PI; portico.add(faixa);
  portico.position.set(p0.x, p0.y, p0.z);
  portico.rotation.y = Math.atan2(p0.tx, p0.tz);
  cena.add(portico);

  // Turbos e rampas.
  P.turbos = def.turbos.map((f, n) => {
    const i = Math.floor(f * P.N), lado = [-0.25, 0.25, 0][n % 3] * P.larg;
    const m = fita(P, lado + 2, lado - 2, 0.09, 0.09, new THREE.MeshBasicMaterial({ map: texTurbo(), side: THREE.DoubleSide }), 4.5, i, i + 3);
    cena.add(m);
    return { i, lado };
  });
  const mRampa = new THREE.MeshLambertMaterial({ map: texRampa(), side: THREE.DoubleSide });
  P.rampas = def.rampas.map(f => {
    const i = Math.floor(f * P.N);
    cena.add(fita(P, P.meia - 0.5, -P.meia + 0.5, 0.1, 0.1, mRampa, 3, i, i + 5, (k, n) => k / (n - 1) * 1.5));
    return { i, n: 5 };
  });

  // Caixas de presente (dão um item) e moedas.
  P.caixas = [];
  for (const f of def.caixas) {
    const i = Math.floor(f * P.N);
    for (const s of [-0.36, -0.12, 0.12, 0.36]) {
      const m = presente();
      const p = P.pts[i], l = s * P.larg;
      m.position.set(p.x + p.lx * l, p.y + 1.2, p.z + p.lz * l);
      cena.add(m);
      P.caixas.push({ m, i, lado: l, volta: 0 });
    }
  }
  P.moedas = [];
  const geoMoeda = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 18);
  const mMoeda = new THREE.MeshToonMaterial({ color: '#ffd23a', emissive: '#6b4a00' });
  def.moedas.forEach((f, n) => {
    const i0 = Math.floor(f * P.N), l = [0.22, -0.22, 0][n % 3] * P.larg;
    for (let k = 0; k < 6; k++) {
      const i = (i0 + k * 3) % P.N, p = P.pts[i];
      const m = new THREE.Mesh(geoMoeda, mMoeda);
      m.rotation.z = Math.PI / 2;
      m.position.set(p.x + p.lx * l, p.y + 0.9, p.z + p.lz * l);
      cena.add(m);
      P.moedas.push({ m, i, lado: l, volta: 0 });
    }
  });

  const fixos = new THREE.Group();
  enfeites(def, P, fixos, cena);
  cena.add(junta(fixos));
  return P;
}

function presente() {
  const g = new THREE.Group();
  const caixa = new THREE.Mesh(GEO.caixa, new THREE.MeshToonMaterial({ color: '#ff4d6d', emissive: '#401020' }));
  caixa.scale.setScalar(1.3); g.add(caixa);
  g.add(bloco(1.36, 1.36, 0.28, '#ffe14d', 0, 0, 0));
  g.add(bloco(0.28, 1.36, 1.36, '#ffe14d', 0, 0, 0));
  for (const s of [-1, 1]) { const l = bola(0.28, '#ffe14d', s * 0.22, 0.78, 0, 1, 0.6, 0.6); l.rotation.z = s * 0.5; g.add(l); }
  g.userData.caixa = caixa;
  return g;
}

/* ---------- Enfeites de cada mundo ---------- */
function longe(P, x, z, dmin) {
  const d2 = dmin * dmin;
  for (let i = 0; i < P.N; i += 3) { const p = P.pts[i]; if ((p.x - x) ** 2 + (p.z - z) ** 2 < d2) return false; }
  return true;
}
function espalha(P, n, dmin, raio, cria) {
  let feitos = 0, tent = 0;
  while (feitos < n && tent++ < n * 30) {
    const x = (Math.random() * 2 - 1) * raio + 15, z = (Math.random() * 2 - 1) * raio + 70;
    if (!longe(P, x, z, dmin)) continue;
    cria(x, z, feitos++);
  }
}
// Um pouco de cada lado da pista, perto o bastante para a criança ver passando.
function beira(P, n, dist, cria) {
  for (let k = 0; k < n; k++) {
    const i = Math.floor(Math.random() * P.N), p = P.pts[i], s = Math.random() < 0.5 ? 1 : -1;
    const l = s * (P.limite + dist + Math.random() * 8);
    const x = p.x + p.lx * l, z = p.z + p.lz * l;
    if (longe(P, x, z, P.limite + dist - 1)) cria(x, z, k, p.y);
  }
}

function arvore(cena, x, z, esc) {
  const g = new THREE.Group();
  g.add(malha(GEO.cil, '#8a5a2b', 0, 1.5, 0, 0.35, 3, 0.35));
  g.add(bola(2, '#3f9e34', 0, 4.2, 0)); g.add(bola(1.5, '#57b947', 0.8, 5.2, 0.4)); g.add(bola(1.3, '#4caf50', -0.9, 4.9, -0.3));
  g.position.set(x, 0, z); g.scale.setScalar(esc); cena.add(g);
}
function pinheiro(cena, x, z, esc) {
  const g = new THREE.Group();
  g.add(malha(GEO.cil, '#7a4a24', 0, 1, 0, 0.3, 2, 0.3));
  for (let i = 0; i < 3; i++) {
    g.add(malha(GEO.cone, '#2e7d5b', 0, 2.6 + i * 1.5, 0, 2.2 - i * 0.55, 2.4, 2.2 - i * 0.55));
    g.add(malha(GEO.cone, '#ffffff', 0, 3.4 + i * 1.5, 0, 1.1 - i * 0.3, 0.9, 1.1 - i * 0.3));
  }
  g.position.set(x, 0, z); g.scale.setScalar(esc); cena.add(g);
}
function coqueiro(cena, x, z, esc) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) g.add(bola(0.35, '#a0703c', Math.sin(i * 0.3) * i * 0.25, 0.4 + i * 0.9, 0, 1, 1.4, 1));
  const topo = new THREE.Vector3(Math.sin(1.5) * 1.25, 5.3, 0);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const f = bola(1.6, '#3fae49', topo.x + Math.cos(a) * 1.3, topo.y - 0.3, Math.sin(a) * 1.3, 1.2, 0.18, 0.45);
    f.rotation.y = -a; f.rotation.z = -0.3; g.add(f);
  }
  g.add(bola(0.3, '#6b4a2b', topo.x + 0.3, topo.y - 0.4, 0.2)); g.add(bola(0.3, '#6b4a2b', topo.x - 0.2, topo.y - 0.5, -0.2));
  g.position.set(x, 0, z); g.scale.setScalar(esc); g.rotation.y = Math.random() * 6; cena.add(g);
}
function guardaSol(cena, x, z) {
  const g = new THREE.Group(), c = ['#ff4d6d', '#3aa0ff', '#ffe14d', '#3ddc84'][Math.floor(Math.random() * 4)];
  g.add(malha(GEO.cil, '#ffffff', 0, 1.5, 0, 0.08, 3, 0.08));
  g.add(malha(GEO.cone, c, 0, 3.2, 0, 2, 0.8, 2));
  g.add(bola(0.6, '#ffffff', 1.4, 0.6, 0.6)); g.add(bola(0.6, c, 1.4, 0.6, 0.6, 1.02, 0.4, 1.02));
  g.position.set(x, 0, z); cena.add(g);
}
function boneco(cena, x, z) {
  const g = new THREE.Group();
  g.add(bola(1.1, '#ffffff', 0, 1, 0)); g.add(bola(0.8, '#ffffff', 0, 2.5, 0)); g.add(bola(0.6, '#ffffff', 0, 3.6, 0));
  g.add(chifre([0, 3.6, 0.5], [0, 3.6, 1.1], 0.12, '#ff8a1f'));
  for (const s of [-1, 1]) g.add(bola(0.09, '#222', s * 0.2, 3.8, 0.52));
  g.add(malha(GEO.cil, '#222', 0, 4.25, 0, 0.45, 0.6, 0.45)); g.add(malha(GEO.cil, '#222', 0, 3.98, 0, 0.7, 0.08, 0.7));
  g.add(malha(GEO.cil, '#d84a4a', 0, 3.15, 0, 0.62, 0.2, 0.62));
  g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; cena.add(g);
}
function nuvem(cena, x, y, z, esc) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) g.add(bola(2 + Math.random() * 1.5, '#ffffff', (i - 2.5) * 2.2, Math.random() * 1.2, (Math.random() - 0.5) * 3));
  g.position.set(x, y, z); g.scale.setScalar(esc); cena.add(g);
  return g;
}
function dinoGigante(cena, x, z, ang, cor) {
  const g = new THREE.Group();
  g.add(bola(4, cor, 0, 6, 0, 1.6, 1, 1));
  for (const [a, b] of [[2.6, 2], [2.6, -2], [-2.6, 2], [-2.6, -2]]) g.add(malha(GEO.cil, cor, a, 2.2, b, 0.9, 4.4, 0.9));
  g.add(entre([4.5, 7, 0], [8, 16, 0], 1.1, cor));
  g.add(bola(1.6, cor, 8.6, 16.6, 0, 1.5, 0.9, 1));
  for (const s of [-1, 1]) { g.add(bola(0.4, '#fff', 9.3, 17.2, s * 0.8)); g.add(bola(0.22, '#222', 9.6, 17.25, s * 0.85)); }
  g.add(chifre([-5.5, 6, 0], [-13, 3, 0], 1.4, cor));
  g.position.set(x, 0, z); g.rotation.y = ang; cena.add(g);
}

function enfeites(def, P, cena, vivo) {
  const anim = P.anim = [];
  if (def.id === 'floresta') {
    beira(P, 70, 3, (x, z) => arvore(cena, x, z, 0.8 + Math.random() * 0.7));
    espalha(P, 90, 16, 260, (x, z) => arvore(cena, x, z, 1 + Math.random()));
    dinoGigante(cena, 15, 60, 0.6, '#7fa8e6');
    dinoGigante(cena, 200, 40, 2.4, '#9b7fe6');
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, m = malha(GEO.cone, i % 2 ? '#7a8f6a' : '#8aa070', 15 + Math.cos(a) * 330, 30, 70 + Math.sin(a) * 330, 70, 60, 70);
      cena.add(m);
    }
    const v = malha(GEO.cone, '#7a5040', -260, 40, 220, 80, 80, 80); cena.add(v);
    cena.add(bola(12, '#ff7a2f', -260, 82, 220, 1, 0.3, 1));
    beira(P, 40, 1, (x, z) => cena.add(bola(0.4, ['#ff6bd6', '#ffe14d', '#ffffff'][Math.floor(Math.random() * 3)], x, 0.3, z)));
  } else if (def.id === 'praia') {
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(1600, 900), new THREE.MeshLambertMaterial({ color: '#2aa7d8' }));
    mar.rotation.x = -Math.PI / 2; mar.position.set(15, 0.02, 650); vivo.add(mar);
    anim.push(t => { mar.position.y = 0.02 + Math.sin(t) * 0.05; });
    beira(P, 45, 3, (x, z) => (z < 190 ? coqueiro(cena, x, z, 0.9 + Math.random() * 0.4) : null));
    beira(P, 20, 4, (x, z) => (z < 190 ? guardaSol(cena, x, z) : null));
    espalha(P, 40, 16, 240, (x, z) => (z < 190 ? coqueiro(cena, x, z, 1.1) : null));
    for (let i = 0; i < 6; i++) nuvem(cena, -200 + i * 80, 60 + Math.random() * 20, 260, 2);
    const ilha = bola(30, '#3fae49', 120, -8, 330, 1, 0.5, 1); cena.add(ilha);
  } else if (def.id === 'neve') {
    beira(P, 70, 3, (x, z) => pinheiro(cena, x, z, 0.8 + Math.random() * 0.6));
    beira(P, 12, 4, (x, z) => boneco(cena, x, z));
    espalha(P, 80, 16, 260, (x, z) => pinheiro(cena, x, z, 1 + Math.random()));
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, x = 15 + Math.cos(a) * 320, z = 70 + Math.sin(a) * 320;
      cena.add(malha(GEO.cone, '#a7bfd8', x, 45, z, 80, 90, 80));
      cena.add(malha(GEO.cone, '#ffffff', x, 78, z, 34, 26, 34));
    }
    const neve = flocos(vivo, 900, 140, '#ffffff', 0.7);
    anim.push((t, dt, cam) => {
      const a = neve.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) - dt * 6; if (y < 0) y += 40;
        a.setY(i, y);
      }
      a.needsUpdate = true;
      neve.position.set(cam.position.x, 0, cam.position.z);
    });
  } else {
    // Céu: nuvens embaixo e em volta, estrelas, arco-íris, balões e ilhas flutuando.
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 260;
      nuvem(cena, 15 + Math.cos(a) * r, -25 - Math.random() * 30, 70 + Math.sin(a) * r, 2 + Math.random() * 2);
    }
    for (let i = 0; i < 25; i++) {
      const i0 = Math.floor(Math.random() * P.N), p = P.pts[i0], s = Math.random() < 0.5 ? 1 : -1, l = s * (20 + Math.random() * 30);
      nuvem(cena, p.x + p.lx * l, p.y - 6 + Math.random() * 14, p.z + p.lz * l, 0.8 + Math.random());
    }
    const arco = new THREE.Group();
    ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ddc84', '#3aa0ff', '#8e6bff'].forEach((c, i) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(90 - i * 3, 1.5, 6, 40, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 }));
      arco.add(t);
    });
    arco.position.set(15, -20, 260); cena.add(arco);
    const est = flocos(vivo, 500, 500, '#fff8b0', 1.6);
    est.position.set(15, 120, 70);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Group(), c = ['#ff4d6d', '#ffe14d', '#3aa0ff', '#3ddc84', '#ff9f1c', '#ff6bd6'][i];
      b.add(bola(5, c, 0, 8, 0, 1, 1.15, 1)); b.add(bloco(2.2, 1.6, 2.2, '#a0703c', 0, 0, 0));
      for (const s of [-1, 1]) b.add(entre([s, 0.8, 0], [s * 3, 5, 0], 0.08, '#555'));
      const a = i / 6 * Math.PI * 2, x = 15 + Math.cos(a) * 120, z = 70 + Math.sin(a) * 120;
      b.position.set(x, 20 + i * 4, z); vivo.add(b);
      anim.push(t => { b.position.y = 20 + i * 4 + Math.sin(t * 0.6 + i) * 3; });
    }
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.3, x = 15 + Math.cos(a) * 200, z = 70 + Math.sin(a) * 200;
      const ilha = new THREE.Group();
      ilha.add(malha(GEO.cone, '#9a7055', 0, -8, 0, 14, -16, 14));
      ilha.add(malha(GEO.cil, '#6cc04a', 0, 0, 0, 14, 1.5, 14));
      arvore(ilha, 3, 2, 1.2); arvore(ilha, -4, -3, 1);
      ilha.position.set(x, 5 + i * 6, z); cena.add(ilha);
    }
  }
}

function flocos(cena, n, raio, cor, tam) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * raio; pos[i * 3 + 1] = Math.random() * 40; pos[i * 3 + 2] = (Math.random() * 2 - 1) * raio;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: cor, size: tam, fog: false }));
  cena.add(p);
  return p;
}
