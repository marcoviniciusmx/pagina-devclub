# DESC.md — Landing Page DevClub

Documento técnico de referência deste projeto: o que é, para que serve, como foi construído, cada animação/interação explicada em detalhe, o design system e as skills disponíveis para evoluí-lo. Mantenha este arquivo atualizado conforme o projeto muda — ele existe para dar contexto completo antes de qualquer nova decisão de design.

---

## 1. O que é este projeto

É a **landing page principal da DevClub**, construída em **Next.js 16 (App Router) + React 19 + TypeScript**, com **Tailwind CSS v4** para estilo e **GSAP + Framer Motion** para animação. Tecnicamente é o pacote `nextjs-scaffold` (nome interno em `package.json`), uma SPA de página única (`/`) composta por seções empilhadas verticalmente, sem roteamento adicional.

**Para que serve:** converter visitantes em candidatos à formação DevClub. A página conta a história do fundador (Rodolfo Mori), demonstra prova social (empresas contratantes, depoimentos, mentores), guia o visitante pela jornada de formação e termina em CTAs recorrentes ("Quero ser aluno" / "Quero me tornar um Desenvolvedor") que levam para `https://www.devclub.com.br/` e para a área do aluno (`https://aulas.devclub.com.br/`).

Não há backend próprio nesta página — é um site de marketing/conversão estático (client components + assets locais), sem formulário embutido nem chamadas a API.

---

## 2. O que é a DevClub (a marca)

De acordo com o conteúdo real do site (`src/lib/data.ts`, `layout.tsx`):

> "A maior escola de programação e IA do Brasil" — formação com **mentoria 360°**, **diploma/certificação reconhecidos**, e uma comunidade de alunos contratados por empresas como **iFood, Itaú, Nubank, VTEX, Santander, Mercado Livre, Ambev**, entre outras.

- **Fundador:** Rodolfo Mori — ex-eletricista que aprendeu a programar do zero, foi contratado pelo Santander, e hoje é **Embaixador oficial da OpenAI no Brasil**. Essa é literalmente a narrativa em 4 atos do vídeo da Hero (seção 6.1).
- **A jornada de formação** (`journeySteps` em `data.ts`, seção "Jornada DevClub" — 6.6): entrada → fundamentos (HTML/CSS/JavaScript) → Front-End (React/Next.js/TailwindCSS) → Full Stack (Node.js/TypeScript/PostgreSQL) → Inteligência Artificial (ChatGPT/Claude/n8n) → monetização (criação de sites, prospecção, vendas) → diploma reconhecido pelo MEC → comunidade contínua.
- **Mentoria 360°** (`mentors` em `data.ts`): 5 mentores reais cobrindo frentes diferentes — mentoria estratégica (Rodolfo), code review técnico (Andrey), preparação de recrutamento/LinkedIn (Fernanda e Juliana), e suporte emocional/mindset (Márcio). Ou seja, a mentoria não é só técnica — é holística (carreira + psicológico).
- **Prova de reconhecimento oficial:** MBA e Pós-Graduação em Tecnologia reconhecidos pelo **MEC** (ver `MecCard` na seção BentoGrid, 6.4).

> **Nota de contexto:** existe um produto irmão, o **MBA em IA** (`mba.devclub.com.br`), fruto de uma parceria DevClub + Faculdade Sirius, com um site próprio e diferente desta landing page. Foi analisado como *referência de mercado* para uma animação 3D interativa (rede neural com IAs orbitando um núcleo) — ver seção 8. Ele **não faz parte deste repositório**, mas serviu de inspiração técnica direta para o "Conhecimento em Fluxo" (`DevClubCore.tsx`, seção 6.5).

---

## 3. Stack técnico

Do `package.json` real do projeto:

