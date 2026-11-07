/* Turma Turbo · EG Gamer X — corrida de kart em 3D para a criançada.
   Telas: abertura → título → escolher piloto → escolher pista → corrida → chegada.
   O kart acelera sozinho; tocar à esquerda/direita vira; o botão redondo usa o item.
   Testes: ?pista=floresta|praia|neve|ceu&piloto=gabriel|matheus|davi|rex|tri|pesco|cachorro|gato */
'use strict';

const $ = id => document.getElementById(id);
const URLP = new URLSearchParams(location.search);
const VOLTAS = 3;

/* ---------- Guardado no aparelho ---------- */
let save = { piloto: 0, som: true, leve: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('turmaTurbo') || '{}')); } catch (e) {}
function guarda() { try { localStorage.setItem('turmaTurbo', JSON.stringify(save)); } catch (e) {} }

/* ---------- Desenho ---------- */
const cv = $('cv');
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(save.leve ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
R.outputEncoding = THREE.sRGBEncoding;
R.toneMapping = THREE.ACESFilmicToneMapping;          // cores e brilho de cinema
R.toneMappingExposure = 1.0;
R.shadowMap.enabled = !save.leve;                     // sombras de verdade (desligam no modo leve)
R.shadowMap.type = THREE.PCFSoftShadowMap;
const cam = new THREE.PerspectiveCamera(65, 1, 0.1, 900);
let W = 1, H = 1;
function ajusta() {
  W = innerWidth; H = innerHeight;
  R.setSize(W, H, false);
  cam.aspect = W / H; cam.updateProjectionMatrix();
  $('gire').classList.toggle('on', W < H * 0.9);
}
addEventListener('resize', ajusta);

/* ---------- Sons (todos sintetizados) ---------- */
let ac = null;
function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
  if (ac.state === 'suspended') ac.resume();
}
function nota(f, dur, tipo = 'sine', vol = 0.12, quando = 0, fFim) {
  if (!ac || !save.som) return;
  const t = ac.currentTime + quando, o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (fFim) o.frequency.exponentialRampToValueAtTime(fFim, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
let bufRuido = null;
function ruido(dur, vol, f0, f1) {
  if (!ac || !save.som) return;
  if (!bufRuido) {
    bufRuido = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = bufRuido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = bufRuido; f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(ac.destination); s.start(t); s.stop(t + dur);
}
const SOM = {
  moeda() { nota(988, 0.08, 'square', 0.06); nota(1319, 0.18, 'square', 0.06, 0.07); },
  caixa() { [523, 659, 784, 1047].forEach((f, i) => nota(f, 0.12, 'triangle', 0.12, i * 0.05)); },
  item() { nota(784, 0.1, 'square', 0.07); nota(1175, 0.2, 'square', 0.07, 0.08); },
  turbo() { ruido(0.7, 0.35, 400, 3000); nota(220, 0.6, 'sawtooth', 0.05, 0, 880); },
  bate() { nota(130, 0.18, 'triangle', 0.25); ruido(0.12, 0.2, 800, 300); },
  gira() { nota(900, 0.6, 'sine', 0.12, 0, 200); },
  pulo() { nota(330, 0.3, 'sine', 0.13, 0, 800); },
  truque() { [784, 988, 1319].forEach((f, i) => nota(f, 0.12, 'square', 0.06, i * 0.06)); },
  bip() { nota(523, 0.3, 'square', 0.1); },
  vai() { nota(1047, 0.6, 'square', 0.1); nota(784, 0.6, 'square', 0.06); },
  ovo() { nota(500, 0.15, 'sine', 0.12, 0, 250); },
  balao() { nota(400, 0.4, 'sine', 0.1, 0, 1200); },
  estrela() { [1047, 1319, 1568, 2093, 1568, 1319].forEach((f, i) => nota(f, 0.1, 'square', 0.05, i * 0.07)); },
  chegada() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => nota(f, i === 5 ? 0.8 : 0.16, 'square', 0.09, i * 0.14)); },
};

// Motor do kart: zumbido que sobe com a velocidade.
let motor = null;
function ligaMotor() {
  if (!ac || motor) return;
  const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.value = 50; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = save.som ? 0.035 : 0;
  o.connect(f).connect(g).connect(ac.destination); o.start();
  motor = { o, g };
}
function desligaMotor() { if (motor) { try { motor.o.stop(); } catch (e) {} motor = null; } }

// Musiquinha da corrida (melodia original, em laço).
const MELODIA = [0, 4, 7, 12, 11, 7, 4, 7, 9, 5, 9, 12, 11, null, 7, null, 0, 4, 7, 12, 14, 12, 11, 9, 7, 9, 11, 7, 12, null, null, null];
const BAIXO = [0, 0, 7, 7, 5, 5, 7, 7, 0, 0, 7, 7, 5, 7, 0, 0];
let musica = null;
function tocaMusica(tom) {
  paraMusica();
  if (!ac) return;
  let passo = 0, prox = ac.currentTime + 0.1;
  const dur = 0.16, base = 440 * Math.pow(2, (tom - 9) / 12);
  musica = setInterval(() => {
    while (prox < ac.currentTime + 0.3) {
      const q = prox - ac.currentTime, m = MELODIA[passo % MELODIA.length];
      if (m !== null) nota(base * Math.pow(2, m / 12), dur * 0.9, 'square', 0.025, q);
      if (passo % 2 === 0) nota(base / 4 * Math.pow(2, BAIXO[(passo / 2) % BAIXO.length] / 12), dur * 1.8, 'triangle', 0.07, q);
      passo++; prox += dur;
    }
  }, 100);
}
function paraMusica() { if (musica) clearInterval(musica); musica = null; }
document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend(); else ac.resume();
});

