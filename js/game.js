/* ==========================================================================
   GAME.JS — Motor de Plataforma 2D Pixel Art, Fases e Regras de Coleta
   ========================================================================== */

const cv = document.getElementById('world');
const cx = cv.getContext('2d');

let W = 800, H = 600, DPR = 1, K = 1;
const V = { s: 1, W: 800, H: 540 };

// Geometria do relevo do terreno
const PTS = [
  [-400, 400], [600, 396], [1400, 408], [2200, 386], [2900, 396],
  [3500, 408], [4300, 388], [5000, 404], [5700, 394], [6100, 396],
  [6650, 460], [7120, 520], [7200, 520], [7500, 520], [7580, 520],
  [8200, 470], [9000, 385], [9600, 308], [10040, 282], [10800, 282]
];

const CHASM = [7200, 7500];
const GUSTS = [[7920, 8180], [8500, 8760], [9100, 9380]];

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Elevação em degraus discretos para visual retrô
function elev(x) {
  let i = 0;
  while (i < PTS.length - 2 && x >= PTS[i + 1][0]) i++;
  const [a, ay] = PTS[i];
  const [b, by] = PTS[i + 1];
  const t = clamp((x - a) / (b - a), 0, 1);
  const c = (1 - Math.cos(Math.PI * t)) / 2;
  const raw = lerp(ay, by, c);
  return Math.round(raw / 2) * 2;
}

const bridge = { p: 0, done: false };

// Plataformas flutuantes de pedra ao longo das 4 fases
const PLATFORMS = [
  // Fase 1
  { x: 640, w: 120, hOff: 68 },
  { x: 960, w: 130, hOff: 82 },
  { x: 1420, w: 120, hOff: 72 },
  { x: 1880, w: 140, hOff: 86 },
  { x: 2340, w: 120, hOff: 70 },
  // Fase 2
  { x: 3340, w: 130, hOff: 74 },
  { x: 3780, w: 130, hOff: 88 },
  { x: 4260, w: 140, hOff: 74 },
  { x: 4760, w: 130, hOff: 86 },
  { x: 5180, w: 120, hOff: 72 },
  // Fase 3
  { x: 6150, w: 120, hOff: 74 },
  { x: 6620, w: 120, hOff: 76 },
  // Fase 4
  { x: 8080, w: 130, hOff: 95 },
  { x: 8660, w: 130, hOff: 95 },
  { x: 9280, w: 130, hOff: 95 }
];

function platformY(pl) {
  return elev(pl.x + pl.w / 2) - pl.hOff;
}

function groundAt(x) {
  if (x > CHASM[0] && x < CHASM[1]) {
    return bridge.done ? 520 : null;
  }
  return elev(x);
}

// Estado da Jogadora (Leo)
const P = {
  x: 160,
  y: 400,
  vx: 0,
  vy: 0,
  dir: 1,
  ground: true,
  coyote: 0,
  glide: false,
  charge: 1,
  phase: 0,
  hearts: 3,
  invuln: 0
};

// Entradas de controle (Teclado + Touch)
const keys = { left: false, right: false, jump: false, jumpJustPressed: false };

let camX = 0, camY = 0, T = 0;
let gameMode = 'title'; // 'title' | 'play' | 'dialog' | 'puzzle' | 'victory'
let currentChapter = 1;

// Dados das Fases e Coleta
const state = {
  ch1Bag: {},
  ch1Order: [],
  ch1TotalTouched: 0,
  ch1Goal: 5, // Precisa de 5 elementos distintos em A
  ch2Got: [],
  ch2Goal: 4, // Precisa de 4 elementos de A ∩ B
  ch4Clues: 0
};

let glyphs = [];
let motes = [];
let npcs = [];
let altars = [];
let parts = [];
let stars = [];

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = W * DPR;
  cv.height = H * DPR;
  const minWorldW = W < 640 ? 500 : 420;
  const minWorldH = H < 500 ? 480 : 540;
  V.s = Math.min(H / minWorldH, W / minWorldW);
  V.W = W / V.s;
  V.H = H / V.s;
  K = DPR * V.s;
  cx.imageSmoothingEnabled = false;

  stars = Array.from({ length: 90 }, (_, i) => ({
    x: (hash(i * 3) * 1600) % V.W,
    y: hash(i * 7) * V.H * 0.55,
    s: i % 4 === 0 ? 3 : 2,
    p: i * 1.3
  }));
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

function spawnBurst(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = 1.2 + Math.random() * 2.5;
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1.2,
      life: 1,
      dec: 0.03 + Math.random() * 0.02,
      c: color,
      sz: 4 + (i % 2) * 2
    });
  }
}

function showToast(html, isBad = false, ms = 2600) {
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.classList.toggle('bad', isBad);
  t.classList.add('on');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('on'), ms);
}

