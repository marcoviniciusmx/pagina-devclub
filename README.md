<h1 align="center">DevClub — Landing Page</h1>

<p align="center">
  Landing page institucional da DevClub, a maior escola de programação e IA do Brasil. Conta a jornada do fundador (de eletricista a desenvolvedor contratado) através de uma experiência de scroll cinematográfica, e apresenta a formação, a mentoria 360° e a prova social da escola até a conversão final.
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre o projeto</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-ias-utilizadas">IAs utilizadas</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-como-executar">Como executar</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-decisões-técnicas">Decisões técnicas</a>
</p>

<br>

<p align="center">
  <img alt="DevClub — Hero da landing page" src="docs/preview.png" width="100%">
</p>

---

## 🏠 Sobre o projeto

A landing page da **DevClub** abre com uma seção Hero em vídeo
cinematográfico: o scroll do usuário controla diretamente a
reprodução de um filme narrado em 4 atos — do eletricista sem
perspectiva ao embaixador da OpenAI no Brasil — sem nenhum autoplay,
100% reversível para frente e para trás. Depois dela, duas outras
seções mantêm o mesmo nível de ambição: um núcleo de partículas em
canvas reagindo ao mouse e a cliques ("Conhecimento em Fluxo") e uma
trilha de circuito impresso que se energiza conforme o aluno "percorre"
a jornada de formação (`DevClubCore.tsx` e `Jornada.tsx`).

O foco do projeto foi tratar motion design como parte do produto, não
como decoração: toda a coreografia de scroll é uma função direta da
posição real do usuário na página — nunca avança sozinha — e tudo
respeita `prefers-reduced-motion`, pulando para o estado final estático
quando o usuário pede menos movimento (inclusive nas animações menores
do Framer Motion, via `MotionConfig` global).

---

## 🧰 Funcionalidades

**Hero cinematográfico**
- Vídeo scroll-scrubbed em 4 atos (eletricista → contratado pelo
  Santander → embaixador da OpenAI → fundação do DevClub), com pin de
  seção e crossfades de texto sincronizados ao vídeo
- Easing customizado (`lingerEase`) que faz o vídeo "respirar" no meio
  de cada ato e acelerar nas transições, em vez de um mapeamento
  linear scroll → frame
- 100% reversível e sem autoplay: a animação é uma função direta da
  posição de scroll, com fallback seguro para `prefers-reduced-motion`

**Conhecimento em Fluxo e Jornada DevClub**
- Núcleo de partículas em `<canvas>` 2D com campo de ruído procedural,
  física de mouse (redemoinho + arrasto) e uma máquina de estados de
  clique completa (hover → pulse → drag → explosão → reconstrução)
- Trilha de circuito impresso desenhada via `stroke-dashoffset`,
  energizada progressivamente pelo scroll com uma mola criticamente
  amortecida (não um `lerp` simples) para uma sensação contínua mesmo
  com scroll em degraus (roda de mouse/trackpad)

**Restante da página**
- Marquee duplo (stack de tecnologias e empresas que contrataram
  alunos) com desaceleração suave no hover
- BentoGrid com diploma reconhecido pelo MEC (cartão 3D que o usuário
  arrasta para virar, física de rotação 1:1 com o ponteiro) e preview
  da plataforma de prática de código
- Ecossistema de mentoria 360° e prova social em cards de depoimento
  em vídeo
- FAQ em acordeão com física de mola (spring) no lugar de transições
  secas de altura fixa

**Geral**
- Totalmente responsivo (mobile, tablet, desktop e ultra-wide)
- Sem chaves, tokens ou credenciais no código - página 100% estática
- Auditoria de deploy: sem assets órfãos, sem código morto, lint e
  build de produção limpos

---

## 💻 Tecnologias

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **GSAP** + **ScrollTrigger** - coreografia de scroll do Hero, timelines
  escrubadas manualmente no Conhecimento em Fluxo e na Jornada
- **Framer Motion** - drag físico do certificado, acordeões (FAQ),
  reveals de entrada e o modal de depoimento
- **ESLint** (`eslint-config-next`, com `react-hooks` em modo estrito)

---

## 🤖 IAs utilizadas

