/* ==========================================================================
   PUZZLES.JS — Diálogos RPG e Cenas dos Conjuntos com Visual Mágico Aprimorado
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);

function svgEl(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function svgTxt(x, y, str, cls = 'svg-lbl', parent = $('#stage')) {
  const t = svgEl('text', { x, y, class: cls, 'text-anchor': 'middle' }, parent);
  t.textContent = str;
  return t;
}

// Inicializa o palco SVG limpo e ajusta o viewBox para preencher o espaço
function initStageDefs(stage = $('#stage'), viewBox = '0 0 460 350') {
  stage.innerHTML = '';
  stage.setAttribute('viewBox', viewBox);
}

// Desenha um Círculo de Conjunto limpo e harmônico
function drawSetCircle(cx, cy, r, cls, colorHex, parent = $('#stage')) {
  return svgEl('circle', { cx, cy, r, class: cls }, parent);
}

// Desenha o cabeçalho do Conjunto ("A", "B", "V", "E", "A ∩ B") limpo e na cor do conjunto
function svgSetLabel(x, y, title, subtitle = '', colorHex = '#ffce54', parent = $('#stage')) {
  const g = svgEl('g', { class: 'set-label-group' }, parent);

  const t1 = svgEl('text', {
    x,
    y,
    class: 'svg-lbl-title',
    'text-anchor': 'middle',
    style: `fill:${colorHex}`
  }, g);
  t1.textContent = title;

  if (subtitle) {
    const t2 = svgEl('text', {
      x,
      y: y + 16,
      class: 'svg-lbl-sub',
      'text-anchor': 'middle',
      style: `fill:${colorHex}`
    }, g);
    t2.textContent = subtitle;
  }

  return g;
}

function svgPoint(evt) {
  const svg = $('#stage');
  const p = svg.createSVGPoint();
  p.x = evt.clientX;
  p.y = evt.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

function shuffleArr(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ================= SISTEMA DE DIÁLOGO ESTILO RPG ================= */
function runDialog(lines) {
  return new Promise(resolve => {
    const overlay = $('#dialog-overlay');
    const speakerEl = $('#dialog-speaker');
    const textEl = $('#dialog-text');
    const nextBtn = $('#dialog-next');
    const portraitCv = $('#dialog-portrait-cv');

    overlay.classList.remove('hidden');
    let idx = 0;

    function showLine() {
      const item = typeof lines[idx] === 'string'
        ? { speaker: 'Lia (Cartógrafa)', portrait: 'hero', text: lines[idx] }
        : lines[idx];

      speakerEl.textContent = item.speaker || 'Lia (Cartógrafa)';
      drawPortrait(portraitCv, item.portrait || 'hero');
      textEl.innerHTML = item.text;
      nextBtn.textContent = idx < lines.length - 1 ? 'PRÓXIMO ▶' : 'FECHAR ✓';
      SFX.blip();
    }

    function advance() {
      idx++;
      if (idx >= lines.length) {
        cleanup();
        resolve();
      } else {
        showLine();
      }
    }

    function onKey(e) {
      if (['Enter', ' ', 'e', 'E'].includes(e.key)) {
        e.preventDefault();
        advance();
      }
    }

    function cleanup() {
      overlay.classList.add('hidden');
      nextBtn.onclick = null;
      window.removeEventListener('keydown', onKey);
    }

    nextBtn.onclick = advance;
    window.addEventListener('keydown', onKey);
    showLine();
  });
}

/* ================= ESTRUTURA DO MODAL DE ENIGMA ================= */
function openPuzzleModal(chapterNum, title, subtitle) {
  $('#puzzle-chapter').textContent = `ALTAR ${chapterNum}: ${title}`;
  $('#puzzle-subtitle').textContent = subtitle;
  initStageDefs($('#stage'));
  $('#puzzle-controls').innerHTML = '';
  $('#puzzle-modal').classList.remove('hidden');
}

function closePuzzleModal() {
  $('#puzzle-modal').classList.add('hidden');
}

function setPuzzlePrompt(html) {
  $('#puzzle-prompt').innerHTML = html;
}

// Cria o elemento geométrico limpo (sem brilhos extras ou halos) para os conjuntos
function createSvgRelic(it, parent = $('#stage')) {
  const g = svgEl('g', { class: 'drag-glyph' }, parent);
  const c = COL[it.color];

  // Área de toque invisível
  svgEl('circle', { r: 21, fill: 'transparent' }, g);

  // Corpo principal da forma com contorno escuro limpo
  svgEl('path', {
    d: shapePath(it.shape, 13.5),
    fill: c,
    stroke: '#140d1f',
    'stroke-width': 2.4
  }, g);

  it.g = g;
  return g;
}