| Categoria | Biblioteca | Versão | Papel |
|---|---|---|---|
| Framework | `next` | 16.2.11 | App Router, Server/Client Components, `next/image`, `next/font` |
| UI | `react` / `react-dom` | 19.2.4 | Componentização |
| Linguagem | `typescript` | ^5 | Tipagem estática |
| Estilo | `tailwindcss` (+ `@tailwindcss/postcss`) | ^4 | Utility classes, tokens via `@theme inline` |
| Animação (scroll/timeline) | `gsap` + `@gsap/react` | ^3.15 / ^2.1 | ScrollTrigger, Timelines escrubadas manualmente |
| Animação (spring/UI) | `framer-motion` | ^12.42 | `motion.div`, `AnimatePresence`, `useSpring`, `useTransform`, `MotionConfig` |
| Ruído procedural | `simplex-noise` | ^4 | Campo de fluxo do Conhecimento em Fluxo (`DevClubCore.tsx`) |
| Ícones | `lucide-react` | ^1.25 | Ícones SVG (Play, Plus, X, ChevronsRight, User, RotateCw, ícones de tech na Jornada) |
| Utilitário CSS | `clsx` + `tailwind-merge` (via `cn()` em `src/lib/utils.ts`) | — | Composição condicional de classes |
| Fontes | `next/font/google`: **Space Grotesk** (headings) + **DM Sans** (corpo) | — | Carregadas via `layout.tsx`, expostas como `--font-heading` / `--font-body` |

**Importante:** **não há Three.js, WebGL, D3 ou qualquer engine 3D real no projeto.** Toda sensação de profundidade/3D hoje vem de: `perspective` + `rotateX/rotateY` via CSS/Framer Motion (parallax de mouse, drag do certificado), um `<canvas>` 2D desenhando partículas/fios à mão (`DevClubCore.tsx`) e timelines GSAP com easings cinematográficos — a mesma técnica "3D falso" identificada na análise do site de referência (seção 8).

`src/lib/gsap.ts` é o ponto único de import do GSAP: registra `ScrollTrigger` e `useGSAP` uma única vez (`typeof window !== "undefined"` guard, necessário porque GSAP toca o DOM e este é um projeto SSR/Next), e exporta `prefersReducedMotion()` — o único ponto de verdade que toda seção com animação via JS usa para checar a preferência do sistema (ver 4.4).

---

## 4. Design System

### 4.1 Paleta de cores (`src/app/globals.css`, tokens `:root`)

| Token | Hex / valor | Uso |
|---|---|---|
| `--color-background` | `#0a0a0a` | Fundo padrão de toda a página (dark mode fixo, não alterna) |
| `--color-background-pure` | `#000000` | Preto absoluto (usado no scrim do modal de vídeo) |
| `--color-surface` | `#111012` | Fundo de cards |
| `--color-border` | `#1a1a1a` | Borda padrão de cards |
| `--color-border-soft` | `rgba(255,255,255,0.08)` | Borda sutil sobre glass/overlays |
| `--color-foreground` | `#ffffff` | Texto principal |
| `--color-muted-foreground` | `#9a9a9a` | Texto secundário e decorativo (7:1 de contraste — AA/AAA compliant), único cinza secundário do projeto |
| **`--color-accent`** | **`#39d572`** (também grafado `#39D372`/`#39D353` em componentes) | **Verde neon, a cor de marca da DevClub.** Usado em CTAs, glows, bordas ativas, ícones em destaque |
| `--color-accent-foreground` | `#0a0a0a` | Texto sobre fundo accent (botões sólidos) |
| `--color-accent-glow` | `rgba(57,213,114,0.4)` | Base de todos os `box-shadow`/`blur` de glow verde |
| `--color-gold` | `#ffd700` | Dourado do diploma/formatura — o selo do MEC e o terminus da trilha na Jornada |

Cor secundária pontual: **`#721AE7`** (roxo) aparece só no wordmark "**Dev**Club" do 4º ato da Hero (`span style={{color: "#721AE7"}}`) e no "blush" ambiente do Footer (`#7C3AED`, mesma família de roxo) — usada com moderação, como contraponto de cor ao verde dominante, nunca como cor primária de UI.

Tudo é **dark-mode fixo** (`className="... dark"` no `<html>`, `color-scheme: dark`) — não existe toggle claro/escuro.

### 4.2 Tipografia

- **Space Grotesk** (`--font-heading`) — pesos 500/600/700, para todos os `h1`–`h4`.
- **DM Sans** (`--font-body`) — pesos 400/500/700, para parágrafos e UI.
- Ambas carregadas via `next/font/google` (self-hosted, zero layout shift por FOIT/FOUT).

