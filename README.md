Travessia: Uma Jornada pelos Conjuntos

Travessia é um jogo web 2D interativo com estética pixel art focado no ensino prático de Teoria dos Conjuntos. Através da exploração, resolução de quebra-cabeças em altares e diálogos de RPG, os jogadores aprendem conceitos matemáticos de forma lúdica e visual.

**Jogue agora: [travessiamat.netlify.app](https://travessiamat.netlify.app/)

**Contexto Acadêmico**

Este projeto foi desenvolvido como requisito para a disciplina de Projeto Aplicado - Cenário 2 (2026.1), do curso de Ciência da Computação / Análise e Desenvolvimento de Sistemas (ADS) da Universidade de Fortaleza (UNIFOR).

O objetivo principal é criar uma ferramenta educacional e interativa voltada para alunos do ensino médio, tornando a matemática menos abstrata e mais engajadora através da lógica de game design.

**Conteúdos Matemáticos Abordados**

O jogo é estruturado em 4 fases progressivas de aprendizado, atendendo aos requisitos de interação do projeto:

Fase 1: Cardinalidade ($\vert{}A\vert{}$) - Compreensão de conjuntos como coleções de elementos distintos (sem repetição).

Fase 2: Interseção ($A \cap B$) - Identificação de elementos que pertencem simultaneamente a dois conjuntos.

Fase 3: União ($A \cup B$) - Combinação de conjuntos, reforçando a regra de não duplicação de elementos.

Fase 4: Princípio da Inclusão-Exclusão - Resolução de enigmas lógicos envolvendo três conjuntos, utilizando raciocínio baseado no Diagrama de Venn.

**Como Jogar (Controles)**

O jogo possui suporte tanto para teclado (desktop) quanto para botões virtuais na tela (mobile/touch).

A / D ou ◀ / ▶ : Andar para a esquerda/direita.

ESPAÇO ou W : Pular (Segure para planar, se disponível).

E ou ENTER : Interagir com Altares, ler placas e avançar diálogos.

Objetivo Geral: Controle o explorador Leo, interaja com os Altares do Conhecimento espalhados pelo mapa e colete os cristais corretos baseando-se nas regras matemáticas ditadas pelo Caderno da Cartógrafa.

**📋 Melhorias Implementadas Pós-Entrevistas (Feedback Pedagógico)**

A partir da avaliação pedagógica realizada com os professores entrevistados (Paulo Henrique, Raquel Jucá e David Martins), foram implementadas as seguintes melhorias no jogo:

- **Tutorial Inicial e Guia Passo a Passo na Tela:** Inclusão de um tutorial inicial rápido explicando movimentação, coleta de cristais e interação com os altares, além de uma barra de orientação contínua no HUD (`🧭 Guia`) que acompanha cada etapa das 4 fases.
- **Legenda e Explicação dos Contadores (`0x`, `1x`, `2x`):** Adição de um diálogo introdutório e de uma legenda visual colorida fixa no Altar IV explicando a função dos marcadores (`0x` = não contado, `1x` = contado 1 vez/correto, `2x/3x` = contado repetido, `-1x` = descontado demais), além de explicações ao clicar em cada marcador.
- **Botão de Dicas Matemáticas (`💡 DICA`):** Disponibilização de dicas matemáticas contextualizadas em todos os desafios dos altares e feedback explicativo automático sempre que o jogador comete um erro.
- **Exemplos do Cotidiano e Reforço do Complementar:** Inclusão de situações reais envolvendo preferências musicais e esportivas, comparação direta entre União ($A \cup B$) e Interseção ($A \cap B$) e destaque visual para os elementos do conjunto complementar (dentro do Universo $U$, mas fora dos conjuntos trabalhados).
- **Resumo por Fase e Relatório do Professor (`📊 RELATÓRIO`):** Exibição de um resumo pedagógico ao final de cada fase (objetivo concluído, conceito, notação e exemplo cotidiano) e um relatório completo com o registro de fases concluídas, tentativas, acertos e erros para acompanhamento do professor.

Tecnologias Utilizadas

Este projeto foi construído do zero (Vanilla), sem o uso de engines pesadas, focando em performance para navegadores:

HTML5: Estrutura e elemento <canvas></canvas> para renderização 2D.

CSS3: Estilização da interface de usuário (HUD), modais, tipografia pixelada e layout responsivo.

JavaScript (ES6+):

game.js: Game Loop, física, controle de câmera e renderização no Canvas.

puzzles.js: Lógica matemática, validação de arrays/sets e manipulação das regras dos conjuntos.

sprites.js: Gerenciamento e desenho dos tilesets e animações.

audio.js: Controle de efeitos sonoros e trilha musical.

🚀 Como Rodar Localmente

Se desejar baixar o código e rodar na sua máquina, siga os passos:

Clone este repositório:

git clone https://github.com/AnaLuizaS4ntos/jogo_mat

Acesse a pasta do projeto:

cd travessia-jogo-matematico

Abra o arquivo index.html em seu navegador web preferido ou utilize uma extensão como o Live Server no VS Code para iniciar um servidor local.

👥 Equipe de Desenvolvimento

Ana Luíza Dos Santos Souza (2520530)

Ian Pereira  (2421344)

Davi Barros Alves (2520357)

Projeto desenvolvido para a Universidade de Fortaleza (UNIFOR) - Ensinando e Aprendendo.
