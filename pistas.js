/* Turma Turbo — as pistas: traçado, asfalto, enfeites e objetos (caixas de presente, moedas, turbo, rampas). */
'use strict';

/* 5 mundos × 4 pistas = 20 pistas. A 1ª de cada mundo tem traçado feito à mão; as outras são geradas
   (sempre iguais) e cada uma tem uma hora do dia e uma música própria. */
const MUNDOS = [
  { id: 'floresta', nome: 'Floresta', emoji: '🌳', c1: '#9be36b', c2: '#2f7a24',
    ceu: ['#5fb4ff', '#d7f0ff'], neblina: '#cfeaff', chao: '#6cc04a', fora: '#58a83a', larg: 15, cerca: '#8a5a2b',
    pontos: [[0, 0], [60, -12], [112, 8], [132, 58], [104, 102], [54, 92], [22, 132], [-40, 142], [-92, 112], [-104, 52], [-62, 18]],
    rampas: [0.4] },
  { id: 'praia', nome: 'Praia', emoji: '🏖️', c1: '#ffe9a8', c2: '#2aa7d8',
    ceu: ['#3aa0ff', '#fff0c8'], neblina: '#e8f6ff', chao: '#f2d48a', fora: '#e8c477', larg: 15, cerca: '#ffffff',
    pontos: [[0, 0], [80, 0], [140, 30], [152, 90], [112, 122], [72, 92], [30, 112], [-20, 152], [-82, 132], [-112, 72], [-82, 20]],
    rampas: [0.56, 0.92] },
  { id: 'neve', nome: 'Neve', emoji: '⛄', c1: '#ffffff', c2: '#7fb6dc',
    ceu: ['#7fb2e6', '#f0f7ff'], neblina: '#eef5ff', chao: '#f4f9ff', fora: '#dde9f6', larg: 15, cerca: '#d84a4a',
    pontos: [[0, 0], [70, -20], [122, 20], [102, 70], [142, 110], [102, 162], [30, 152], [2, 102], [-50, 132], [-112, 102], [-102, 30], [-52, -10]],
    rampas: [0.34, 0.65] },
  { id: 'vulcao', nome: 'Vulcão', emoji: '🌋', c1: '#ffb04a', c2: '#6a1a0e',
    ceu: ['#6a2418', '#ffa66a'], neblina: '#c9805a', chao: '#5a4640', fora: '#3e302b', larg: 15, cerca: '#2b2220',
    pontos: [[0, 0], [72, -12], [124, 28], [114, 82], [62, 72], [34, 124], [-28, 134], [-82, 102], [-112, 42], [-62, 8]],
    rampas: [0.3, 0.7] },
  { id: 'ceu', nome: 'Céu', emoji: '☁️', c1: '#ffc8f0', c2: '#6b5bff', ceuPista: true,
    ceu: ['#4b3bd6', '#ffb8e8'], neblina: '#e8c8ff', larg: 14,
    pontos: [[0, 0, 0], [70, 0, 6], [132, 40, 14], [132, 112, 24], [72, 152, 30], [2, 132, 24], [-30, 82, 14], [-92, 92, 20], [-132, 42, 12], [-82, -10, 3]],
    rampas: [0.32, 0.62, 0.9] },
];
// Hora do dia de cada pista do mundo: muda o céu, a neblina e o sol.
const HORAS = {
  dia:   { emoji: '☀️' },
  tarde: { emoji: '🌇', ceu: ['#ff7a3a', '#ffd9a0'], neblina: '#ffcf9e', sol: '#ffbf7a', forca: 0.85, dirSol: [90, 40, 10] },
  manha: { emoji: '🌅', ceu: ['#7fa6e8', '#ffd6e6'], neblina: '#f3dbe6', sol: '#ffe2cc', forca: 0.9, dirSol: [-70, 55, 40] },
  noite: { emoji: '🌙', ceu: ['#040a24', '#22336e'], neblina: '#17234c', sol: '#a9bcff', forca: 0.5, hemi: 0.3, dirSol: [-40, 90, -50], noite: true },
};
const ORDEM_HORAS = ['dia', 'tarde', 'manha', 'noite'];