// Voz: só fala o nome do piloto escolhido.
function falar(txt) {
  if (!save.som) return;
  if (window.Android && Android.falar) { try { Android.falar(txt); } catch (e) {} return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-BR'; u.pitch = 1.3; u.rate = 1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------- Fotinhas dos pilotos (feitas uma vez, com o próprio desenho 3D) ---------- */
const FOTO = {};
function fazFotos() {
  const cena = new THREE.Scene();
  cena.background = new THREE.Color('#cfe8ff');
  cena.environment = ambiente('#9fd0ff', '#ffffff', '#b8c4d0');
  cena.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.35));
  const l = new THREE.DirectionalLight(0xffffff, 1.8); l.position.set(2, 3, 4); cena.add(l);
  const c = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  R.setSize(128, 128, false);
  for (const p of PILOTOS) {
    const g = corReal(criaPiloto(p)); cena.add(g);
    const y = p.tipo === 'pesco' ? 2.2 : 1.5;
    c.position.set(0.9, y + 0.25, 2.6); c.lookAt(0, y - 0.05, 0);
    R.render(cena, c);
    FOTO[p.id] = cv.toDataURL('image/png');
    cena.remove(g);
  }
  cena.environment.dispose();
}

/* ---------- Vitrine (fundo dos menus: kart girando no palco) ---------- */
const vitrine = new THREE.Scene();
vitrine.background = texCeu('#2f7de1', '#bfe6ff');
vitrine.environment = ambiente('#2f7de1', '#bfe6ff', '#ffd23a');
vitrine.add(new THREE.HemisphereLight(0xffffff, 0x6688aa, 0.3));
{
  const l = criaSol(vitrine, 2.2), sc = l.shadow.camera;
  sc.left = sc.bottom = -5; sc.right = sc.top = 5; sc.updateProjectionMatrix();
  moveSol(l, 0, 0, 0);
}
const palco = new THREE.Group();
palco.add(malha(GEO.cil, mat('#ffd23a', 'tinta'), 0, -0.2, 0, 2.6, 0.4, 2.6));
palco.add(malha(GEO.cil, mat('#ff8a1f', 'tinta'), 0, -0.45, 0, 2.9, 0.3, 2.9));
palco.children.forEach(m => { m.receiveShadow = true; });
corReal(vitrine);
vitrine.add(palco);
for (let i = 0; i < 14; i++) {
  const a = i / 14 * Math.PI * 2;
  vitrine.add(bola(0.25, ['#ff4d6d', '#ffe14d', '#3ddc84', '#3aa0ff', '#ff6bd6'][i % 5], Math.cos(a) * 2.75, 0.02, Math.sin(a) * 2.75));
}
for (let i = 0; i < 8; i++) nuvem(vitrine, -40 + i * 12, 2 + Math.random() * 10, -40 - Math.random() * 10, 0.6 + Math.random() * 0.4);
let kartVitrine = null, escolhido = Math.min(save.piloto | 0, PILOTOS.length - 1);

function mostraPiloto(i, falarNome = true) {
  escolhido = (i + PILOTOS.length) % PILOTOS.length;
  const p = PILOTOS[escolhido];
  if (kartVitrine) palco.remove(kartVitrine);
  kartVitrine = criaKart(p);
  kartVitrine.scale.setScalar(1.35);
  kartVitrine.traverse(o => { o.castShadow = true; });
  corReal(kartVitrine);
  palco.add(kartVitrine);
  $('nomePiloto').textContent = p.nome;
  $('escolhe').style.setProperty('--cor', p.cor);
  document.querySelectorAll('#fotos .foto').forEach((b, j) => b.classList.toggle('on', j === escolhido));
  if (falarNome) falar(p.nome);
}

/* ---------- Telas ---------- */
let tela = 'abertura';
function telas(nome) {
  tela = nome;
  for (const id of ['titulo', 'escolhe', 'pistas', 'fim']) $(id).classList.toggle('on', id === nome);
  $('hud').classList.toggle('on', nome === 'corrida');
  $('controles').classList.toggle('on', nome === 'corrida');
  $('bCasa').classList.toggle('on', nome === 'corrida' || nome === 'fim' || nome === 'escolhe' || nome === 'pistas');
}
function vaiTitulo() { acabaCorrida(); telas('titulo'); }
function vaiEscolhe() { acabaCorrida(); telas('escolhe'); mostraPiloto(escolhido, false); }
function vaiPistas() { acabaCorrida(); telas('pistas'); }

/* ---------- A corrida ---------- */
let C = null;
const ITENS = { turbo: '🚀', estrela: '⭐', ovo: '🥚', balao: '🎈', moedas: '💰' };
const teclas = { esq: false, dir: false };
const dedos = { esq: new Set(), dir: new Set() };

