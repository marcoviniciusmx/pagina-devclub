# DESC.md — Landing Page DevClub

Documento técnico de referência deste projeto: o que é, para que serve, como foi construído, cada animação/interação explicada em detalhe, o design system e as skills disponíveis para evoluí-lo. Mantenha este arquivo atualizado conforme o projeto muda — ele existe para dar contexto completo antes de qualquer nova decisão de design.

---

## 1. O que é este projeto

É a **landing page principal da DevClub**, construída em **Next.js 16 (App Router) + React 19 + TypeScript**, com **Tailwind CSS v4** para estilo e **GSAP + Framer Motion** para animação. Tecnicamente é o pacote `nextjs-scaffold` (nome interno em `package.json`), uma SPA de página única (`/`) composta por seções empilhadas verticalmente, sem roteamento adicional.

**Para que serve:** converter visitantes em candidatos à formação DevClub. A página conta a história do fundador (Rodolfo Mori), demonstra prova social (empresas contratantes, depoimentos, mentores), detalha a grade curricular e termina em CTAs recorrentes ("Quero ser aluno" / "Quero me tornar um Desenvolvedor") que levam para `https://www.devclub.com.br/` e para a área do aluno (`https://aulas.devclub.com.br/`).

Não há backend próprio nesta página — é um site de marketing/conversão estático (client components + assets locais), sem formulário embutido nem chamadas a API.

---

## 2. O que é a DevClub (a marca)

De acordo com o conteúdo real do site (`src/lib/data.ts`, `layout.tsx`):

> "A maior escola de programação e IA do Brasil" — formação com **mentoria 360°**, **diploma/certificação reconhecidos**, e uma comunidade de alunos contratados por empresas como **iFood, Itaú, Nubank, VTEX, Santander, Mercado Livre, Ambev**, entre outras.

- **Fundador:** Rodolfo Mori — ex-eletricista que aprendeu a programar do zero, foi contratado pelo Santander, e hoje é **Embaixador oficial da OpenAI no Brasil**. Essa é literalmente a narrativa em 4 atos do vídeo da Hero (seção 6.1).
- **Formações oferecidas** (`gradeAreas` em `data.ts`):
  1. **FullStack Pro** — HTML, CSS, JavaScript, React.js, Node.js, React Native, TypeScript.
  2. **FrontEnd Club** — HTML, CSS, JavaScript, React.js.
  3. **IA Club** — Engenharia de Prompt, Machine Learning, Deep Learning, n8n, Prospecção de Clientes.
  4. **Mil Reais em 7 Dias** — criação de sites + prospecção de clientes + vendas (formação de monetização rápida).
- **Mentoria 360°** (`mentors` em `data.ts`): 5 mentores reais cobrindo frentes diferentes — mentoria estratégica (Rodolfo), code review técnico (Andrey), preparação de recrutamento/LinkedIn (Fernanda e Juliana), e suporte emocional/mindset (Márcio). Ou seja, a mentoria não é só técnica — é holística (carreira + psicológico).
- **Prova de reconhecimento oficial:** MBA e Pós-Graduação em Tecnologia reconhecidos pelo **MEC** (ver `MecCard` na seção BentoGrid).

> **Nota de contexto:** existe um produto irmão, o **MBA em IA** (`mba.devclub.com.br`), fruto de uma parceria DevClub + Faculdade Sirius, com um site próprio e diferente desta landing page. Foi analisado nesta conversa como *referência de mercado* para uma animação 3D interativa (rede neural com IAs orbitando um núcleo) — ver seção 8. Ele **não faz parte deste repositório**, mas serviu de inspiração técnica.

---

## 3. Stack técnico

Do `package.json` real do projeto:

| Categoria | Biblioteca | Versão | Papel |
|---|---|---|---|
| Framework | `next` | 16.2.11 | App Router, Server/Client Components, `next/image`, `next/font` |
| UI | `react` / `react-dom` | 19.2.4 | Componentização |
| Linguagem | `typescript` | ^5 | Tipagem estática |
| Estilo | `tailwindcss` (+ `@tailwindcss/postcss`) | ^4 | Utility classes, tokens via `@theme inline` |
| Animação (scroll/timeline) | `gsap` + `@gsap/react` (`useGSAP`) | ^3.15 / ^2.1 | ScrollTrigger, Timelines, Flip |
| Animação (spring/UI) | `framer-motion` | ^12.42 | `motion.div`, `AnimatePresence`, `useSpring`, `useTransform` |
| Ícones | `lucide-react` | ^1.25 | Ícones SVG (Play, Plus, X, ChevronsRight, User) |
| Utilitário CSS | `clsx` + `tailwind-merge` (via `cn()` em `src/lib/utils.ts`) | — | Composição condicional de classes |
| Fontes | `next/font/google`: **Space Grotesk** (headings) + **DM Sans** (corpo) | — | Carregadas via `layout.tsx`, expostas como `--font-heading` / `--font-body` |

**Importante:** **não há Three.js, WebGL, D3 ou qualquer engine 3D real no projeto.** Toda sensação de profundidade/3D hoje vem de: `perspective` + `rotateX/rotateY` via CSS/Framer Motion (parallax de mouse) e timelines GSAP com easings cinematográficos — a mesma técnica "3D falso" identificada na análise do site de referência (seção 8).

`src/lib/gsap.ts` é o ponto único de import do GSAP: registra `ScrollTrigger`, `Flip` e `useGSAP` uma única vez (`typeof window !== "undefined"` guard, necessário porque GSAP toca o DOM e este é um projeto SSR/Next).

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
| `--color-muted-foreground` | `#9a9a9a` | Texto secundário (7:1 de contraste — AA/AAA compliant) |
| `--color-subtle` | `#666666` | Só para texto grande/decorativo — **não** passa em AA para corpo de texto (comentário explícito no CSS) |
| **`--color-accent`** | **`#39d572`** (também grafado `#39D372`/`#39D353` em componentes) | **Verde neon, a cor de marca da DevClub.** Usado em CTAs, glows, bordas ativas, ícones em destaque |
| `--color-accent-foreground` | `#0a0a0a` | Texto sobre fundo accent (botões sólidos) |
| `--color-accent-glow` | `rgba(57,213,114,0.4)` | Base de todos os `box-shadow`/`blur` de glow verde |

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
- `.mask-fade-x` — máscara de gradiente nas bordas esquerda/direita, usada no Marquee para o efeito de itens "surgindo do nada" nas pontas.
- `.border-beam` — anel cônico giratório (conic-gradient + mask composite `exclude`) que percorre a borda de um card no hover; girado via `transform: rotate()` (não via ângulo do próprio gradiente, evitando precisar registrar `@property`). Usado no `NeonButton` e no `PlatformCard`.

### 4.4 Acessibilidade de movimento

`@media (prefers-reduced-motion: reduce)` zera **globalmente** todas as `animation-duration`/`transition-duration` para `0.01ms` e força `iteration-count: 1`. Além disso, cada componente com JS-driven animation (Hero, Marquee, CompanyFlipGrid) verifica `matchMedia("(prefers-reduced-motion: reduce)")` manualmente antes de montar qualquer timeline GSAP, e Framer Motion usa `useReducedMotion()` nos hooks de tilt/parallax. Isso é tratado como requisito de primeira classe, não como afterthought.

---

## 5. Estrutura de seções (ordem real em `src/app/page.tsx`)

```
<Hero />        → vídeo cinematográfico scroll-scrubbed, 4 atos narrativos
<Marquee />     → stack tecnológica (loop infinito) + empresas (flip grid 3D)
<BentoGrid />   → MEC/diploma (tilt 3D) + plataforma de código (parallax em camadas)
<Formacao />    → grade curricular em accordion com spotlight de cursor
<Mentoria />    → grid de 5 mentores com reveal on-scroll
<Depoimentos /> → 3 cards de vídeo (abre modal com YouTube embed)
<Faq />         → accordion de perguntas frequentes (spring physics)
<Footer />      → CTA final + links institucionais
```