### 4.3 Utilitários visuais reutilizáveis (`globals.css`)

- `.glass` — vidro fosco: `rgba(17,16,18,0.6)` + `backdrop-filter: blur(20px)` + borda suave. Base de cards flutuantes (badge "All systems operational", modal de vídeo, TypewriterCode).
- `.glow-accent` — `box-shadow: 0 0 60px -12px var(--color-accent-glow)`, o "brilho" verde padrão em cards/imagens.
- `.text-glow` — `text-shadow` verde, usado em palavras-chave (ex: "**MEC**" no MecCard).
- `.border-beam` — anel cônico giratório (conic-gradient + mask composite `exclude`) que percorre a borda de um card no hover; girado via `transform: rotate()` (não via ângulo do próprio gradiente, evitando precisar registrar `@property`). Usado no `NeonButton` e no `PlatformCard`.

### 4.4 Acessibilidade de movimento

`@media (prefers-reduced-motion: reduce)` zera **globalmente** todas as `animation-duration`/`transition-duration` para `0.01ms` e força `iteration-count: 1` — cobre toda animação CSS pura (`hero-float`, `cert-scanline`, `mec-seal-pulse`, `border-beam-spin`, utilities do Tailwind). Isso **não** cobre o Framer Motion, que anima via motion values/WAAPI e ignora essas propriedades CSS, nem os loops em `requestAnimationFrame` — por isso:

- Todo componente com animação JS-driven (Hero, DevClubCore, Jornada, CompanyFlipGrid, BentoGrid) verifica a preferência antes de montar qualquer timeline/loop, via `prefersReducedMotion()` (`src/lib/gsap.ts`) — um único ponto de verdade, sem reimplementações de `matchMedia` espalhadas pelo código.
- `layout.tsx` envolve toda a árvore em `<MotionConfig reducedMotion="user">`, fazendo **todo** `motion.*`/`AnimatePresence` do Framer Motion (Reveal, Faq, modal de Depoimentos) respeitar a preferência automaticamente, sem precisar checar em cada componente individualmente.

Tratado como requisito de primeira classe, não como afterthought.

---

## 5. Estrutura de seções (ordem real em `src/app/page.tsx`)

```
<Hero />         → vídeo cinematográfico scroll-scrubbed, 4 atos narrativos
<Marquee />      → empresas que contrataram alunos (flip grid 3D)
<BentoGrid />    → MEC/diploma (drag 3D) + plataforma de código (parallax em camadas)
<DevClubCore />  → "Conhecimento em Fluxo": núcleo de partículas em canvas
<Jornada />      → "Jornada DevClub": trilha de circuito energizada pelo scroll
<Mentoria />     → grid de 5 mentores com reveal on-scroll
<Depoimentos />  → 3 cards de vídeo (abre modal com YouTube embed)
<Faq />          → accordion de perguntas frequentes (spring physics)
<Footer />       → CTA final + links institucionais
```

Cada seção (exceto Hero, DevClubCore e Jornada, que têm sua própria lógica de entrada) usa o componente compartilhado `<Reveal>` para entrar suavemente conforme o scroll chega nela.

---

## 6. Animações e interações — explicadas uma a uma

### 6.1 Hero — vídeo cinematográfico "scroll-scrubbed" (`Hero.tsx`)

A animação mais sofisticada do projeto. **Não é CSS/GSAP puro animando elementos — é o scroll controlando diretamente o `currentTime` de um `<video>`**, técnica de "scrollytelling" usada por sites como Apple.

**Mecânica:**
1. A seção é **pinada** (`ScrollTrigger` com `pin: true`) por `4 × window.innerHeight` de scroll — ou seja, o usuário rola 4 telas inteiras sem a seção sair da tela, e esse scroll é convertido em progresso de uma timeline GSAP.
2. Um `gsap.timeline()` de duração abstrata `10` (`TOTAL_DURATION`) é dividido em **4 "atos" iguais** (2.5 unidades cada = 25% do scroll):
   - Ato 1 — "De Eletricista frustrado"
   - Ato 2 — "A Desenvolvedor contratado pelo Santander"
   - Ato 3 — "Dominando a Inteligência Artificial" (Embaixador OpenAI)
   - Ato 4 — "Fundação do **Dev**Club" (com CTA "Quero Transformar Minha Carreira")