function angDif(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
const lim = (v, a, b) => Math.max(a, Math.min(b, v));

function iniciaCorrida(ip) {
  acabaCorrida();
  audio();
  const def = PISTAS[ip], cena = new THREE.Scene();
  const P = montaPista(def, cena);
  const outros = PILOTOS.filter((p, i) => i !== escolhido);
  const grade = [...outros.slice(0, 5), PILOTOS[escolhido], ...outros.slice(5)];   // o jogador larga em 6º
  const habs = [0.95, 0.93, 0.91, 0.9, 0.88, 0.87, 0.86].sort(() => Math.random() - 0.5);
  const sombraMat = new THREE.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false });
  const karts = grade.map((p, n) => {
    const fila = Math.floor(n / 2), lado = (n % 2 ? -1 : 1) * 3.5;
    const idx = (P.N - 3 - fila * 4) % P.N, pt = P.pts[idx];
    const m = corReal(criaKart(p)); cena.add(m);
    m.traverse(o => { o.castShadow = true; });
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), sombraMat);
    sombra.rotation.x = -Math.PI / 2; sombra.visible = !R.shadowMap.enabled; cena.add(sombra);
    const eu = p === PILOTOS[escolhido];
    return {
      p, m, sombra, eu, x: pt.x + pt.lx * lado, z: pt.z + pt.lz * lado, y: pt.y, chaoY: pt.y,
      ang: Math.atan2(pt.tx, pt.tz), vel: 0, idx, volta: 0, meio: true, prog: idx - P.N, lat: lado,
      item: null, roleta: 0, turbo: 0, estrela: 0, giro: 0, bolha: 0, ar: false, vy: 0, truque: false, rampa: -1,
      dTempo: 0, drift: 0, carga: 0, moedas: 0, bateu: 0, terminou: false, aura: null, virar: 0,
      ia: { hab: eu ? 1 : habs.pop(), fase: Math.random() * 6, tItem: 0 },
    };
  });
  const eu = karts.find(k => k.eu);
  // Faíscas do drift atrás do kart do jogador.
  const faiscas = [];
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(GEO.esfera, new THREE.MeshBasicMaterial({ color: '#6bd5ff', transparent: true, opacity: 0.85 }));
    f.scale.setScalar(0.22); f.position.set(s * 0.72, 0.15, -1.05); f.visible = false; eu.m.add(f); faiscas.push(f);
  }
  C = { ip, def, P, cena, karts, eu, faiscas, t: 0, fase: 'contagem', cont: 3.6, ultimoNum: 4, objs: [], chegada: [],
        angCam: eu.ang, fov: 65, fimT: 0, confete: null, mapa: fundoMapa(P), voltaVista: 0 };
  cam.position.set(eu.x, eu.y + 3, eu.z);
  posAnt = 0;
  telas('corrida');
  atualizaItem();
  $('contagem').textContent = '';
  ligaMotor();
  tocaMusica([0, 5, 2, 7][ip]);
}