Cada seção (exceto Hero e Marquee) usa o componente compartilhado `<Reveal>` para entrar suavemente conforme o scroll chega nela.

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
3. O vídeo de fundo (`/videos/hero-devclub-fast.mp4`) é **mudo, sem loop e sem autoplay** — seu `currentTime` é animado de `0` até `video.duration` por essa mesma timeline (`tl.to(video, { currentTime: ... })`), então rolar a página literalmente "escrubbing" o filme like uma timeline de editor de vídeo.
4. **`lingerEase`** — uma função de easing customizada (não é um easing built-in do GSAP) que faz cada ato **"respirar"**: o vídeo desacelera perto do meio de cada ato (enquanto o texto daquele ato está totalmente visível e legível) e acelera perto da transição para o próximo. Matematicamente é uma mistura entre mapeamento linear e uma cúbica com derivada zero no ponto médio (`x=0.5`), preservando os extremos (`f(0)=0`, `f(1)=1`) para que os "seams" entre atos nunca percam sincronia entre vídeo e texto.
5. Cada bloco de texto (`ACTS[i]`) entra com `fromTo(autoAlpha:0→1, y:24→0, power3.out)` e sai com `to(autoAlpha→0, y:-24, power2.inOut)`, sempre **encostando exatamente** no limite do próximo ato (sem gap nem overlap — testado e documentado no código como solução para dois bugs anteriores: texto duplicado sobreposto e frame em branco).
6. O retrato final de Rodolfo (`rodolfoFinalRef`) só aparece em `t=8.2` (dentro do Ato 4, depois do título já ter assentado) — um "payoff" deliberado, não simultâneo ao texto.
7. **Reversível:** como tudo pertence à mesma timeline pinada, rolar para cima desfaz a animação na ordem exata inversa — não há lógica separada para isso.
8. **Cuidados técnicos documentados no próprio código:**
   - O vídeo é reencodado com **todo frame como keyframe** (`-g 1 -keyint_min 1`) — sem isso, "seekar" `currentTime` obrigaria o decoder a andar da keyframe anterior a cada frame, travando em scroll rápido.
   - A timeline só é construída após `loadedmetadata` do vídeo (precisa de `video.duration`), nunca antes.
   - `prefers-reduced-motion` pula toda a animação: mostra direto o último frame do vídeo e o Ato 4.
   - O header (logo + nav) é renderizado via **`createPortal` para `document.body`**, fora da seção pinada — necessário porque ScrollTrigger aplica `transform` no elemento pinado, e isso quebra `position: fixed` em descendentes (vira relativo ao container transformado). O portal usa `useSyncExternalStore` para decidir quando montar, evitando hydration mismatch (SSR não tem `document`).

### 6.2 Marquee — stack de tecnologias em loop infinito (`Marquee.tsx`)

- Duas cópias idênticas da lista de itens são concatenadas (`[...items, ...items]`); a track é animada com `xPercent: 0 → -50` em loop infinito (`repeat: -1`, `ease: "none"`) — como a segunda metade é pixel-idêntica à primeira, o loop nunca mostra "costura".
- Velocidade constante em **px/segundo** (não em duração fixa) — a duração do tween é calculada a partir da largura real da track (`scrollWidth / 2 / 55px/s`), então o ritmo visual é o mesmo não importa quantos itens existam.
- **Freio inercial no hover:** ao invés de pausar/tocar abruptamente, o `mouseenter` anima um proxy numérico (`speed.value: 1 → 0.25`) ao longo de 0.8s com `power2.out`, aplicando esse valor ao `timeScale()` do tween a cada frame — a marquee desacelera suavemente como se tivesse atrito, e acelera de volta do mesmo jeito no `mouseleave`.
- Cada logo individual vai de `opacity-35 grayscale` para `opacity-100` colorido + leve `scale-110` + glow verde no hover (`group-hover`).

### 6.3 CompanyFlipGrid — logos de empresas em flip 3D (`CompanyFlipGrid.tsx`)