function populateChapterItems() {
  // Cristais da Fase 1 (Cardinalidade): vários repetidos e 7 tipos distintos espalhados no chão e plataformas
  const c1 = [
    { k: 'gc', x: 420, h: 24 },
    { k: 'gc', x: 560, h: 24 }, // repetido proposital no chão
    { k: 'tt', x: 700, h: 96 }, // em cima da plataforma 1
    { k: 'gc', x: 860, h: 24 }, // repetido
    { k: 'rd', x: 1020, h: 110 }, // plataforma 2
    { k: 'tt', x: 1230, h: 24 }, // repetido
    { k: 'gs', x: 1480, h: 100 }, // plataforma 3
    { k: 'tc', x: 1700, h: 26 },
    { k: 'rd', x: 1820, h: 26 }, // repetido
    { k: 'rt', x: 1950, h: 114 }, // plataforma 4
    { k: 'gs', x: 2180, h: 26 }, // repetido
    { k: 'td', x: 2400, h: 98 }, // plataforma 5
    { k: 'tc', x: 2600, h: 26 }  // repetido
  ];

  // Cristais da Fase 2 (Interseção A ∩ B: Quentes E com Pontas)
  // Válidos (A ∩ B): gt, gd, gs, rt, rd, rs
  // Armadilhas (Fora de A ∩ B): gc, rc (sem pontas), tc, tt, td, ts (frios)
  const c2 = [
    { k: 'gt', x: 3180, h: 26 },  // VÁLIDO (1)
    { k: 'gc', x: 3320, h: 26 },  // ARMADILHA (círculo dourado)
    { k: 'rd', x: 3400, h: 102 }, // VÁLIDO na plataforma (2)
    { k: 'tc', x: 3600, h: 26 },  // ARMADILHA (frio e redondo)
    { k: 'gs', x: 3840, h: 116 }, // VÁLIDO na plataforma (3)
    { k: 'tt', x: 4050, h: 26 },  // ARMADILHA (tem pontas mas é frio)
    { k: 'rt', x: 4330, h: 102 }, // VÁLIDO na plataforma (4)
    { k: 'rc', x: 4540, h: 26 },  // ARMADILHA (quente mas redondo)
    { k: 'gd', x: 4820, h: 114 }, // VÁLIDO extra na plataforma (5)
    { k: 'td', x: 5020, h: 26 },  // ARMADILHA
    { k: 'rs', x: 5240, h: 100 }, // VÁLIDO extra na plataforma (6)
    { k: 'gs', x: 5440, h: 26 }   // VÁLIDO extra (7)
  ];

  glyphs = [
    ...c1.map((o, i) => ({ it: G(o.k), x: o.x, h: o.h, ch: 1, alive: true, ph: i * 0.9 })),
    ...c2.map((o, i) => ({ it: G(o.k), x: o.x, h: o.h, ch: 2, alive: true, ph: i * 1.1 }))
  ];

  motes = [];
  for (let x = 5850; x < 9850; x += 240) {
    if (x > 7080 && x < 7580) continue;
    motes.push({ x, h: 48 + (hash(x) * 65), alive: true });
  }

  const npcData = [
    { x: 7760, clue: 'Total no cume: <b>|U| = 30</b> viajantes.', note: '|U| = 30 viajantes no total' },
    { x: 8140, clue: '<b>15</b> tocaram a Areia (A), <b>12</b> ouviram o Vento (V), <b>10</b> seguiram a Estrela (E).', note: '|A|=15, |V|=12, |E|=10' },
    { x: 8680, clue: 'Interseções duplas: <b>|A ∩ V| = 5</b> e <b>|V ∩ E| = 4</b>.', note: '|A ∩ V| = 5, |V ∩ E| = 4' },
    { x: 9260, clue: 'Mais uma dupla: <b>|A ∩ E| = 3</b> tocaram a areia e seguiram a estrela.', note: '|A ∩ E| = 3' },
    { x: 9700, clue: 'No centro de tudo: <b>|A ∩ V ∩ E| = 2</b> viveram as 3 experiências!', note: '|A ∩ V ∩ E| = 2 (os três)' }
  ];

  npcs = npcData.map((d, i) => ({
    x: d.x,
    clue: d.clue,
    note: d.note,
    seen: false,
    id: i + 1
  }));

  altars = [
    { ch: 1, x: 2880, solved: false, label: 'MONÓLITO I' },
    { ch: 2, x: 5660, solved: false, label: 'ALTAR II (VENN)' },
    { ch: 3, x: 7130, solved: false, label: 'ALAVANCA DA PONTE' },
    { ch: 4, x: 10060, solved: false, label: 'SANTUÁRIO FINAL' }
  ];
}

function resetWorld() {
  currentChapter = 1;
  bridge.p = 0;
  bridge.done = false;
  state.ch1Bag = {};
  state.ch1Order = [];
  state.ch1TotalTouched = 0;
  state.ch2Got = [];
  state.ch4Clues = 0;

  Object.assign(P, {
    x: 160,
    y: elev(160),
    vx: 0,
    vy: 0,
    dir: 1,
    ground: true,
    glide: false,
    charge: 1,
    phase: 0,
    hearts: 3,
    invuln: 0
  });

  populateChapterItems();
  camX = P.x - V.W * 0.35;
  camY = P.y - V.H * 0.68;
  updateHUD();
  updateNotesUI();
}

function updateNotesUI() {
  const box = document.getElementById('notes-box');
  const list = document.getElementById('notes-list');
  if (currentChapter !== 4) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  list.innerHTML = npcs.map(n =>
    n.seen
      ? `<li>✔ ${n.note}</li>`
      : `<li class="pending">? Converse com o Viajante #${n.id}</li>`
  ).join('');
}

function isAltarReady(ch) {
  if (ch === 1) return state.ch1Order.length >= state.ch1Goal;
  if (ch === 2) return state.ch2Got.length >= state.ch2Goal;
  if (ch === 3) return true;
  if (ch === 4) return state.ch4Clues >= 4;
  return false;
}