3. O vídeo de fundo (`/videos/hero-devclub-fast.mp4`) é **mudo, sem loop e sem autoplay** — seu `currentTime` é animado de `0` até `video.duration` por essa mesma timeline (`tl.to(video, { currentTime: ... })`), então rolar a página literalmente "escrubbing" o filme como uma timeline de editor de vídeo. Único `<video>` do projeto — reencodado com todo frame como keyframe (ver item 8 abaixo) para permitir esse scrub.
4. **`lingerEase`** — uma função de easing customizada (não é um easing built-in do GSAP) que faz cada ato **"respirar"**: o vídeo desacelera perto do meio de cada ato (enquanto o texto daquele ato está totalmente visível e legível) e acelera perto da transição para o próximo.
5. Cada bloco de texto (`ACTS[i]`) entra com `fromTo(autoAlpha:0→1, y:24→0, power3.out)` e sai com `to(autoAlpha→0, y:-24, power2.inOut)`, sempre **encostando exatamente** no limite do próximo ato (sem gap nem overlap). Apenas o primeiro ato é renderizado como `<h1>` real — os outros 3 usam `<p>` com o mesmo visual, para a página nunca ter mais de um H1 simultâneo no DOM (os 4 blocos existem o tempo todo, só a opacidade/visibilidade muda).
6. O retrato final de Rodolfo (`rodolfoFinalRef`) só aparece em `t=8.2` (dentro do Ato 4, depois do título já ter assentado) — um "payoff" deliberado, não simultâneo ao texto.
7. **Reversível:** como tudo pertence à mesma timeline pinada, rolar para cima desfaz a animação na ordem exata inversa — não há lógica separada para isso.
8. **Cuidados técnicos documentados no próprio código:**
   - O vídeo é reencodado com **todo frame como keyframe** (`-g 1 -keyint_min 1`) — sem isso, "seekar" `currentTime` obrigaria o decoder a andar da keyframe anterior a cada frame, travando em scroll rápido.
   - A timeline só é construída após `loadedmetadata` do vídeo (precisa de `video.duration`), nunca antes.
   - `prefers-reduced-motion` pula toda a animação: mostra direto o último frame do vídeo e o Ato 4.
   - O header (logo + nav) é renderizado via **`createPortal` para `document.body`**, fora da seção pinada — necessário porque ScrollTrigger aplica `transform` no elemento pinado, e isso quebra `position: fixed` em descendentes. O portal usa `useSyncExternalStore` para decidir quando montar, evitando hydration mismatch (SSR não tem `document`).

### 6.2 Marquee — empresas contratantes (`Marquee.tsx`)

- Wrapper fino em volta de `CompanyFlipGrid` (seção 6.3): título "Empresas que contratam alunos DevClub" + o grid de logos propriamente dito.

### 6.3 CompanyFlipGrid — logos de empresas em flip vertical (`CompanyFlipGrid.tsx`)

- Cada célula do grid é um par de nós que sobem e se empurram um ao outro ("follow-through" físico, não uma troca de estado instantânea): o logo entrando sobe numa única curva `power2.inOut` até a posição de repouso; no instante exato (mesmo frame) em que cruza a posição do logo assentado, esse logo assentado é empurrado pra cima e some, desfocando e desvanecendo antes de sair pela borda de cima.
- Dois nós (A/B) trocam de papel a cada ciclo em vez de resetar a posição E o conteúdo de um único nó ao mesmo tempo — a fonte clássica de flicker de 1 frame.
- Distribui os itens reais (iFood, Itaú, Nubank, VTEX, USP, Santander, Mercado Livre, Ambev, OAB) e um conjunto de nomes fictícios (`showcaseFillerItems`, isolado propositalmente da lista real de contratantes) round-robin entre as células do grid.
- As animações de cada célula são criadas dentro de um `gsap.context()` — inclusive as recriadas de forma assíncrona a cada novo ciclo (via `ctx.add()`), para que `ctx.revert()` no unmount mate qualquer tween em andamento, não só o do primeiro ciclo.