- **Claude Code**: usado como par de desenvolvimento durante todo o
  projeto. Além da coreografia de scroll do Hero em GSAP/ScrollTrigger
  (timeline cinematográfica, sincronismo entre `scrub` e o pino da
  seção, a race condition entre o portal da logo do header e a medição
  de posição), conduziu a construção do núcleo de partículas do
  "Conhecimento em Fluxo" (simulação em canvas, máquina de estados de
  clique) e da trilha "Jornada DevClub" (mola criticamente amortecida
  para suavizar o scroll, revelação sincronizada de ícones), uma
  varredura completa de responsividade em todas as seções, e uma
  auditoria final de pré-deploy (segurança, arquitetura, performance,
  acessibilidade, assets órfãos e código morto) com triple-check de
  `tsc`/lint/build e validação visual das telas via Chrome headless.
  Todo o código gerado foi revisado e testado manualmente antes de
  aceito.
- **Gemini**: usado como apoio durante todo o processo para discutir
  ideias, tirar dúvidas e validar decisões antes de implementá-las.

---

## 👷 Estrutura do projeto

```
src/
  app/
    layout.tsx       # fontes, metadata, shell HTML e MotionConfig global
    page.tsx          # composição das seções da landing page
    globals.css       # tokens de cor/tema e estilos globais
  components/
    sections/         # Hero, Marquee, CompanyFlipGrid, BentoGrid,
                       # DevClubCore, Jornada, Mentoria, Depoimentos,
                       # Faq, Footer
    ui/                # NeonButton, Reveal (componentes reutilizáveis)
  lib/
    data.ts            # conteúdo estático (stack, empresas, jornada, FAQ)
    gsap.ts            # setup/registro de plugins do GSAP + helper de
                       # prefers-reduced-motion
    utils.ts           # helpers (ex: cn/merge de classes)
public/
  assets/              # imagens e ícones usados pelas seções
  videos/              # vídeo de fundo do Hero
```

---

## 🔰 Como executar

### Pré-requisitos
- Node.js

### Clonar o repositório
```bash
git clone https://github.com/marcoviniciusmx/pagina-devclub.git
cd pagina-devclub
```

### Instalar e rodar
```bash
npm install
npm run dev
```
Aplicação disponível em `http://localhost:3000`.

### Build de produção
```bash
npm run build
npm run start
```

---

## 🏗️ Decisões técnicas

- **Pin de seção com scrub suavizado, não animação por tempo fixo**:
  o Hero usa `ScrollTrigger` com `pin: true` — a timeline é uma função
  direta da posição de scroll (nunca avança sozinha), com um `scrub`
  ajustado para dar peso cinematográfico sem abrir mão do controle
  manual do usuário em ambas as direções.
- **Logo do header portalizada para `<body>`**: a marca fixa do
  header precisa ficar em `position: fixed` de verdade — dentro da
  seção pinada, um `transform` aplicado pelo próprio `ScrollTrigger`
  transformaria esse `fixed` em relativo ao ancestral, quebrando o
  posicionamento. Portalizar para `document.body` resolve isso sem
  gambiarra de z-index.
- **Conhecimento em Fluxo e Jornada não usam `ScrollTrigger`**: com o
  Hero pinado logo acima, o cálculo interno do GSAP para "onde termina
  o documento" fica adiantado para qualquer trigger posterior. As duas
  seções leem a posição real via `getBoundingClientRect()` a cada
  quadro (`requestAnimationFrame`) e suavizam esse valor com uma mola
  criticamente amortecida antes de aplicá-lo a uma timeline pausada
  (`tl.progress(p)`) — mesmo resultado visual, sem depender do cálculo
  de fim de página do ScrollTrigger.
- **`prefers-reduced-motion` como estado de primeira classe**: quando
  ativo, cada seção animada pula direto para o estado final — não é só
  desligar easing, é um caminho de renderização alternativo. Um
  `MotionConfig reducedMotion="user"` global garante que até as
  animações menores do Framer Motion (fades de entrada, acordeões,
  modal de depoimento) respeitem essa preferência automaticamente.
- **Conteúdo centralizado em `lib/data.ts`**: stack de tecnologias,
  empresas parceiras, jornada de formação, mentores e FAQ vivem como
  dados estruturados em um único arquivo, não espalhados pelo JSX de
  cada seção — trocar um texto ou reordenar um item não exige tocar
  em lógica de componente.