function acabaCorrida() {
  if (!C) return;
  paraMusica(); desligaMotor();
  const compartilhadas = new Set(Object.values(GEO));
  const matsFixos = new Set([...Object.values(MATS), ...Object.values(lamb)]);
  C.cena.traverse(o => {
    if (o.geometry && !compartilhadas.has(o.geometry)) o.geometry.dispose();
    if (o.material && !matsFixos.has(o.material)) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
  if (C.cena.background && C.cena.background.dispose) C.cena.background.dispose();
  if (C.cena.environment) C.cena.environment.dispose();
  C = null;
  dedos.esq.clear(); dedos.dir.clear();
}

function sorteiaItem(pos) {
  const tab = pos <= 2 ? ['ovo', 'ovo', 'balao', 'moedas', 'turbo']
    : pos <= 5 ? ['turbo', 'ovo', 'balao', 'moedas', 'estrela']
    : ['turbo', 'turbo', 'estrela', 'balao', 'estrela'];
  return tab[Math.floor(Math.random() * tab.length)];
}

function usaItem(k) {
  const it = k.item; if (!it || C.fase !== 'corre') return;
  k.item = null;
  const fx = Math.sin(k.ang), fz = Math.cos(k.ang);
  if (it === 'turbo') { k.turbo = Math.max(k.turbo, 1.6); if (k.eu) SOM.turbo(); }
  else if (it === 'estrela') { k.estrela = 6; if (k.eu) SOM.estrela(); }
  else if (it === 'moedas') { k.moedas = Math.min(10, k.moedas + 3); if (k.eu) SOM.moeda(); }
  else if (it === 'ovo') {
    const m = new THREE.Group();
    m.add(bola(0.55, '#fff8e8', 0, 0.7, 0, 1, 1.3, 1));
    for (let i = 0; i < 5; i++) m.add(bola(0.12, '#6cc04a', Math.cos(i * 1.3) * 0.48, 0.5 + (i % 3) * 0.3, Math.sin(i * 1.3) * 0.48, 1, 1, 0.4));
    m.position.set(k.x - fx * 2.4, k.chaoY, k.z - fz * 2.4);
    C.cena.add(corReal(m));
    C.objs.push({ tipo: 'ovo', m, x: m.position.x, z: m.position.z, dono: k, imune: 0.6, vida: 45 });
    if (k.eu) SOM.ovo();
  } else if (it === 'balao') {
    const m = new THREE.Group();
    m.add(bola(0.7, '#ff4d6d', 0, 1.6, 0, 1, 1.2, 1));
    m.add(bola(0.18, '#ffffff', 0.25, 1.95, 0.45));
    m.add(entre([0, 0.75, 0], [0, 0.2, 0], 0.03, '#ffffff'));
    C.cena.add(corReal(m));
    const ord = ranking(), pos = ord.indexOf(k);
    C.objs.push({ tipo: 'balao', m, dono: k, alvo: pos > 0 ? ord[pos - 1] : null, s: k.idx + 2, lado: k.lat, vida: 9, x: k.x, z: k.z });
    if (k.eu) SOM.balao();
  }
  if (k.eu) atualizaItem();
}

function ranking() {
  return [...C.karts].sort((a, b) => {
    const ca = C.chegada.indexOf(a), cb = C.chegada.indexOf(b);
    if (ca >= 0 || cb >= 0) return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb);
    return b.prog - a.prog;
  });
}

function atualizaIdx(k) {
  const P = C.P, N = P.N;
  let melhor = k.idx, md = Infinity;
  for (let o = -6; o <= 14; o++) {
    const i = (k.idx + o + N) % N, p = P.pts[i], d = (p.x - k.x) ** 2 + (p.z - k.z) ** 2;
    if (d < md) { md = d; melhor = i; }
  }
  if (md > 400) for (let i = 0; i < N; i++) {
    const p = P.pts[i], d = (p.x - k.x) ** 2 + (p.z - k.z) ** 2;
    if (d < md) { md = d; melhor = i; }
  }
  k.idx = melhor;
}

function atualizaKart(k, dt, pos) {
  const P = C.P, N = P.N, corre = C.fase === 'corre';
  const piloto = k.eu && !k.terminou;

  // Direção: jogador (dedos/teclas) ou piloto automático.
  let virar = 0;
  if (piloto) {
    virar = ((dedos.esq.size || teclas.esq) ? 1 : 0) - ((dedos.dir.size || teclas.dir) ? 1 : 0);
  } else {
    const olha = (k.idx + 7 + Math.floor(k.vel * 0.25)) % N, p = P.pts[olha];
    const lado = Math.sin(C.t * 0.35 + k.ia.fase) * P.meia * 0.45;
    const alvoAng = Math.atan2(p.x + p.lx * lado - k.x, p.z + p.lz * lado - k.z);
    virar = lim(angDif(alvoAng - k.ang) * 2.5, -1, 1);
  }
  if (k.giro > 0 || k.bolha > 0) virar = 0;
  k.virar += (virar - k.virar) * Math.min(1, dt * 10);

  // Velocidade.
  let vmax = 24 + k.moedas * 0.3;
  if (!k.eu) {
    vmax *= k.ia.hab;
    const dif = C.eu.prog - k.prog;                // borracha: ninguém fica muito longe do jogador
    if (dif > 25) vmax *= 1.12; else if (dif < -25) vmax *= 0.86;
  }
  const fora = !P.def.ceuPista && Math.abs(k.lat) > P.meia + 1.3;
  if (fora && k.estrela <= 0 && k.turbo <= 0 && !k.ar) vmax *= 0.55;
  if (k.estrela > 0) { k.estrela -= dt; vmax *= 1.25; }
  if (k.turbo > 0) { k.turbo -= dt; vmax *= 1.45; k.vel = Math.max(k.vel, vmax * 0.9); }
  const acelera = corre && k.giro <= 0 && k.bolha <= 0;
  if (acelera) k.vel = k.vel < vmax ? Math.min(vmax, k.vel + 15 * dt) : Math.max(vmax, k.vel - 22 * dt);
  else k.vel = Math.max(0, k.vel - (k.giro > 0 || k.bolha > 0 ? 30 : 18) * dt);
  if (k.giro > 0) k.giro -= dt;
  if (k.bolha > 0) k.bolha -= dt;

  // Drift automático: segurar a curva com velocidade carrega um mini-turbo.
  if (piloto) {
    const s = Math.sign(virar);
    if (s !== 0 && k.vel > 14 && (k.drift === 0 || k.drift === s)) {
      k.dTempo += dt;
      if (k.dTempo > 0.45) { k.drift = s; k.carga += dt; }
    } else {
      if (k.drift && k.carga > 0.7) { k.turbo = Math.max(k.turbo, k.carga > 1.6 ? 1.1 : 0.6); SOM.turbo(); }
      k.drift = 0; k.carga = 0; k.dTempo = 0;
    }
  }

  // Virar.
  const fator = Math.min(1, k.vel / 8) * (k.ar ? 0.5 : 1);
  k.ang += k.virar * 1.75 * (k.drift ? 1.3 : 1) * fator * dt;

  // Ajudinha para os pequenos: sem mexer no controle, o kart segue a estrada sozinho.
  if (piloto && virar === 0 && k.giro <= 0) {
    const p = P.pts[(k.idx + 8) % N];
    const alvo = Math.atan2(p.x + p.lx * k.lat * 0.5 - k.x, p.z + p.lz * k.lat * 0.5 - k.z);
    k.ang += lim(angDif(alvo - k.ang), -1, 1) * 1.6 * dt;
  }

  // Andar.
  k.x += Math.sin(k.ang) * k.vel * dt;
  k.z += Math.cos(k.ang) * k.vel * dt;
  const antes = k.idx;
  atualizaIdx(k);
  let p = P.pts[k.idx];
  k.lat = (k.x - p.x) * p.lx + (k.z - p.z) * p.lz;

  // Muro/grade da beira.
  if (Math.abs(k.lat) > P.limite) {
    const s = Math.sign(k.lat), sobra = k.lat - s * P.limite;
    k.x -= p.lx * sobra; k.z -= p.lz * sobra; k.lat = s * P.limite;
    const tang = Math.atan2(p.tx, p.tz);
    k.ang += lim(angDif(tang - k.ang), -0.5, 0.5) * 0.5;
    if (k.bateu <= 0) { k.vel *= 0.8; k.bateu = 0.4; if (k.eu) SOM.bate(); }
  }
  if (k.bateu > 0) k.bateu -= dt;

  // Altura do chão (com rampas).
  const ao = (k.x - p.x) * p.tx + (k.z - p.z) * p.tz;
  let chao = p.y + p.incl * ao, naRampa = -1;
  for (let r = 0; r < P.rampas.length; r++) {
    const rp = P.rampas[r], d = (k.idx - rp.i + N) % N + ao / ESPACO;
    if (d >= 0 && d <= rp.n && Math.abs(k.lat) < P.meia - 0.5) { chao += d / rp.n * 1.5; naRampa = r; }
  }
  if (k.rampa >= 0 && naRampa < 0 && !k.ar && k.vel > 6) {            // saiu da ponta da rampa: pulo!
    k.ar = true; k.vy = 5 + k.vel * 0.28; k.truque = false;
    if (k.eu) SOM.pulo();
    if (!k.eu && Math.random() < 0.5) k.truque = true;
  }
  k.rampa = naRampa;
  k.chaoY = chao;
  if (k.ar) {
    k.vy -= 28 * dt; k.y += k.vy * dt;
    if (k.y <= chao) {
      k.y = chao; k.ar = false;
      if (k.truque) { k.turbo = Math.max(k.turbo, 0.8); if (k.eu) SOM.turbo(); }
      k.truque = false;
    }
  } else k.y = chao;

  // Placas de turbo no chão.
  for (const t of P.turbos) {
    const d = (k.idx - t.i + N) % N;
    if (d <= 3 && Math.abs(k.lat - t.lado) < 2.3 && !k.ar) {
      if (k.turbo < 0.5 && k.eu) SOM.turbo();
      k.turbo = Math.max(k.turbo, 1.0);
    }
  }

  // Voltas e progresso.
  if (k.idx > N * 0.4 && k.idx < N * 0.6) k.meio = true;
  if (antes > N * 0.75 && k.idx < N * 0.25 && k.meio) { k.volta++; k.meio = false; }
  else if (antes < N * 0.25 && k.idx > N * 0.75 && k.volta > 0) { k.volta--; }
  k.prog = (k.volta - 1) * N + k.idx;
  if (k.volta > VOLTAS && !k.terminou) {
    k.terminou = true; C.chegada.push(k);
    if (k.eu) chegou();
  }

  // Item: roleta e uso pelos adversários.
  if (k.roleta > 0) {
    k.roleta -= dt;
    if (k.roleta <= 0) { k.item = sorteiaItem(pos); k.ia.tItem = C.t + 1.5 + Math.random() * 5; if (k.eu) { SOM.item(); atualizaItem(); } }
  }
  if (k.item && (!k.eu || k.terminou) && C.t > k.ia.tItem) usaItem(k);

  // Desenho do kart.
  const m = k.m, d = m.userData;
  m.position.set(k.x, k.y, k.z);
  let vis = k.ang;
  if (k.giro > 0) vis += (1.2 - k.giro) * 12;
  m.rotation.set(-Math.atan(p.incl) * 0.9, vis + k.drift * 0.35, -k.virar * 0.06 * Math.min(1, k.vel / 15), 'YXZ');
  if (k.ar) m.rotation.x -= lim(k.vy * 0.03, -0.3, 0.3) + (k.truque ? 0 : 0);
  d.rodas.forEach(r => { r.rotation.x += k.vel * dt / 0.3; });
  d.frente.forEach(f => { f.rotation.y = k.virar * 0.45; });
  d.piloto.rotation.z = -k.virar * 0.12;
  d.piloto.position.y = k.terminou ? Math.abs(Math.sin(C.t * 7)) * 0.3 : 0;
  if (k.ar && k.truque) d.piloto.rotation.y += dt * 14; else d.piloto.rotation.y *= 0.8;
  if (k.bolha > 0) m.position.y += Math.min(1.6, (1.4 - k.bolha) * 4) * Math.min(1, k.bolha * 3);
  k.sombra.position.set(k.x, k.chaoY + 0.08, k.z);
  k.sombra.rotation.z = k.ang;
  const brilho = k.estrela > 0 || k.bolha > 0;
  if (brilho && !k.aura) {
    k.aura = new THREE.Mesh(GEO.esfera, new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.35, depthWrite: false }));
    k.aura.scale.set(1.3, 1.3, 1.6); k.aura.position.y = 0.9; m.add(k.aura);
  }
  if (k.aura) {
    k.aura.visible = brilho;
    if (k.estrela > 0) k.aura.material.color.setHSL((C.t * 2) % 1, 1, 0.6).convertSRGBToLinear();
    else k.aura.material.color.set('#9fe6ff');
  }
}