function updateHUD() {
  const stageTag = document.getElementById('hud-stage-tag');
  const heartsEl = document.getElementById('hud-hearts');
  const goalEl = document.getElementById('hud-goal');
  const bagEl = document.getElementById('hud-bag');
  const statusEl = document.getElementById('hud-status');

  const heartsStr = Array.from({ length: 3 }, (_, i) =>
    `<span style="color:${i < P.hearts ? '#ff5252' : '#46375e'}">♥</span>`
  ).join('');
  heartsEl.innerHTML = heartsStr;

  const ready = isAltarReady(currentChapter);

  if (currentChapter === 1) {
    stageTag.textContent = 'FASE I: CARDINALIDADE';
    goalEl.innerHTML = `Meta do Portão: Colete <em>5 cristais distintos</em> para o conjunto <b>A</b>`;
    bagEl.innerHTML = `<span>A = {</span>` +
      state.ch1Order.map(k => `<span class="hud-bag-item">${icon(state.ch1Bag[k], 18)}</span>`).join('') +
      `<span>}</span>`;
    statusEl.innerHTML =
      `<span>Cardinalidade <b>|A| = ${state.ch1Order.length} / ${state.ch1Goal}</b> (Tocados: ${state.ch1TotalTouched})</span>` +
      (ready ? `<span class="ready-badge">PORTÃO PRONTO!</span>` : '');
  } else if (currentChapter === 2) {
    stageTag.textContent = 'FASE II: INTERSEÇÃO (A ∩ B)';
    goalEl.innerHTML = `Pegue só <em>A ∩ B</em>: <b>Tom Quente</b> (Dourado/Rosa) <b>E Com Pontas</b>!`;
    bagEl.innerHTML = `<span>A ∩ B = {</span>` +
      state.ch2Got.map(it => `<span class="hud-bag-item">${icon(it, 18)}</span>`).join('') +
      `<span>}</span>`;
    statusEl.innerHTML =
      `<span>Coletados: <b>${state.ch2Got.length} / ${state.ch2Goal}</b> (Cuidado com os errados!)</span>` +
      (ready ? `<span class="ready-badge">ALTAR PRONTO!</span>` : '');
  } else if (currentChapter === 3) {
    stageTag.textContent = 'FASE III: A PONTE DA UNIÃO (A ∪ B)';
    goalEl.innerHTML = `Desça até a beira do abismo e acione a <em>Alavanca da Ponte</em>`;
    bagEl.innerHTML = `<span>Fórmula: <b>|A ∪ B| = |A| + |B| - |A ∩ B|</b></span>`;
    statusEl.innerHTML =
      `<span>Construção da Ponte: <b>${Math.round(bridge.p * 100)}%</b></span>` +
      `<span class="ready-badge">ALAVANCA ATIVA</span>`;
  } else {
    stageTag.textContent = 'FASE IV: INCLUSÃO-EXCLUSÃO';
    goalEl.innerHTML = `Suba pelos ventos e ouça os <em>Viajantes</em> antes do Santuário`;
    bagEl.innerHTML = `<span>Conjuntos: <b>A (Areia)</b>, <b>V (Vento)</b>, <b>E (Estrela)</b> em <b>U</b></span>`;
    statusEl.innerHTML =
      `<span>Pistas anotadas: <b>${state.ch4Clues} / 5</b></span>` +
      (ready ? `<span class="ready-badge">SANTUÁRIO PRONTO!</span>` : '');
  }
}

function respawnAtCheckpoint(reasonMsg) {
  SFX.hurt();
  P.hearts = 3;
  P.vx = 0;
  P.vy = 0;

  if (currentChapter === 1) P.x = 180;
  else if (currentChapter === 2) {
    P.x = 2960;
    state.ch2Got = [];
    glyphs.forEach(gl => { if (gl.ch === 2) gl.alive = true; });
  } else if (currentChapter === 3) {
    P.x = 6980;
  } else {
    P.x = 7620;
  }

  P.y = elev(P.x);
  P.ground = true;
  updateHUD();
  showToast(reasonMsg, true, 3200);
}

function jumpToChapter(ch) {
  SFX.init();
  currentChapter = ch;
  P.hearts = 3;
  P.vx = 0;
  P.vy = 0;
  P.ground = true;

  if (ch === 1) {
    P.x = 160;
  } else if (ch === 2) {
    altars[0].solved = true;
    P.x = 2960;
  } else if (ch === 3) {
    altars[0].solved = true;
    altars[1].solved = true;
    P.x = 5760;
  } else if (ch === 4) {
    altars[0].solved = true;
    altars[1].solved = true;
    altars[2].solved = true;
    bridge.p = 1;
    bridge.done = true;
    P.x = 7620;
  }
  P.y = elev(P.x);
  updateHUD();
  updateNotesUI();
}

// Verifica se o Mago está em frente ao altar atual
function getNearbyAltar() {
  const al = altars[currentChapter - 1];
  if (!al || al.solved) return null;
  if (Math.abs(P.x - (al.x - 32)) < 68) return al;
  return null;
}

