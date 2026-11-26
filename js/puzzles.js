/* ==========================================================================
   PUZZLES.JS — Diálogos RPG, Cenas dos Conjuntos, Dicas, Resumos e Relatório
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);

/* ================= REGISTRO PEDAGÓGICO (PARA ALUNO E PROFESSOR) ================= */
const PEDAGOGY = {
  stages: {
    1: {
      name: 'Fase I — Cardinalidade |A|',
      concept: 'Conjunto e Cardinalidade (|A|)',
      symbol: '|A| = número de elementos distintos',
      objective: 'Coletar 5 cristais distintos e determinar a cardinalidade ignorando repetições.',
      explanation: 'Em um conjunto, elementos iguais não são contados duas vezes. A cardinalidade |A| representa apenas a quantidade de elementos únicos.',
      dailyExample: 'Cotidiano: Se na sua playlist você ouviu 3 vezes a mesma música de Rock e 4 músicas diferentes de Pop, o conjunto de músicas distintas que você ouviu tem cardinalidade 5 (e não 7!).',
      completed: false,
      attempts: 0,
      correct: 0,
      errors: 0,
      hints: 0
    },
    2: {
      name: 'Fase II — Interseção e Diagrama de Venn',
      concept: 'Interseção (A ∩ B) e Universo (U)',
      symbol: 'A ∩ B = { x ∈ U | x ∈ A e x ∈ B }',
      objective: 'Identificar elementos que pertencem a dois conjuntos simultaneamente e classificar 8 elementos nas 4 regiões do Diagrama de Venn.',
      explanation: 'Diferença importante: na INTERSEÇÃO (A ∩ B, conectivo "E") entram apenas os elementos que cumprem as duas propriedades ao mesmo tempo. Já quem não cumpre nenhuma fica fora dos círculos, no Universo (U).',
      dailyExample: 'Cotidiano: Se A = alunos que gostam de Futebol e B = alunos que gostam de Basquete, a interseção A ∩ B reúne apenas quem pratica os DOIS esportes ao mesmo tempo.',
      completed: false,
      attempts: 0,
      correct: 0,
      errors: 0,
      hints: 0
    },
    3: {
      name: 'Fase III — União de Conjuntos',
      concept: 'União (A ∪ B) e Inclusão-Exclusão (2 conjuntos)',
      symbol: '|A ∪ B| = |A| + |B| - |A ∩ B|',
      objective: 'Calcular a quantidade de elementos da União descontando a interseção contada em duplicidade.',
      explanation: 'Na UNIÃO (A ∪ B, conectivo "OU") entram todos os elementos de A, de B ou de ambos. Como os elementos de A ∩ B estão dentro de A e também dentro de B, subtraímos |A ∩ B| uma vez para não contá-los em dobro.',
      dailyExample: 'Cotidiano: Em uma sala, 10 alunos ouvem Rock (A), 8 ouvem Pop (B) e 6 ouvem os dois estilos (A ∩ B). O total de alunos que ouvem Rock OU Pop é 10 + 8 - 6 = 12 alunos.',
      completed: false,
      attempts: 0,
      correct: 0,
      errors: 0,
      hints: 0
    },
    4: {
      name: 'Fase IV — Três Conjuntos e Complementar',
      concept: 'Inclusão-Exclusão (3 conjuntos) e Complementar (Aᶜ)',
      symbol: '|A∪V∪E| = |A|+|V|+|E| - |A∩V| - |V∩E| - |A∩E| + |A∩V∩E|  e  |(A∪V∪E)ᶜ| = |U| - |A∪V∪E|',
      objective: 'Equilibrar a contagem das 7 regiões em 1x e determinar o conjunto complementar em relação ao Universo U.',
      explanation: 'Com 3 conjuntos, somamos os individuais, subtraímos as interseções duplas e somamos de volta a interseção tripla para que cada região seja contada exatamente 1 vez (1x). O Complementar reúne quem pertence ao Universo U, mas não pertence a nenhum dos conjuntos trabalhados.',
      dailyExample: 'Cotidiano: Numa turma de 30 alunos (|U| = 30), se 27 participam de grupos de Teatro, Música ou Dança (|T ∪ M ∪ D| = 27), então 30 - 27 = 3 alunos formam o conjunto complementar (não participam de nenhum dos três).',
      completed: false,
      attempts: 0,
      correct: 0,
      errors: 0,
      hints: 0
    }
  },
  reset() {
    for (const k in this.stages) {
      this.stages[k].completed = false;
      this.stages[k].attempts = 0;
      this.stages[k].correct = 0;
      this.stages[k].errors = 0;
      this.stages[k].hints = 0;
    }
  },
  recordAttempt(ch, isCorrect) {
    const st = this.stages[ch];
    if (!st) return;
    st.attempts++;
    if (isCorrect) st.correct++;
    else st.errors++;
  },
  recordPathError(ch) {
    const st = this.stages[ch];
    if (!st) return;
    st.errors++;
  },
  recordHint(ch) {
    const st = this.stages[ch];
    if (!st) return;
    st.hints++;
  }
};

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
        ? { speaker: 'Leo (Explorador)', portrait: 'hero', text: lines[idx] }
        : lines[idx];

      speakerEl.textContent = item.speaker || 'Leo (Explorador)';
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
      $('#dialog-box').onclick = null;
      window.removeEventListener('keydown', onKey);
    }

    nextBtn.onclick = e => {
      e.stopPropagation();
      advance();
    };
    $('#dialog-box').onclick = () => advance();
    window.addEventListener('keydown', onKey);
    showLine();
  });
}

