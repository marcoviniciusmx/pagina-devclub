"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { stackItems } from "@/lib/data";

// Fases 1-4 do plano "DevClub Core": núcleo + campo de fluxo + nós (Fase 1),
// fios de energia + pulsos + o Hero Moment (Fase 2), física do mouse como
// perturbação de campo inteiro + câmera (Fase 3), e a máquina de estados de
// clique no núcleo (Fase 4): Idle -> Hover -> Pulse -> Drag -> Explosion ->
// Rebuild -> Idle.

// Espaço/tempo do campo de ruído -- controlam o "tamanho" das correntes
// (FIELD_SCALE menor = redemoinhos maiores) e a velocidade com que o campo
// em si se reconfigura (TIME_SCALE). Duas amostras do mesmo noise3D em
// coordenadas fixas distintas alimentam a respiração do núcleo (canal de
// intensidade e canal de deformação) -- nunca o mesmo pulso duas vezes,
// em vez de uma senoide de amplitude fixa.
const FIELD_SCALE = 0.0026;
const TIME_SCALE = 0.00013;
const CORE_INTENSITY_FREQ = 0.00015;
const CORE_DEFORM_FREQ = 0.00021;

// Velocidade ambiente dos nós dentro do campo de fluxo -- o regime "vivo"
// sem NENHUMA interação do mouse. Um valor quase estático fazia a cena
// parecer "parada" quando ninguém tocava o mouse; este é moderado o
// bastante pra as tecnologias visivelmente atravessarem a área em todas as
// direções (de um lado pro outro, de cima pra baixo, na diagonal) sem virar
// um bando de partículas erráticas. Só afeta o deslocamento de base -- o
// swirl/arrasto do mouse (Fase 3, abaixo) continua somando em cima disso,
// sem alteração.
const NODE_DRIFT_SPEED_MIN = 0.34;
const NODE_DRIFT_SPEED_MAX = 0.58;
const BOUNDARY_CONTAINMENT = 0.045;

// No máximo 5 dos 18 nós recebem um fio visível ao mesmo tempo -- uma
// "conexão" (slot) nasce, segura, e morre, então escolhe outro nó (nunca
// o mesmo de antes, e nunca um que já esteja ocupado por outro slot). O
// violeta -- o acento raro da paleta -- aparece em no máximo 1 slot por vez.
const MAX_ACTIVE_LINES = 5;
const VIOLET_CHANCE = 0.15;
const HERO_MOMENT_DELAY = 1700;
const HERO_MOMENT_DURATION = 1100;

// Fase 3 -- o mouse não empurra só quem está perto (raio fixo de 150px,
// técnica do site de referência). A posição do cursor entra como um termo
// vetorial a mais dentro da própria função do campo -- influência decai
// suavemente com a distância (exp(-d/raio), nunca corte abrupto em zero) e
// alcança TODOS os nós, não só os vizinhos. Dois componentes se somam: um
// redemoinho (perpendicular ao vetor cursor->nó, mexe a correnteza ao redor
// do cursor mesmo parado) e um arrasto (a velocidade do próprio cursor
// "puxa" a corrente na direção do movimento -- "colocar a mão num rio muda
// a correnteza inteira", não só a água ao redor da mão).
const MOUSE_RADIUS_FACTOR = 0.65;
const SWIRL_STRENGTH = 0.018;
const DRAG_STRENGTH = 0.4;
const MOUSE_VELOCITY_EASE = 0.2;

// Câmera: respiração contínua e quase imperceptível mesmo sem interação
// (amplitude em torno de 1%, amostrada do mesmo ruído procedural -- nunca
// o mesmo ciclo duas vezes) + um tilt leve que se SOMA a essa base quando
// o mouse está sobre a cena, nunca a substitui.
const BREATHE_AMPLITUDE = 0.006;
const BREATHE_FREQ = 0.00009;
const TILT_MAX_DEG = 4.5;
const TILT_EASE = 0.06;

// Fase 4 -- a máquina de estados do clique no núcleo. Cada transição
// responde a uma pergunta ("Toda animação responde uma pergunta"): Hover
// convida ("dá pra clicar aqui"); Pulse é o núcleo prendendo a respiração;
// Drag é a energia sendo absorvida (os 18 nós são puxados pra dentro, todos
// se agrupando no centro); Explosion+Rebuild são um único movimento
// contínuo de "abrir o leque" -- os nós saem do centro e se espalham de
// novo, uns pra cima, outros pra baixo, em posições reembaralhadas a cada
// clique, até revelar as 18 tecnologias de novo. O tempo dessa máquina é
// avançado manualmente dentro do próprio `tick` (igual ao `stepSlot` dos
// fios de energia) em vez de depender do ticker do GSAP -- GSAP ainda
// fornece as curvas de easing (`gsap.parseEase`, funções puras, sem
// ticker), só não controla o relógio da sequência.
const HOVER_RADIUS_FACTOR = 3.4; // múltiplo de coreR
const PULSE_DURATION = 0.55;
const DRAG_DURATION = 0.7;
const EXPLOSION_DURATION = 0.5;
const REBUILD_DURATION = 1.1;
const FAN_DURATION = EXPLOSION_DURATION + REBUILD_DURATION;