async function triggerAltarInteraction() {
  if (gameMode !== 'play') return;
  const al = getNearbyAltar();
  if (!al) return;

  if (!isAltarReady(al.ch)) {
    SFX.hurt();
    if (al.ch === 1) {
      showToast(`Portão Trancado! Você só tem <b>|A| = ${state.ch1Order.length}/${state.ch1Goal}</b> cristais distintos. Volte com [◀ / A] e explore as plataformas!`, true, 3500);
    } else if (al.ch === 2) {
      showToast(`Altar Trancado! Colete <b>${state.ch2Goal}</b> cristais de <b>A ∩ B</b> (Quentes E com Pontas) pelo caminho!`, true, 3500);
    } else if (al.ch === 4) {
      showToast(`Fale com pelo menos <b>4 Viajantes</b> na subida antes de abrir o Santuário!`, true, 3500);
    }
    return;
  }

  gameMode = 'puzzle';
  keys.left = keys.right = keys.jump = false;
  document.getElementById('btn-interact').classList.add('hidden');

  if (al.ch === 1) {
    await runDialog([
      {
        speaker: 'Mestre Lia (Cartógrafa)',
        portrait: 'npc',
        text: `Muito bem, Leo! Você reuniu <b>|A| = ${state.ch1Order.length}</b> cristais distintos na sua bolsa (mesmo tendo tocado em ${state.ch1TotalTouched} pelo caminho).`
      },
      {
        speaker: 'Leo (Explorador)',
        portrait: 'hero',
        text: `Entendi! Na <b>Cardinalidade</b> de um conjunto, elementos repetidos não aumentam a contagem. Agora vou destrancar o Monólito!`
      }
    ]);
    await runAltar1();
    al.solved = true;
    currentChapter = 2;
    P.hearts = 3;
    updateHUD();
    await runDialog([
      {
        speaker: 'Mestre Lia (Cartógrafa)',
        portrait: 'npc',
        text: `Fase II - <b>Interseção (A ∩ B)</b>! Adiante há cristais misturados. O conjunto <b>A</b> são as cores <b>Quentes (Dourado e Rosa)</b>, e <b>B</b> são as formas <b>Com Pontas</b>.`
      },
      {
        speaker: 'Leo (Explorador)',
        portrait: 'hero',
        text: `Então para pegar só <b>A ∩ B</b>, preciso pegar apenas os que são <b>Quentes E têm Pontas</b> ao mesmo tempo, desviando dos círculos e dos cristais verde-água!`
      }
    ]);
  } else if (al.ch === 2) {
    await runAltar2();
    al.solved = true;
    currentChapter = 3;
    P.hearts = 3;
    updateHUD();
    await runDialog([
      {
        speaker: 'Mestre Lia (Cartógrafa)',
        portrait: 'npc',
        text: `O Portão II abriu! À frente fica o Grande Abismo. Para construir a ponte da <b>União (A ∪ B)</b>, lembre-se de descontar a interseção que foi contada duas vezes!`
      }
    ]);
  } else if (al.ch === 3) {
    await runAltar3(prog => {
      bridge.p = prog;
      if (prog >= 1) bridge.done = true;
      updateHUD();
    });
    al.solved = true;
    bridge.p = 1;
    bridge.done = true;
    currentChapter = 4;
    updateHUD();
    updateNotesUI();
    await runDialog([
      {
        speaker: 'Leo (Explorador)',
        portrait: 'hero',
        text: `A ponte está firme! Agora começa a subida para o Cume dos Ventos. Segurando <b>[PULAR]</b> dentro das correntes de vento, minha capa me leva para o alto!`
      }
    ]);
  } else if (al.ch === 4) {
    await runAltar4();
    al.solved = true;
    gameMode = 'victory';
    await runDialog([
      {
        speaker: 'Mestre Lia (Cartógrafa)',
        portrait: 'npc',
        text: `Parabéns, Leo! Você dominou a <b>Cardinalidade |A|</b>, a <b>Interseção A ∩ B</b>, a <b>União A ∪ B</b>, o <b>Princípio da Inclusão-Exclusão</b> e o <b>Complementar</b>!`
      },
      {
        speaker: 'Leo (Explorador)',
        portrait: 'hero',
        text: `Contar bem é não esquecer ninguém, e não contar ninguém duas vezes! Missão cumprida no topo da montanha!`
      }
    ]);
    resetWorld();
    const stageSel = document.getElementById('stage-select');
    if (stageSel) stageSel.value = '1';
    document.getElementById('title-screen').classList.remove('hidden');
    gameMode = 'title';
    return;
  }

  gameMode = 'play';
}

/* ================= FÍSICA E LOOP DE ATUALIZAÇÃO ================= */
function inGust(x) {
  return npcs.some(n => Math.abs(x - n.x) < 34);
}