### 6.4 BentoGrid — dois cards com efeitos 3D distintos (`BentoGrid.tsx`)

**MecCard** (diploma/certificação MEC):
- O certificado é tratado como um objeto físico segurado, não um flip automático de 180°: enquanto o ponteiro está pressionado, a rotação acompanha o mouse 1:1 (sem lag de mola); ao soltar, decide — pelo eixo que se moveu mais — se volta pra frente ou completa o giro na mesma direção que já estava sendo puxado.
- Uma pequena rotação extra no eixo Z ("flex"), proporcional à velocidade do ponteiro durante o arraste, simula um cartão que não é uma chapa rígida.
- `backface-visibility: hidden` nas duas faces resolve sozinho qual delas está de frente pra câmera em qualquer rotação composta — sem bookkeeping manual de "qual lado está visível".
- Uma dica (`DragHint`, "Arraste para virar") aparece ancorada à borda inferior do card até o primeiro gesto real (arraste, clique ou Enter) — depois some para sempre. Em `prefers-reduced-motion` (onde o arraste é desabilitado e a interação vira clique/Enter), o texto muda para "Clique para virar".
- Linha de "scanner" (`cert-scanline`, keyframe CSS) varre o card de cima a baixo a cada 3.4s. Selo do MEC pulsa brilho dourado+verde (`mec-seal-pulse`).
- Cantos de mira (corner brackets) + hash fake + padrão "QR" fixo (matriz hardcoded, não `Math.random()`, para nunca gerar hydration mismatch entre servidor e cliente).

**PlatformCard** (ambiente de código):
- **Parallax em duas camadas com profundidade real:** duas imagens (`interface-devclub.png` de fundo, `playground-devlcub.png` na frente) se movem em proporções diferentes ao mouse — a de trás desloca ±5px, a da frente ±16px (~3× mais) — criando separação de profundidade perceptível.
- `TypewriterCode`: efeito de máquina de escrever real digitando `const dev = new DevClub(); dev.transformCareer();` caractere por caractere (45ms/char) com syntax highlighting manual, cursor piscante, e loop. Em `prefers-reduced-motion`, o texto final é derivado direto na renderização (sem passar por `setState` dentro do efeito) em vez de digitado.
- `.border-beam` (anel cônico girando na borda) ativa só no hover do card inteiro.

### 6.5 DevClubCore — "Conhecimento em Fluxo" (`DevClubCore.tsx`)

Núcleo de partículas em `<canvas>` 2D (`getContext('2d')`) reagindo ao mouse e a cliques — inspirado na análise do site de referência da seção 8, sem nenhuma dependência de WebGL/Three.js. As 18 tecnologias (`stackItems` em `data.ts`) são "nós" de um campo de fluxo orgânico ao redor de um núcleo central.

**Camadas da simulação:**
1. **Campo de fluxo (Fase 1):** cada nó deriva continuamente segundo um campo de ruído procedural (`simplex-noise`), com posição inicial distribuída por ângulo áureo + passo irracional `√2` no raio (duas constantes irracionais diferentes, para nenhum par de nós coincidir em ângulo E raio por acidente aritmético).
2. **Fios de energia (Fase 2):** até 5 "conexões" simultâneas entre o núcleo e nós aleatórios, cada uma com sua própria máquina de fases (`idle → in → hold → out`) e duração aleatória — nunca todas nascendo/morrendo juntas. Um acento roxo raro (`VIOLET_CHANCE`) aparece em no máximo 1 conexão por vez.
3. **Física do mouse (Fase 3):** o cursor não empurra só nós próximos — entra como um termo vetorial na própria função do campo, com influência que decai suavemente com a distância (`exp(-d/raio)`, nunca corte abrupto) e alcança todos os nós. Dois componentes se somam: um redemoinho (perpendicular ao vetor cursor→nó) e um arrasto (a velocidade do cursor "puxa" a corrente). A câmera (`inner.style.transform`) respira continuamente por ruído procedural e ganha um tilt leve que se soma a essa base quando o mouse está sobre a cena.
4. **Máquina de estados de clique (Fase 4):** `idle → hover → pulse → drag → explosion → rebuild → idle`. Clicar no núcleo faz os 18 nós convergirem pro centro (Drag), o núcleo "piscar" e liberar um leque reembaralhado de posições (Explosion/Rebuild — nunca a mesma disposição do clique anterior), revelando as tecnologias de novo. O tempo dessa máquina é avançado manualmente dentro do próprio loop de animação (não pelo ticker do GSAP) — GSAP só fornece as curvas de easing puras (`gsap.parseEase`).
5. **Hero Moment:** ~1.7s depois da seção "acordar" (via `IntersectionObserver`), uma única onda síncrona percorre todas as conexões de uma vez — a única quebra deliberada da regra "nada começa exatamente junto". O mesmo momento se repete no instante exato em que o leque termina de se abrir após um clique, reforçando visualmente que as tecnologias "voltaram".