function chegou() {
  SOM.chegada();
  C.fimT = 2.2;
  $('contagem').textContent = '🏁'; anima($('contagem'));
}

function colisoes() {
  const ks = C.karts;
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const a = ks[i], b = ks[j], dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
    if (d2 > 3 || Math.abs(a.y - b.y) > 1.5) continue;
    const d = Math.sqrt(d2) || 0.01, emp = (1.75 - d) / 2;
    if (emp <= 0) continue;
    const nx = dx / d, nz = dz / d;
    a.x -= nx * emp; a.z -= nz * emp; b.x += nx * emp; b.z += nz * emp;
    if (a.estrela > 0 && b.estrela <= 0 && b.giro <= 0) { b.giro = 1.2; if (b.eu) SOM.gira(); }
    if (b.estrela > 0 && a.estrela <= 0 && a.giro <= 0) { a.giro = 1.2; if (a.eu) SOM.gira(); }
    if ((a.eu || b.eu) && Math.random() < 0.15) SOM.bate();
  }
}

function atualizaObjs(dt) {
  const P = C.P, N = P.N;
  for (const o of C.objs) {
    o.vida -= dt;
    if (o.tipo === 'ovo') {
      o.imune -= dt;
      o.m.rotation.y += dt;
      for (const k of C.karts) {
        if ((k === o.dono && o.imune > 0) || k.ar) continue;
        if ((k.x - o.x) ** 2 + (k.z - o.z) ** 2 < 2.2) {
          o.vida = 0;
          if (k.estrela <= 0) { k.giro = 1.2; if (k.eu) SOM.gira(); }
        }
      }
    } else {
      // Balão voa pela estrada até alcançar quem está na frente.
      o.s += 34 * dt / ESPACO;
      const i = Math.floor(o.s) % N, p = P.pts[i];
      if (o.alvo) {
        const perto = (o.alvo.prog - (o.dono.prog + (o.s - o.dono.idx)));
        o.lado += (o.alvo.lat - o.lado) * Math.min(1, dt * (perto < 30 ? 6 : 1));
      }
      o.x = p.x + p.lx * o.lado; o.z = p.z + p.lz * o.lado;
      o.m.position.set(o.x, p.y + Math.sin(C.t * 6) * 0.2, o.z);
      for (const k of C.karts) {
        if (k === o.dono) continue;
        if ((k.x - o.x) ** 2 + (k.z - o.z) ** 2 < 3.2) {
          o.vida = 0;
          if (k.estrela <= 0) { k.bolha = 1.4; if (k.eu) SOM.gira(); }
          break;
        }
      }
    }
    if (o.vida <= 0) C.cena.remove(o.m);
  }
  C.objs = C.objs.filter(o => o.vida > 0);
}