function update(dt) {
  if (gameMode !== 'play') return;

  if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);

  // Movimento Horizontal (Controle Real Esquerda / Direita)
  const moveDir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const maxSpeed = 3.4;
  if (moveDir !== 0) {
    P.dir = moveDir;
    P.vx = lerp(P.vx, moveDir * maxSpeed, 0.22 * dt);
    P.phase += Math.abs(P.vx) * 0.15 * dt;
  } else {
    P.vx *= Math.pow(0.72, dt);
    if (Math.abs(P.vx) < 0.08) P.vx = 0;
  }

  const prevY = P.y;
  P.x += P.vx * dt;

  // Limites laterais do mapa e colisão sólida na frente dos portões fechados
  if (P.x < 60) {
    P.x = 60;
    if (P.vx < 0) P.vx = 0;
  }
  for (const al of altars) {
    if (!al.solved && al.ch !== 3) {
      const gateFrontX = al.x - 48;
      if (P.x > gateFrontX) {
        P.x = gateFrontX;
        if (P.vx > 0) P.vx = 0;
      }
    }
  }
  if (P.x > 10200) P.x = 10200;

  if (P.ground) {
    P.coyote = 7;
  } else if (P.coyote > 0) {
    P.coyote = Math.max(0, P.coyote - dt);
  }

  // Pulo (com Coyote Time para pular na borda das plataformas sem falhar)
  if (keys.jumpJustPressed && (P.ground || P.coyote > 0)) {
    P.vy = -8.8;
    P.ground = false;
    P.coyote = 0;
    SFX.jump();
    spawnBurst(P.x, P.y, '#ffce54', 5);
  }
  keys.jumpJustPressed = false;

  // Gravidade, Planar e Correntes de Vento
  const gust = inGust(P.x);
  if (!P.ground) {
    P.vy += 0.36 * dt;
    P.glide = keys.jump && (P.vy > -0.5 || gust) && (P.charge > 0 || gust);
    if (P.glide) {
      if (gust) {
        P.vy = Math.max(P.vy - 0.62 * dt, -4.4);
      } else {
        P.vy = Math.min(P.vy, 0.85);
        P.charge = Math.max(0, P.charge - 0.004 * dt);
      }
    }
    P.y += P.vy * dt;
  } else {
    P.glide = false;
    P.charge = Math.min(1, P.charge + 0.01 * dt);
  }

  // Colisão com Plataformas Flutuantes (one-way)
  let onSurface = false;
  for (const pl of PLATFORMS) {
    if (P.x >= pl.x - 10 && P.x <= pl.x + pl.w + 10) {
      const py = platformY(pl);
      if (P.vy >= 0 && prevY <= py + 6 && P.y >= py) {
        P.y = py;
        P.vy = 0;
        P.ground = true;
        onSurface = true;
        break;
      }
    }
  }

  // Colisão com o Chão Principal
  const g = groundAt(P.x);
  if (!onSurface) {
    if (g !== null) {
      if (P.ground && P.y <= g + 10) {
        P.y = g;
      } else if (P.vy >= 0 && P.y >= g) {
        P.y = g;
        P.vy = 0;
        P.ground = true;
        SFX.land();
      } else if (P.y < g - 4) {
        P.ground = false;
      }
    } else {
      P.ground = false;
    }
  }

  // Caiu no Abismo da Fase 3!
  if (P.y > 650) {
    respawnAtCheckpoint('Você caiu no Abismo! Construa a ponte na Alavanca antes de atravessar.');
    return;
  }

  // Coleta de Cristais (Fases 1 e 2)
  for (const gl of glyphs) {
    if (!gl.alive) continue;
    const gy = elev(gl.x) - gl.h + Math.sin(T * 0.05 + gl.ph) * 4;
    if (Math.abs(gl.x - P.x) < 22 && Math.abs(gy - (P.y - 22)) < 28) {
      gl.alive = false;
      const it = gl.it;
      if (gl.ch === 1) {
        state.ch1TotalTouched++;
        if (state.ch1Bag[it.key]) {
          SFX.pickupDup();
          spawnBurst(gl.x, gy, '#c2b6d6', 6);
          showToast(`${describe(it)} já está em <b>A</b>! Elementos repetidos não mudam <b>|A|</b>.`);
        } else {
          state.ch1Bag[it.key] = it;
          state.ch1Order.push(it.key);
          SFX.pickupNew(state.ch1Order.length);
          spawnBurst(gl.x, gy, COL[it.color], 14);
          showToast(`+1 Elemento distinto! ${describe(it)} entrou em <b>A</b> (<b>|A| = ${state.ch1Order.length}</b>).`);
        }
        updateHUD();
      } else if (gl.ch === 2) {
        if (warm(it) && sharp(it)) {
          state.ch2Got.push(it);
          SFX.pickupNew(state.ch2Got.length);
          spawnBurst(gl.x, gy, COL[it.color], 14);
          showToast(`Boa! ${describe(it)} está em <b>A ∩ B</b> (${state.ch2Got.length}/${state.ch2Goal}).`);
          updateHUD();
        } else {
          P.hearts--;
          P.invuln = 45;
          SFX.hurt();
          spawnBurst(gl.x, gy, '#ff5252', 12);
          const why = !warm(it) && !sharp(it)
            ? 'é frio e não tem pontas (fora de A e B)'
            : !warm(it)
              ? 'tem pontas, mas é frio (só em B)'
              : 'é quente, mas redondo (só em A)';
          if (P.hearts <= 0) {
            respawnAtCheckpoint(`Sem energia! Você pegou muitos cristais fora de A ∩ B. Tentando a Fase II novamente!`);
            return;
          } else {
            showToast(`Ops! ${describe(it)} ${why}! (-1 ♥)`, true);
            updateHUD();
          }
        }
      }
    }
  }

  // Coleta de orbes de energia de planar
  for (const m of motes) {
    if (!m.alive) continue;
    const my = elev(m.x) - m.h + Math.sin(T * 0.06 + m.x) * 4;
    if (Math.abs(m.x - P.x) < 20 && Math.abs(my - (P.y - 22)) < 28) {
      m.alive = false;
      P.charge = 1;
      SFX.mote();
      spawnBurst(m.x, my, '#48dbfb', 8);
    }
  }

  // Conversa automática ao passar pelos Viajantes da Fase 4
  for (const npc of npcs) {
    if (!npc.seen && Math.abs(P.x - npc.x) < 38) {
      npc.seen = true;
      state.ch4Clues++;
      SFX.pickupNew(state.ch4Clues);
      spawnBurst(npc.x, elev(npc.x) - 24, '#48dbfb', 12);
      showToast(`Viajante #${npc.id}: "${npc.clue}"`, false, 4200);
      updateHUD();
      updateNotesUI();
    }
  }

  // Atualiza botão de interação com Altar
  const nearAltar = getNearbyAltar();
  const interactBtn = document.getElementById('btn-interact');
  if (nearAltar) {
    interactBtn.classList.remove('hidden');
    interactBtn.textContent = isAltarReady(nearAltar.ch)
      ? `ABRIR ${nearAltar.label} [E]`
      : `VER REQUISITO [E]`;
  } else {
    interactBtn.classList.add('hidden');
  }

  // Atualiza partículas (poeira mágica sobe suavemente)
  parts.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.magic ? -0.015 : 0.1) * dt;
    p.life -= p.dec * dt;
  });
  parts = parts.filter(p => p.life > 0);

  // Câmera suave acompanhando Leo
  const targetCamX = P.x - V.W * (P.dir >= 0 ? 0.36 : 0.64);
  const targetCamY = P.y - V.H * 0.68;
  camX = lerp(camX, targetCamX, 0.09 * dt);
  camY = lerp(camY, targetCamY, 0.08 * dt);
}

/* ================= RENDERIZAÇÃO PIXEL ART 2D ================= */
function setLayerTransform(parallax) {
  const cy0 = 400 - V.H * 0.68;
  const tx = Math.round(-camX * parallax * K);
  const ty = Math.round(-(cy0 + (camY - cy0) * parallax) * K);
  cx.setTransform(K, 0, 0, K, tx, ty);
}

function drawPixelPlatform(pl) {
  const py = platformY(pl);
  const h = 18;
  // Sombra e corpo de tijolos
  cx.fillStyle = '#1b1429';
  cx.fillRect(pl.x, py, pl.w, h);
  cx.fillStyle = '#4e3b6b';
  cx.fillRect(pl.x + 2, py + 2, pl.w - 4, h - 4);
  // Topo iluminado dourado/areia
  cx.fillStyle = '#e0a96d';
  cx.fillRect(pl.x, py, pl.w, 4);
  // Divisórias de blocos
  cx.fillStyle = '#291f3d';
  for (let bx = pl.x + 24; bx < pl.x + pl.w - 8; bx += 24) {
    cx.fillRect(bx, py + 4, 2, h - 6);
  }
}

