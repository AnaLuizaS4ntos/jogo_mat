/* ==========================================================================
   SPRITES.JS — Motor de Pixel Art (Mago Chibi, NPCs, Relíquias e Ícones)
   ========================================================================== */

const COL = {
  gold: '#ffce54',
  rose: '#ff6b8b',
  teal: '#48dbfb'
};

const COL_DARK = {
  gold: '#b87d14',
  rose: '#a82849',
  teal: '#187c96'
};

const COL_LIGHT = {
  gold: '#fff3b8',
  rose: '#ffc2d1',
  teal: '#c4f5ff'
};

const SHAPE = {
  circle: ['círculo', 'm'],
  triangle: ['triângulo', 'm'],
  diamond: ['losango', 'm'],
  star: ['estrela', 'f']
};

const COLORNAME = {
  gold: ['dourado', 'dourada'],
  rose: ['rosado', 'rosada'],
  teal: ['verde-água', 'verde-água']
};

function mk(color, shape) {
  return { color, shape, key: color + shape };
}

const warm = it => it.color !== 'teal';
const sharp = it => it.shape !== 'circle';

function describe(it) {
  const [n, g] = SHAPE[it.shape];
  return `${g === 'f' ? 'Uma' : 'Um'} ${n} ${COLORNAME[it.color][g === 'f' ? 1 : 0]}`;
}

const G = s => {
  const m = {
    gc: ['gold', 'circle'], gt: ['gold', 'triangle'], gd: ['gold', 'diamond'], gs: ['gold', 'star'],
    rc: ['rose', 'circle'], rt: ['rose', 'triangle'], rd: ['rose', 'diamond'], rs: ['rose', 'star'],
    tc: ['teal', 'circle'], tt: ['teal', 'triangle'], td: ['teal', 'diamond'], ts: ['teal', 'star']
  }[s];
  return mk(m[0], m[1]);
};