function pegaveis(dt) {
  const P = C.P;
  const ord = ranking();
  for (const c of P.caixas) {
    c.m.rotation.y += dt * 1.5; c.m.rotation.x = Math.sin(C.t * 2 + c.lado) * 0.3;
    c.m.userData.caixa.material.color.setHSL((C.t * 0.3 + c.lado * 0.05) % 1, 0.85, 0.6).convertSRGBToLinear();
    if (c.volta > 0) { c.volta -= dt; c.m.visible = c.volta <= 0; if (c.volta > 0) continue; }
    for (const k of C.karts) {
      if ((k.x - c.m.position.x) ** 2 + (k.z - c.m.position.z) ** 2 < 3.6) {
        c.volta = 3; c.m.visible = false;
        if (!k.item && k.roleta <= 0) { k.roleta = 1.1; if (k.eu) SOM.caixa(); }
        break;
      }
    }
  }
  for (const c of P.moedas) {
    c.m.rotation.y += dt * 3;
    if (c.volta > 0) { c.volta -= dt; c.m.visible = c.volta <= 0; if (c.volta > 0) continue; }
    for (const k of C.karts) {
      if ((k.x - c.m.position.x) ** 2 + (k.z - c.m.position.z) ** 2 < 2.2) {
        c.volta = 8; c.m.visible = false;
        k.moedas = Math.min(10, k.moedas + 1);
        if (k.eu) SOM.moeda();
        break;
      }
    }
  }
  return ord;
}

function camera(dt) {
  const k = C.eu;
  let alvoAng = k.ang;
  if (C.fase === 'contagem') alvoAng = k.ang + Math.PI * lim((C.cont - 1.2) / 2.2, 0, 1);   // começa olhando o rosto do piloto
  if (tela === 'fim') C.angCam += dt * 0.45;
  else C.angCam += angDif(alvoAng - C.angCam) * Math.min(1, dt * (C.fase === 'contagem' ? 3 : 6));
  const dist = tela === 'fim' ? 7 : 6.2, alt = tela === 'fim' ? 2.6 : 2.9;
  const dx = k.x - Math.sin(C.angCam) * dist, dz = k.z - Math.cos(C.angCam) * dist;
  const dy = Math.max(k.y, k.chaoY) + alt;
  const s = 1 - Math.exp(-dt * 10);
  cam.position.x += (dx - cam.position.x) * s;
  cam.position.z += (dz - cam.position.z) * s;
  cam.position.y += (dy - cam.position.y) * (1 - Math.exp(-dt * 6));
  cam.lookAt(k.x + Math.sin(C.angCam) * 3, k.y + 1.3, k.z + Math.cos(C.angCam) * 3);
  const fov = 65 + (k.turbo > 0 ? 10 : 0) + Math.min(6, k.vel * 0.15);
  C.fov += (fov - C.fov) * Math.min(1, dt * 4);
  cam.fov = C.fov; cam.updateProjectionMatrix();
}