// Gerador de números "sorteados" que dá sempre a mesma sequência para a mesma semente.
function sorteador(semente) {
  let a = (semente * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Traçado em volta de um centro com o raio ondulando: nunca cruza com ele mesmo.
function tracado(semente, ceu) {
  const r = sorteador(semente), n = 14;
  const k1 = 2 + Math.floor(r() * 3), k2 = k1 + 1 + Math.floor(r() * 2);
  const a1 = 0.16 + r() * 0.12, a2 = 0.06 + r() * 0.08, f1 = r() * 6, f2 = r() * 6;
  const R0 = 88 + r() * 28, ex = 0.8 + r() * 0.4, sentido = r() < 0.5 ? 1 : -1;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = sentido * i / n * Math.PI * 2 - Math.PI / 2, rad = R0 * (1 + a1 * Math.sin(k1 * t + f1) + a2 * Math.sin(k2 * t + f2));
    pts.push([15 + Math.cos(t) * rad * ex, 70 + Math.sin(t) * rad / ex, ceu ? 14 + 10 * Math.sin(2 * t + f1) + 5 * Math.sin(3 * t + f2) : 0]);
  }
  return pts;
}

const PISTAS = [];
MUNDOS.forEach((m, im) => ORDEM_HORAS.forEach((h, n) => {
  const hr = HORAS[h];
  PISTAS.push({
    ...m, mundo: im, num: n + 1, chave: m.id + (n + 1), hora: h, nome: m.nome + ' ' + (n + 1),
    ceu: hr.ceu || m.ceu, neblina: hr.neblina || m.neblina,
    sol: hr.sol || '#fff3dc', forca: hr.forca || 1, hemi: hr.hemi || 0.45, dirSol: hr.dirSol || [60, 100, 40], noite: !!hr.noite,
    pontos: n === 0 ? m.pontos : tracado(im * 10 + n, m.ceuPista),
    rampas: n === 0 ? m.rampas : (n % 2 ? [0.38, 0.72] : [0.46]),
    caixas: [0.15, 0.47, 0.77], turbos: m.ceuPista ? [0.05, 0.22, 0.52, 0.82] : [0.3, 0.6, 0.88],
    moedas: [0.08, 0.25, 0.55, 0.68, 0.85],
    musica: im * 4 + n + 1,
  });
}));

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
  return texCanvas(256, 256, (x, w, h) => {
    x.fillStyle = ceu ? '#3b318f' : '#4a4d53'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {                               // pedrinhas do asfalto
      const v = Math.random();
      x.fillStyle = ceu ? `rgba(255,${200 + v * 55 | 0},255,${v * 0.3})` : `rgba(${v < 0.5 ? '20,20,24' : '200,200,205'},${0.04 + Math.random() * 0.12})`;
      x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 6; i++) {                                  // manchas e partes mais gastas
      const px = Math.random() * w, py = Math.random() * h, g = x.createRadialGradient(px, py, 2, px, py, 60);
      g.addColorStop(0, ceu ? 'rgba(255,180,255,.08)' : 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    if (!ceu) for (const cx of [0.3, 0.7]) {                       // marcas de pneu nas faixas
      x.fillStyle = 'rgba(15,15,18,.18)';
      x.fillRect(cx * w - 14, 0, 9, h); x.fillRect(cx * w + 5, 0, 9, h);
    }
    x.fillStyle = ceu ? '#ffe9ff' : '#ecebe4';
    x.fillRect(w / 2 - 4, 0, 8, h * 0.45);                          // faixa do meio tracejada
    x.fillStyle = ceu ? 'rgba(255,255,255,.55)' : 'rgba(240,240,232,.85)';
    x.fillRect(8, 0, 5, h); x.fillRect(w - 13, 0, 5, h);
    for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(60,60,60,.35)'; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
}
// Chão com textura: grama, areia ou neve, com variação de cor para não parecer liso.
function texChao(base, tipo) {
  return texCanvas(256, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const c = new THREE.Color(base);
    const tom = (d, a) => { const k = c.clone().offsetHSL(0, 0, d); return `rgba(${k.r * 255 | 0},${k.g * 255 | 0},${k.b * 255 | 0},${a})`; };
    for (let i = 0; i < 14; i++) {
      const px = Math.random() * w, py = Math.random() * h, g = x.createRadialGradient(px, py, 4, px, py, 50 + Math.random() * 40);
      g.addColorStop(0, tom((Math.random() - 0.5) * 0.12, 0.6)); g.addColorStop(1, tom(0, 0));
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < (tipo === 'grama' ? 7000 : 5000); i++) {
      const px = Math.random() * w, py = Math.random() * h;
      if (tipo === 'grama') {                                       // folhinhas de grama
        x.strokeStyle = tom((Math.random() - 0.45) * 0.22, 0.7); x.lineWidth = 1;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 3 - Math.random() * 4); x.stroke();
      } else {
        x.fillStyle = tom((Math.random() - 0.5) * (tipo === 'neve' ? 0.08 : 0.16), 0.6);
        x.fillRect(px, py, 1.5, 1.5);
      }
    }
  });
}
// Brilho do sol no céu.
function texSol() {
  const t = texCanvas(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.18, 'rgba(255,250,220,.95)');
    g.addColorStop(0.35, 'rgba(255,240,190,.35)'); g.addColorStop(1, 'rgba(255,230,180,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
/* Reflexo do céu nos karts e moedas: uma esfera com as cores do céu, transformada em mapa de ambiente. */
function ambiente(cimo, horizonte, chao) {
  const s = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), pos = g.attributes.position;
  const a = new THREE.Color(cimo), b = new THREE.Color(horizonte), c = new THREE.Color(chao), cor = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 50, k = y > 0 ? b.clone().lerp(a, Math.pow(y, 0.6)) : b.clone().lerp(c, Math.min(1, -y * 4));
    k.convertSRGBToLinear(); cor.push(k.r, k.g, k.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sol = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8), new THREE.MeshBasicMaterial({ color: '#fffaf0' }));
  sol.position.set(25, 35, 18); s.add(sol);
  const pm = new THREE.PMREMGenerator(R), rt = pm.fromScene(s, 0.02);
  pm.dispose(); g.dispose();
  return rt.texture;
}
/* Sol que faz sombra: segue o kart do jogador para as sombras ficarem nítidas perto dele. */
const DIR_SOL = new THREE.Vector3(60, 100, 40).normalize();
function criaSol(cena, forca, cor = '#fff3dc') {
  const sol = new THREE.DirectionalLight(cor, forca);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  const sc = sol.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 1; sc.far = 260;
  sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.03;
  cena.add(sol, sol.target);
  return sol;
}
function moveSol(sol, x, y, z, dir = DIR_SOL) {
  sol.position.set(x + dir.x * 120, y + dir.y * 120, z + dir.z * 120);
  sol.target.position.set(x, y, z);
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
  t.encoding = THREE.sRGBEncoding;
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
function mL(c) { return lamb[c] || (lamb[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, envMapIntensity: 0.3 })); }

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
  m.receiveShadow = true;
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
  cena.add(new THREE.HemisphereLight(def.ceu[1], ceu ? '#b48cff' : def.chao, def.hemi));
  P.sol = criaSol(cena, (ceu ? 1.6 : 2.0) * def.forca, def.sol);
  P.dirSol = new THREE.Vector3(...def.dirSol).normalize();
  cena.environment = ambiente(def.ceu[0], def.neblina, ceu ? (def.noite ? '#2a2f6a' : '#ffffff') : def.chao);
  const brilhoSol = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSol(), fog: false, depthWrite: false, transparent: true,
    color: def.noite ? '#dfe6ff' : '#ffffff' }));
  brilhoSol.scale.setScalar(def.noite ? 70 : 180);
  brilhoSol.position.copy(P.dirSol).multiplyScalar(700).add(new THREE.Vector3(15, 0, 70));
  cena.add(brilhoSol);

  const tAsf = texAsfalto(ceu);
  tAsf.anisotropy = R.capabilities.getMaxAnisotropy();
  const mAsf = new THREE.MeshStandardMaterial({ map: tAsf, side: THREE.DoubleSide, roughness: ceu ? 0.35 : 0.88, metalness: ceu ? 0.25 : 0, envMapIntensity: ceu ? 0.8 : 0.25 });
  const mZeb = new THREE.MeshStandardMaterial({ map: texZebra(ceu), side: THREE.DoubleSide, roughness: 0.7, envMapIntensity: 0.3 });
  cena.add(fita(P, P.meia, -P.meia, 0.03, 0.03, mAsf, 12));
  cena.add(fita(P, P.meia + 1.3, P.meia, 0.06, 0.06, mZeb, 8));
  cena.add(fita(P, -P.meia, -P.meia - 1.3, 0.06, 0.06, mZeb, 8));

  if (ceu) {
    // Estrada flutuando: lateral grossa por baixo e grade de arco-íris dos dois lados.
    const mLado = new THREE.MeshStandardMaterial({ color: '#8e7bff', side: THREE.DoubleSide });
    for (const s of [1, -1]) cena.add(fita(P, s * (P.meia + 1.3), s * (P.meia + 1.3), 0.06, -2.2, mLado, 10));
    cena.add(fita(P, P.meia + 1.3, -P.meia - 1.3, -2.2, -2.2, new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide }), 10));
    const mGrade = new THREE.MeshBasicMaterial({ map: texArcoIris(), side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    for (const s of [1, -1]) cena.add(fita(P, s * (P.meia + 1.1), s * (P.meia + 1.1), 0.06, 1.1, mGrade, 6));
  } else {
    const tipo = def.id === 'floresta' ? 'grama' : def.id === 'neve' ? 'neve' : 'areia';   // vulcão usa o "areia" escuro
    const tChao = texChao(def.chao, tipo); tChao.repeat.set(220, 220); tChao.anisotropy = R.capabilities.getMaxAnisotropy();
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: tChao, roughness: tipo === 'neve' ? 0.7 : 1, envMapIntensity: 0.25 }));
    chao.rotation.x = -Math.PI / 2; chao.position.y = -0.05; chao.receiveShadow = true; cena.add(chao);
    const mFora = new THREE.MeshStandardMaterial({ map: texChao(def.fora, tipo), roughness: 1, envMapIntensity: 0.25 });
    cena.add(fita(P, P.limite + 1, P.meia + 1.3, 0.01, 0.01, mFora, 10));
    cena.add(fita(P, -P.meia - 1.3, -P.limite - 1, 0.01, 0.01, mFora, 10));
    const mCerca = new THREE.MeshStandardMaterial({ color: def.cerca, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.3 });
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
  const mRampa = new THREE.MeshStandardMaterial({ map: texRampa(), side: THREE.DoubleSide, roughness: 0.6, envMapIntensity: 0.3 });
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
  const mMoeda = new THREE.MeshStandardMaterial({ color: '#ffc928', emissive: '#3a2600', metalness: 1, roughness: 0.22 });
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
  enfeitesNoite(def, P, fixos, cena);
  corReal(fixos);
  const juntos = junta(fixos);
  juntos.traverse(o => { o.castShadow = o.receiveShadow = true; });
  cena.add(juntos);
  corReal(cena);
  return P;
}

