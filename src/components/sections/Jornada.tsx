"use client";

import Image from "next/image";
import {
  Briefcase,
  Globe2,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { journeySteps } from "@/lib/data";
import { cn } from "@/lib/utils";

// Jornada DevClub -- "a trilha".
//
// A metáfora é uma trilha de circuito impresso conduzindo energia. Ela não
// foi escolhida por estética: o Rodolfo saiu de eletricista para
// programador, e uma trilha de cobre energizada é literalmente a ponte
// entre esses dois mundos. Cada formação é um módulo soldado nessa trilha.
//
// Duas regras de desenho, que existem para o resultado não virar "placa-mãe
// ilustrada" -- o modo de falha desse conceito:
//
//  * UMA trilha dominante. Consistência geométrica total: todo checkpoint
//    (o primeiro, o diploma, todos) segue a MESMA alternância esquerda/
//    direita. Nenhum é "especial" na geometria -- só o ouro do terminus é.
//  * Transição de pista sempre por um trecho a 45°, nunca por um canto de
//    90°. Placas reais chanfram os cantos por causa do processo de
//    fabricação; é esse detalhe que separa "trilha de circuito" de
//    "fluxograma".
//
// O mecanismo: a trilha existe desde o primeiro frame, apagada (cobre sem
// energia). O scroll ENERGIZA ela progressivamente -- um `stroke-dashoffset`
// sobre uma cópia acesa, seguido por uma cabeça viajante com halo.

// Testado subir esse valor pra abrir mais respiro entre checkpoints --
// não funciona: `gap` entre módulos e o orçamento de scroll de QUALQUER
// tween da timeline (`GROUP_BUDGET` abaixo incluído) são ambos frações do
// MESMO comprimento total da trilha (`L`), então os dois crescem juntos,
// na mesma proporção, quando a seção fica mais alta -- a razão entre eles
// (o que realmente determina se corta ou não) não muda. O orçamento
// seguro é uma fração fixa de `L`, não uma distância em px; ver
// `GROUP_BUDGET`.
const SECTION_VH = 440;

type Pt = { x: number; y: number };
type NodeInfo = { x: number; y: number; len: number; side: 1 | -1 };
type Trace = { d: string; total: number; nodes: NodeInfo[]; origin: Pt };
type TechIcon = { kind: "asset"; src: string } | { kind: "lucide"; Icon: LucideIcon };

// Ícone real da marca sempre que existe um asset oficial no projeto; ícone
// genérico do lucide (nunca uma logo de memória) para conceitos ou
// ferramentas sem asset -- mesma regra que já rege o resto do projeto
// (`src/lib/data.ts`: nunca reproduzir uma marca de memória, cair para um
// substituto honesto quando não há fonte oficial).
const TECH_ICON: Record<string, TechIcon> = {
  HTML: { kind: "asset", src: "/assets/tech-stack/html5.svg" },
  CSS: { kind: "asset", src: "/assets/tech-stack/css3.svg" },
  JavaScript: { kind: "asset", src: "/assets/tech-stack/javascript.svg" },
  React: { kind: "asset", src: "/assets/tech-stack/react.svg" },
  "Next.js": { kind: "asset", src: "/assets/tech-stack/nextjs.svg" },
  TailwindCSS: { kind: "asset", src: "/assets/tech-stack/tailwindcss.svg" },
  "Node.js": { kind: "asset", src: "/assets/tech-stack/node.svg" },
  TypeScript: { kind: "asset", src: "/assets/tech-stack/typescript.svg" },
  PostgreSQL: { kind: "asset", src: "/assets/tech-stack/postgresql.svg" },
  ChatGPT: { kind: "asset", src: "/assets/tech-stack/openai.svg" },
  Claude: { kind: "asset", src: "/assets/tech-stack/claude.svg" },
  n8n: { kind: "asset", src: "/assets/tech-stack/n8n.svg" },
  "Criação de Sites": { kind: "lucide", Icon: Globe2 },
  Prospecção: { kind: "lucide", Icon: Target },
  Vendas: { kind: "lucide", Icon: TrendingUp },
  Freelancing: { kind: "lucide", Icon: Briefcase },
};

function buildTrace(W: number, H: number): Trace {
  const narrow = W < 760;

  // O deslocamento lateral entre pistas é deliberadamente contido -- largo
  // o bastante para sentir a curva, sem convidar a reparar nela.
  const laneL = narrow ? Math.max(28, W * 0.1) : W * 0.5 - Math.min(W * 0.1, 130);
  const laneR = narrow ? laneL : W * 0.5 + Math.min(W * 0.1, 130);

  const top = H * 0.1;
  // Perto do fim da seção (não em 0.87H como antes): sobrava ~13% de altura
  // -- vários vh de scroll morto -- entre a chegada do último checkpoint e
  // o início da seção seguinte. O `jd-fade-grad` (abaixo) recebe a mesma
  // folga para não desenhar o desvanecimento por cima do último módulo.
  const bottom = H * 0.95;
  const count = journeySteps.length;
  const gap = (bottom - top) / (count - 1);

  // Alternância uniforme para TODOS os checkpoints -- o primeiro e o
  // diploma incluídos. Nenhuma etapa recebe um tratamento geométrico
  // especial; a única coisa que marca o terminus é a cor.
  const targets: NodeInfo[] = journeySteps.map((_, i) => {
    const y = top + i * gap;
    if (narrow) return { x: laneL, y, len: 0, side: 1 };
    const onLeft = i % 2 === 0;
    return { x: onLeft ? laneL : laneR, y, len: 0, side: onLeft ? 1 : -1 };
  });

  // A fonte fica alinhada ao centro da seção (a mesma linha em que o núcleo
  // do DevClubCore, seção anterior, já vive) -- e o primeiro chanfro parte
  // dali até a pista do primeiro checkpoint, exatamente como qualquer outro
  // trecho da trilha. É o que tira a "entrada" de ser um caso especial.
  //
  // O traço começa NA fonte (`originY`), não em y=0: começando em y=0 a
  // cabeça viajante, em repouso, ficava sentada bem no topo do SVG --
  // cortada pelo cabeçalho/borda da viewport, lendo como uma segunda
  // bolinha solta acima da fonte. Um único ponto de partida resolve os
  // dois de uma vez.
  const originX = narrow ? laneL : W * 0.5;
  const originY = H * 0.035;
  const pts: Pt[] = [{ x: originX, y: originY }];
  let cur: Pt = pts[0];
  const push = (p: Pt) => {
    pts.push(p);
    cur = p;
  };

  const CHAMFER = 13;
  for (const t of targets) {
    const dx = t.x - cur.x;
    if (Math.abs(dx) > CHAMFER * 2.5) {
      const dir = Math.sign(dx);
      const yJog = cur.y + (t.y - cur.y) * 0.5;
      push({ x: cur.x, y: yJog - CHAMFER });
      push({ x: cur.x + dir * CHAMFER, y: yJog });
      push({ x: t.x - dir * CHAMFER, y: yJog });
      push({ x: t.x, y: yJog + CHAMFER });
      push({ x: t.x, y: t.y });
    } else {
      push({ x: t.x, y: t.y });
    }
  }
  // A trilha PARA no último checkpoint (comunidade) -- ela não seguia
  // sobrando até o fim da seção. Continuar depois do último módulo deixava
  // um trecho de traço sem função nenhuma, e a cabeça viajante, no final do
  // scroll, ficava parada bem perto da borda de baixo em vez de descansar
  // exatamente sobre o último módulo.

  let total = 0;
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(total);
  }
  let ni = 0;
  for (let i = 1; i < pts.length && ni < targets.length; i++) {
    if (
      Math.abs(pts[i].x - targets[ni].x) < 0.5 &&
      Math.abs(pts[i].y - targets[ni].y) < 0.5
    ) {
      targets[ni].len = lens[i];
      ni++;
    }
  }

  const d =
    `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ` +
    pts
      .slice(1)
      .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

  const origin: Pt = { x: originX, y: originY };
  return { d, total, nodes: targets, origin };
}