function drawAltarGate(al) {
  const gy = elev(al.x);
  const ready = isAltarReady(al.ch);
  const color = al.solved ? '#5cd85a' : ready ? '#ffce54' : '#ff5252';

  // Pilares de pedra pixelados
  cx.fillStyle = '#231b36';
  cx.fillRect(al.x - 24, gy - 96, 48, 96);
  cx.fillStyle = '#3d305c';
  cx.fillRect(al.x - 20, gy - 92, 40, 92);
  cx.fillStyle = '#f4d28c';
  cx.fillRect(al.x - 28, gy - 102, 56, 8);

  // Cristais rúnicos no centro do monólito
  cx.fillStyle = '#120d1f';
  cx.fillRect(al.x - 10, gy - 68, 20, 36);
  cx.fillStyle = color;
  cx.fillRect(al.x - 6, gy - 64, 12, 28);

  // Barreira mágica vertical na frente do portão enquanto não foi resolvido
  if (!al.solved && al.ch !== 3) {
    cx.fillStyle = ready ? 'rgba(255, 206, 84, 0.45)' : 'rgba(255, 82, 82, 0.55)';
    cx.fillRect(al.x - 30, gy - 420, 6, 420);
  }

  // Placa flutuante acima do altar
  const bob = Math.round(Math.sin(T * 0.08) * 3);
  cx.fillStyle = '#141020';
  cx.fillRect(al.x - 52, gy - 130 + bob, 104, 20);
  cx.strokeStyle = color;
  cx.lineWidth = 2;
  cx.strokeRect(al.x - 52, gy - 130 + bob, 104, 20);

  cx.fillStyle = color;
  cx.font = 'bold 9px "Silkscreen", monospace';
  cx.textAlign = 'center';
  const statusTxt = al.solved ? 'ABERTO ✔' : ready ? 'APERTE [E]' : 'TRANCADO';
  cx.fillText(statusTxt, al.x, gy - 116 + bob);
}

const glowCache = {};
function getGlowCanvas(color) {
  if (glowCache[color]) return glowCache[color];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 28);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color + '66');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return (glowCache[color] = c);
}

// Brilho mágico suave da própria cor (sem estourar para o branco)
function drawMagicGlow(x, y, color, rad, alpha = 0.35) {
  cx.save();
  cx.globalAlpha = alpha * 0.65;
  cx.drawImage(getGlowCanvas(color), Math.round(x - rad), Math.round(y - rad), Math.round(rad * 2), Math.round(rad * 2));
  cx.restore();
}

// Desenha uma estrelinha de brilho de 4 pontas em Pixel Art (✦)
function drawPixelStar(x, y, arm, color) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  if (arm <= 0) return;
  cx.fillStyle = color;
  cx.fillRect(rx - arm, ry, arm * 2 + 1, 1);
  cx.fillRect(rx, ry - arm, 1, arm * 2 + 1);
}

function drawHero() {
  if (P.invuln > 0 && Math.floor(P.invuln / 3) % 2 === 1) return;

  let spr = SPRITES.hero.idle;
  if (!P.ground && P.glide) {
    spr = SPRITES.hero.glide;
  } else if (!P.ground) {
    spr = SPRITES.hero.run1;
  } else if (Math.abs(P.vx) > 0.35) {
    spr = Math.floor(P.phase) % 2 === 0 ? SPRITES.hero.run1 : SPRITES.hero.run2;
  }

  cx.save();
  cx.translate(Math.round(P.x), Math.round(P.y));
  // Sombra no chão
  if (P.ground) {
    cx.fillStyle = 'rgba(10, 6, 18, 0.45)';
    cx.fillRect(-14, -2, 28, 4);
  }
  cx.scale(P.dir, 1);
  cx.drawImage(spr, -28, -50);
  cx.restore();

  // Efeito de Magia Suave na ponta verde do cajado
  const tipX = Math.round(P.x + P.dir * 19);
  const tipY = Math.round(P.y - 26 + (P.glide ? -2 : 0));
  const pulse = Math.sin(T * 0.15);

  drawMagicGlow(tipX, tipY, '#2eb84b', 13 + pulse * 2.5, 0.5);
  drawPixelStar(tipX, tipY - 1, pulse > 0 ? 2 : 1, '#82f26b');

  // Estrelinhas mágicas subindo e orbitando a ponta do cajado
  for (let i = 0; i < 3; i++) {
    const phase = (T * 0.04 + i * 0.33) % 1;
    const sway = Math.sin(T * 0.12 + i * 2.1) * (5 + i * 2);
    const sx = Math.round(tipX + sway);
    const sy = Math.round(tipY - phase * 18);
    const arm = phase < 0.5 ? 2 : 1;
    drawPixelStar(sx, sy, arm, i % 2 === 0 ? '#82f26b' : '#48dbfb');
  }

  // Rastro sutil de poeira mágica quando o Mago anda ou plana
  if ((Math.abs(P.vx) > 0.5 || P.glide) && Math.floor(T) % 4 === 0) {
    parts.push({
      x: tipX + (Math.random() * 4 - 2),
      y: tipY + (Math.random() * 4 - 2),
      vx: -P.vx * 0.15 + (Math.random() * 0.4 - 0.2),
      vy: -0.6 - Math.random() * 0.5,
      life: 0.9,
      dec: 0.045,
      c: Math.random() > 0.4 ? '#82f26b' : '#ffffff',
      sz: 2,
      magic: true
    });
  }

  // Barra de energia mágica para planar
  if (P.charge < 0.99) {
    cx.fillStyle = '#141020';
    cx.fillRect(P.x - 16, P.y - 58, 32, 5);
    cx.fillStyle = '#82f26b';
    cx.fillRect(P.x - 15, P.y - 57, Math.round(30 * P.charge), 3);
  }
}