function presente() {
  const g = new THREE.Group();
  const caixa = new THREE.Mesh(GEO.caixa, new THREE.MeshStandardMaterial({ color: '#ff4d6d', emissive: '#401020', roughness: 0.25, metalness: 0.2 }));
  caixa.scale.setScalar(1.3); g.add(caixa);
  const laco = mat('#ffe14d', 'tinta');
  g.add(bloco(1.36, 1.36, 0.28, laco, 0, 0, 0));
  g.add(bloco(0.28, 1.36, 1.36, laco, 0, 0, 0));
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

const FOLHAS = ['#2f6b2a', '#3a7d32', '#4b8f3a', '#356f2c', '#5a9a40'].map(c => mat(c, 'folha'));
const CASCA = mat('#6b4a2e', 'pelo');
function arvore(cena, x, z, esc) {
  const g = new THREE.Group();
  g.add(malha(GEO.tronco, CASCA, 0, 1.6, 0, 0.32, 3.2, 0.32));
  for (const [a, b] of [[0.6, 0.4], [-0.5, -0.3]]) g.add(entre([0, 2.6, 0], [a * 1.6, 3.8, b * 1.6], 0.12, CASCA));
  for (let i = 0; i < 6; i++) {                                     // copa feita de vários tufos
    const a = i / 6 * Math.PI * 2 + Math.random(), r = i ? 1.1 : 0;
    const f = malha(GEO.folha, FOLHAS[Math.floor(Math.random() * FOLHAS.length)],
      Math.cos(a) * r, 4.4 + Math.random() * 0.9 + (i ? 0 : 0.6), Math.sin(a) * r, 1.3 + Math.random() * 0.6);
    f.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(f);
  }
  g.position.set(x, 0, z); g.scale.setScalar(esc); g.rotation.y = Math.random() * 6; cena.add(g);
}
function pedra(cena, x, z, esc, cor = '#8d8a84') {
  const m = malha(GEO.pedra, mat(cor, 'folha'), x, 0.2 * esc, z, esc * (0.8 + Math.random() * 0.6), esc * 0.6, esc);
  m.rotation.set(Math.random(), Math.random() * 6, Math.random()); cena.add(m);
}
function pinheiro(cena, x, z, esc) {
  const g = new THREE.Group();
  g.add(malha(GEO.cil, '#7a4a24', 0, 1, 0, 0.3, 2, 0.3));
  for (let i = 0; i < 3; i++) {
    g.add(malha(GEO.cone, mat('#24563d', 'folha'), 0, 2.6 + i * 1.5, 0, 2.2 - i * 0.55, 2.4, 2.2 - i * 0.55));
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
      const a = i / 6 * Math.PI * 2, m = malha(GEO.cone, mat(i % 2 ? '#6f8560' : '#7f9668', 'folha'), 15 + Math.cos(a) * 330, 30, 70 + Math.sin(a) * 330, 70, 60, 70);
      cena.add(m);
    }
    const v = malha(GEO.cone, '#7a5040', -260, 40, 220, 80, 80, 80); cena.add(v);
    cena.add(bola(12, '#ff7a2f', -260, 82, 220, 1, 0.3, 1));
    beira(P, 40, 1, (x, z) => cena.add(bola(0.4, ['#ff6bd6', '#ffe14d', '#ffffff'][Math.floor(Math.random() * 3)], x, 0.3, z)));
    beira(P, 45, 0, (x, z) => pedra(cena, x, z, 0.6 + Math.random() * 1.2));
  } else if (def.id === 'praia') {
    const praia = Math.max(...P.pts.map(p => p.z)) + 30;
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(1600, 900), new THREE.MeshStandardMaterial({ color: '#1f8fc4', roughness: 0.08, metalness: 0.3 }));
    mar.rotation.x = -Math.PI / 2; mar.position.set(15, 0.02, praia + 450); vivo.add(mar);
    anim.push(t => { mar.position.y = 0.02 + Math.sin(t) * 0.05; });
    beira(P, 45, 3, (x, z) => (z < praia ? coqueiro(cena, x, z, 0.9 + Math.random() * 0.4) : null));
    beira(P, 20, 4, (x, z) => (z < praia ? guardaSol(cena, x, z) : null));
    espalha(P, 40, 16, 240, (x, z) => (z < praia ? coqueiro(cena, x, z, 1.1) : null));
    for (let i = 0; i < 6; i++) nuvem(cena, -200 + i * 80, 60 + Math.random() * 20, praia + 70, 2);
    const ilha = bola(30, '#3fae49', 120, -8, praia + 140, 1, 0.5, 1); cena.add(ilha);
  } else if (def.id === 'neve') {
    beira(P, 70, 3, (x, z) => pinheiro(cena, x, z, 0.8 + Math.random() * 0.6));
    beira(P, 12, 4, (x, z) => boneco(cena, x, z));
    beira(P, 35, 0, (x, z) => pedra(cena, x, z, 0.6 + Math.random(), '#9aa4ae'));
    espalha(P, 80, 16, 260, (x, z) => pinheiro(cena, x, z, 1 + Math.random()));
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, x = 15 + Math.cos(a) * 320, z = 70 + Math.sin(a) * 320;
      cena.add(malha(GEO.cone, mat('#8fa6bf', 'folha'), x, 45, z, 80, 90, 80));
      cena.add(malha(GEO.cone, mat('#ffffff', 'folha'), x, 78, z, 34, 26, 34));
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
  } else if (def.id === 'vulcao') {
    // Vulcões soltando fumaça, lagos de lava brilhando, pedras escuras e árvores secas.
    const lava = new THREE.MeshBasicMaterial({ color: '#ff5a14' });
    for (const [x, z, e] of [[-230, 250, 1.2], [260, -60, 0.9], [-40, -230, 0.7]]) {
      cena.add(malha(GEO.cone, mat('#3b2a26', 'folha'), x, 50 * e, z, 95 * e, 100 * e, 95 * e));
      const topo = new THREE.Mesh(GEO.bolinha, lava); topo.position.set(x, 98 * e, z); topo.scale.set(14 * e, 4 * e, 14 * e); vivo.add(topo);
      for (let i = 0; i < 8; i++) {                                 // fumaça subindo
        const f = new THREE.Mesh(GEO.bolinha, new THREE.MeshStandardMaterial({ color: '#55504c', transparent: true, opacity: 0.55, roughness: 1 }));
        vivo.add(f);
        anim.push((t, dt) => {
          const k = ((t * 0.12 + i / 8) % 1);
          f.position.set(x + Math.sin(i * 2 + t * 0.3) * 6 * k * e, 100 * e + k * 70 * e, z + k * 20 * e);
          f.scale.setScalar((6 + k * 18) * e); f.material.opacity = 0.55 * (1 - k);
        });
      }
    }
    espalha(P, 16, 22, 230, (x, z) => {                             // lagos de lava
      const m = new THREE.Mesh(new THREE.CircleGeometry(5 + Math.random() * 8, 18), lava);
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); vivo.add(m);
      cena.add(malha(GEO.pedra, mat('#2a201d', 'folha'), x, 0, z, 6 + Math.random() * 3, 0.8, 6 + Math.random() * 3));
    });
    anim.push(t => { lava.color.setHSL(0.04 + Math.sin(t * 2) * 0.015, 1, 0.5 + Math.sin(t * 3) * 0.06).convertSRGBToLinear(); });
    beira(P, 70, 0, (x, z) => pedra(cena, x, z, 0.6 + Math.random() * 1.6, '#4a3c37'));
    espalha(P, 60, 14, 260, (x, z) => pedra(cena, x, z, 2 + Math.random() * 4, '#3e322e'));
    beira(P, 30, 3, (x, z) => {                                     // árvores secas
      const g = new THREE.Group(), c = mat('#2a1e1a', 'pelo');
      g.add(malha(GEO.tronco, c, 0, 2, 0, 0.3, 4, 0.3));
      for (const [a, b, h] of [[1.2, 0.3, 3.4], [-1, -0.4, 3.0], [0.3, 1, 4.2]]) g.add(entre([0, h - 1.2, 0], [a, h + 0.8, b], 0.1, c));
      g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; cena.add(g);
    });
    const brasas = flocos(vivo, 400, 120, '#ffaa44', 0.6);
    anim.push((t, dt, cam) => {
      const a = brasas.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 3; if (y > 40) y -= 40; a.setY(i, y); }
      a.needsUpdate = true;
      brasas.position.set(cam.position.x, 0, cam.position.z);
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

function enfeitesNoite(def, P, cena, vivo) {
  if (!def.noite) return;
  const est = flocos(vivo, 700, 600, '#ffffff', 1.5);
  est.position.set(15, 140, 70);
  if (def.ceuPista) return;
  const luz = new THREE.MeshBasicMaterial({ color: '#fff1b8' });
  const brilho = new THREE.SpriteMaterial({ map: texSol(), color: '#ffd98a', depthWrite: false, transparent: true });
  for (let i = 0; i < P.N; i += 22) for (const s of [1, -1]) {
    const p = P.pts[i], l = s * (P.limite + 1.6), x = p.x + p.lx * l, z = p.z + p.lz * l;
    cena.add(malha(GEO.cil, mat('#3a3d44', 'metal'), x, 3, z, 0.12, 6, 0.12));
    cena.add(entre([x, 5.9, z], [x - p.lx * s * 1.4, 6.1, z - p.lz * s * 1.4], 0.08, mat('#3a3d44', 'metal')));
    const lamp = new THREE.Mesh(GEO.bolinha, luz); lamp.scale.setScalar(0.3);
    lamp.position.set(x - p.lx * s * 1.4, 5.9, z - p.lz * s * 1.4); vivo.add(lamp);
    const b = new THREE.Sprite(brilho); b.scale.setScalar(5); b.position.copy(lamp.position); vivo.add(b);
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