- Cada célula do grid é um "cubo" 2D com `perspective: 800px` que gira `rotateX` de forma independente e assíncrona (delay inicial aleatório entre 0–6s), simulando um placar de aeroporto ("keepy-uppy").
- O truque central: **a logo só é trocada exatamente no meio do giro (`rotateX: ±90deg`)**, ponto em que o card está de perfil e portanto **invisível** — a troca de conteúdo nunca é vista, só o "tombo".
- Sequência por ciclo: `rotateX 0→-90 (power1.in)` → troca o `activeIndex` + dispara um flash de glow (`opacity 0→1→0` via `yoyo`) → salta instantaneamente para `+90` (mesma silhueta de perfil, então o salto não é percebido) → `rotateX 90→0 (power1.out)` → espera um tempo aleatório (2.5–6s) → repete.
- Distribui os itens reais (iFood, Itaú, Nubank, VTEX, USP, Santander, Mercado Livre, Ambev, OAB) e um conjunto de nomes fictícios (`showcaseFillerItems`, adicionado só por densidade visual, isolado propositalmente da lista real de contratantes) round-robin entre as células do grid.

### 6.4 BentoGrid — dois cards com efeitos 3D distintos (`BentoGrid.tsx`)

**MecCard** (diploma/certificação MEC):
- Tilt 3D reativo ao mouse via Framer Motion: `useMotionValue` bruto → `useSpring({stiffness:180, damping:22})` → aplicado a `rotateX`/`rotateY` do cartão do diploma. A spring física (não um tween linear) faz o card responder continuamente a movimentos do mouse em vez de só tocar uma animação one-shot.
- Linha de "scanner" (`cert-scanline`, keyframe CSS) varre o card de cima a baixo a cada 3.4s.
- Selo do MEC pulsa brilho dourado+verde (`mec-seal-pulse` keyframe, `drop-shadow` duplo).
- Cantos de mira (corner brackets) + hash fake + padrão "QR" fixo (matriz hardcoded, não `Math.random()`, para nunca gerar hydration mismatch entre servidor e cliente).

**PlatformCard** (ambiente de código):
- **Parallax em duas camadas com profundidade real:** duas imagens (`interface-devclub.png` de fundo, `playground-devlcub.png` na frente) se movem em proporções diferentes ao mouse — a de trás desloca ±5px, a da frente ±16px (~3× mais) — criando separação de profundidade perceptível ao invés de as duas imagens deslizarem juntas como um plano só.
- `TypewriterCode`: efeito de máquina de escrever real (não CSS puro) digitando `const dev = new DevClub(); dev.transformCareer();` caractere por caractere (45ms/char) com syntax highlighting manual (`highlightCode` — keywords em roxo, identificadores em azul, `DevClub` em verde-accent), cursor piscante, e loop (apaga e recomeça após 2.2s de pausa).
- `.border-beam` (anel cônico girando na borda) ativa só no hover do card inteiro.

### 6.5 Formação — grade curricular em accordion com spotlight (`Formacao.tsx`)

- 4 cards (FullStack Pro, FrontEnd Club, IA Club, Mil Reais em 7 Dias); um fica sempre "ativo" (expandido), controlado por `activeIndex` (clique ou hover trocam o ativo).
- **Spotlight que segue o cursor:** em vez de guardar a posição do mouse em `useState` (o que forçaria um re-render do React a cada pixel de movimento), a posição é escrita **direto no DOM** (`spotlight.style.background = radial-gradient(...)`) via ref — o brilho acompanha o cursor na velocidade nativa do ponteiro, sem gargalo de re-render.
- Expansão do card usa uma curva de easing customizada, `cubic-bezier(0.25, 1, 0.5, 1)` — "entra rápido, assenta devagar" (mais orgânica que um `ease-out` padrão do Tailwind).
- Um glow verde (`motion.span` com `layoutId="grade-glow"`) usa o sistema de **Layout Animation** do Framer Motion: ao trocar de card ativo, o glow **anima sua própria posição** de um card para o outro (spring physics) ao invés de sumir e reaparecer — dá sensação de "um único brilho que se move", não vários brilhos piscando.
- Tags de tecnologia dentro do card expandido entram em **stagger** (cada uma 0.1s depois da anterior).