/* ---------- Mapinha ---------- */
function fundoMapa(P) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of P.pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  const esc = 170 / Math.max(x1 - x0, z1 - z0);
  const ox = 100 - (x0 + x1) / 2 * esc, oz = 100 - (z0 + z1) / 2 * esc;
  // Espelha no X para o mapa bater com o que o jogador vê (a esquerda do piloto é +X).
  const conv = (x, z) => [200 - (ox + x * esc), oz + z * esc];
  const c = document.createElement('canvas'); c.width = c.height = 200;
  const g = c.getContext('2d');
  g.lineJoin = 'round';
  for (const [cor, lw] of [['rgba(0,0,0,.45)', 16], ['#fff', 10]]) {
    g.strokeStyle = cor; g.lineWidth = lw; g.beginPath();
    P.pts.forEach((p, i) => { const [a, b] = conv(p.x, p.z); if (i) g.lineTo(a, b); else g.moveTo(a, b); });
    g.closePath(); g.stroke();
  }
  return { c, conv };
}
function desenhaMapa() {
  const g = $('mapa').getContext('2d');
  g.clearRect(0, 0, 200, 200);
  g.save(); g.translate(100, 100); g.scale(1, -1); g.translate(-100, -100);   // norte (+Z) para cima
  g.drawImage(C.mapa.c, 0, 0);
  for (const k of [...C.karts].sort((a, b) => a.eu - b.eu)) {
    const [x, y] = C.mapa.conv(k.x, k.z);
    g.fillStyle = k.p.cor; g.strokeStyle = '#fff'; g.lineWidth = k.eu ? 4 : 2;
    g.beginPath(); g.arc(x, y, k.eu ? 9 : 6, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  g.restore();
}

/* ---------- Painel ---------- */
function anima(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
let posAnt = 0;
function painel(ord) {
  const pos = ord.indexOf(C.eu) + 1;
  if (pos !== posAnt) { $('posicao').textContent = pos + 'º'; $('posicao').classList.toggle('p1', pos === 1); posAnt = pos; }
  $('volta').textContent = lim(C.eu.volta, 1, VOLTAS) + '/' + VOLTAS;
  $('moedas').textContent = C.eu.moedas;
  if (C.eu.volta !== C.voltaVista && C.fase === 'corre' && C.eu.volta >= 2 && C.eu.volta <= VOLTAS) {
    $('contagem').textContent = C.eu.volta + '/' + VOLTAS; anima($('contagem'));
    setTimeout(() => { if (C && $('contagem').textContent.includes('/')) $('contagem').textContent = ''; }, 1300);
  }
  C.voltaVista = C.eu.volta;
  const b = $('bItem'), k = C.eu;
  if (k.roleta > 0) {
    const nomes = Object.keys(ITENS);
    b.textContent = ITENS[nomes[Math.floor(C.t * 12) % nomes.length]];
    b.className = 'item roleta';
  }
  desenhaMapa();
}
function atualizaItem() {
  const k = C && C.eu, b = $('bItem');
  if (!k) return;
  b.textContent = k.item ? ITENS[k.item] : '';
  b.className = 'item' + (k.item ? ' cheio' : '');
}

/* ---------- Chegada ---------- */
function mostraFim() {
  telas('fim');
  $('controles').classList.remove('on');
  const ord = ranking(), pos = ord.indexOf(C.eu) + 1;
  $('medalha').textContent = ['🏆', '🥈', '🥉'][pos - 1] || '⭐';
  $('lista').innerHTML = ord.map((k, i) =>
    `<div class="${k.eu ? 'eu' : ''}" style="background:${k.p.cor}"><img src="${FOTO[k.p.id]}" alt=""><b>${i + 1}</b></div>`).join('');
  confete();
}
function confete() {
  const n = 260, pos = new Float32Array(n * 3), cor = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    c.setHSL(Math.random(), 0.9, 0.6); cor.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  C.confete = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.14, vertexColors: true }));
  C.cena.add(C.confete);
}

/* ---------- Modo leve: se o celular não aguentar, tira as sombras e a nitidez extra ---------- */
let medT = 0, medN = 0;
function mede(bruto) {
  if (save.leve || medN < 0 || bruto <= 0 || bruto > 0.25) return;
  medT += bruto; medN++;
  if (medN >= 90) {
    if (medT / medN > 1 / 28) modoLeve();
    medN = -1;
  }
}
function modoLeve() {
  save.leve = true; guarda();
  R.shadowMap.enabled = false;
  R.setPixelRatio(1); ajusta();
  const marca = o => { if (o.material) o.material.needsUpdate = true; };
  vitrine.traverse(marca);
  if (C) { C.cena.traverse(marca); C.karts.forEach(k => { k.sombra.visible = true; }); }
}

/* ---------- Laço principal ---------- */
let ultimo = performance.now();
function quadro(agora) {
  requestAnimationFrame(quadro);
  const bruto = (agora - ultimo) / 1000;
  const dt = Math.max(0, Math.min(0.05, bruto)); ultimo = Math.max(ultimo, agora);
  if (C && C.fase === 'corre' && tela === 'corrida') mede(bruto);
  if (C && (tela === 'corrida' || tela === 'fim')) {
    C.t += dt;
    if (C.fase === 'contagem') {
      C.cont -= dt;
      const n = Math.ceil(C.cont - 0.6);
      if (n < C.ultimoNum && n >= 1 && n <= 3) { $('contagem').textContent = n; anima($('contagem')); SOM.bip(); C.ultimoNum = n; }
      if (C.cont <= 0.6 && C.ultimoNum > 0) {
        C.fase = 'corre'; C.ultimoNum = 0;
        $('contagem').textContent = 'VAI!'; anima($('contagem')); SOM.vai();
        setTimeout(() => { if (C && $('contagem').textContent === 'VAI!') $('contagem').textContent = ''; }, 900);
      }
    }
    const ord = pegaveis(dt);
    C.karts.forEach(k => atualizaKart(k, dt, ord.indexOf(k) + 1));
    colisoes();
    atualizaObjs(dt);
    for (const a of C.P.anim) a(C.t, dt, cam);
    camera(dt);
    if (tela === 'corrida') painel(ord);
    if (C.fimT > 0) { C.fimT -= dt; if (C.fimT <= 0) mostraFim(); }
    if (C.confete) {
      const a = C.confete.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 3; if (y < 0) y += 12; a.setY(i, y); }
      a.needsUpdate = true;
      C.confete.position.set(C.eu.x, C.eu.y, C.eu.z);
    }
    if (motor) {
      const v = C.eu.vel + (C.eu.turbo > 0 ? 8 : 0);
      motor.o.frequency.setTargetAtTime(48 + v * 3.6, ac.currentTime, 0.05);
      motor.g.gain.setTargetAtTime(save.som && tela === 'corrida' ? 0.03 : 0, ac.currentTime, 0.1);
    }
    moveSol(C.P.sol, C.eu.x, C.eu.y, C.eu.z);
    R.render(C.cena, cam);
  } else {
    palco.rotation.y += dt * 0.7;
    cam.fov = 45; cam.updateProjectionMatrix();
    cam.position.set(0, 2.6, 7.2); cam.lookAt(0, 1.1, 0);
    if (tela === 'titulo') { cam.position.set(-3, 2.6, 8.5); cam.lookAt(-3, 1.1, 0); }
    if (tela === 'pistas') { cam.position.set(0, 4, 9); cam.lookAt(0, 0.8, 0); }
    if (kartVitrine) kartVitrine.userData.piloto.position.y = Math.abs(Math.sin(agora / 300)) * 0.08;
    R.render(vitrine, cam);
  }
}