/* ================= ESTRUTURA DO MODAL DE ENIGMA E DICAS ================= */
let activePuzzleHint = '';
let activePuzzleChapter = 1;

function setPuzzleHint(ch, hintHtml) {
  activePuzzleChapter = ch;
  activePuzzleHint = hintHtml;
  const hintBtn = $('#btn-puzzle-hint');
  if (hintBtn) {
    hintBtn.classList.toggle('hidden', !hintHtml);
    hintBtn.onclick = () => {
      SFX.blip();
      PEDAGOGY.recordHint(activePuzzleChapter);
      setPuzzlePrompt(`<span class="hint-highlight">💡 <b>Dica Matemática:</b> ${activePuzzleHint}</span>`);
    };
  }
}

function setPuzzleLegend(html = '') {
  const leg = $('#puzzle-legend');
  if (!leg) return;
  if (!html) {
    leg.innerHTML = '';
    leg.classList.add('hidden');
  } else {
    leg.innerHTML = html;
    leg.classList.remove('hidden');
  }
}

function openPuzzleModal(chapterNum, title, subtitle) {
  $('#puzzle-chapter').textContent = `ALTAR ${chapterNum}: ${title}`;
  $('#puzzle-subtitle').textContent = subtitle;
  initStageDefs($('#stage'));
  setPuzzleLegend('');
  $('#puzzle-controls').innerHTML = '';
  $('#puzzle-modal').classList.remove('hidden');
}

function closePuzzleModal() {
  setPuzzleLegend('');
  $('#puzzle-modal').classList.add('hidden');
}

function setPuzzlePrompt(html) {
  $('#puzzle-prompt').innerHTML = html;
}