### 6.6 Mentoria — grid de mentores (`Mentoria.tsx`)

- O mais simples das seções: `<Reveal>` com delay progressivo por card (`index * 0.06`, cascata sutil) + no hover, um glow radial verde atrás do retrato (opacity 0→30%) e leve `scale-105` na foto — nada de física custom, só transições CSS.

### 6.7 Depoimentos — modal de vídeo (`Depoimentos.tsx`)

- Cards de thumbnail com botão de play; clique abre um **modal acessível** (`role="dialog"`, `aria-modal`, foco automático no botão fechar, `Escape` fecha, scroll do body travado enquanto aberto) que injeta um `<iframe>` do YouTube com autoplay.
- Entrada/saída do modal via `AnimatePresence` do Framer Motion: overlay em fade simples, card do vídeo em fade+scale+translateY (`0.9 → 1`, `12px → 0`).

### 6.8 Faq — accordion com física de mola (`Faq.tsx`)

- Um único objeto de spring (`FAQ_SPRING = {stiffness:300, damping:30}`) é compartilhado entre a rotação do ícone `+` (→45°, virando `×`), a altura do painel (`0 → auto`) e (implicitamente) o timing geral — garantindo que ícone e painel **assentem em sincronia**, não em curvas de tempo ligeiramente diferentes.

### 6.9 Footer — imagem mascarada + CTA final (`Footer.tsx`)

- Foto de fundo dessaturada (`grayscale contrast-125 brightness-90`) mascarada com gradiente linear (`mask-image: transparent → black → black → transparent`) para dissolver sem bordas retas contra as seções vizinhas.
- Um "blush" roxo (`#7C3AED`, `blur-3xl`) centralizado atrás do título — único uso de roxo fora da Hero, sempre como acento pontual, nunca dominante.
- Indicador "All systems operational" com ping verde (`animate-ping` + `.glass`).

### 6.10 Componentes de UI compartilhados

- **`<Reveal>`** (`src/components/ui/Reveal.tsx`) — wrapper genérico usado em quase toda seção abaixo da Hero: `opacity:0, y:20 → opacity:1, y:0` ao entrar no viewport (`whileInView`, `once: true`, margem antecipada de `-80px`). É o "reveal on scroll" padrão do site.
- **`<NeonButton>`** (`src/components/ui/NeonButton.tsx`) — CTA padrão (variantes `solid`/`ghost`), com glow verde e o `.border-beam` opcional girando no hover.

---

## 7. Skills disponíveis neste projeto

### 7.1 `ui-ux-pro-max`

Base de dados local pesquisável (67 estilos, 161 paletas, 57 pares de fonte, 25 tipos de gráfico, 21 stacks) com regras de UX priorizadas (acessibilidade > toque > performance > estilo > layout > tipografia/cor > animação > formulários > navegação > dados). Serve para:
- Gerar um **design system completo** com `--design-system` (paleta, tipografia, efeitos, anti-padrões) a partir de uma query textual do produto.
- Consultar domínios específicos (`--domain style|color|typography|ux|gsap|react`) quando uma decisão pontual precisa de embasamento.
- Existem **dials** (`--variance`, `--motion`, `--density` de 1–10) para calibrar ousadia visual, intensidade de movimento e densidade de layout sem reescrever a query.
- Já reconhece este projeto como Next.js + Tailwind + GSAP + Framer Motion + Lucide (está documentado no próprio skill como stack de referência).
- Uso típico aqui: antes de redesenhar qualquer seção ou criar um componente novo, rodar `--design-system` com palavras-chave do contexto (ex: `"bootcamp programação IA dark neon"`) para validar paleta/tipografia/efeitos contra o que já existe, e usar `--domain gsap` para pegar esqueletos de animação prontos calibrados por intensidade.

### 7.2 `scroll-world`