const ICON_GAP = 34;
const ICON_OFFSET = 44;

function iconSlot(n: NodeInfo, j: number, count: number, onRight: boolean): Pt {
  return {
    x: n.x + (onRight ? ICON_OFFSET : -ICON_OFFSET),
    y: n.y + (j - (count - 1) / 2) * ICON_GAP,
  };
}

export function Jornada() {
  const sectionRef = useRef<HTMLElement>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const bloomRef = useRef<SVGPathElement>(null);
  const goldRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const headHaloRef = useRef<SVGCircleElement>(null);
  const originPulseRef = useRef<SVGCircleElement>(null);
  const padRefs = useRef<(SVGRectElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const terminusGlowRef = useRef<SVGCircleElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);

  const techIconRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const techFanWireRefs = useRef<(SVGLineElement | null)[][]>([]);
  const techLinkWireRefs = useRef<(SVGLineElement | null)[][]>([]);

  const [trace, setTrace] = useState<Trace | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const terminusIdx = useMemo(() => journeySteps.length - 2, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const measure = () => {
      const w = section.clientWidth;
      const h = section.scrollHeight;
      if (!w || !h) return;
      setSize({ w, h });
      setTrace(buildTrace(w, h));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const live = liveRef.current;
    if (!section || !live || !trace || !size.h) return;

    const reduced = prefersReducedMotion();
    const narrow = size.w < 760;
    const L = trace.total;
    const termLen = trace.nodes[terminusIdx].len;

    const pads = padRefs.current.filter(Boolean) as SVGRectElement[];
    const texts = textRefs.current.filter(Boolean) as HTMLDivElement[];
    const allIcons = techIconRefs.current.flat().filter(Boolean) as HTMLDivElement[];
    const allWires = [
      ...techFanWireRefs.current.flat(),
      ...techLinkWireRefs.current.flat(),
    ].filter(Boolean) as SVGLineElement[];

    if (reduced) {
      gsap.set([live, bloomRef.current], { strokeDasharray: L, strokeDashoffset: 0 });
      gsap.set(goldRef.current, { strokeDasharray: L, strokeDashoffset: L - termLen });
      gsap.set(headRef.current, { autoAlpha: 0 });
      gsap.set(pads, { opacity: 1 });
      gsap.set(texts, { autoAlpha: 1, y: 0 });
      gsap.set([terminusGlowRef.current, sealRef.current], { autoAlpha: 1 });
      gsap.set(sealRef.current, { scale: 1 });
      gsap.set(allIcons, { autoAlpha: 1, scale: 1 });
      gsap.set(allWires, { autoAlpha: 1 });
      return;
    }

    let tlInstance: gsap.core.Timeline | null = null;

    const ctx = gsap.context(() => {
      gsap.set([live, bloomRef.current], { strokeDasharray: L, strokeDashoffset: L });
      gsap.set(goldRef.current, { strokeDasharray: L, strokeDashoffset: L });
      gsap.set(pads, { opacity: 0.22 });
      gsap.set(texts, { autoAlpha: 0, y: 16 });
      gsap.set([terminusGlowRef.current, sealRef.current], { autoAlpha: 0 });
      gsap.set(sealRef.current, { scale: 0.9 });
      gsap.set(allWires, { autoAlpha: 0 });

      const TOTAL = 100;
      // Sem `scrollTrigger`: com a Hero (seção acima) pinada, o cálculo
      // interno do GSAP para "onde fica o fim do documento" fica
      // consistentemente adiantado para qualquer trigger depois dela --
      // confirmado direto na instância após `refresh(true)`, inclusive em
      // build de produção. Progresso lido de `getBoundingClientRect` a
      // cada frame; a timeline só recebe `tl.progress(p)`.
      const tl = (tlInstance = gsap.timeline({ paused: true }));

      tl.to(
        [live, bloomRef.current],
        {
          strokeDashoffset: 0,
          ease: "none",
          duration: TOTAL,
          onUpdate: () => {
            const head = headRef.current;
            const halo = headHaloRef.current;
            if (!head) return;
            const off = gsap.getProperty(live, "strokeDashoffset") as number;
            const p = live.getPointAtLength(Math.max(0, L - off));
            head.setAttribute("cx", String(p.x));
            head.setAttribute("cy", String(p.y));
            halo?.setAttribute("cx", String(p.x));
            halo?.setAttribute("cy", String(p.y));
          },
        },
        0,
      );

      // Pulso e texto no MESMO instante -- nenhum atraso entre "a energia
      // chegou" e "o conteúdo apareceu". Sincronizado, não encadeado.
      trace.nodes.forEach((n, i) => {
        const at = (n.len / L) * TOTAL;
        if (padRefs.current[i]) {
          tl.to(padRefs.current[i], { opacity: 1, duration: TOTAL * 0.01, ease: "power2.out" }, at);
        }
        if (textRefs.current[i]) {
          tl.to(
            textRefs.current[i],
            { autoAlpha: 1, y: 0, duration: TOTAL * 0.02, ease: "power2.out" },
            at,
          );
        }
        // A mecânica é a mesma da "Economia acumulada" do MBA (estudada
        // no código-fonte real, não por aparência): o valor original
        // NUNCA é tocado; uma cópia nasce no pixel exato onde ele vive,
        // se desprende e viaja até o destino, e só na chegada vira outra
        // coisa. A diferença aqui é deliberada: lá o voo roda em tempo
        // real (tween de 0.75s disparado ao cruzar um limiar de scroll);
        // aqui o voo inteiro é um tween DENTRO da timeline escrubada --
        // nunca um disparo em tempo real -- então rolar pra trás desfaz
        // a MESMA interpolação ao contrário, em qualquer ponto, sem
        // depender de nenhuma animação "terminar sozinha".
        if (!narrow && journeySteps[i].techs.length > 0) {
          const iconOnRight = n.side === -1;
          const techs = journeySteps[i].techs;
          // A timeline inteira é ESCRUBADA -- "duração" aqui não é tempo
          // real, é uma fração do scroll do checkpoint inteiro. Uma janela
          // pequena o bastante pra nunca cortar o texto (tentativa
          // anterior: 0.032/0.006 fixos) acaba correspondendo a pouquíssimo
          // scroll real -- o grupo inteiro de ícones acontecia dentro de um
          // único "tique" de roda do mouse, o que lê como um susto, não
          // como leveza. E como o `stagger` era FIXO por tecnologia, um
          // checkpoint com mais ícones (monetização, 4) sempre demorava
          // proporcionalmente mais pra terminar, sem folga extra pra
          // compensar -- o corte de texto reportado.
          //
          // A correção: um orçamento de scroll FIXO para o grupo inteiro
          // (`GROUP_BUDGET`), não por ícone -- todo checkpoint, com 3 ou 4
          // tecnologias, termina de revelar dentro da MESMA janela seguinda.
          // Dentro desse orçamento, cada ícone recebe uma duração própria
          // generosa o bastante pra ler como um movimento de verdade (voo +
          // pouso), e o `stagger` entre eles é uma FRAÇÃO dessa duração
          // (não um valor fixo) -- o próximo parte enquanto o anterior
          // ainda está visivelmente em voo, criando um efeito cascata: "um
          // de cada vez", nunca todos ao mesmo tempo, mas também nunca uma
          // espera longa entre um e outro.
          const GROUP_BUDGET = TOTAL * 0.045;
          const CASCADE_RATIO = 0.45;
          const techCount = techs.length;
          const techWindow =
            GROUP_BUDGET / (Math.max(0, techCount - 1) * CASCADE_RATIO + 0.93);
          const stagger = techWindow * CASCADE_RATIO;

          techs.forEach((_tech, j) => {
            const icon = techIconRefs.current[i]?.[j];
            const wire = techFanWireRefs.current[i]?.[j];
            const link = j > 0 ? techLinkWireRefs.current[i]?.[j - 1] : null;
            if (!icon) return;
            const slot = iconSlot(n, j, techs.length, iconOnRight);
            const techAt = at + j * stagger;

            // O fio SEMPRE nasce no módulo (x1/y1 = n.x/n.y, já assim no
            // JSX) e cresce em direção ao ícone via stroke-dashoffset (mesma
            // técnica da trilha principal) -- o rastro que o ícone deixa
            // pra trás ao sair de dentro da caixa.
            if (wire) {
              const wireLen = Math.hypot(slot.x - n.x, slot.y - n.y);
              gsap.set(wire, { strokeDasharray: wireLen, strokeDashoffset: wireLen });
              tl.set(wire, { autoAlpha: 1 }, techAt);
              tl.to(
                wire,
                { strokeDashoffset: 0, ease: "power2.out", duration: techWindow * 0.7 },
                techAt,
              );
            }
            // O ícone nasce DENTRO do módulo -- posição, opacidade e escala
            // partem do próprio pad (`n.x`/`n.y`, o quadrado verde), não da
            // palavra na lista de tecnologias. Um único tween (não mais um
            // par cópia-de-texto + ícone) sai do centro do módulo, pequeno
            // e invisível, e cresce até o tamanho final na posição de
            // repouso -- lê como algo se desdobrando de dentro da caixa,
            // não como um elemento novo surgindo do nada. Por ser um
            // `fromTo` dentro da timeline escrubada, rolar pra trás desfaz
            // a MESMA interpolação ao contrário -- o ícone visivelmente
            // encolhe e é puxado de volta pra dentro do módulo, sem
            // precisar de nenhuma lógica extra pra reversão. Ease
            // `power2.out` (nunca `back.out`): cresce até o tamanho final e
            // para, sem ultrapassar -- ultrapassar seria literalmente um
            // pulinho, o "jogado ali" já reportado antes.
            tl.fromTo(
              icon,
              { left: n.x, top: n.y, autoAlpha: 0, scale: 0.25 },
              {
                left: slot.x,
                top: slot.y,
                autoAlpha: 1,
                scale: 1,
                duration: techWindow * 0.85,
                ease: "power2.out",
              },
              techAt,
            );
            if (link) {
              tl.to(link, { autoAlpha: 1, duration: techWindow * 0.25 }, techAt + techWindow * 0.7);
            }
          });
        }
      });

      // O terminus. A energia que percorreu a trilha inteira vira ouro, o
      // brilho abre no módulo e o selo nasce dali. Três tweens, e só.
      const goldAt = (termLen / L) * TOTAL - TOTAL * 0.06;
      tl.to(
        goldRef.current,
        { strokeDashoffset: L - termLen, ease: "power1.inOut", duration: TOTAL * 0.075 },
        goldAt,
      );
      tl.to(
        terminusGlowRef.current,
        { autoAlpha: 1, duration: TOTAL * 0.04, ease: "power2.out" },
        (termLen / L) * TOTAL - TOTAL * 0.01,
      );
      tl.to(
        sealRef.current,
        { autoAlpha: 1, scale: 1, duration: TOTAL * 0.045, ease: "expo.out" },
        (termLen / L) * TOTAL + TOTAL * 0.005,
      );

      // Respiração contínua, independente do scroll -- a fonte e a cabeça
      // viajante nunca ficam paradas. Anima o RAIO (`attr:{r}`), não
      // `scale`: escalar um `<circle>` posicionado por `cx`/`cy` exige
      // acertar `transformOrigin` no ponto exato, e o GSAP resolveu
      // "center" errado aqui (o círculo ganhava um `translate` extra e ia
      // parar fora da trilha). Animar o raio direto não tem essa categoria
      // de bug.
      gsap.to(originPulseRef.current, {
        attr: { r: 4 },
        opacity: 0.55,
        duration: 1.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to(headHaloRef.current, {
        attr: { r: 21 },
        opacity: 0.55,
        duration: 1.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, section);

    // O progresso: lido de `getBoundingClientRect` a cada frame -- sempre a
    // posição REAL. Uma mola CRITICAMENTE amortecida, não um `lerp` simples
    // nem uma mola sub-amortecida: uma primeira tentativa aqui (aceleração
    // + atrito multiplicativo) tinha raízes complexas -- ultrapassava o
    // alvo e voltava, o "solavanco" reportado, só que sutil o bastante pra
    // não ser óbvio olhando o resultado, só analisando o sistema. A fórmula
    // abaixo (Driscoll/Bosch: atualização exata de uma mola criticamente
    // amortecida) converge sem ultrapassar por construção, E leva o tempo
    // real entre frames em conta -- sem isso, a física muda de
    // comportamento dependendo da taxa de quadros do dispositivo, o que é
    // o oposto de "contínua e refinada".
    // OMEGA alto (26, tentativa anterior) deixava a mola grudada perto
    // demais do scroll bruto -- e a maioria das rodas de mouse/trackpad no
    // Windows entrega scroll em DEGRAUS discretos, não uma rampa contínua.
    // Uma mola pouco atrasada mal filtra esses degraus: ela "salta" atrás
    // de cada um quase de imediato, e é ESSA sucessão de pequenos saltos
    // que lê como robotizado, mesmo a curva sendo matematicamente suave.
    // OMEGA mais baixo faz a mola absorver vários degraus como um único
    // deslize contínuo (mais inércia, mais "peso") -- ao custo de mais
    // atraso bruto. Isso só é seguro agora porque o orçamento do grupo de
    // ícones acima (`GROUP_BUDGET`) parou de depender de um atraso mínimo
    // pra não cortar texto -- as duas mudanças são um par: uma dá folga
    // (ícones terminam bem dentro da janela do checkpoint), a outra gasta
    // parte dela em suavidade.
    let raf = 0;
    let current = 0;
    let velocity = 0;
    let awake = false;
    let lastT = 0;
    const OMEGA = 27; // responsividade -- maior number, mais "rígido"

    function frame(now: number) {
      const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 1 / 60);
      lastT = now;

      const rect = section!.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const target =
        scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;

      const x = OMEGA * dt;
      const expTerm = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = current - target;
      const temp = (velocity + OMEGA * change) * dt;
      velocity = (velocity - OMEGA * temp) * expTerm;
      current = target + (change + temp) * expTerm;

      tlInstance?.progress(Math.max(0, Math.min(1, current)));
      raf = requestAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.some((e) => e.isIntersecting);
        if (intersecting && !awake) {
          awake = true;
          // Sem isto, `current` acorda em 0 mesmo que o usuário já tenha
          // scrollado bem além do início da seção antes do
          // `IntersectionObserver` disparar (rootMargin de 50% dá folga
          // de sobra pra isso acontecer num scroll rápido) -- um salto
          // inicial artificial que a mola then precisa "recuperar" correndo,
          // consumindo justamente a margem de segurança do primeiro
          // checkpoint. Sincronizar `current` com a posição real ANTES do
          // primeiro frame elimina esse transiente sem tocar em como a
          // mola se comporta depois disso.
          const rect = section!.getBoundingClientRect();
          const scrollable = rect.height - window.innerHeight;
          current =
            scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;
          raf = requestAnimationFrame(frame);
        } else if (intersecting && awake && !raf) {
          // De volta à folga do `rootMargin` depois de ter sido pausada
          // abaixo -- a mola retoma de onde ficou e persegue o alvo atual
          // normalmente, sem precisar resincronizar (é exatamente o que
          // ela já faz sozinha para qualquer salto grande de scroll).
          raf = requestAnimationFrame(frame);
        } else if (!intersecting && awake && raf) {
          // Fora da folga de 50% em ambas as direções -- sem isso, a leitura
          // de `getBoundingClientRect` e o `tlInstance.progress()` desta
          // seção continuavam rodando a cada frame pelo resto do scroll da
          // página, mesmo com a Jornada muito longe da tela.
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    observer.observe(section);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      ctx.revert();
    };
  }, [trace, size, terminusIdx]);

  const narrow = size.w > 0 && size.w < 760;

  return (
    <section
      ref={sectionRef}
      aria-label="A jornada do aluno DevClub"
      className="relative"
      style={{ height: `${SECTION_VH}vh` }}
    >
      {/* Cabeçalho próprio da seção -- em fluxo normal, no topo esquerdo,
          igual a qualquer outra seção do site (ver `DevClubCore.tsx`).
          Antes flutuava centralizado por cima da trilha,
          o que fazia a peça inteira ler como "encaixada num cartão" em vez
          de uma superfície que nasce e desce livremente. */}
      <div className="relative z-20 mx-auto max-w-6xl px-6 pt-20 sm:pt-24">
        <p className="mb-3 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Formações DevClub
        </p>
        <h2 className="max-w-md font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Do primeiro código ao diploma.
        </h2>
      </div>

      {trace && (
        <svg
          className="absolute inset-0 h-full w-full"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="jd-term">
              <stop offset="0" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="0.6" stopColor="#ffd700" stopOpacity="0.1" />
              <stop offset="1" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
            {/* A trilha nasce e morre no escuro, nunca num corte reto --
                é o que tira a sensação de "seção dentro de um retângulo".
                Só a copa (o traço em si) usa essa máscara; a fonte e o
                brilho do terminus continuam sempre nítidos. */}
            <linearGradient id="jd-fade-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="0.025" stopColor="white" stopOpacity="1" />
              <stop offset="0.975" stopColor="white" stopOpacity="1" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="jd-fade" maskContentUnits="objectBoundingBox">
              <rect x="0" y="0" width="1" height="1" fill="url(#jd-fade-grad)" />
            </mask>
          </defs>

          <g mask="url(#jd-fade)">
            <path
              d={trace.d}
              fill="none"
              stroke="#39d572"
              strokeOpacity="0.13"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              ref={bloomRef}
              d={trace.d}
              fill="none"
              stroke="#39d572"
              strokeOpacity="0.16"
              strokeWidth="7"
              strokeLinejoin="round"
              style={{ strokeDasharray: trace.total, strokeDashoffset: trace.total }}
            />
            <path
              ref={liveRef}
              d={trace.d}
              fill="none"
              stroke="#39d572"
              strokeOpacity="0.95"
              strokeWidth="1.6"
              strokeLinejoin="round"
              style={{ strokeDasharray: trace.total, strokeDashoffset: trace.total }}
            />
            <path
              ref={goldRef}
              d={trace.d}
              fill="none"
              stroke="#ffd700"
              strokeOpacity="0.95"
              strokeWidth="1.8"
              strokeLinejoin="round"
              style={{ strokeDasharray: trace.total, strokeDashoffset: trace.total }}
            />
          </g>

          {/* A fonte: sempre acesa, o objeto que explica de onde a trilha
              parte -- fora da máscara, nunca esmaece. */}
          <circle
            cx={trace.origin.x}
            cy={trace.origin.y}
            r="9"
            fill="none"
            stroke="#39d572"
            strokeWidth="1.4"
            strokeOpacity="0.8"
          />
          <circle
            ref={originPulseRef}
            cx={trace.origin.x}
            cy={trace.origin.y}
            r="3"
            fill="#c8ffdf"
            style={{ filter: "drop-shadow(0 0 6px rgba(57,213,114,0.85))" }}
          />

          {terminusIdx >= 0 && trace.nodes[terminusIdx] && (
            <circle
              ref={terminusGlowRef}
              cx={trace.nodes[terminusIdx].x}
              cy={trace.nodes[terminusIdx].y}
              r={130}
              fill="url(#jd-term)"
              opacity="0"
            />
          )}

          {/* Os módulos -- um pad quadrado na trilha, apagado até a
              energia chegar -- e, quando aquele checkpoint tem
              tecnologias, os fios que ligam o módulo aos ícones do lado
              oposto do texto. */}
          {trace.nodes.map((n, i) => {
            const isTerm = i === terminusIdx;
            const s = isTerm ? 17 : 11;
            const techs = journeySteps[i].techs;
            // Ícones sempre do lado OPOSTO ao texto -- texto e ícones no
            // mesmo lado era o bug reportado, gerando poluição visual.
            // `alignRight` (texto à esquerda do módulo) e o lado dos
            // ícones são o MESMO booleano por construção: texto à esquerda
            // -> ícones à direita, e vice-versa.
            const onRight = n.side === -1;
            return (
              <g key={i}>
                <rect
                  ref={(el) => {
                    padRefs.current[i] = el;
                  }}
                  x={n.x - s}
                  y={n.y - s}
                  width={s * 2}
                  height={s * 2}
                  rx={3}
                  fill="#0a0a0a"
                  stroke={isTerm ? "#ffd700" : "#39d572"}
                  strokeWidth={isTerm ? 1.8 : 1.4}
                  opacity="0.22"
                />
                {!narrow &&
                  techs.map((tech, j) => {
                    const slot = iconSlot(n, j, techs.length, onRight);
                    return (
                      <line
                        key={tech}
                        ref={(el) => {
                          (techFanWireRefs.current[i] ??= [])[j] = el;
                        }}
                        x1={n.x}
                        y1={n.y}
                        x2={slot.x}
                        y2={slot.y}
                        stroke="#39d572"
                        strokeOpacity="0.4"
                        strokeWidth="1"
                        opacity="0"
                      />
                    );
                  })}
                {!narrow &&
                  techs.slice(1).map((tech, j) => {
                    const a = iconSlot(n, j, techs.length, onRight);
                    const b = iconSlot(n, j + 1, techs.length, onRight);
                    return (
                      <line
                        key={tech}
                        ref={(el) => {
                          (techLinkWireRefs.current[i] ??= [])[j] = el;
                        }}
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="#39d572"
                        strokeOpacity="0.55"
                        strokeWidth="1"
                        opacity="0"
                      />
                    );
                  })}
              </g>
            );
          })}

          {/* A cabeça viajante: um halo largo e suave por baixo e um
              núcleo pequeno e nítido por cima -- mesma dupla barata usada
              na trilha, só que pontual. `cx`/`cy` começam na FONTE (mesmo
              ponto de `originPulseRef` acima), não omitidos -- sem valor
              inicial o SVG assume `cx="0" cy="0"`, e o halo de raio 16 +
              blur(6px) rendeririam como um borrão verde colado no canto
              superior-esquerdo até o primeiro `onUpdate` do GSAP corrigir a
              posição (só dispara quando o progresso do scroll muda pela
              primeira vez -- no primeiro frame, ou ao voltar pro topo da
              seção, ainda não tinha disparado nenhuma vez). */}
          <circle
            ref={headHaloRef}
            cx={trace.origin.x}
            cy={trace.origin.y}
            r="16"
            fill="#39d572"
            opacity="0.28"
            style={{ filter: "blur(6px)" }}
          />
          <circle
            ref={headRef}
            cx={trace.origin.x}
            cy={trace.origin.y}
            r="4"
            fill="#c8ffdf"
            style={{ filter: "drop-shadow(0 0 8px rgba(57,213,114,0.9))" }}
          />
        </svg>
      )}

      {trace &&
        journeySteps.map((step, i) => {
          const n = trace.nodes[i];
          const isTerm = i === terminusIdx;
          const alignRight = n.side === -1;
          // Mesmo booleano que no SVG: texto à esquerda -> ícones à
          // direita, texto à direita -> ícones à esquerda. NUNCA o mesmo
          // lado -- era exatamente esse o bug reportado.
          const iconOnRight = alignRight;
          const width = narrow ? size.w - n.x - 56 : 380;
          const left = alignRight ? n.x - 34 - width : n.x + 34;
          return (
            <div key={step.id}>
              <div
                className="pointer-events-none absolute z-10"
                style={{ left, top: n.y, width }}
              >
                {/* Wrapper estático faz o centramento vertical; o GSAP
                    anima só o filho. Misturar `transform` do Tailwind com
                    `transform` animado pelo GSAP no MESMO elemento faz um
                    sobrescrever o outro. */}
                <div style={{ transform: "translateY(-50%)" }}>
                  <div
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                    className={alignRight ? "text-right" : "text-left"}
                  >
                    {isTerm && (
                      <div
                        ref={sealRef}
                        className={cn(
                          "relative mb-2 h-11 w-11 opacity-0",
                          alignRight ? "ml-auto" : "mr-auto",
                        )}
                      >
                        <Image
                          src="/assets/bento/selo-mec.png"
                          alt=""
                          fill
                          sizes="44px"
                          className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                        />
                      </div>
                    )}
                    <h3
                      className={cn(
                        "font-heading text-lg font-semibold sm:text-xl",
                        isTerm ? "text-gold" : "text-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    {step.techs.length > 0 && (
                      <div
                        className={cn(
                          "mt-3 flex flex-wrap gap-x-3 gap-y-1",
                          alignRight ? "justify-end" : "justify-start",
                        )}
                      >
                        {step.techs.map((tech) => (
                          <span
                            key={tech}
                            className="font-mono text-[10px] tracking-wide text-accent/55"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!narrow &&
                step.techs.map((tech, j) => {
                  const slot = iconSlot(n, j, step.techs.length, iconOnRight);
                  const icon = TECH_ICON[tech];
                  return (
                    <div
                      key={tech}
                      ref={(el) => {
                        (techIconRefs.current[i] ??= [])[j] = el;
                      }}
                      className="pointer-events-none absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-accent/25 bg-black/40 opacity-0 backdrop-blur-sm"
                      style={{
                        left: slot.x,
                        top: slot.y,
                        boxShadow: "0 0 10px 1px rgba(57,213,114,0.22)",
                      }}
                      title={tech}
                    >
                      {icon?.kind === "asset" ? (
                        <div className="relative h-4 w-4">
                          <Image src={icon.src} alt="" fill sizes="16px" className="object-contain" />
                        </div>
                      ) : icon?.kind === "lucide" ? (
                        <icon.Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                      ) : null}
                    </div>
                  );
                })}
            </div>
          );
        })}
    </section>
  );
}