function placeSvgNode(g, x, y, s = 1) {
  g.setAttribute('transform', `translate(${x}, ${y}) scale(${s})`);
}

function askMultipleChoice(options, correct, hintHtml) {
  return new Promise(resolve => {
    const controls = $('#puzzle-controls');
    controls.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'pixel-btn choice-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        if (opt === correct) {
          btn.classList.add('right');
          SFX.fanfare();
          setTimeout(() => {
            controls.innerHTML = '';
            resolve();
          }, 850);
        } else {
          btn.classList.add('wrong');
          SFX.hurt();
          setPuzzlePrompt(hintHtml);
        }
      };
      controls.appendChild(btn);
    });
  });
}

function waitContinueButton(label = 'DESTRANCAR CAMINHO ▶') {
  return new Promise(resolve => {
    const controls = $('#puzzle-controls');
    controls.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'pixel-btn success';
    btn.textContent = label;
    btn.onclick = () => {
      SFX.unlock();
      controls.innerHTML = '';
      resolve();
    };
    controls.appendChild(btn);
  });
}

/* ================= ALTAR I: CARDINALIDADE |B| ================= */
async function runAltar1() {
  openPuzzleModal('I', 'O MONÓLITO DA CARDINALIDADE', 'Elementos repetidos contam apenas uma vez');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 460 350');

  // Grande círculo do Conjunto B preenchendo o palco
  drawSetCircle(230, 175, 162, 'ca', COL.gold, stage);
  svgSetLabel(230, 54, 'B', 'Conjunto B (8 cristais)', COL.gold, stage);

  const items = shuffleArr([
    G('gs'), G('gs'), G('tc'), G('rd'),
    G('tc'), G('gs'), G('rt'), G('td')
  ]);

  items.forEach((it, i) => {
    const g = createSvgRelic(it, stage);
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 122 + col * 72;
    const y = 132 + row * 88;
    placeSvgNode(g, x, y, 1.2);

    const lbl = svgTxt(x, y + 32, `${SHAPE[it.shape][0]}`, 'svg-lbl sub', stage);
    lbl.style.fontSize = '12.5px';
    lbl.style.fill = COL[it.color];

    g.onclick = () => {
      SFX.step(3);
      const countSame = items.filter(x => x.key === it.key).length;
      setPuzzlePrompt(
        `${describe(it)} aparece <b>${countSame}x</b> dentro do círculo, mas em <b>B</b> conta só <b>1 vez</b>! Qual é <b>|B|</b>?`
      );
    };
  });

  setPuzzlePrompt('O círculo do conjunto <b>B</b> guarda 8 cristais, mas vários são repetidos. Qual é a cardinalidade <b>|B|</b> (total de elementos distintos)?');
  await askMultipleChoice(
    [8, 5, 4, 6],
    5,
    'Dica: Clique nos cristais! Estrela dourada (3x) e Círculo verde-água (2x) são repetidos. Conte apenas os tipos únicos!'
  );

  setPuzzlePrompt('Exato! <b>|B| = 5</b>. Mesmo com 8 cristais desenhados, existem apenas <b>5 elementos distintos</b> em B.');
  await waitContinueButton('ABRIR PORTÃO I ▶');
  closePuzzleModal();
}