Skill para construir heros "voo pelo mundo" scroll-scrubbado usando vídeos gerados por IA (Higgsfield): o scroll comanda uma câmera pré-renderada que mergulha de fora para dentro de cada cena, sem cortes, encadeando N cenas via clipes de vídeo com **seams (costuras) idênticas quadro-a-quadro**. É literalmente a mesma técnica de base já usada na Hero deste projeto (scroll → `currentTime` de vídeo) — a diferença é que aqui o skill cobre a geração das cenas em si (dioramas 3D isométricos ou qualquer direção de arte) via IA, mais o motor de scrub (`scrub-engine.js`, vanilla JS, framework-agnostic) com hardening completo para mobile (blob URLs para seekability, seek-coalescing, priming de iOS, safe-area).

**Relevância direta para este projeto:** a Hero atual já usa manualmente a técnica central do `scroll-world` (vídeo único, scroll drive `currentTime`, `lingerEase` próprio). O skill entraria em cena se a DevClub quiser expandir esse conceito para **múltiplas cenas conectadas** (ex: um "mundo" representando a jornada do aluno — eletricista → primeira linha de código → contratação → comunidade — como cenas 3D geradas por IA ao invés de um único vídeo real), reaproveitando o próprio `lingerEase`/pacing já validado neste código.

---

## 8. Referência de mercado analisada: `mba.devclub.com.br`

Durante a fase de pesquisa deste redesign, o site do **MBA em IA** (produto irmão, parceria DevClub + Faculdade Sirius) foi inspecionado ao vivo para entender uma animação de rede/constelação na Hero (logos de ChatGPT, Claude, Gemini etc. orbitando um núcleo central, reagindo ao cursor).

**Conclusão técnica (via DevTools/Playwright):** **não é WebGL/Three.js** — é `<canvas>` 2D (`getContext('2d')`) desenhando só partículas, "fios" (curvas de Bézier) e brilhos, combinado com **elementos DOM reais** para cada logo (posicionados via `transform` calculado a cada frame) e um **tilt 3D falso** via `rotateX/rotateY` em CSS reagindo à posição do mouse. Interatividade do cursor = repulsão simples por distância (`d < 150px`); um "cursor fantasma" simulado assume a demonstração após 25s de inatividade. Toda a coreografia de entrada usa GSAP timelines com easing `power3.out` — o mesmo padrão já exigido neste projeto (`CLAUDE.md`).

**Por que isso importa para este repositório:** a técnica é 100% replicável com o stack já instalado aqui (Canvas 2D + GSAP + React), sem adicionar Three.js. Três ideias de aplicação foram levantadas nessa conversa (ainda não implementadas):
1. Núcleo = logo DevClub, órbita = stack ensinada (reaproveitando `stackItems` de `data.ts`).
2. Núcleo = diploma/"contratado", órbita = empresas contratantes (reaproveitando `companyItems`/`CompanyFlipGrid`).
3. Aplicar a mesma engenharia (canvas + DOM + GSAP timeline) na animação de "cacos da logo" já especificada no `CLAUDE.md` deste projeto (fragmentos convergindo dos 4 cantos, dirigidos por `ScrollTrigger` com `scrub` em vez de autoplay por tempo).

Nenhuma dessas ideias foi implementada ainda — decisão em aberto (ver seção 9).

---

## 9. Estado atual / em aberto

- Working tree no momento deste documento tem mudanças não commitadas em: `Hero.tsx`, `Marquee.tsx`, `data.ts`, `gsap.ts`, `eslint.config.mjs`, `package.json`, assets da Hero — e um componente novo ainda não integrado ao `page.tsx`: `CompanyFlipGrid.tsx` (na verdade já está integrado, importado dentro de `Marquee.tsx`).
- Decisão pendente do usuário: qual das 3 ideias da seção 8 (ou uma variação) implementar como próxima animação 3D interativa — usando `ui-ux-pro-max` para validar a direção visual e, se a ambição crescer para múltiplas cenas cinematográficas, avaliar `scroll-world`.