/* --- Renderizador de Matrizes de Pixel Art --- */
function makePixelCanvas(rows, palette, scale = 2) {
  const h = rows.length;
  const w = rows[0].length;
  const cv = document.createElement('canvas');
  cv.width = w * scale;
  cv.height = h * scale;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

// Paleta do Mago (inspirada na referência enviada: chapéu azul pontudo, cachecol vermelho, túnica azul/clara e cajado com cristal verde)
const PAL_HERO = {
  'O': '#1b1829', // contorno escuro
  'D': '#143a66', // azul sombra (chapéu/capa)
  'B': '#1f5591', // azul principal (chapéu/capa)
  'b': '#3b77b8', // azul claro (borda do chapéu/capa)
  'I': '#8f98b8', // túnica interna sombra
  'i': '#c7d0eb', // túnica interna clara
  'S': '#df9e6e', // pele tom quente
  's': '#b8794d', // sombra da pele
  'E': '#1b1829', // olhos verticais chibi
  'R': '#d9323c', // cachecol vermelho vivo
  'r': '#961f2b', // sombra do cachecol vermelho
  'W': '#5c3426', // madeira escura do cajado
  'w': '#8c533e', // madeira clara do cajado
  'G': '#2eb84b', // cristal verde do cajado
  'g': '#82f26b', // brilho verde claro do cristal
  'L': '#ffffff', // brilho branco do cristal
  'K': '#4a2b24', // botas marrom escuro
  'k': '#a67458'  // sola/detalhe da bota
};

// Mago 26x26 — Parado (Idle)
const HERO_IDLE = [
  '.......OOOOOO.............',
  '......OBBBBBbOO...........',
  '.....OBBBBBBBBbO..OOOO....',
  '....OBBBBBBBBBbO.ObbbbO...',
  '...OODDBBBBBBBBBbObbbbbO..',
  '....OOODDBBBBBbbbbbbbbDO..',
  '......OODBBBbbOOOObbbDO...',
  '.....OOBBbbOOSSSSSOObDO...',
  '....OOBBbOOSSSSSSSSOODO...',
  '....OBBbOSSSSSSSSSSSOO..OO',
  '....OBbOSSSSESSSESSSOWOOwO',
  '....OBbOSSSSESSSESSSOWLgGO',
  '....OODOSSSSSSSSSSSSOWggGO',
  '.OOO..OOssSSSSSSSSssOOWWOO',
  'ORRrO.OORRRRRRRRRRRROwWO..',
  'OrrrROOrrrrrrrrrrrrSwWO...',
  '.OOOrROOBbOwwwiiOwwWBO....',
  '...O.OOBbOSSSSiWwSSBBO....',
  '.....OOBbOwwwiiWiiiBBO....',
  '....OOBBbOwWiiiiiiiBBOO...',
  '....OBBBDOwWIIiiiiiBBDO...',
  '...OOBBDwWOOIIiiiiOBBDOO..',
  '...OBBDOwO.OKKOO.KKOOBDO..',
  '....OODOO..OKKOO.KKO.OO...',
  '.....OO....OkkOO.kkO......',
  '...........OOOO..OOOO.....'
];

// Mago 26x26 — Correndo Frame 1
const HERO_RUN1 = [
  '.......OOOOOO.............',
  '......OBBBBBbOO...........',
  '.....OBBBBBBBBbO..OOOO....',
  '....OBBBBBBBBBbO.ObbbbO...',
  '...OODDBBBBBBBBBbObbbbbO..',
  '....OOODDBBBBBbbbbbbbbDO..',
  '......OODBBBbbOOOObbbDO...',
  '.....OOBBbbOOSSSSSOObDO...',
  '....OOBBbOOSSSSSSSSOODO...',
  '....OBBbOSSSSSSSSSSSOO..OO',
  '....OBbOSSSSESSSESSSOWOOwO',
  '....OBbOSSSSESSSESSSOWLgGO',
  '.OOOOODOSSSSSSSSSSSSOWggGO',
  'ORRRrOOOssSSSSSSSSssOOWWOO',
  'OrrrrROORRRRRRRRRRRROwWO..',
  '.OOO..OrrrrrrrrrrrrSwWO...',
  '......OOBbOwwwiiOwwWBO....',
  '.....OOBbOSSSSiWwSSBBO....',
  '....OOBBbOwwwiiWiiiBBOO...',
  '....OBBBDOwWiiiiiiiBBDO...',
  '...OOBBDOwWIIiiiiiOBBDOO..',
  '...OBBDOwWOOIIiiiOOBBBDO..',
  '....OODOO.OKKOO...OKKOO...',
  '.........OKkkOO...OkkOO...',
  '.........OOOOO....OOOO....',
  '..........................'
];

// Mago 26x26 — Correndo Frame 2
const HERO_RUN2 = [
  '..........................',
  '.......OOOOOO.............',
  '......OBBBBBbOO...........',
  '.....OBBBBBBBBbO..OOOO....',
  '....OBBBBBBBBBbO.ObbbbO...',
  '...OODDBBBBBBBBBbObbbbbO..',
  '....OOODDBBBBBbbbbbbbbDO..',
  '......OODBBBbbOOOObbbDO...',
  '.....OOBBbbOOSSSSSOObDO...',
  '....OOBBbOOSSSSSSSSOODO...',
  '....OBBbOSSSSSSSSSSSOO..OO',
  '....OBbOSSSSESSSESSSOWOOwO',
  '....OBbOSSSSESSSESSSOWLgGO',
  '....OODOSSSSSSSSSSSSOWggGO',
  '..OOO.OOssSSSSSSSSssOOWWOO',
  '.ORRrOOORRRRRRRRRRRROwWO..',
  'OrrrRO.OrrrrrrrrrrrSwWO...',
  '.OOO..OOBbOwwwiiOwwWBO....',
  '.....OOBbOSSSSiWwSSBBO....',
  '....OOBBbOwwwiiWiiiBBOO...',
  '....OBBBDOwWiiiiiiiBBDO...',
  '...OOBBDwWOOIIiiiiOBBDOO..',
  '...OBBDOwO..OKKO.OKKOOBDO.',
  '....OODOO...OkkO.OkkO.OO..',
  '............OOOO.OOOO.....',
  '..........................'
];

// Mago 26x26 — Planando / Flutuando com Magia
const HERO_GLIDE = [
  '.......OOOOOO.............',
  '......OBBBBBbOO...........',
  '.....OBBBBBBBBbO..OOOO....',
  '....OBBBBBBBBBbO.ObbbbO...',
  '...OODDBBBBBBBBBbObbbbbO..',
  '....OOODDBBBBBbbbbbbbbDO..',
  '......OODBBBbbOOOObbbDO...',
  '.....OOBBbbOOSSSSSOObDO...',
  '....OOBBbOOSSSSSSSSOODO.OO',
  '....OBBbOSSSSSSSSSSSOO.OwO',
  'OOO.OBbOSSSSESSSESSSOWOLgO',
  'ORROOBbOSSSSESSSESSSOWggGO',
  'OrrROODOSSSSSSSSSSSSOOWWOO',
  '.OOrROOOssSSSSSSSSssOwWO..',
  '..OO..OORRRRRRRRRRRROwO...',
  '.....OOrrrrrrrrrrrrSwWO...',
  '...OOBBBbbOwwwiiOwwWBBOO..',
  '..OOBBBBbbOSSSSiWwSSBBBOO.',
  '.OOBBBBBbOwwwiiWiiiBBBBBOO',
  '.OBBBBBDOwWiiiiiiiBBBBBBDO',
  '..OOBBDwWOOIIiiiiiOBBBDOO.',
  '...OODOwO.OKKOO.KKO.OOO...',
  '....OOO...OkkOO.kkO.......',
  '..........OOOO..OOOO......',
  '..........................',
  '..........................'
];

// NPC Sábio / Viajante em estilo Chibi RPG (inspirado na segunda referência: capuz claro/dourado e cajado)
const NPC_TRAVELER = [
  '......OOOOOOOO......',
  '.....OiiiiiiiiO.....',
  '....OiiiiiiiiiiO....',
  '...OiiOOOOOOOOiiO...',
  '..OiiOSSSSSSSSOiiO..',
  '..OiiOSSESSSESSOiiO.',
  '.OWWOOSSESSSESSOiiO.',
  'OWBYWOSSSSSSSSSOiiO.',
  '.OWWOOssSSSSssOOiiO.',
  '..OWO.OiiBBiiO.OOOO.',
  '..OWOOiiiBBiiiOO....',
  '..OWOSSSSBBSSSSO....',
  '..OWOiiiiBBiiiiO....',
  '..OWOiiiBBBBiiiOO...',
  '..OWOiiBBBBBBiiiiO..',
  '..OWOiiBBBBBBiiiiO..',
  '..OWOOOKKOO.KKOOOO..',
  '..OOO.OKKOO.KKO.....',
  '......OOOO..OOOO....',
  '....................'
];

const PAL_NPC = {
  'O': '#1b1829',
  'i': '#f5f0e6',
  'B': '#f0b642',
  'Y': '#fff7b8',
  'S': '#f2c299',
  's': '#cfa07a',
  'E': '#1b1829',
  'W': '#78442a',
  'K': '#4a2b24'
};

// Matrizes 12x12 simétricas para cada forma em Pixel Art
const RELIC_MATRICES = {
  circle: [
    '....OOOO....',
    '..OOLLLLOO..',
    '.OLLMMMMMMO.',
    '.OLMMMMMMDO.',
    'OMLMMMMMMMDO',
    'OMMMMMMMMMDO',
    'OMMMMMMMMDDO',
    'OMMMMMMMDDDO',
    '.OMMMMMDDDO.',
    '.OMDDDDDDDO.',
    '..OODDDDOO..',
    '....OOOO....'
  ],
  triangle: [
    '.....OO.....',
    '....OLLO....',
    '....OLMO....',
    '...OLLMMO...',
    '...OLMMMO...',
    '..OLLMMMDO..',
    '..OLMMMMDO..',
    '.OLLMMMMDDO.',
    '.OLMMMMMDDO.',
    'OLLMMMMMDDDO',
    'OMDDDDDDDDDO',
    'OOOOOOOOOOOO'
  ],
  diamond: [
    '.....OO.....',
    '....OLLO....',
    '...OLLMMO...',
    '..OLLMMMDO..',
    '.OLLMMMMDDO.',
    'OLLMMMMMMDDO',
    'OMMMMMMMDDDO',
    '.OMMMMMDDDO.',
    '..OMMMDDDO..',
    '...OMDDDO...',
    '....ODDO....',
    '.....OO.....'
  ],
  star: [
    '.....OO.....',
    '....OLLO....',
    '....OLMO....',
    'OOOOLLMMOOOO',
    'OLLMMMMMMDDO',
    '.OMMMMMMMDO.',
    '..OLLMMMDO..',
    '..OLMMMMDO..',
    '.OLLMOOMDDO.',
    '.OMOO..OODO.',
    '.OOO....OOO.',
    '............'
  ]
};

// Paleta Fantasma / Eco do próprio Mago (tons translúcidos de ciano e gelo espectral)
const PAL_GHOST = {
  'O': '#16384c', // contorno espectral azul-escuro
  'D': '#286480', // sombra azul-gelo
  'B': '#48b8d8', // chapéu/capa ciano
  'b': '#8cf0ff', // luz ciano brilhante
  'I': '#7ad6e8', // túnica interna
  'i': '#ccfaff', // túnica interna clara
  'S': '#a8f0ff', // rosto etéreo
  's': '#6ccde0', // sombra rosto
  'E': '#102b3a', // olhos verticais
  'R': '#6ce8ff', // cachecol espectral
  'r': '#3db5d1', // sombra cachecol
  'W': '#4088a6', // cajado espectral
  'w': '#68b8d6', // luz cajado
  'G': '#7dffb3', // cristal mágico
  'g': '#b8ffd6', // brilho cristal
  'L': '#ffffff', // centro cristal
  'K': '#2d6e8a', // botas
  'k': '#5ebad9'  // sola
};

const SPRITES = {
  hero: {},
  npc: null,
  relics: {}
};

function initSprites() {
  SPRITES.hero.idle = makePixelCanvas(HERO_IDLE, PAL_HERO, 2);
  SPRITES.hero.run1 = makePixelCanvas(HERO_RUN1, PAL_HERO, 2);
  SPRITES.hero.run2 = makePixelCanvas(HERO_RUN2, PAL_HERO, 2);
  SPRITES.hero.glide = makePixelCanvas(HERO_GLIDE, PAL_HERO, 2);
  SPRITES.hero.ghost = makePixelCanvas(HERO_IDLE, PAL_GHOST, 2);
  SPRITES.npc = makePixelCanvas(NPC_TRAVELER, PAL_NPC, 2);

  for (const color of ['gold', 'rose', 'teal']) {
    for (const shape of ['circle', 'triangle', 'diamond', 'star']) {
      const pal = {
        'O': '#140d1f',
        'L': COL_LIGHT[color],
        'M': COL[color],
        'D': COL_DARK[color]
      };
      SPRITES.relics[color + shape] = makePixelCanvas(RELIC_MATRICES[shape], pal, 2);
    }
  }
}

initSprites();

// Desenha retrato pixelado em um canvas de diálogo (64x64)
function drawPortrait(canvas, type = 'hero') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const src = type === 'npc' ? SPRITES.npc : SPRITES.hero.idle;
  ctx.drawImage(src, 4, 4, 56, 56);
}

// Caminhos geométricos das gemas para os Diagramas de Conjuntos (SVG)
function shapePath(s, r = 13) {
  if (s === 'circle') {
    return `M ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 Z`;
  }
  if (s === 'triangle') {
    return `M 0 ${-r * 1.05} L ${r * 0.98} ${r * 0.78} L ${-r * 0.98} ${r * 0.78} Z`;
  }
  if (s === 'diamond') {
    return `M 0 ${-r * 1.15} L ${r * 0.85} 0 L 0 ${r * 1.15} L ${-r * 0.85} 0 Z`;
  }
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.46 : r * 1.12;
    p += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1) + ' ';
  }
  return p + 'Z';
}

function icon(it, sz = 22) {
  const c = COL[it.color];
  return `<svg viewBox="-16 -16 32 32" width="${sz}" height="${sz}">
    <path d="${shapePath(it.shape, 12.5)}" fill="${c}" stroke="#140d1f" stroke-width="2.2"/>
  </svg>`;
}