// Cria o elemento geométrico limpo para os conjuntos
function createSvgRelic(it, parent = $('#stage')) {
  const g = svgEl('g', { class: 'drag-glyph' }, parent);
  const c = COL[it.color];

  // Área de toque invisível ampliada para dedos no mobile
  svgEl('circle', { r: 26, fill: 'transparent' }, g);

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

function askMultipleChoice(options, correct, hintHtml, ch = activePuzzleChapter) {
  setPuzzleHint(ch, hintHtml);
  return new Promise(resolve => {
    const controls = $('#puzzle-controls');
    controls.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'pixel-btn choice-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        if (opt === correct) {
          PEDAGOGY.recordAttempt(ch, true);
          btn.classList.add('right');
          SFX.fanfare();
          setTimeout(() => {
            controls.innerHTML = '';
            resolve();
          }, 850);
        } else {
          PEDAGOGY.recordAttempt(ch, false);
          btn.classList.add('wrong');
          SFX.hurt();
          setPuzzlePrompt(`<span class="hint-highlight">💡 <b>Dica Matemática:</b> ${hintHtml}</span>`);
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

/* ================= RESUMO AO FINAL DE CADA FASE & RELATÓRIO DO PROFESSOR ================= */
function showStageSummaryModal(ch) {
  return new Promise(resolve => {
    const st = PEDAGOGY.stages[ch];
    st.completed = true;

    const modal = $('#summary-modal');
    const titleEl = $('#summary-title');
    const subEl = $('#summary-subtitle');
    const bodyEl = $('#summary-body');
    const closeBtn = $('#btn-summary-close');

    titleEl.textContent = `📜 RESUMO: ${st.name.toUpperCase()}`;
    subEl.textContent = 'Síntese do conceito matemático trabalhado e desempenho na fase';

    bodyEl.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">✔ OBJETIVO CONCLUÍDO</div>
          <p>${st.objective}</p>
        </div>
        <div class="summary-card">
          <div class="summary-label">📐 CONCEITO &amp; NOTAÇÃO MATEMÁTICA</div>
          <div class="summary-formula">${st.symbol}</div>
          <p>${st.explanation}</p>
        </div>
        <div class="summary-card">
          <div class="summary-label">🌍 EXEMPLO NO COTIDIANO</div>
          <p>${st.dailyExample}</p>
        </div>
        <div class="summary-stats-bar">
          <span>🎯 Acertos na Fase: <b>${st.correct}</b></span>
          <span>🔄 Tentativas no Altar: <b>${st.attempts}</b></span>
          <span>⚠️ Erros / Ajustes: <b>${st.errors}</b></span>
          <span>💡 Dicas Consultadas: <b>${st.hints}</b></span>
        </div>
      </div>
    `;

    closeBtn.textContent = ch < 4 ? `AVANÇAR PARA A FASE ${ch + 1} ▶` : `VER RELATÓRIO FINAL ★`;
    modal.classList.remove('hidden');
    SFX.fanfare();

    const finish = () => {
      modal.classList.add('hidden');
      closeBtn.onclick = null;
      resolve();
    };
    closeBtn.onclick = finish;
  });
}

function showTeacherReportModal(isFinalVictory = false) {
  return new Promise(resolve => {
    const modal = $('#summary-modal');
    const titleEl = $('#summary-title');
    const subEl = $('#summary-subtitle');
    const bodyEl = $('#summary-body');
    const closeBtn = $('#btn-summary-close');

    titleEl.textContent = isFinalVictory
      ? '🏆 TRAVESSIA CONCLUÍDA — RELATÓRIO PEDAGÓGICO'
      : '📊 RELATÓRIO DE ACOMPANHAMENTO (ALUNO / PROFESSOR)';
    subEl.textContent = 'Registro de fases concluídas, tentativas, acertos, erros e conceitos trabalhados';

    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalErrors = 0;
    let completedCount = 0;

    const rowsHtml = [1, 2, 3, 4].map(ch => {
      const s = PEDAGOGY.stages[ch];
      totalAttempts += s.attempts;
      totalCorrect += s.correct;
      totalErrors += s.errors;
      if (s.completed) completedCount++;
      const badge = s.completed
        ? `<span class="rep-status ok">✔ Concluída</span>`
        : `<span class="rep-status pending">Em aberto</span>`;
      return `
        <tr>
          <td><b>${s.name}</b><br><small>${s.symbol}</small></td>
          <td>${badge}</td>
          <td><b>${s.attempts}</b></td>
          <td style="color:var(--green)"><b>${s.correct}</b></td>
          <td style="color:${s.errors > 0 ? 'var(--rose)' : 'var(--ink-muted)'}"><b>${s.errors}</b></td>
        </tr>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <div class="report-wrap">
        <div class="summary-stats-bar" style="margin-bottom:10px;">
          <span>🏁 Fases Concluídas: <b>${completedCount} / 4</b></span>
          <span>🎯 Total de Acertos: <b>${totalCorrect}</b></span>
          <span>🔄 Total de Tentativas: <b>${totalAttempts}</b></span>
          <span>⚠️ Total de Erros: <b>${totalErrors}</b></span>
        </div>

        <div class="report-table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Fase / Conceito</th>
                <th>Status</th>
                <th>Tentativas</th>
                <th>Acertos</th>
                <th>Erros</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="summary-card" style="margin-top:10px;">
          <div class="summary-label">📚 SÍNTESE DOS CONCEITOS TRABALHADOS</div>
          <p style="font-size:13px;line-height:1.55;">
            • <b>Cardinalidade |A|:</b> Quantidade de elementos distintos de um conjunto (sem repetir iguais).<br>
            • <b>Interseção (A ∩ B):</b> Elementos que pertencem a A <b>E</b> a B simultaneamente.<br>
            • <b>União (A ∪ B):</b> Elementos em A <b>OU</b> em B (<b>|A ∪ B| = |A| + |B| - |A ∩ B|</b>).<br>
            • <b>Inclusão-Exclusão (3 Conjuntos):</b> Equilíbrio das 7 regiões para que cada elemento seja contado exatamente <b>1x</b>.<br>
            • <b>Complementar (Aᶜ):</b> Elementos que pertencem ao Universo <b>U</b>, mas ficam fora dos conjuntos trabalhados.
          </p>
        </div>
      </div>
    `;

    closeBtn.textContent = isFinalVictory ? 'VOLTAR À TELA INICIAL ▶' : 'FECHAR RELATÓRIO ✓';
    modal.classList.remove('hidden');

    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      closeBtn.onclick = null;
      resolve();
    };
  });
}

/* ================= ALTAR I: CARDINALIDADE |B| ================= */
async function runAltar1() {
  openPuzzleModal('I', 'O MONÓLITO DA CARDINALIDADE', 'Notação: |B| = número de elementos distintos do conjunto B');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 460 350');

  // Grande círculo do Conjunto B preenchendo o palco
  drawSetCircle(230, 175, 162, 'ca', COL.gold, stage);
  svgSetLabel(230, 54, 'B', 'Conjunto B (8 cristais no círculo)', COL.gold, stage);

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
        `${describe(it)} aparece <b>${countSame}x</b> dentro do círculo, mas na cardinalidade <b>|B|</b> conta apenas <b>1 vez</b>! Qual é o valor de <b>|B|</b>?`
      );
    };
  });

  setPuzzlePrompt(
    'O símbolo <b>|B|</b> representa a <b>cardinalidade</b> (quantidade de elementos distintos) do conjunto B. Mesmo com 8 cristais desenhados, vários são repetidos. Qual é o valor de <b>|B|</b>?'
  );
  await askMultipleChoice(
    [8, 5, 4, 6],
    5,
    'Conte apenas os tipos únicos! A Estrela dourada aparece 3 vezes (conta 1) e o Círculo azul aparece 2 vezes (conta 1). Somando com os outros 3 cristais únicos, temos 5 elementos distintos.',
    1
  );

  // Passo 2 do Altar I: Conexão com o Cotidiano
  $('#puzzle-subtitle').textContent = 'Aplicação no Cotidiano: Playlist de Músicas';
  setPuzzlePrompt(
    '🌍 <b>No Cotidiano:</b> Ana ouviu <b>4 músicas diferentes de MPB</b> e repetiu a <b>mesma música de Rock 3 vezes</b>. Se <b>M</b> é o conjunto das músicas distintas que Ana ouviu, qual é a cardinalidade <b>|M|</b>?'
  );
  await askMultipleChoice(
    [7, 5, 4, 3],
    5,
    'A música de Rock ouvida 3 vezes é um único elemento no conjunto M! Portanto: 4 músicas de MPB + 1 música de Rock = 5 músicas distintas (|M| = 5).',
    1
  );

  setPuzzlePrompt('Exato! <b>|B| = 5</b> e <b>|M| = 5</b>. Em qualquer conjunto, elementos repetidos contam apenas uma única vez!');
  await waitContinueButton('CONCLUIR FASE I ▶');
  closePuzzleModal();
  await showStageSummaryModal(1);
}

/* ================= ALTAR II: INTERSEÇÃO E DIAGRAMA DE VENN ================= */
async function runAltar2() {
  openPuzzleModal('II', 'ALTAR DOS DOIS CÍRCULOS', 'A ∩ B (Interseção = pertence aos dois) dentro do Universo U');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 500 340');

  setPuzzleHint(
    2,
    'Olhe para a cor e a forma do cristal: se for Quente (Dourado/Rosa) E tiver Pontas, arraste para o centro (A ∩ B). Se for só Quente (círculo dourado/rosa), vai na esquerda (só A). Se for Frio com Pontas, vai na direita (só B). Se for Frio e redondo (círculo azul), fica dentro do retângulo U, mas fora dos círculos!'
  );

  const U = { x: 10, y: 8, w: 480, h: 324 };
  const A = { x: 176, y: 194, r: 118 };
  const B = { x: 324, y: 194, r: 118 };

  svgEl('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 14, class: 'univ' }, stage);
  svgSetLabel(36, 36, 'U', '', '#d8cef0', stage);

  drawSetCircle(A.x, A.y, A.r, 'ca', COL.gold, stage);
  drawSetCircle(B.x, B.y, B.r, 'cb', COL.teal, stage);

  // Rótulos alinhados harmonicamente na faixa superior
  svgSetLabel(124, 38, 'A', 'Quentes', COL.gold, stage);
  svgSetLabel(250, 38, 'A ∩ B', 'Ambos (E)', '#fff8e7', stage);
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
    if (isW && isS) return 'pertence à interseção <b>A ∩ B</b> (centro: é Quente <b>E</b> tem Pontas ao mesmo tempo)';
    if (isW) return 'pertence só a <b>A</b> (lado esquerdo: é Quente, mas não tem pontas)';
    if (isS) return 'pertence só a <b>B</b> (lado direito: tem Pontas, mas é de cor fria/azul)';
    return 'pertence ao <b>Complementar de A ∪ B em U</b> (fora dos círculos A e B, mas dentro do retângulo U!)';
  }

  for (let idx = 0; idx < list.length; idx++) {
    const it = list[idx];
    await new Promise(res => {
      const g = createSvgRelic(it, stage);
      placeSvgNode(g, home.x, home.y, 1.3);

      setPuzzlePrompt(
        `[${idx + 1}/${list.length}] <b>${describe(it)}</b> — Arraste do canto direito para sua região correta no Diagrama de Venn!`
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
          PEDAGOGY.recordAttempt(2, true);
          const key = inA && inB ? 'both' : inA ? 'onlyA' : inB ? 'onlyB' : 'outU';
          const slotList = regionSlots[key];
          const slot = slotList[slotCounts[key] % slotList.length] || p;
          slotCounts[key]++;
          placeSvgNode(g, slot.x, slot.y, 1.15);
          g.style.pointerEvents = 'none';
          SFX.pickupNew(idx + 1);
          res();
        } else {
          if (movedFromDock) PEDAGOGY.recordAttempt(2, false);
          SFX.hurt();
          placeSvgNode(g, home.x, home.y, 1.3);
          setPuzzlePrompt(
            `<span class="hint-highlight">💡 <b>Dica:</b> ${describe(it)} ${warm(it) ? 'é tom quente' : 'é tom frio'} e ${sharp(it) ? 'tem pontas' : 'não tem pontas'}. Logo, ela ${explainZone(it)}.</span>`
          );
        }
      };

      g.addEventListener('pointerup', onDrop);
      g.addEventListener('pointercancel', onDrop);
    });
  }

  spawnDock.remove();

  // Pergunta rápida para reforçar a diferença entre Interseção (A ∩ B) e União (A ∪ B)
  $('#puzzle-subtitle').textContent = 'Diferença entre Interseção (A ∩ B) e União (A ∪ B)';
  setPuzzlePrompt(
    'Observe o diagrama completo acima: há <b>3 cristais</b> no centro (<b>A ∩ B</b>: Quentes <b>E</b> com Pontas). E quantos cristais pertencem à <b>União A ∪ B</b> (todos que estão em A, em B ou no centro)?'
  );
  await askMultipleChoice(
    [7, 3, 8, 5],
    7,
    'Conte todos os cristais dentro dos dois círculos: 2 só em A + 3 na interseção (A ∩ B) + 2 só em B = 7 cristais na União A ∪ B! (O círculo azul lá fora é o único que não pertence a A ∪ B).',
    2
  );

  setPuzzlePrompt('Perfeito! <b>|A ∩ B| = 3</b> (ambos) e <b>|A ∪ B| = 7</b> (pelo menos um), enquanto <b>1</b> cristal ficou no complementar fora dos círculos!');
  await waitContinueButton('CONCLUIR FASE II ▶');
  closePuzzleModal();
  await showStageSummaryModal(2);
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

    const neededK = a + b - u;
    setPuzzleHint(
      3,
      `Pela fórmula da União: |A ∪ B| = |A| + |B| - |A ∩ B|. Como |A| + |B| = ${a} + ${b} = ${a + b} e queremos |A ∪ B| = ${u}, ajuste a interseção central para |A ∩ B| = ${a + b} - ${u} = ${neededK}!`
    );

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
        `Fórmula da União: <b>|A ∪ B| = |A| + |B| - |A ∩ B|</b> &rarr; ${a} + ${b} - <b>${k}</b> = <b>${unionVal}</b><br>` +
        `<span style="color:var(--teal)">Meta da Ponte: ajuste a interseção até obter <b>|A ∪ B| = ${u}</b> elementos distintos!</span>`
      );

      lockWrap.innerHTML = '';
      if (unionVal === u) {
        const okBtn = document.createElement('button');
        okBtn.className = 'pixel-btn success';
        okBtn.textContent = 'TRAVAR ENGRENAGEM ✓';
        okBtn.onclick = () => {
          PEDAGOGY.recordAttempt(3, true);
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
  openPuzzleModal('III', 'ENGRENAGEM DA PONTE', 'União (A ∪ B): juntar elementos sem contar a interseção duas vezes');

  const rounds = [
    { a: 7, b: 5, u: 9, start: 0, subtitle: 'Engrenagem 1/3: Evite contar duas vezes os elementos compartilhados' },
    { a: 6, b: 6, u: 8, start: 0, subtitle: 'Engrenagem 2/3: Quantos elementos precisam ficar na interseção A ∩ B?' },
    { a: 4, b: 5, u: 9, start: 4, subtitle: 'Engrenagem 3/3: E quando os conjuntos são disjuntos (A ∩ B = ∅, sem elementos em comum)?' }
  ];

  for (let i = 0; i < rounds.length; i++) {
    await runBridgeGearRound(rounds[i], () => onBridgeStep && onBridgeStep((i + 1) * 0.3));
  }

  // Pergunta final contextualizada com situação do cotidiano (Esportes na Escola)
  const stage = $('#stage');
  initStageDefs(stage, '0 0 480 340');
  $('#puzzle-subtitle').textContent = 'Trava Mestre da Ponte — Aplicação no Cotidiano (Esportes)';

  drawSetCircle(170, 154, 112, 'ca', COL.gold, stage);
  drawSetCircle(310, 154, 112, 'cb', COL.teal, stage);

  svgSetLabel(106, 144, 'A', 'Futebol: |A| = 10', COL.gold, stage);
  svgSetLabel(374, 144, 'B', 'Vôlei: |B| = 8', COL.teal, stage);
  svgSetLabel(240, 144, 'A ∩ B', 'Ambos: 6', '#fff8e7', stage);
  svgSetLabel(240, 304, '|A ∪ B| = ?', 'Futebol OU Vôlei', COL.gold, stage);

  setPuzzlePrompt(
    '🌍 <b>Trava Mestre (Cotidiano):</b> Em um grupo de amigos, <b>|A| = 10</b> jogam Futebol, <b>|B| = 8</b> jogam Vôlei e <b>|A ∩ B| = 6</b> praticam <b>os dois esportes</b>. Quantos amigos jogam Futebol <b>OU</b> Vôlei (<b>|A ∪ B|</b>)?'
  );
  await askMultipleChoice(
    [18, 12, 24, 4],
    12,
    'Se somarmos 10 + 8 = 18, os 6 amigos que jogam ambos (A ∩ B) foram contados duas vezes! Subtraia a interseção: |A ∪ B| = |A| + |B| - |A ∩ B| = 10 + 8 - 6 = 12.',
    3
  );

  onBridgeStep && onBridgeStep(1);
  setPuzzlePrompt('<b>10 + 8 - 6 = 12!</b> A ponte da União sobre o abismo está completa e firme!');
  await waitContinueButton('CONCLUIR FASE III ▶');
  closePuzzleModal();
  await showStageSummaryModal(3);
}

/* ================= ALTAR IV: INCLUSÃO-EXCLUSÃO (3 CONJUNTOS) + COMPLEMENTAR ================= */
async function runAltar4() {
  openPuzzleModal('IV', 'SANTUÁRIO DOS TRÊS VENTOS', 'Princípio da Inclusão-Exclusão para 3 Conjuntos');
  const stage = $('#stage');
  initStageDefs(stage, '0 0 480 355');

  // Legenda explicativa clara sobre os contadores 0x, 1x e 2x solicitada pelos 3 professores
  setPuzzleLegend(`
    <span class="leg-title">Como funcionam os contadores nas 7 regiões:</span>
    <span class="leg-chip zero"><b>0x</b> Não contado</span>
    <span class="leg-chip ok"><b>1x</b> Contado 1 vez (Correto!)</span>
    <span class="leg-chip over"><b>2x / 3x</b> Contado repetido (Subtraia!)</span>
    <span class="leg-chip neg"><b>-1x</b> Descontado demais (Some!)</span>
  `);

  setPuzzleHint(
    4,
    'Para que todas as 7 regiões fiquem com [1x]: 1º) Ative +|A|, +|V| e +|E| (as interseções ficarão com 2x e 3x porque foram somadas várias vezes). 2º) Ative -|A∩V|, -|V∩E| e -|A∩E| para descontar os repetidos (mas o centro cairá para 0x!). 3º) Ative +|A∩V∩E| para devolver o centro para 1x!'
  );

  // Três círculos harmônicos ampliados
  const circles = [
    { x: 178, y: 146, r: 96, c: 'ca', n: 'A', lx: 64, ly: 50, t: 'Areia (15)', col: COL.gold },
    { x: 302, y: 146, r: 96, c: 'cb', n: 'V', lx: 416, ly: 50, t: 'Vento (12)', col: COL.teal },
    { x: 240, y: 238, r: 96, c: 'cc', n: 'E', lx: 392, ly: 312, t: 'Estrela (10)', col: COL.rose }
  ];

  circles.forEach(o => {
    drawSetCircle(o.x, o.y, o.r, o.c, o.col, stage);
  });

  circles.forEach(o => {
    svgSetLabel(o.lx, o.ly, o.n, o.t, o.col, stage);
  });

  // Posições e nomes pedagógicos das 7 regiões de contagem dentro dos 3 círculos
  const pos = {
    1: { xy: [134, 130], desc: 'Apenas A (tocaram só a Areia)' },
    2: { xy: [346, 130], desc: 'Apenas V (ouviram só o Vento)' },
    4: { xy: [240, 268], desc: 'Apenas E (seguiram só a Estrela)' },
    3: { xy: [240, 108], desc: 'Em A e V (pertence à interseção A ∩ V)' },
    5: { xy: [180, 206], desc: 'Em A e E (pertence à interseção A ∩ E)' },
    6: { xy: [300, 206], desc: 'Em V e E (pertence à interseção V ∩ E)' },
    7: { xy: [240, 168], desc: 'Centro A ∩ V ∩ E (viveram as 3 experiências)' }
  };

  const badges = {};
  for (const m in pos) {
    const [bx, by] = pos[m].xy;
    const g = svgEl('g', { class: 'badge zero', style: 'cursor:pointer' }, stage);
    svgEl('rect', { x: bx - 18, y: by - 12, width: 36, height: 24, rx: 12 }, g);
    const t = svgEl('text', { x: bx, y: by }, g);
    t.textContent = '0x';
    badges[m] = { g, t, currentK: 0 };

    // Ao clicar num contador 0x/1x/2x, explica exatamente o que ele significa!
    g.onclick = () => {
      SFX.blip();
      const k = badges[m].currentK;
      const msg = k === 0
        ? 'está com <b>0x</b> (ainda não foi incluída na soma).'
        : k === 1
          ? 'está com <b>1x</b> (contada exatamente 1 vez — ideal!).'
          : k > 1
            ? `está com <b>${k}x</b> (foi contada <b>${k} vezes</b>! Ative uma subtração de interseção para descontar a repetição).`
            : `está com <b>${k}x</b> (foi descontada demais! Ative uma soma para corrigir).`;
      setPuzzlePrompt(`🔎 <b>Região "${pos[m].desc}":</b> ${msg}`);
    };
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
        b.currentK = k;
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
        setPuzzlePrompt(
          'Cada marcador (<b>0x, 1x, 2x</b>) indica quantas vezes aquela região foi contada. Ative as parcelas abaixo até que <b>todas as 7 regiões fiquem verdes com [1x]</b>! <i>(Toque em qualquer marcador para entender seu estado)</i>.'
        );
      } else {
        setPuzzlePrompt(
          `Fórmula ativa: <b>${expr} = ${sum}</b><br>` +
          `<span style="color:var(--teal)">${allOne ? '✔ Perfeito! Todas as 7 regiões estão com [1x] (|A ∪ V ∪ E| = 27)!' : 'Ajuste os botões: regiões com [2x/3x] foram contadas repetidas; regiões com [0x] faltam ser contadas!'}</span>`
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
          PEDAGOGY.recordAttempt(4, true);
          controls.querySelectorAll('button').forEach(b => (b.disabled = true));
          SFX.fanfare();
          setTimeout(resolve, 1400);
        }
      };
      controls.appendChild(btn);
    });

    updateFormula();
  });

  // Parte 2 do Altar IV: O Conjunto Complementar com representação visual dos elementos fora da união
  setPuzzleLegend('');
  initStageDefs(stage, '0 0 480 350');
  $('#puzzle-subtitle').textContent = 'O Conjunto Complementar: Elementos em U que NÃO pertencem a A ∪ V ∪ E';

  svgEl('rect', { x: 14, y: 12, width: 452, height: 326, rx: 14, class: 'univ' }, stage);
  svgSetLabel(104, 38, 'U (Universo)', '|U| = 30 viajantes no total', '#e2d9f3', stage);

  drawSetCircle(240, 174, 102, 'ca', COL.gold, stage);
  svgSetLabel(240, 162, 'A ∪ V ∪ E', '27 viajantes na união', COL.gold, stage);

  // Representação visual explícita dos elementos do Complementar (dentro de U, mas fora do círculo)
  const compPoints = [
    { x: 64, y: 156, item: G('tc') },
    { x: 416, y: 156, item: G('td') },
    { x: 64, y: 252, item: G('ts') }
  ];
  compPoints.forEach((cp, idx) => {
    const node = createSvgRelic(cp.item, stage);
    placeSvgNode(node, cp.x, cp.y, 1.0);
    const txt = svgTxt(cp.x, cp.y + 28, `Fora #${idx + 1}`, 'svg-lbl sub', stage);
    txt.style.fill = COL.teal;
    txt.style.fontSize = '11px';
  });

  svgSetLabel(240, 308, 'Complementar (A ∪ V ∪ E)ᶜ = ?', 'Em U, mas fora dos 3 conjuntos', COL.teal, stage);

  setPuzzlePrompt(
    'Dos <b>|U| = 30</b> viajantes do universo <b>U</b>, descobrimos que <b>27</b> pertencem à união <b>A ∪ V ∪ E</b> (dentro do círculo). Quantos viajantes pertencem ao <b>Conjunto Complementar</b> (dentro de <b>U</b>, mas <b>fora</b> dos 3 conjuntos)?'
  );
  await askMultipleChoice(
    [3, 27, 0, 57],
    3,
    'O conjunto complementar reúne os elementos do Universo U que não pertencem à união trabalhada: |(A ∪ V ∪ E)ᶜ| = |U| - |A ∪ V ∪ E| = 30 - 27 = 3!',
    4
  );

  // Parte 3 do Altar IV: Problema Cotidiano envolvendo 3 Conjuntos + Complementar
  $('#puzzle-subtitle').textContent = 'Aplicação no Cotidiano: 3 Conjuntos e Complementar numa Escola';
  setPuzzlePrompt(
    '🌍 <b>Desafio Final (Cotidiano):</b> Em uma turma de <b>|U| = 35 alunos</b>, uma pesquisa sobre estilos musicais (Rock, Pop e Samba) mostrou que <b>|R ∪ P ∪ S| = 29 alunos</b> curtem pelo menos um desses 3 estilos. Quantos alunos da turma <b>não curtem nenhum</b> dos três (conjunto complementar)?'
  );
  await askMultipleChoice(
    [6, 29, 5, 11],
    6,
    'Subtraia do Universo total da turma (|U| = 35) a união dos 3 conjuntos (|R ∪ P ∪ S| = 29): 35 - 29 = 6 alunos no conjunto complementar!',
    4
  );

  setPuzzlePrompt('Exato! <b>35 - 29 = 6</b>. Você dominou os 3 Conjuntos, a Inclusão-Exclusão e o Complementar!');
  await waitContinueButton('VER RESUMO DA FASE IV ★');
  closePuzzleModal();
  await showStageSummaryModal(4);
}