**Detalhes de robustez:**
- Ao redimensionar a janela, os 18 nós são deslocados pelo mesmo delta que o centro da cena se moveu, para nunca ficarem visivelmente fora do lugar.
- O loop de animação **pausa** quando a seção sai completamente da área visível (o usuário já rolou bem além dela) e **retoma sozinho** ao se aproximar de novo — não gasta quadro de animação em segundo plano à toa.
- `prefers-reduced-motion`: estado final estático direto (núcleo estável, nós já no lugar, um punhado de fios fixos sem pulso viajando), sem nenhum loop de animação.

### 6.6 Jornada DevClub — trilha de circuito impresso (`Jornada.tsx`)

A metáfora é uma trilha de circuito impresso conduzindo energia — escolhida porque a história do fundador é literalmente eletricista → programador, e uma trilha de cobre energizada é a ponte entre esses dois mundos. Cada etapa da formação é um módulo soldado nessa trilha.

**Duas regras de desenho** (para o resultado nunca virar "placa-mãe ilustrada" nem "fluxograma"):
- Uma trilha dominante, com alternância esquerda/direita **uniforme** em todo checkpoint — nenhum é geometricamente especial, só a cor marca o terminus (o diploma, em dourado).
- Transições de pista sempre por um trecho a 45° (chanfrado), nunca por um canto reto de 90°.

**Mecânica:**
1. A trilha existe desde o primeiro frame, apagada (cobre sem energia) — o scroll a energiza progressivamente via `stroke-dashoffset` sobre uma cópia acesa, com uma cabeça viajante (círculo + halo) seguindo a ponta via `getPointAtLength`.
2. Como o Hero pinado acima atrapalha o cálculo de fim de documento do `ScrollTrigger` para triggers posteriores (mesma razão do DevClubCore, seção 6.5), o progresso não vem do ScrollTrigger: é lido via `getBoundingClientRect()` a cada quadro e suavizado por uma **mola criticamente amortecida** (fórmula exata de atualização, não um `lerp`/mola sub-amortecida que ultrapassaria o alvo) antes de mover uma timeline GSAP pausada (`tl.progress(p)`). Essa mola é o que faz o scroll em degraus (comum em mouse/trackpad no Windows) ler como um deslize contínuo em vez de uma sucessão de saltos.
3. **Ícones de tecnologia:** em vez de "voar" de uma palavra na lista, cada ícone nasce de dentro do próprio módulo (pad verde) — um único `fromTo` sai do centro do módulo, pequeno e invisível, e cresce até o tamanho final na posição de repouso, um de cada vez, com um orçamento de scroll fixo por checkpoint (não por ícone), para um checkpoint com 4 tecnologias não demorar proporcionalmente mais que um com 3. Por ser um tween dentro da timeline escrubada, rolar para trás desfaz a mesma interpolação ao contrário — o ícone visivelmente encolhe e é puxado de volta pro módulo, sem lógica extra de reversão.
4. **Terminus (diploma reconhecido pelo MEC):** a energia que percorreu a trilha inteira vira ouro, um brilho radial abre no módulo e o selo do MEC nasce dali.
5. A fonte da trilha e a cabeça viajante respiram continuamente (raio animado via `attr:{r}`, não `scale` — escalar um `<circle>` posicionado por `cx`/`cy` exige acertar `transformOrigin`, uma categoria de bug evitada animando o raio direto).
6. Ao redimensionar a janela, a trilha inteira é recalculada (`buildTrace`) e a timeline é reconstruída — diferente do DevClubCore, aqui o realinhamento é completo, não um deslocamento incremental.
7. O loop de animação **pausa** quando a seção está bem fora da folga do `IntersectionObserver` (margem de 50% da viewport em ambas as direções) e **retoma sozinho** ao se aproximar — mesma otimização do DevClubCore.
8. `prefers-reduced-motion`: trilha inteira já desenhada, textos e ícones já visíveis, sem nenhum scrub.