function render() {
  cx.setTransform(K, 0, 0, K, 0, 0);

  // Limpa e preenche a tela inteira com a cor do horizonte para nunca sobrar rastro de frames
  const skyBands = ['#141026', '#1e1838', '#2f224f', '#4c2c5e', '#783a63', '#a85060', '#d4755b', '#e38c68'];
  cx.fillStyle = skyBands[skyBands.length - 1];
  cx.fillRect(0, 0, Math.ceil(V.W) + 2, Math.ceil(V.H) + 2);

  // 1. Céu em faixas estilo 16-Bit Pixel Art cobrindo toda a tela
  const bandH = Math.ceil(V.H / skyBands.length);
  skyBands.forEach((col, i) => {
    cx.fillStyle = col;
    cx.fillRect(0, i * bandH, Math.ceil(V.W) + 2, bandH + 2);
  });

  // 2. Estrelas quadradas pixeladas
  cx.fillStyle = '#fff8e7';
  for (const s of stars) {
    if (Math.sin(T * 0.04 + s.p) > -0.2) {
      cx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
  }

  // 3. Sol / Lua Pixelada
  const sunX = Math.round(V.W * 0.75);
  const sunY = Math.round(V.H * 0.22);
  cx.fillStyle = '#ffce54';
  cx.fillRect(sunX - 28, sunY - 28, 56, 56);
  cx.fillStyle = '#fff3b8';
  cx.fillRect(sunX - 20, sunY - 20, 40, 40);

  // 4. Ruínas distantes em Parallax (0.35)
  setLayerTransform(0.35);
  cx.fillStyle = '#281c3d';
  const r0 = Math.floor((camX * 0.35) / 280) - 1;
  for (let i = r0; i < r0 + V.W / 280 + 3; i++) {
    const h = hash(i);
    const rx = Math.round(i * 280 + h * 90);
    const ht = Math.round(50 + h * 90);
    cx.fillRect(rx, 410 - ht, 18, ht + 500);
    cx.fillRect(rx + 48, 410 - ht + 16, 18, ht + 484);
    cx.fillRect(rx - 6, 410 - ht - 8, 78, 10);
  }

  // 5. Dunas / Colinas em degraus em Parallax (0.6)
  setLayerTransform(0.6);
  cx.fillStyle = '#3b264a';
  const x0 = Math.floor((camX * 0.6) / 16) * 16 - 32;
  for (let x = x0; x < x0 + V.W + 64; x += 16) {
    const dy = Math.round(420 + Math.sin(x * 0.004) * 20 + Math.cos(x * 0.01) * 8);
    cx.fillRect(x, dy, 17, 800);
    cx.fillStyle = '#523461';
    cx.fillRect(x, dy, 17, 4);
    cx.fillStyle = '#3b264a';
  }

  // 6. Camada Principal do Mundo (1.0)
  setLayerTransform(1);
  const viewLeft = Math.floor((camX - 32) / 16) * 16;
  const viewRight = camX + V.W + 48;

  // Fundo escuro do Abismo (Fase 3)
  if (CHASM[1] >= viewLeft && CHASM[0] <= viewRight) {
    cx.fillStyle = '#120b1d';
    cx.fillRect(CHASM[0], 520, CHASM[1] - CHASM[0], 800);
  }

  // Terreno em blocos de Pixel Art (com buraco real no Abismo)
  for (let x = viewLeft; x <= viewRight; x += 16) {
    if (x >= CHASM[0] && x < CHASM[1]) continue;
    const gy = elev(x);
    // Corpo da rocha
    cx.fillStyle = '#261936';
    cx.fillRect(x, gy, 17, 800);
    // Camada média de tijolo de areia
    cx.fillStyle = '#6e4246';
    cx.fillRect(x, gy + 6, 17, 14);
    // Borda superior de areia iluminada
    cx.fillStyle = '#e09f5a';
    cx.fillRect(x, gy, 17, 6);
    // Detalhe de pixel nos blocos
    if ((x / 16) % 2 === 0) {
      cx.fillStyle = '#472b35';
      cx.fillRect(x + 4, gy + 12, 6, 4);
    }
  }

  // Ponte sobre o Abismo (Fase 3)
  if (bridge.p > 0) {
    const totalBlocks = 15;
    const bw = (CHASM[1] - CHASM[0]) / totalBlocks;
    for (let i = 0; i < totalBlocks; i++) {
      if (i / totalBlocks >= bridge.p) break;
      const bx = CHASM[0] + i * bw;
      cx.fillStyle = '#4a2e1b';
      cx.fillRect(bx + 1, 520, bw - 2, 12);
      cx.fillStyle = '#ffce54';
      cx.fillRect(bx + 1, 520, bw - 2, 4);
    }
  }

  // Plataformas flutuantes
  for (const pl of PLATFORMS) {
    if (pl.x + pl.w < viewLeft || pl.x > viewRight) continue;
    drawPixelPlatform(pl);
  }

  // Altares / Portões
  for (const al of altars) {
    if (al.x + 80 < viewLeft || al.x - 80 > viewRight) continue;
    drawAltarGate(al);
  }

  // Ecos do Passado (Fase 4) — Alma translúcida do Mago com feixe fino e partículas azuis subindo
  for (const npc of npcs) {
    if (npc.x + 60 < viewLeft || npc.x - 60 > viewRight) continue;
    const ny = elev(npc.x);
    const bob = Math.round(Math.sin(T * 0.06 + npc.id) * 3);

    // Feixe de luz espectral fino da alma subindo até o topo da tela
    cx.fillStyle = npc.seen ? 'rgba(72, 219, 251, 0.07)' : 'rgba(140, 240, 255, 0.12)';
    cx.fillRect(Math.round(npc.x - 22), -1500, 44, ny + 1500);

    // Partículas / luzinhas azuis subindo dentro do feixe da alma
    cx.fillStyle = '#48dbfb';
    for (let k = 0; k < 7; k++) {
      const wx = Math.round(npc.x - 16 + ((k * 13 + npc.id * 7) % 32));
      const wy = Math.round(ny - ((T * 3.2 + k * 85 + npc.id * 40) % 600));
      cx.fillRect(wx, wy, 3, k % 2 === 0 ? 14 : 8);
    }

    // Sprite Fantasma Translúcido do Mago
    cx.save();
    cx.globalAlpha = npc.seen ? 0.42 : (0.7 + Math.sin(T * 0.08 + npc.id) * 0.12);
    cx.drawImage(SPRITES.hero.ghost, Math.round(npc.x - 26), Math.round(ny - 50 + bob));
    cx.restore();

    // Indicador sobre o Eco
    cx.fillStyle = npc.seen ? '#5cd85a' : '#8cf0ff';
    cx.font = 'bold 10px "Silkscreen", monospace';
    cx.textAlign = 'center';
    cx.fillText(npc.seen ? '✔' : '!', npc.x, ny - 56 + bob);
  }

  // Orbes de vento (motes) com brilho mágico
  for (const m of motes) {
    if (!m.alive || m.x < viewLeft || m.x > viewRight) continue;
    const my = Math.round(elev(m.x) - m.h + Math.sin(T * 0.06 + m.x) * 4);
    drawMagicGlow(m.x, my, '#48dbfb', 16 + Math.sin(T * 0.1 + m.x) * 3, 0.55);
    cx.fillStyle = '#141020';
    cx.fillRect(m.x - 5, my - 5, 10, 10);
    cx.fillStyle = '#48dbfb';
    cx.fillRect(m.x - 3, my - 3, 6, 6);
    cx.fillStyle = '#ffffff';
    cx.fillRect(m.x - 1, my - 1, 2, 2);
  }

  // Cristais / Relíquias em Pixel Art com aura mágica aditiva e estrelas cintilantes
  for (const gl of glyphs) {
    if (!gl.alive || gl.x < viewLeft || gl.x > viewRight) continue;
    const gy = Math.round(elev(gl.x) - gl.h + Math.sin(T * 0.05 + gl.ph) * 4);
    const col = COL[gl.it.color];
    const lightCol = COL_LIGHT[gl.it.color];
    const pulse = Math.sin(T * 0.12 + gl.ph);

    // Aura luminosa aditiva da cor do elemento
    drawMagicGlow(gl.x, gy, col, 24 + pulse * 4, 0.65);

    const spr = SPRITES.relics[gl.it.key];
    if (spr) {
      cx.drawImage(spr, Math.round(gl.x - 12), gy - 12);
    }

    // Estrelinhas de 4 pontas (✦) cintilando ao redor do elemento
    for (let i = 0; i < 3; i++) {
      const a = T * 0.05 + gl.ph + i * 2.09;
      const r = 14 + Math.sin(T * 0.14 + i + gl.ph) * 3;
      const sx = Math.round(gl.x + Math.cos(a) * r);
      const sy = Math.round(gy + Math.sin(a) * r);
      const arm = Math.sin(T * 0.18 + i * 1.7 + gl.ph) > 0 ? 2 : 1;
      drawPixelStar(sx, sy, arm, i === 0 ? '#ffffff' : lightCol);
    }
  }

  // Jogadora Lia
  drawHero();

  // Partículas quadradas pixeladas
  for (const p of parts) {
    cx.fillStyle = p.c;
    cx.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz);
  }
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(2.5, (now - lastTime) / 16.67);
  lastTime = now;
  T += dt;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ================= EVENTOS DE TECLADO E BOTÕES NA TELA ================= */
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
    keys.left = true;
  }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) {
    keys.right = true;
  }
  if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
    if (gameMode === 'play') e.preventDefault();
    if (!keys.jump) keys.jumpJustPressed = true;
    keys.jump = true;
  }
  if (['e', 'E', 'Enter'].includes(e.key) && gameMode === 'play') {
    triggerAltarInteraction();
  }
});