const easeChargeInOut = gsap.parseEase("power2.inOut");
const easeDragInOut = gsap.parseEase("power2.inOut");
const easeFlashOut = gsap.parseEase("power2.out");
const easeFanOut = gsap.parseEase("power3.out");

type CoreState =
  | "idle"
  | "hover"
  | "pulse"
  | "drag"
  | "explosion"
  | "rebuild";

type FlowNode = {
  el: HTMLDivElement;
  x: number;
  y: number;
  seedX: number;
  seedY: number;
  speed: number;
  homeXAtClick: number;
  homeYAtClick: number;
  explodeTargetX: number;
  explodeTargetY: number;
};

type MouseState = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  nx: number;
  ny: number;
  active: boolean;
};

type LinePhase = "idle" | "in" | "hold" | "out";

type LineSlot = {
  nodeIndex: number | null;
  lastNodeIndex: number | null;
  phase: LinePhase;
  phaseStart: number;
  phaseDuration: number;
  alpha: number;
  pulseT: number;
  pulseSpeed: number;
  bendSeed: number;
  violet: boolean;
};

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function DevClubCore() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const inner = innerRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !inner || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const noise3D = createNoise3D();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0;
    let H = 0;
    let CX = 0;
    let CY = 0;
    let coreR = 0;
    let minR = 0;
    let maxR = 0;
    let mouseRadius = 0;
    let hoverRadius = 0;

    function size() {
      if (!stage || !canvas) return;
      const rect = stage.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
      CX = W / 2;
      CY = H / 2;
      coreR = Math.min(W, H) * 0.075;
      minR = Math.min(W, H) * 0.16;
      maxR = Math.min(W, H) * 0.46;
      mouseRadius = Math.min(W, H) * MOUSE_RADIUS_FACTOR;
      hoverRadius = coreR * HOVER_RADIUS_FACTOR;
    }
    size();
    // Resize only recomputes the stage's own dimensions above -- it never
    // touches the 18 nodes already drifting around the old center. Without
    // this, rotating a tablet (or resizing the window) mid-scroll left
    // every chip stranded relative to the new CX/CY, only crawling back via
    // the (deliberately weak) boundary-containment force over several
    // seconds. Shifting every node by the same delta the center moved keeps
    // their relative arrangement intact with no visible jump.
    function onResize() {
      const prevCX = CX;
      const prevCY = CY;
      size();
      const dx = CX - prevCX;
      const dy = CY - prevCY;
      if (dx || dy) {
        nodes.forEach((n) => {
          n.x += dx;
          n.y += dy;
        });
      }
    }
    window.addEventListener("resize", onResize);

    const mouse: MouseState = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      nx: 0,
      ny: 0,
      active: false,
    };
    const tiltState = { x: 0, y: 0 };

    function onPointerMove(e: PointerEvent) {
      const rect = stage!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (!mouse.active) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.vx = 0;
        mouse.vy = 0;
      }
      mouse.active = true;
    }
    function onPointerLeave() {
      mouse.active = false;
      mouse.vx = 0;
      mouse.vy = 0;
    }
    if (!reduced) {
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerleave", onPointerLeave);
    }

    const chipEls = chipRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );

    // Ângulo em passo áureo para a distribuição inicial, mas o raio usa um
    // passo irracional DIFERENTE (√2, não a mesma razão áurea) -- se os
    // dois usassem a mesma constante, alguns pares de índices distantes
    // (ex.: i=2 e i=15) acabam caindo em ângulo E raio parecidos por
    // coincidência aritmética, sobrepondo dois chips no frame inicial.
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const nodes: FlowNode[] = chipEls.map((el, i) => {
      const a = i * GOLDEN_ANGLE;
      const r = minR + (maxR - minR) * (0.35 + 0.4 * ((i * Math.SQRT2) % 1));
      return {
        el,
        x: CX + Math.cos(a) * r,
        y: CY + Math.sin(a) * r * 0.86,
        seedX: i * 137.5,
        seedY: i * 57.3,
        speed:
          NODE_DRIFT_SPEED_MIN +
          Math.random() * (NODE_DRIFT_SPEED_MAX - NODE_DRIFT_SPEED_MIN),
        homeXAtClick: 0,
        homeYAtClick: 0,
        explodeTargetX: 0,
        explodeTargetY: 0,
      };
    });

    const lineSlots: LineSlot[] = Array.from(
      { length: Math.min(MAX_ACTIVE_LINES, nodes.length) },
      (_, i) => ({
        nodeIndex: null,
        lastNodeIndex: null,
        phase: "idle",
        phaseStart: 0,
        // Atraso inicial escalonado -- os slots nunca "ligam" todos juntos
        // (regra do Ritmo: nada começa exatamente junto com outro).
        phaseDuration: randRange(300, 2200) + i * 260,
        alpha: 0,
        pulseT: Math.random(),
        pulseSpeed: randRange(0.00035, 0.0006),
        bendSeed: i * 33.7,
        violet: false,
      }),
    );

    const coreWake = { level: reduced ? 1 : 0 };
    let ctxGsap: gsap.Context | null = null;
    let raf = 0;
    let observer: IntersectionObserver | null = null;
    let awake = reduced;
    let t0 = performance.now();
    let heroMomentStart: number | null = null;
    let heroMomentTimeoutId: ReturnType<typeof setTimeout> | undefined;

    // Fase 4: estado do clique + o proxy que as timelines do GSAP tweenam
    // (lido a cada frame dentro de `tick`/`stepNode`/`drawCore`).
    let coreState: CoreState = "idle";
    let cursorStyle = "default";
    const sequence = { charge: 0, drag: 0, explode: 0, fan: 0 };

    function drawCore(
      t: number,
      heroBoost: number,
      chargeLevel: number,
      explodeFlash: number,
      ringVisibility: number,
    ) {
      if (!ctx) return;
      const n1 = reduced ? 0 : noise3D(0, 0, t * CORE_INTENSITY_FREQ);
      const n2 = reduced ? 0 : noise3D(120, 60, t * CORE_DEFORM_FREQ);
      // Prendendo a respiração: o núcleo tensiona (encolhe um pouco) e
      // brilha mais forte enquanto absorve energia (Pulse/Drag).
      const intensity =
        (0.55 + 0.45 * ((n1 + 1) / 2)) *
        coreWake.level *
        (1 + heroBoost * 0.7) *
        (1 + chargeLevel * 0.5 + explodeFlash * 1.4);
      const wobble = n2 * 0.06;
      const r = coreR * (1 + wobble) * (1 - chargeLevel * 0.22);

      for (let layer = 3; layer >= 0; layer--) {
        const rr = Math.max(0.1, r * (1 + layer * 1.7));
        const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, rr);
        const a = (0.55 - layer * 0.11) * intensity;
        grad.addColorStop(0, `rgba(205,255,225,${(a * 0.9).toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(57,213,114,${(a * 0.55).toFixed(3)})`);
        grad.addColorStop(1, "rgba(57,213,114,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(CX, CY, rr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nada de clarão separado cobrindo a cena inteira -- mesmo sendo um
      // círculo, um raio grande o bastante só mostra o "miolo" dele dentro
      // da área visível, e isso lê como um banho retangular (a mesma
      // sensação de área delimitada que estávamos tentando eliminar). O
      // "pisca" da explosão já está inteiro em `intensity` acima
      // (`explodeFlash * 1.4`) -- só a bola verde do meio brilha mais
      // forte por um instante, nada além dela.

      // Três anéis-guia sempre presentes ao redor do núcleo -- não só no
      // hover, um conjunto fixo desde o despertar, como órbitas aninhadas
      // (um menor por dentro, o do meio no lugar do anel antigo, um maior
      // por fora). Cada um com seu próprio wobble de raio -- frequência e
      // fase diferentes, nunca sincronizados ("Nothing is Perfect"). No
      // hover eles só ficam um pouco mais visíveis, reforçando o convite ao
      // clique sem deixar de existir o resto do tempo. Somem conforme as
      // tecnologias convergem pro centro (Drag, `ringVisibility` acompanha
      // `sequence.drag`) e voltam junto com a explosão (`ringVisibility`
      // sobe rápido no início do leque) -- a mesma lógica de "a energia se
      // concentrou pra dentro, depois se libera" que já rege os fios.
      if (coreWake.level > 0.01 && ringVisibility > 0.001) {
        const hoverBoost = coreState === "hover" ? 1.7 : 1;
        const ringFactors = [1.45, 2.1, 2.95];
        const ringBaseAlpha = [0.13, 0.19, 0.1];
        ringFactors.forEach((factor, i) => {
          const wobble =
            Math.sin(t * (0.0021 + i * 0.0009) + i * 2.1) * (3 + i * 1.5);
          const ringR = Math.max(0.1, r * factor + wobble);
          const alpha =
            ringBaseAlpha[i] * hoverBoost * coreWake.level * ringVisibility;
          ctx.strokeStyle = `rgba(205,255,225,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    }

    function stepNode(n: FlowNode, t: number, dt: number, mouse: MouseState) {
      // Drag (Fase 4): o campo de fluxo normal é suspenso -- os nós são
      // interpolados diretamente da posição de onde estavam quando o
      // núcleo começou a absorver energia até o próprio centro.
      if (coreState === "drag") {
        n.x = n.homeXAtClick + (CX - n.homeXAtClick) * sequence.drag;
        n.y = n.homeYAtClick + (CY - n.homeYAtClick) * sequence.drag;
        n.el.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%)`;
        return;
      }
      // Explosion + Rebuild (Fase 4): um único movimento de "abrir o
      // leque" -- do centro (onde o Drag deixou todo mundo agrupado) até
      // uma nova posição bem distribuída (embaralhada a cada clique,
      // metade pra cima, metade pra baixo), revelando as 18 tecnologias de
      // novo. `sequence.fan` (0->1, ease power3.out) é o mesmo valor pros
      // dois estados -- só o núcleo (flash) muda de um pro outro.
      if (coreState === "explosion" || coreState === "rebuild") {
        n.x = CX + (n.explodeTargetX - CX) * sequence.fan;
        n.y = CY + (n.explodeTargetY - CY) * sequence.fan;
        n.el.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%)`;
        return;
      }

      const nx = (n.x - CX) * FIELD_SCALE;
      const ny = (n.y - CY) * FIELD_SCALE;
      const angle =
        noise3D(nx + n.seedX, ny + n.seedY, t * TIME_SCALE) * Math.PI * 2;
      // Pulse (Fase 4): "tudo desacelera" -- a velocidade natural do
      // campo é amortecida enquanto o núcleo prende a respiração, sem
      // ainda soltar o controle da posição (isso só acontece no Drag).
      const speedFactor = coreState === "pulse" ? 1 - sequence.charge * 0.85 : 1;
      let vx = Math.cos(angle) * n.speed * speedFactor;
      let vy = Math.sin(angle) * n.speed * speedFactor;

      const dx = n.x - CX;
      const dy = n.y - CY;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < minR) {
        const push = (minR - dist) * BOUNDARY_CONTAINMENT;
        vx += (dx / dist) * push;
        vy += (dy / dist) * push;
      } else if (dist > maxR) {
        const pull = (dist - maxR) * BOUNDARY_CONTAINMENT;
        vx -= (dx / dist) * pull;
        vy -= (dy / dist) * pull;
      }

      if (mouse.active) {
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const mdist = Math.hypot(mdx, mdy) || 1;
        // Decaimento suave e sem corte: TODO nó recebe alguma influência,
        // só que cada vez mais fraca quanto mais longe está do cursor.
        const influence = Math.exp(-mdist / mouseRadius);
        const swirlX = -mdy / mdist;
        const swirlY = mdx / mdist;
        vx += swirlX * influence * SWIRL_STRENGTH;
        vy += swirlY * influence * SWIRL_STRENGTH;
        vx += mouse.vx * influence * DRAG_STRENGTH;
        vy += mouse.vy * influence * DRAG_STRENGTH;
      }

      n.x += vx * dt;
      n.y += vy * dt;
      n.el.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%)`;
    }

    // ---------- fios de energia (Fase 2) ----------

    function phaseDurationFor(phase: LinePhase) {
      if (phase === "in") return randRange(500, 900);
      if (phase === "hold") return randRange(1800, 3400);
      if (phase === "out") return randRange(500, 900);
      return randRange(300, 2600); // idle: intervalo até religar em outro nó
    }

    function activateSlot(slot: LineSlot, now: number) {
      const busy = new Set(
        lineSlots
          .filter((s) => s !== slot && s.nodeIndex !== null)
          .map((s) => s.nodeIndex),
      );
      let candidates = nodes
        .map((_, i) => i)
        .filter((i) => !busy.has(i) && i !== slot.lastNodeIndex);
      if (candidates.length === 0) {
        candidates = nodes.map((_, i) => i).filter((i) => !busy.has(i));
      }
      if (candidates.length === 0) return; // todo mundo ocupado -- tenta de novo no próximo idle

      const idx = candidates[Math.floor(Math.random() * candidates.length)];
      const anyoneViolet = lineSlots.some((s) => s !== slot && s.violet);

      slot.nodeIndex = idx;
      slot.lastNodeIndex = idx;
      slot.violet = !anyoneViolet && Math.random() < VIOLET_CHANCE;
      slot.bendSeed = Math.random() * 1000;
      slot.pulseSpeed = randRange(0.00035, 0.0006);
      slot.pulseT = Math.random();
      slot.phase = "in";
      slot.phaseStart = now;
      slot.phaseDuration = phaseDurationFor("in");
    }

    function stepSlot(slot: LineSlot, now: number) {
      const elapsed = now - slot.phaseStart;

      if (slot.phase === "idle") {
        slot.alpha = 0;
        if (elapsed >= slot.phaseDuration) activateSlot(slot, now);
        return;
      }

      if (slot.phase === "in") {
        slot.alpha = Math.min(1, elapsed / slot.phaseDuration);
        if (elapsed >= slot.phaseDuration) {
          slot.phase = "hold";
          slot.phaseStart = now;
          slot.phaseDuration = phaseDurationFor("hold");
        }
      } else if (slot.phase === "hold") {
        slot.alpha = 1;
        if (elapsed >= slot.phaseDuration) {
          slot.phase = "out";
          slot.phaseStart = now;
          slot.phaseDuration = phaseDurationFor("out");
        }
      } else if (slot.phase === "out") {
        slot.alpha = Math.max(0, 1 - elapsed / slot.phaseDuration);
        if (elapsed >= slot.phaseDuration) {
          slot.nodeIndex = null;
          slot.phase = "idle";
          slot.phaseStart = now;
          slot.phaseDuration = phaseDurationFor("idle");
        }
      }
    }

    function drawEnergyLine(
      node: FlowNode,
      alpha: number,
      violet: boolean,
      bendSeed: number,
      pulseT: number,
      t: number,
    ) {
      if (!ctx || alpha <= 0.01) return;
      const dx = node.x - CX;
      const dy = node.y - CY;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      // Curva nunca reta e nunca parada -- o deslocamento perpendicular do
      // meio da curva é amostrado do mesmo campo de ruído, então a linha
      // respira continuamente em vez de assumir uma forma fixa ao nascer.
      const bend = noise3D(bendSeed, 0, t * 0.00025) * 26;
      const mx = (CX + node.x) / 2 + px * bend;
      const my = (CY + node.y) / 2 + py * bend;

      const tip = violet ? "139,63,240" : "57,213,114";
      const grad = ctx.createLinearGradient(CX, CY, node.x, node.y);
      grad.addColorStop(0, `rgba(57,213,114,${(0.55 * alpha).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${tip},${(0.16 * alpha).toFixed(3)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + alpha * 0.7;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.quadraticCurveTo(mx, my, node.x, node.y);
      ctx.stroke();

      const u = 1 - pulseT;
      const k = pulseT;
      const qx = u * u * CX + 2 * u * k * mx + k * k * node.x;
      const qy = u * u * CY + 2 * u * k * my + k * k * node.y;
      const pulseR = 6;
      const pg = ctx.createRadialGradient(qx, qy, 0, qx, qy, pulseR);
      pg.addColorStop(0, `rgba(220,255,235,${(0.9 * alpha).toFixed(3)})`);
      pg.addColorStop(1, "rgba(57,213,114,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(qx, qy, pulseR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Realça o chip que está recebendo energia agora -- a única pergunta
    // que essa animação responde é "por que esse nó está brilhando?" ("Toda
    // animação responde uma pergunta"): porque um fio está ativo nele.
    function paintHighlights(highlights: Map<number, { alpha: number; violet: boolean }>) {
      nodes.forEach((n, i) => {
        const h = highlights.get(i);
        if (!h) {
          n.el.style.boxShadow = "";
          return;
        }
        const color = h.violet ? "139,63,240" : "57,213,114";
        n.el.style.boxShadow = `0 0 ${(10 + h.alpha * 10).toFixed(1)}px ${(1 + h.alpha).toFixed(1)}px rgba(${color},${(0.5 * h.alpha).toFixed(2)})`;
      });
    }

    // Fase 4: a máquina de estados do clique em si. O tempo é avançado à
    // mão dentro do `tick` (mesma técnica de `phaseStart`/`phaseDuration`
    // já usada em `stepSlot`), não por uma timeline do GSAP -- só as
    // curvas de easing vêm do GSAP (`parseEase`, puras, sem depender do
    // ticker dele rodando em sincronia com o nosso próprio loop).
    let sequenceStart = 0;

    function startClickSequence(now: number) {
      if (coreState !== "idle" && coreState !== "hover") return;

      nodes.forEach((n) => {
        n.homeXAtClick = n.x;
        n.homeYAtClick = n.y;
      });

      sequence.charge = 0;
      sequence.drag = 0;
      sequence.explode = 0;
      sequence.fan = 0;
      coreState = "pulse";
      sequenceStart = now;
    }

    // Embaralha [0..n-1] (Fisher-Yates) -- o leque do Explosion/Rebuild
    // nunca reaparece na mesma disposição do clique anterior.
    function shuffledIndices(n: number) {
      const arr = Array.from({ length: n }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function beginExplosion(now: number) {
      coreState = "explosion";
      sequenceStart = now;
      // Silêncio quebrado de uma vez: todas as conexões ativas somem
      // instantaneamente -- a energia que carregavam acabou de ser
      // liberada, não faz sentido continuarem acesas.
      lineSlots.forEach((slot) => {
        slot.nodeIndex = null;
        slot.phase = "idle";
        slot.alpha = 0;
        slot.phaseStart = now;
        slot.phaseDuration = phaseDurationFor("idle");
      });
      // Leque bem distribuído (mesma lógica do layout inicial: ângulo
      // áureo + raio em passo √2), mas com a ORDEM embaralhada -- metade
      // dos nós abre pra cima, metade pra baixo, nunca repetindo o
      // arranjo do clique anterior.
      const order = shuffledIndices(nodes.length);
      nodes.forEach((n, i) => {
        const slot = order[i];
        const a = slot * GOLDEN_ANGLE + (Math.random() - 0.5) * 0.25;
        const r =
          minR + (maxR - minR) * (0.4 + 0.5 * ((slot * Math.SQRT2) % 1));
        n.explodeTargetX = CX + Math.cos(a) * r;
        n.explodeTargetY = CY + Math.sin(a) * r * 0.86;
      });
    }

    // Avança a máquina de estados um frame -- chamada de dentro do
    // `tick`. Cada `if` é uma transição só, sempre lendo `now` do mesmo
    // relógio (`performance.now()` via `requestAnimationFrame`) que já
    // governa o resto da simulação.
    function advanceSequence(now: number) {
      if (coreState === "pulse") {
        const p = Math.min(1, (now - sequenceStart) / (PULSE_DURATION * 1000));
        sequence.charge = easeChargeInOut(p);
        if (p >= 1) {
          coreState = "drag";
          sequenceStart = now;
        }
      } else if (coreState === "drag") {
        const p = Math.min(1, (now - sequenceStart) / (DRAG_DURATION * 1000));
        sequence.drag = easeDragInOut(p);
        if (p >= 1) beginExplosion(now);
      } else if (coreState === "explosion") {
        const flashP = Math.min(
          1,
          (now - sequenceStart) / (EXPLOSION_DURATION * 1000),
        );
        sequence.explode = 1 - easeFlashOut(flashP);
        sequence.fan = easeFanOut(
          Math.min(1, (now - sequenceStart) / (FAN_DURATION * 1000)),
        );
        // O núcleo começa a relaxar (soltar o aperto do Drag) na MESMA
        // curva com que os nós se afastam do centro -- energia se
        // liberando ao longo do leque inteiro, não só no instante do
        // flash. Contínuo com o mesmo cálculo no Rebuild abaixo (os dois
        // só existem porque `sequence.fan` já é contínuo entre eles).
        sequence.charge = 1 - sequence.fan;
        if (flashP >= 1) coreState = "rebuild";
      } else if (coreState === "rebuild") {
        sequence.explode = 0;
        const fanP = Math.min(1, (now - sequenceStart) / (FAN_DURATION * 1000));
        sequence.fan = easeFanOut(fanP);
        sequence.charge = 1 - sequence.fan;
        // Vira "idle" assim que o leque estiver VISUALMENTE completo, não
        // só quando o cronômetro em tempo bruto zera -- `power3.out` (a
        // curva do leque) já está a ~99.5% do caminho bem antes de `fanP`
        // cravar 1, e esperar a duração cheia deixava um resto "morto":
        // as tecnologias já pareciam paradas, mas nem retomavam o vagar
        // orgânico (preso em `coreState === "rebuild"`) nem o núcleo
        // relaxava de volta (chargeLevel/raio só soltavam no snap final)
        // -- o delay reportado nas duas coisas ao mesmo tempo.
        if (sequence.fan >= 0.995 || fanP >= 1) {
          coreState = "idle";
          // Sem isso o núcleo fica "carregado" (mais apertado e mais
          // brilhante, ver `drawCore`) para sempre depois do primeiro
          // clique -- charge/drag só fazem sentido durante a própria
          // sequência, não no regime vivo de volta. Na prática já chega
          // perto de 0 sozinho (contínuo desde o início do Explosion),
          // isso só zera o resíduo.
          sequence.charge = 0;
          sequence.drag = 0;
          sequence.fan = 0;
          // O mesmo Hero Moment do primeiro despertar da seção -- uma
          // onda síncrona percorrendo TODAS as conexões de uma vez, ver
          // `heroEnvelope` no `tick` -- se repete aqui, no instante exato
          // em que o leque termina de se abrir. Reforça visualmente que
          // as 18 tecnologias "voltaram", do mesmo jeito que apareceram
          // pela primeira vez, em vez de deixar o sistema normal de fios
          // (1 a 5 por vez, aleatório) reintroduzir as conexões aos poucos.
          heroMomentStart = now;
        }
      }
    }

    function onClick(e: MouseEvent) {
      const rect = stage!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const d = Math.hypot(px - CX, py - CY);
      if (d < hoverRadius) startClickSequence(performance.now());
    }
    if (!reduced) {
      stage.addEventListener("click", onClick);
    }

    let lastNow = performance.now();
    function tick(now: number) {
      if (!inner) return;
      const t = now - t0;
      const dt = Math.min((now - lastNow) / 16.7, 3);
      lastNow = now;

      // Velocidade do cursor suavizada (não o delta cru de um único evento
      // pointermove, que chega irregular) -- é essa velocidade que "arrasta"
      // a corrente na Fase 3.
      const rawVx = mouse.x - mouse.px;
      const rawVy = mouse.y - mouse.py;
      mouse.vx += (rawVx - mouse.vx) * MOUSE_VELOCITY_EASE;
      mouse.vy += (rawVy - mouse.vy) * MOUSE_VELOCITY_EASE;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.nx = W ? (mouse.x / W - 0.5) * 2 : 0;
      mouse.ny = H ? (mouse.y / H - 0.5) * 2 : 0;

      // Câmera: a respiração de base nunca para (ruído procedural, nunca
      // senoide fixa); o tilt do mouse se SOMA a ela, nunca a substitui.
      const targetTiltY = mouse.active ? mouse.nx * TILT_MAX_DEG : 0;
      const targetTiltX = mouse.active ? -mouse.ny * TILT_MAX_DEG : 0;
      tiltState.x += (targetTiltX - tiltState.x) * TILT_EASE;
      tiltState.y += (targetTiltY - tiltState.y) * TILT_EASE;
      const breathe = 1 + BREATHE_AMPLITUDE * noise3D(300, 300, t * BREATHE_FREQ);
      inner.style.transform = `rotateX(${tiltState.x.toFixed(3)}deg) rotateY(${tiltState.y.toFixed(3)}deg) scale(${breathe.toFixed(4)})`;

      // Fase 4 -- Hover: só se aplica quando não há uma sequência de
      // clique em andamento (Pulse/Drag/Explosion/Rebuild não se
      // interrompem por causa da posição do mouse).
      if (coreState === "idle" || coreState === "hover") {
        const distToCore = mouse.active
          ? Math.hypot(mouse.x - CX, mouse.y - CY)
          : Infinity;
        const isNearCore = mouse.active && distToCore < hoverRadius;
        coreState = isNearCore ? "hover" : "idle";
      } else {
        advanceSequence(now);
      }
      const nextCursor = coreState === "hover" ? "pointer" : "default";
      if (nextCursor !== cursorStyle) {
        cursorStyle = nextCursor;
        stage!.style.cursor = cursorStyle;
      }

      // O Hero Moment: uma única onda síncrona que percorre TODAS as
      // conexões de uma vez, ~1.7s depois do despertar (quando a maioria
      // dos chips já assentou) -- o único instante em que a regra "nada
      // começa exatamente junto" é quebrada de propósito.
      let heroEnvelope = 0;
      if (heroMomentStart !== null) {
        const he = now - heroMomentStart;
        if (he < HERO_MOMENT_DURATION) {
          heroEnvelope = Math.sin((he / HERO_MOMENT_DURATION) * Math.PI);
        } else {
          heroMomentStart = null;
        }
      }

      // Anéis: continuam cheios durante o Pulse (o núcleo prende a
      // respiração, mas nenhuma tecnologia se moveu ainda) e só começam a
      // sumir no Drag, na MESMA proporção em que os nós convergem pro
      // centro (`sequence.drag`) -- é a força das tecnologias se
      // agrupando que "apaga" os anéis, não um timer independente do
      // núcleo. Voltam rápido assim que o leque começa a se abrir.
      let ringVisibility = 1;
      if (coreState === "drag") {
        ringVisibility = 1 - sequence.drag;
      } else if (coreState === "explosion" || coreState === "rebuild") {
        ringVisibility = Math.min(1, sequence.fan * 3);
      }

      ctx?.clearRect(0, 0, W, H);
      drawCore(t, heroEnvelope, sequence.charge, sequence.explode, ringVisibility);
      nodes.forEach((n) => stepNode(n, t, reduced ? 0 : dt, mouse));

      const highlights = new Map<number, { alpha: number; violet: boolean }>();

      if (heroEnvelope > 0.01) {
        nodes.forEach((n, i) => {
          const pulseT = (t * 0.0007 + i * 0.11) % 1;
          drawEnergyLine(n, heroEnvelope * 0.85, false, i * 41.3, pulseT, t);
          highlights.set(i, { alpha: heroEnvelope, violet: false });
        });
      }

      // Fios de energia só existem nos estados "vivos" (Idle/Hover/
      // Rebuild) -- Pulse/Drag/Explosion são exatamente o silêncio dessas
      // conexões enquanto a energia delas está sendo redirecionada pro
      // núcleo e depois liberada.
      if (
        coreState === "idle" ||
        coreState === "hover" ||
        coreState === "rebuild"
      ) {
        lineSlots.forEach((slot) => {
          stepSlot(slot, now);
          if (slot.nodeIndex === null || slot.alpha <= 0.01) return;
          const node = nodes[slot.nodeIndex];
          slot.pulseT = (slot.pulseT + slot.pulseSpeed * dt * 16.7) % 1;
          drawEnergyLine(
            node,
            slot.alpha,
            slot.violet,
            slot.bendSeed,
            slot.pulseT,
            t,
          );
          const existing = highlights.get(slot.nodeIndex);
          if (!existing || existing.alpha < slot.alpha) {
            highlights.set(slot.nodeIndex, {
              alpha: slot.alpha,
              violet: slot.violet,
            });
          }
        });
      }

      paintHighlights(highlights);

      if (!reduced) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (awake || !stage) return;
      awake = true;
      t0 = performance.now();
      lastNow = t0;

      ctxGsap = gsap.context(() => {
        gsap.to(coreWake, {
          level: 1,
          duration: 1.4,
          ease: "power2.out",
        });
        chipEls.forEach((el, i) => {
          gsap.to(el, {
            opacity: 1,
            scale: 1,
            duration: 0.7 + Math.random() * 0.3,
            delay: i * 0.06 + Math.random() * 0.3,
            ease: "power3.out",
          });
        });
      }, stage);

      heroMomentTimeoutId = setTimeout(() => {
        heroMomentStart = performance.now();
      }, HERO_MOMENT_DELAY);

      raf = requestAnimationFrame(tick);
    }

    if (reduced) {
      // Estado final direto: núcleo estável, nós já no lugar, e um punhado
      // de fios fixos (sem pulso viajando) -- mesmo padrão de curto-
      // circuito usado no resto do projeto para prefers-reduced-motion
      // (ver Hero.tsx/Marquee.tsx), sem loop de animação.
      gsap.set(chipEls, { opacity: 1, scale: 1 });
      nodes.forEach((n) => {
        n.el.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%)`;
      });
      drawCore(0, 0, 0, 0, 1);
      nodes.slice(0, 4).forEach((n, i) => drawEnergyLine(n, 0.55, i === 0, i * 41.3, 0.5, 0));
    } else {
      gsap.set(chipEls, { opacity: 0, scale: 0.6 });
      // Um frame "adormecido" antes de qualquer interseção -- núcleo
      // discreto, nós ainda invisíveis (arco emocional: 0-2s curiosidade).
      drawCore(0, 0, 0, 0, 1);

      observer = new IntersectionObserver(
        (entries) => {
          const intersecting = entries.some((e) => e.isIntersecting);
          if (intersecting) {
            if (!awake) {
              wake();
            } else if (!raf) {
              // Scrolled back into view after being paused below -- only
              // the rAF loop resumes; the one-time GSAP entrance (`wake`'s
              // own context) never replays.
              raf = requestAnimationFrame(tick);
            }
          } else if (awake && raf) {
            // Once the user has scrolled past this section, the canvas
            // redraw + 18-node simulation has nothing left to show anyone
            // -- without this, `tick` kept re-scheduling itself forever,
            // spending a frame budget on every screen for the rest of the
            // page's scroll for a section nobody can see.
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(section);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      clearTimeout(heroMomentTimeoutId);
      observer?.disconnect();
      ctxGsap?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32"
    >
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Conhecimento em Fluxo
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Tudo o que você vai dominar, em constante movimento.
        </h2>
      </div>

      <div
        ref={stageRef}
        style={{ perspective: 1400 }}
        className="relative h-[75vh] max-h-[700px] min-h-[460px] w-full"
      >
        {/* De propósito SEM borda, fundo próprio, cantos arredondados ou
            `overflow-hidden` -- qualquer um desses cria um "retângulo"
            perceptível que denuncia "isso é um componente", exatamente o
            problema reportado comparando com o site de referência (onde a
            rede vive solta no mesmo fundo da página). O núcleo/fios são
            desenhados num canvas totalmente transparente sobre o mesmo
            preto do body, e os chips (nós) não são mais cortados ao saírem
            da área "lógica" -- eles só param de ser encontrados pelo mouse
            (ver `hoverRadius`/`mouseRadius`), nunca desaparecem visualmente.
            Único elemento que a câmera (respiração + tilt do mouse, Fase 3)
            transforma -- o `stage` externo mantém `perspective` e as
            coordenadas estáveis do pointermove, nunca gira ele mesmo. */}
        <div ref={innerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />

          {stackItems.map((item, i) => (
            <div
              key={item.name}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              className="pointer-events-none absolute top-0 left-0 flex items-center gap-1.5 rounded-full border border-border-soft bg-black/60 px-2.5 py-1 opacity-0 backdrop-blur-sm transition-shadow duration-300"
            >
              <span className="relative h-3.5 w-3.5 shrink-0">
                <Image
                  src={item.icon}
                  alt=""
                  fill
                  sizes="14px"
                  className="object-contain"
                />
              </span>
              <span className="font-mono text-[10px] font-medium whitespace-nowrap text-foreground">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