### 6.7 Mentoria — grid de mentores (`Mentoria.tsx`)

- A mais simples das seções: `<Reveal>` com delay progressivo por card (`index * 0.06`, cascata sutil) + no hover, um glow radial verde atrás do retrato e leve `scale-105` na foto — nada de física custom, só transições CSS.

### 6.8 Depoimentos — modal de vídeo (`Depoimentos.tsx`)

- Cards de thumbnail com botão de play; clique abre um **modal acessível** (`role="dialog"`, `aria-modal`, foco automático no botão fechar, `Escape` fecha, scroll do body travado enquanto aberto) que injeta um `<iframe>` do YouTube com autoplay e `referrerPolicy="strict-origin-when-cross-origin"`.
- O modal **prende o foco do teclado** enquanto aberto (Tab/Shift+Tab circulam só entre os controles do próprio diálogo) e **devolve o foco** ao card que o abriu quando fecha.
- Abaixo do vídeo incorporado, um link "Assistir no YouTube" leva direto ao vídeo real em outra aba — sempre uma saída caso o embed falhe (privacidade do navegador, região, etc.).
- Entrada/saída do modal via `AnimatePresence` do Framer Motion: overlay em fade simples, card do vídeo em fade+scale+translateY.

### 6.9 Faq — accordion com física de mola (`Faq.tsx`)

- Um único objeto de spring (`FAQ_SPRING = {stiffness:300, damping:30}`) é compartilhado entre a rotação do ícone `+` (→45°, virando `×`), a altura do painel (`0 → auto`) e o timing geral — garantindo que ícone e painel **assentem em sincronia**.

### 6.10 Footer — imagem mascarada + CTA final (`Footer.tsx`)

- Foto de fundo dessaturada mascarada com gradiente linear para dissolver sem bordas retas contra as seções vizinhas.
- Um "blush" roxo (`#7C3AED`, `blur-3xl`) centralizado atrás do título — único uso de roxo fora da Hero.
- Indicador "All systems operational" com ping verde (`animate-ping` + `.glass`).

### 6.11 Componentes de UI compartilhados

- **`<Reveal>`** (`src/components/ui/Reveal.tsx`) — wrapper genérico usado em quase toda seção abaixo da Hero: `opacity:0, y:20 → opacity:1, y:0` ao entrar no viewport (`whileInView`, `once: true`). É o "reveal on scroll" padrão do site.
- **`<NeonButton>`** (`src/components/ui/NeonButton.tsx`) — CTA padrão (variantes `solid`/`ghost`), com glow verde e o `.border-beam` opcional girando no hover.

---

## 7. Skills disponíveis neste projeto

### 7.1 `ui-ux-pro-max`

Base de dados local pesquisável (67 estilos, 161 paletas, 57 pares de fonte, 25 tipos de gráfico, 21 stacks) com regras de UX priorizadas (acessibilidade > toque > performance > estilo > layout > tipografia/cor > animação > formulários > navegação > dados). Serve para:
- Gerar um **design system completo** com `--design-system` (paleta, tipografia, efeitos, anti-padrões) a partir de uma query textual do produto.
- Consultar domínios específicos (`--domain style|color|typography|ux|gsap|react`) quando uma decisão pontual precisa de embasamento.
- Existem **dials** (`--variance`, `--motion`, `--density` de 1–10) para calibrar ousadia visual, intensidade de movimento e densidade de layout sem reescrever a query.
- Já reconhece este projeto como Next.js + Tailwind + GSAP + Framer Motion + Lucide.
- Uso típico aqui: antes de redesenhar qualquer seção ou criar um componente novo, rodar `--design-system` com palavras-chave do contexto para validar paleta/tipografia/efeitos contra o que já existe, e usar `--domain gsap` para pegar esqueletos de animação prontos calibrados por intensidade.