window.addEventListener('keyup', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
  if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) keys.jump = false;
});

function bindPadButton(id, keyName) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const press = e => {
    e.preventDefault();
    if (e.pointerId != null && btn.setPointerCapture) {
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    }
    SFX.init();
    if (keyName === 'jump' && !keys.jump) keys.jumpJustPressed = true;
    keys[keyName] = true;
    btn.classList.add('active');
  };
  const release = e => {
    e.preventDefault();
    keys[keyName] = false;
    btn.classList.remove('active');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

bindPadButton('btn-left', 'left');
bindPadButton('btn-right', 'right');
bindPadButton('btn-jump', 'jump');

document.getElementById('btn-interact')?.addEventListener('click', () => {
  SFX.init();
  triggerAltarInteraction();
});

// No mobile, permite tocar diretamente próximo ao altar na tela caso esteja ao alcance
cv.addEventListener('pointerdown', e => {
  if (gameMode !== 'play') return;
  const nearAltar = altars.find(a => !a.solved && Math.abs(P.x - a.x) < 62);
  if (nearAltar) {
    const rect = cv.getBoundingClientRect();
    const worldX = camX + (e.clientX - rect.left) / V.s;
    if (Math.abs(worldX - nearAltar.x) < 75) {
      SFX.init();
      triggerAltarInteraction();
    }
  }
});

document.getElementById('btn-sound')?.addEventListener('click', e => {
  const muted = SFX.toggleMute();
  e.currentTarget.textContent = muted ? 'SOM: OFF' : 'SOM: ON';
});

document.getElementById('stage-select')?.addEventListener('change', e => {
  const ch = parseInt(e.target.value, 10);
  if (ch >= 1 && ch <= 4) {
    jumpToChapter(ch);
    e.target.blur();
  }
});

document.getElementById('btn-start-game')?.addEventListener('click', async () => {
  SFX.init();
  SFX.fanfare();
  resetWorld();
  const stageSel = document.getElementById('stage-select');
  if (stageSel) stageSel.value = '1';
  document.getElementById('title-screen').classList.add('hidden');
  gameMode = 'dialog';
  await runDialog([
    {
      speaker: 'Mestre Lia (Cartógrafa)',
      portrait: 'npc',
      text: `Bem-vinda às Ruínas dos Conjuntos, <b>Leo</b>! Para abrir o <b>Monólito I</b>, você precisa montar um conjunto <b>A</b> com <b>5 cristais distintos (|A| = 5)</b>.`
    },
    {
      speaker: 'Leo (Explorador)',
      portrait: 'hero',
      text: `Pode deixar! Vou usar <b>[A / D]</b> ou as <b>[Setas]</b> para explorar o vale e <b>[Espaço / W]</b> para pular nas plataformas em busca de 5 formas/cores diferentes!`
    }
  ]);
  gameMode = 'play';
});

// Inicialização
resize();
resetWorld();
requestAnimationFrame(loop);