/* ---------- Controles ---------- */
function liga(el, ev, fn) { el.addEventListener(ev, fn); }
function toqueLado(lado) {
  return e => {
    e.preventDefault(); audio();
    dedos[lado].add(e.pointerId);
    $(lado === 'esq' ? 'tEsq' : 'tDir').classList.add('on');
    if (C && C.eu.ar) C.eu.truque = true, SOM.truque();
  };
}
liga($('tEsq'), 'pointerdown', toqueLado('esq'));
liga($('tDir'), 'pointerdown', toqueLado('dir'));
function soltaDedo(e) {
  for (const l of ['esq', 'dir']) {
    if (dedos[l].delete(e.pointerId) && !dedos[l].size) $(l === 'esq' ? 'tEsq' : 'tDir').classList.remove('on');
  }
}
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, soltaDedo);
liga($('bItem'), 'pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (C) usaItem(C.eu); });

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') teclas.esq = true;
  else if (k === 'arrowright' || k === 'd') teclas.dir = true;
  else if (k === ' ' || k === 'x' || k === 'arrowup') {
    if (C && C.eu.ar && !C.eu.truque) { C.eu.truque = true; SOM.truque(); }
    else if (C) usaItem(C.eu);
  } else return;
  e.preventDefault();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') teclas.esq = false;
  if (k === 'arrowright' || k === 'd') teclas.dir = false;
});

$('bJogar').onclick = () => { audio(); vaiEscolhe(); };
$('bSom').onclick = () => { save.som = !save.som; guarda(); $('bSom').textContent = save.som ? '🔊' : '🔇'; audio(); SOM.bip(); };
$('bAnt').onclick = () => { audio(); mostraPiloto(escolhido - 1); };
$('bProx').onclick = () => { audio(); mostraPiloto(escolhido + 1); };
$('bOk').onclick = () => { audio(); SOM.caixa(); save.piloto = escolhido; guarda(); vaiPistas(); };
$('bCasa').onclick = () => vaiTitulo();
$('bDeNovo').onclick = () => iniciaCorrida(C ? C.ip : 0);
$('bProxPista').onclick = () => iniciaCorrida(C ? (C.ip + 1) % PISTAS.length : 0);
$('bPistas').onclick = () => vaiPistas();

$('gradePistas').innerHTML = PISTAS.map((p, i) =>
  `<button data-i="${i}" style="--c1:${p.c1};--c2:${p.c2}"><b>${p.emoji}</b><span>${p.nome}</span></button>`).join('');
$('gradePistas').querySelectorAll('button').forEach(b => { b.onclick = () => iniciaCorrida(+b.dataset.i); });

window.appVoltar = () => {
  if (tela === 'titulo') return false;
  if (tela === 'corrida' || tela === 'fim') vaiPistas();
  else if (tela === 'pistas') vaiEscolhe();
  else vaiTitulo();
  return true;
};

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- Começo ---------- */
fazFotos();
ajusta();
$('fotos').innerHTML = PILOTOS.map((p, i) =>
  `<button class="foto" data-i="${i}" style="--cor:${p.cor}" aria-label="${p.nome}"><img src="${FOTO[p.id]}" alt=""></button>`).join('');
$('fotos').querySelectorAll('.foto').forEach(b => { b.onclick = () => { audio(); mostraPiloto(+b.dataset.i); }; });
$('bSom').textContent = save.som ? '🔊' : '🔇';
mostraPiloto(escolhido, false);
requestAnimationFrame(quadro);

const testePista = PISTAS.findIndex(p => p.id === URLP.get('pista'));
const testePiloto = PILOTOS.findIndex(p => p.id === URLP.get('piloto'));
if (testePiloto >= 0) mostraPiloto(testePiloto, false);
setTimeout(() => {
  $('abertura').classList.remove('on');
  if (testePista >= 0) iniciaCorrida(testePista);
  else if (URLP.get('tela') === 'escolhe') vaiEscolhe();
  else telas('titulo');
}, testePista >= 0 || URLP.has('tela') ? 0 : 1800);