/* ================= ALTAR II: INTERSEÇÃO E DIAGRAMA DE VENN ================= */
async function runAltar2() {
  openPuzzleModal('II', 'ALTAR DOS DOIS CÍRCULOS', 'Arraste cada cristal para sua região correta');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 500 340');

  const U = { x: 10, y: 8, w: 480, h: 324 };
  const A = { x: 176, y: 194, r: 118 };
  const B = { x: 324, y: 194, r: 118 };

  svgEl('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 14, class: 'univ' }, stage);
  svgSetLabel(36, 36, 'U', '', '#d8cef0', stage);

  drawSetCircle(A.x, A.y, A.r, 'ca', COL.gold, stage);
  drawSetCircle(B.x, B.y, B.r, 'cb', COL.teal, stage);

  // Rótulos alinhados harmonicamente na faixa superior
  svgSetLabel(124, 38, 'A', 'Quentes', COL.gold, stage);
  svgSetLabel(250, 38, 'A ∩ B', 'Ambos', '#fff8e7', stage);
  svgSetLabel(376, 38, 'B', 'Com Pontas', COL.teal, stage);

  // Berço onde nasce a peça a ser arrastada (canto inferior direito)
  const home = { x: 450, y: 292 };
  const spawnDock = svgEl('circle', {
    cx: home.x,
    cy: home.y,
    r: 25,
    fill: 'rgba(255, 255, 255, 0.04)',
    stroke: '#7c6ba6',
    'stroke-width': 1.8,
    'stroke-dasharray': '4 4'
  }, stage);

  // Slots simétricos e centralizados dentro de cada região ampliada
  const regionSlots = {
    onlyA: [{ x: 110, y: 168 }, { x: 110, y: 220 }, { x: 110, y: 194 }],
    onlyB: [{ x: 390, y: 168 }, { x: 390, y: 220 }, { x: 390, y: 194 }],
    both: [{ x: 250, y: 148 }, { x: 250, y: 194 }, { x: 250, y: 240 }],
    outU: [{ x: 46, y: 292 }, { x: 88, y: 302 }]
  };
  const slotCounts = { onlyA: 0, onlyB: 0, both: 0, outU: 0 };

  const list = shuffleArr([
    G('gc'), G('rt'), G('ts'), G('tc'),
    G('gs'), G('rc'), G('td'), G('gd')
  ]);

  function explainZone(it) {
    const isW = warm(it);
    const isS = sharp(it);
    if (isW && isS) return 'pertence a <b>A ∩ B</b> (no centro, onde os círculos A e B se cruzam)';
    if (isW) return 'pertence só a <b>A</b> (lado esquerdo: é quente, mas redondo)';
    if (isS) return 'pertence só a <b>B</b> (lado direito: tem pontas, mas é frio/verde-água)';
    return 'fica <b>fora dos círculos A e B</b> (mas dentro do retângulo U!)';
  }

  for (let idx = 0; idx < list.length; idx++) {
    const it = list[idx];
    await new Promise(res => {
      const g = createSvgRelic(it, stage);
      placeSvgNode(g, home.x, home.y, 1.3);

      setPuzzlePrompt(
        `[${idx + 1}/${list.length}] <b>${describe(it)}</b> — Arraste para a região certa do diagrama!`
      );

      let dragging = false;
      g.addEventListener('pointerdown', e => {
        dragging = true;
        g.setPointerCapture(e.pointerId);
        SFX.init();
      });

      g.addEventListener('pointermove', e => {
        if (!dragging) return;
        const p = svgPoint(e);
        placeSvgNode(g, p.x, p.y, 1.38);
      });

      const onDrop = e => {
        if (!dragging) return;
        dragging = false;
        const p = svgPoint(e);
        const movedFromDock = Math.hypot(p.x - home.x, p.y - home.y) > 26;
        const inU = p.x > U.x && p.x < U.x + U.w && p.y > U.y && p.y < U.y + U.h;
        const inA = Math.hypot(p.x - A.x, p.y - A.y) < A.r;
        const inB = Math.hypot(p.x - B.x, p.y - B.y) < B.r;

        if (movedFromDock && inU && inA === warm(it) && inB === sharp(it)) {
          const key = inA && inB ? 'both' : inA ? 'onlyA' : inB ? 'onlyB' : 'outU';
          const slotList = regionSlots[key];
          const slot = slotList[slotCounts[key] % slotList.length] || p;
          slotCounts[key]++;
          placeSvgNode(g, slot.x, slot.y, 1.15);
          g.style.pointerEvents = 'none';
          SFX.pickupNew(idx + 1);
          res();
        } else {
          SFX.hurt();
          placeSvgNode(g, home.x, home.y, 1.3);
          setPuzzlePrompt(
            `Ops! ${describe(it)}: ${warm(it) ? 'é tom quente' : 'é tom frio'} e ${sharp(it) ? 'tem pontas' : 'não tem pontas'}. Ela ${explainZone(it)}.`
          );
        }
      };

      g.addEventListener('pointerup', onDrop);
      g.addEventListener('pointercancel', onDrop);
    });
  }

  spawnDock.remove();
  setPuzzlePrompt('Perfeito! Todos os 8 cristais foram classificados corretamente dentro de <b>U</b>.');
  await waitContinueButton('ABRIR PORTÃO II ▶');
  closePuzzleModal();
}

/* ================= ALTAR III: A PONTE DO ABISMO (UNIÃO) ================= */
function spiralPos(cx, cy, i, side = 1) {
  const r = 19 * Math.sqrt(i + 0.6);
  const a = i * 2.4 + (side < 0 ? Math.PI : 0);
  return {
    x: cx + Math.cos(a) * r * 0.68,
    y: cy + Math.sin(a) * r * 0.72
  };
}

// Cria um nó circular limpo para o Altar III
function createMiniGemNode(colorKey, parent = $('#stage')) {
  const g = svgEl('g', {}, parent);
  svgEl('circle', {
    r: 7.5,
    fill: COL[colorKey],
    stroke: '#140d1f',
    'stroke-width': 1.8
  }, g);
  return g;
}

function runBridgeGearRound({ a, b, u, start, subtitle }, onProgress) {
  return new Promise(resolve => {
    const stage = $('#stage');
    initStageDefs(stage, '0 0 480 340');
    $('#puzzle-subtitle').textContent = subtitle;

    const cy = 182;
    const Rr = 108;
    const maxOverlap = Math.min(a, b);

    const gA = svgEl('g', {}, stage);
    const gB = svgEl('g', {}, stage);
    drawSetCircle(0, cy, Rr, 'ca', COL.gold, gA);
    drawSetCircle(0, cy, Rr, 'cb', COL.teal, gB);

    // Letras A e B alinhadas acima de cada círculo
    svgSetLabel(-16, cy - Rr - 30, 'A', `|A| = ${a}`, COL.gold, gA);
    svgSetLabel(16, cy - Rr - 30, 'B', `|B| = ${b}`, COL.teal, gB);

    const interBadge = svgSetLabel(240, cy + Rr + 24, 'A ∩ B', '', '#fff8e7', stage);

    const dotsA = Array.from({ length: a }, () => createMiniGemNode('gold', stage));
    const dotsB = Array.from({ length: b }, () => createMiniGemNode('teal', stage));

    const lensPos = (j, k) => ({ x: 240, y: cy + (j - (k - 1) / 2) * 18 });

    const controls = $('#puzzle-controls');
    controls.innerHTML = '';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'pixel-btn';
    minusBtn.textContent = '- AFAST.';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'retro-slider';
    slider.min = 0;
    slider.max = maxOverlap;
    slider.step = 1;
    slider.value = start;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'pixel-btn';
    plusBtn.textContent = '+ APROX.';

    const lockWrap = document.createElement('div');
    lockWrap.style.width = '100%';
    lockWrap.style.textAlign = 'center';
    lockWrap.style.marginTop = '6px';

    controls.appendChild(minusBtn);
    controls.appendChild(slider);
    controls.appendChild(plusBtn);
    controls.appendChild(lockWrap);

    function updateGear(k) {
      slider.value = k;
      const dist = k === 0 ? 228 : 196 - k * 10;
      const xA = 240 - dist / 2;
      const xB = 240 + dist / 2;

      gA.setAttribute('transform', `translate(${xA}, 0)`);
      gB.setAttribute('transform', `translate(${xB}, 0)`);
      interBadge.style.opacity = k > 0 ? '1' : '0.45';

      dotsA.forEach((node, i) => {
        const p = i < a - k ? spiralPos(xA - 32, cy, i, -1) : lensPos(i - (a - k), k);
        node.setAttribute('transform', `translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
      });

      dotsB.forEach((node, i) => {
        const p = i < b - k ? spiralPos(xB + 32, cy, i, 1) : lensPos(i - (b - k), k);
        node.setAttribute('transform', `translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
      });

      const unionVal = a + b - k;
      setPuzzlePrompt(
        `|A| + |B| - |A ∩ B| = ${a} + ${b} - <b>${k}</b> = <b>${unionVal}</b><br>` +
        `<span style="color:var(--teal)">Meta da Ponte: precisamos de <b>|A ∪ B| = ${u}</b> blocos!</span>`
      );

      lockWrap.innerHTML = '';
      if (unionVal === u) {
        const okBtn = document.createElement('button');
        okBtn.className = 'pixel-btn success';
        okBtn.textContent = 'TRAVAR ENGRENAGEM ✓';
        okBtn.onclick = () => {
          SFX.fanfare();
          onProgress && onProgress();
          resolve();
        };
        lockWrap.appendChild(okBtn);
      }
    }

    minusBtn.onclick = () => {
      const next = Math.max(0, +slider.value - 1);
      SFX.step(next);
      updateGear(next);
    };
    plusBtn.onclick = () => {
      const next = Math.min(maxOverlap, +slider.value + 1);
      SFX.step(next);
      updateGear(next);
    };
    slider.oninput = () => {
      SFX.step(+slider.value);
      updateGear(+slider.value);
    };

    updateGear(start);
  });
}

async function runAltar3(onBridgeStep) {
  openPuzzleModal('III', 'ENGRENAGEM DA PONTE', 'Ajuste a interseção para cravar o tamanho da união');

  const rounds = [
    { a: 7, b: 5, u: 9, start: 0, subtitle: 'Engrenagem 1/3: Evite contar duas vezes os blocos compartilhados' },
    { a: 6, b: 6, u: 8, start: 0, subtitle: 'Engrenagem 2/3: Quantos elementos precisam ficar na interseção?' },
    { a: 4, b: 5, u: 9, start: 4, subtitle: 'Engrenagem 3/3: E quando os conjuntos são disjuntos (A ∩ B = ∅)?' }
  ];

  for (let i = 0; i < rounds.length; i++) {
    await runBridgeGearRound(rounds[i], () => onBridgeStep && onBridgeStep((i + 1) * 0.3));
  }

  // Pergunta final da ponte com dois círculos harmônicos ampliados
  const stage = $('#stage');
  initStageDefs(stage, '0 0 480 340');
  $('#puzzle-subtitle').textContent = 'Trava Mestre da Ponte';

  drawSetCircle(170, 154, 112, 'ca', COL.gold, stage);
  drawSetCircle(310, 154, 112, 'cb', COL.teal, stage);

  svgSetLabel(108, 146, 'A', '|A| = 10', COL.gold, stage);
  svgSetLabel(372, 146, 'B', '|B| = 8', COL.teal, stage);
  svgSetLabel(240, 146, 'A ∩ B', '6 blocos', '#fff8e7', stage);
  svgSetLabel(240, 304, '|A ∪ B| = ?', 'Total da União', COL.gold, stage);

  setPuzzlePrompt('Para travar a última viga: se <b>|A| = 10</b>, <b>|B| = 8</b> e eles compartilham <b>|A ∩ B| = 6</b>, qual é o tamanho de <b>|A ∪ B|</b>?');
  await askMultipleChoice(
    [18, 12, 24, 4],
    12,
    'Lembre da fórmula da Inclusão-Exclusão: |A ∪ B| = |A| + |B| - |A ∩ B| = 10 + 8 - 6!'
  );

  onBridgeStep && onBridgeStep(1);
  setPuzzlePrompt('<b>10 + 8 - 6 = 12!</b> A ponte sobre o abismo está completa e firme!');
  await waitContinueButton('ATRAVESSAR A PONTE ▶');
  closePuzzleModal();
}

/* ================= ALTAR IV: INCLUSÃO-EXCLUSÃO (3 CONJUNTOS) + COMPLEMENTAR ================= */
async function runAltar4() {
  openPuzzleModal('IV', 'SANTUÁRIO DOS TRÊS VENTOS', 'Princípio da Inclusão-Exclusão para 3 Conjuntos');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 480 360');

  // Três círculos harmônicos ampliados
  const circles = [
    { x: 178, y: 146, r: 96, c: 'ca', n: 'A', lx: 64, ly: 52, t: 'Areia (15)', col: COL.gold },
    { x: 302, y: 146, r: 96, c: 'cb', n: 'V', lx: 416, ly: 52, t: 'Vento (12)', col: COL.teal },
    { x: 240, y: 238, r: 96, c: 'cc', n: 'E', lx: 388, ly: 312, t: 'Estrela (10)', col: COL.rose }
  ];

  circles.forEach(o => {
    drawSetCircle(o.x, o.y, o.r, o.c, o.col, stage);
  });

  circles.forEach(o => {
    svgSetLabel(o.lx, o.ly, o.n, o.t, o.col, stage);
  });

  // Posições das 7 regiões de contagem dentro dos 3 círculos
  const pos = {
    1: [134, 130], // só A
    2: [346, 130], // só V
    4: [240, 268], // só E
    3: [240, 108], // A e V
    5: [180, 206], // A e E
    6: [300, 206], // V e E
    7: [240, 168]  // A, V e E (centro)
  };

  const badges = {};
  for (const m in pos) {
    const g = svgEl('g', { class: 'badge zero' }, stage);
    svgEl('rect', { x: pos[m][0] - 17, y: pos[m][1] - 12, width: 34, height: 24, rx: 12 }, g);
    const t = svgEl('text', { x: pos[m][0], y: pos[m][1] }, g);
    t.textContent = '0x';
    badges[m] = { g, t };
  }

  const terms = [
    { m: 1, s: 1, l: '|A|', v: 15, on: false },
    { m: 2, s: 1, l: '|V|', v: 12, on: false },
    { m: 4, s: 1, l: '|E|', v: 10, on: false },
    { m: 3, s: -1, l: '|A∩V|', v: 5, on: false },
    { m: 6, s: -1, l: '|V∩E|', v: 4, on: false },
    { m: 5, s: -1, l: '|A∩E|', v: 3, on: false },
    { m: 7, s: 1, l: '|A∩V∩E|', v: 2, on: false }
  ];

  const controls = $('#puzzle-controls');
  controls.innerHTML = '';

  await new Promise(resolve => {
    function updateFormula() {
      let allOne = true;
      for (const m in pos) {
        let k = 0;
        terms.forEach(t => {
          if (t.on && (m & t.m) === t.m) k += t.s;
        });
        const b = badges[m];
        b.t.textContent = `${k}x`;
        b.g.setAttribute('class', 'badge ' + (k === 1 ? 'ok' : k === 0 ? 'zero' : k < 0 ? 'neg' : 'over'));
        if (k !== 1) allOne = false;
      }

      const active = terms.filter(t => t.on);
      let sum = 0;
      let expr = '';
      active.forEach((t, i) => {
        sum += t.s * t.v;
        expr += (i === 0 ? (t.s < 0 ? '-' : '') : (t.s < 0 ? ' - ' : ' + ')) + t.v;
      });

      if (!active.length) {
        setPuzzlePrompt('Ative os botões abaixo para somar e subtrair até que <b>todas as 7 regiões fiquem com [1x]</b> (contadas exatamente uma vez).');
      } else {
        setPuzzlePrompt(
          `<b>${expr} = ${sum}</b><br>` +
          `<span style="color:var(--teal)">${allOne ? 'Perfeito! Cada região foi contada exatamente 1 vez!' : 'Observe os marcadores no diagrama: regiões com 2x ou 0x precisam de ajuste!'}</span>`
        );
      }
      return allOne;
    }

    terms.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'term-btn';
      btn.innerHTML = `${t.s > 0 ? '+' : '-'} ${t.l}<small>${t.v}</small>`;
      btn.onclick = () => {
        t.on = !t.on;
        btn.classList.toggle('on', t.on);
        SFX.step(t.s > 0 ? 5 : 2);
        if (updateFormula()) {
          controls.querySelectorAll('button').forEach(b => (b.disabled = true));
          SFX.fanfare();
          setTimeout(resolve, 1400);
        }
      };
      controls.appendChild(btn);
    });

    updateFormula();
  });

  // Parte 2 do Altar IV: O Complementar
  initStageDefs(stage, '0 0 480 350');
  $('#puzzle-subtitle').textContent = 'O Conjunto Complementar (Quem ficou de fora?)';

  svgEl('rect', { x: 14, y: 12, width: 452, height: 326, rx: 14, class: 'univ' }, stage);
  svgSetLabel(86, 40, 'U', '|U| = 30 viajantes', '#e2d9f3', stage);

  drawSetCircle(240, 172, 108, 'ca', COL.gold, stage);
  svgSetLabel(240, 164, 'A ∪ V ∪ E', '27 viajantes na união', COL.gold, stage);
  svgSetLabel(240, 306, 'Complementar = ?', 'Fora dos 3 conjuntos', COL.teal, stage);

  setPuzzlePrompt('Dos <b>|U| = 30</b> viajantes que cruzaram a montanha, descobrimos que <b>27</b> viveram pelo menos uma das 3 experiências (<b>|A ∪ V ∪ E| = 27</b>). Quantos não viveram <b>nenhuma</b> delas?');
  await askMultipleChoice(
    [3, 27, 0, 57],
    3,
    'Dica: O complemento é o total do universo U menos a união: |U| - |A ∪ V ∪ E| = 30 - 27!'
  );

  setPuzzlePrompt('Exato! <b>30 - 27 = 3 viajantes</b> formam o conjunto complementar!');
  await waitContinueButton('CONCLUIR A TRAVESSIA ★');
  closePuzzleModal();
}