### 7.2 `scroll-world`

Skill para construir heros "voo pelo mundo" scroll-scrubbado usando vídeos gerados por IA (Higgsfield): o scroll comanda uma câmera pré-renderada que mergulha de fora para dentro de cada cena, sem cortes, encadeando N cenas via clipes de vídeo com **seams (costuras) idênticas quadro-a-quadro**. É a mesma técnica de base já usada na Hero deste projeto (scroll → `currentTime` de vídeo) — a diferença é que aqui o skill cobre a geração das cenas em si via IA, mais o motor de scrub (`scrub-engine.js`, vanilla JS, framework-agnostic) com hardening completo para mobile.

**Relevância direta para este projeto:** a Hero atual já usa manualmente a técnica central do `scroll-world`. O skill entraria em cena se a DevClub quiser expandir esse conceito para **múltiplas cenas conectadas** (ex: um "mundo" representando a jornada do aluno como cenas 3D geradas por IA, em vez de um único vídeo real), reaproveitando o próprio `lingerEase`/pacing já validado neste código.

---

## 8. Referência de mercado analisada: `mba.devclub.com.br`

O site do **MBA em IA** (produto irmão, parceria DevClub + Faculdade Sirius) foi inspecionado ao vivo para entender uma animação de rede/constelação na Hero (logos de ChatGPT, Claude, Gemini etc. orbitando um núcleo central, reagindo ao cursor).

**Conclusão técnica:** **não é WebGL/Three.js** — é `<canvas>` 2D (`getContext('2d')`) desenhando partículas, "fios" (curvas de Bézier) e brilhos, combinado com **elementos DOM reais** para cada logo (posicionados via `transform` calculado a cada frame) e um **tilt 3D falso** via `rotateX/rotateY` reagindo à posição do mouse. Interatividade do cursor = repulsão simples por distância; um "cursor fantasma" simulado assume a demonstração após inatividade.

**O que foi implementado a partir dessa referência:**
1. ✅ **Núcleo = logo DevClub, órbita = stack ensinada** → construído como `DevClubCore.tsx` ("Conhecimento em Fluxo", seção 6.5), reaproveitando `stackItems` de `data.ts`.
2. ⬜ Núcleo = diploma/"contratado", órbita = empresas contratantes (reaproveitando `companyItems`/`CompanyFlipGrid`) — ideia levantada, não implementada.
3. ⬜ Aplicar a mesma engenharia (canvas + DOM + GSAP timeline) na animação de "cacos da logo" especificada no `CLAUDE.md` deste projeto (fragmentos convergindo dos 4 cantos, dirigidos por scroll). Os assets brutos de uma tentativa anterior desse conceito (recortes da logo, vídeos de referência) foram removidos numa auditoria de limpeza por não terem nenhum uso no código atual — a especificação em `CLAUDE.md` continua de pé, mas exigiria gerar/recortar novos assets se for retomada.

---

## 9. Estado atual

- As 9 seções da página estão implementadas e integradas em `page.tsx` (ver seção 5). Não há seção "em rollout" pendurada no código hoje.
- O projeto passou por uma auditoria completa (arquitetura, segurança, performance/animações, responsividade/acessibilidade, código morto) com correções aplicadas: build/`tsc`/lint limpos, sem assets órfãos, sem componentes não utilizados.
- Decisão em aberto: qual das 2 ideias restantes da seção 8 (ou uma variação) implementar como próxima animação 3D interativa — usando `ui-ux-pro-max` para validar a direção visual e, se a ambição crescer para múltiplas cenas cinematográficas, avaliar `scroll-world`.
