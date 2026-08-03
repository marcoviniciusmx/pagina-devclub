"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { RotateCw } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

// Decorative authentication mark for the diploma footer -- not a real QR
// code, just a fixed pixel matrix so it renders identically on server and
// client (Math.random() here would cause a hydration mismatch).
const QR_PATTERN = [
  [1, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 1],
  [0, 1, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 1],
];

const HOVER_SPRING = { type: "spring", stiffness: 180, damping: 22 } as const;
const SETTLE_SPRING = { type: "spring", stiffness: 210, damping: 20 } as const;
const REDUCED_TWEEN = { type: "tween", duration: 0.15, ease: "easeOut" } as const;

// Degrees of rotateX/rotateY per pixel of drag -- tuned so pulling roughly
// a third of the card's own width completes a full 90 degrees, matching
// "arrastei pouco -> 20 graus, arrastei bastante -> 180 graus" directly off
// the pointer, not a fixed-duration animation.
const DRAG_SENSITIVITY = 0.45;
// The "it's not a rigid sheet" flex: a small extra rotateZ proportional to
// how fast the pointer is currently moving, clamped, then eased back to 0
// on release -- 2-5deg per the brief.
const FLEX_VELOCITY_SCALE = 0.6;
const MAX_FLEX_DEG = 4;

type DragState = {
  pointerId: number;
  originX: number;
  originY: number;
  startRX: number;
  startRY: number;
  lastX: number;
  lastT: number;
};

// Treats the certificate as a held physical object rather than a canned
// 180deg flip: rotation tracks the pointer 1:1 while held (no spring lag --
// "a posição do mouse controla diretamente a rotação"), and only on release
// does it decide, from wherever it happens to be, whether to spring back to
// front or complete on to the back. `backface-visibility: hidden` on both
// faces (see the JSX) does the actual face-swap for free at the geometric
// 90deg crossing, for any compound X+Y rotation -- no manual "which side is
// showing" bookkeeping needed for the *visual*; the geometry below is only
// for deciding the *release* target.
function useCardFlip() {
  const reduceMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const rotateZ = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  // Uma vez só, nunca reseta -- controla a dica de "dá pra arrastar"
  // (ver `DragHint` abaixo): ela existe pra quem ainda não descobriu a
  // interação, então some no primeiro gesto real e não deve voltar depois,
  // nem se o usuário devolver o card exatamente à posição de origem.
  const [hasInteracted, setHasInteracted] = useState(false);
  const drag = useRef<DragState | null>(null);
  // Releasing the pointer capture below fires a real `pointerleave` on this
  // element whenever the cursor ends up outside its bounds (the common
  // case after a real drag) -- but that event lands on a LATER tick, after
  // `drag.current` is already cleared, so the idle-hover reset below would
  // otherwise stomp the just-computed settle target back to (0, 0) on every
  // single release. This suppresses exactly that one spurious leave.
  const suppressLeave = useRef(false);
  // Where the card is currently resting (0 = front, +-180 = back, and any
  // further multiple of 180 after repeated flips) -- the idle hover-tilt
  // wobbles a few degrees AROUND this, not around a hardcoded 0, otherwise
  // just hovering over a card resting on its back would drag it back
  // towards the front.
  const restRX = useRef(0);
  const restRY = useRef(0);

  const settleSpring = reduceMotion ? REDUCED_TWEEN : SETTLE_SPRING;

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    // Grabs instantly, with nothing else contesting the gesture: without
    // this, the browser's own default mousedown behavior (start a text
    // selection, or -- worse -- a native drag-ghost of whichever <img> the
    // pointer happens to be over) sometimes wins the race against our own
    // pointer handling, which is what read as "sometimes it just doesn't
    // respond" -- it wasn't slow, the browser was doing something else
    // with that same pointerdown instead.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setHasInteracted(true);
    drag.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startRX: rotateX.get(),
      startRY: rotateY.get(),
      lastX: event.clientX,
      lastT: performance.now(),
    };
    setIsDragging(true);
  }

  function onPointerMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const d = drag.current;
    if (!d) {
      // Idle hover-tilt -- unchanged from before, just re-triggered as an
      // imperative spring per move instead of a permanently-wired one, so
      // it can share the same motion values as the drag physics below.
      const rect = event.currentTarget.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      animate(rotateY, restRY.current + px * 10, HOVER_SPRING);
      animate(rotateX, restRX.current + py * -10, HOVER_SPRING);
      return;
    }

    rotateY.set(d.startRY + (event.clientX - d.originX) * DRAG_SENSITIVITY);
    rotateX.set(d.startRX - (event.clientY - d.originY) * DRAG_SENSITIVITY);

    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    const vx = (event.clientX - d.lastX) / dt;
    rotateZ.set(
      Math.max(-MAX_FLEX_DEG, Math.min(MAX_FLEX_DEG, vx * FLEX_VELOCITY_SCALE)),
    );
    d.lastX = event.clientX;
    d.lastT = now;
  }

  function settleTo(rx: number, ry: number) {
    restRX.current = rx;
    restRY.current = ry;
    animate(rotateX, rx, settleSpring);
    animate(rotateY, ry, settleSpring);
    animate(rotateZ, 0, settleSpring);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    suppressLeave.current = true;
    if (event.currentTarget.hasPointerCapture(d.pointerId)) {
      event.currentTarget.releasePointerCapture(d.pointerId);
    }
    drag.current = null;
    setIsDragging(false);
    setTimeout(() => {
      suppressLeave.current = false;
    }, 100);

    const rx = rotateX.get();
    const ry = rotateY.get();
    // Whichever axis the pointer actually travelled further on this session
    // is the one treated as "the flip" -- it snaps to the nearest resting
    // multiple of 180 in the direction already being dragged, continuing
    // the motion rather than reversing it. The other axis reverts to
    // wherever it was before this drag started; a diagonal drag still
    // *tilts* both, but only one of them was ever meant to flip the card.
    const dominantIsY = Math.abs(ry - d.startRY) >= Math.abs(rx - d.startRX);
    settleTo(
      dominantIsY ? d.startRX : Math.round(rx / 180) * 180,
      dominantIsY ? Math.round(ry / 180) * 180 : d.startRY,
    );
  }

  function onPointerLeave() {
    if (drag.current || suppressLeave.current) return;
    if (reduceMotion) return;
    animate(rotateX, restRX.current, HOVER_SPRING);
    animate(rotateY, restRY.current, HOVER_SPRING);
  }

  // Keyboard/reduced-motion fallback: toggle to whichever resting face is
  // opposite the current one, using the same geometric test the pointer
  // path uses (product of the cosines is negative once more of the back is
  // facing the camera than the front, correctly accounting for compound
  // rotation).
  function toggleFace() {
    setHasInteracted(true);
    const rx = rotateX.get();
    const ry = rotateY.get();
    const facingBack =
      Math.cos((rx * Math.PI) / 180) * Math.cos((ry * Math.PI) / 180) < 0;
    settleTo(
      Math.round(rx / 180) * 180,
      Math.round(ry / 180) * 180 + (facingBack ? -180 : 180),
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleFace();
  }

  function onClick() {
    if (!reduceMotion) return; // pointer users flip by dragging
    toggleFace();
  }

  return {
    rotateX,
    rotateY,
    rotateZ,
    isDragging,
    hasInteracted,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onKeyDown,
    onClick,
  };
}

// Dica de que o certificado é interativo -- sem ela, a maioria só vê um
// cartão parado (ou, no máximo, um tilt de hover que passa despercebido) e
// nunca descobre que dá pra arrastar. Um selo pequeno, ancorado à borda
// inferior do card (nunca sobre o conteúdo do "documento" em si, pra não
// quebrar a ilusão de certificado real), com o mesmo vocabulário visual do
// resto do cartão (mono, borda accent/25, vidro escuro). O ícone balança
// sutilmente pra sugerir rotação sem nunca girar de verdade (isso pareceria
// um spinner de carregamento) -- e a dica inteira desaparece pra sempre no
// primeiro gesto real, então nunca compete com o conteúdo pra quem já sabe.
function DragHint({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none absolute -bottom-3.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accent/25 bg-black/70 py-1.5 pr-3 pl-2 whitespace-nowrap shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      <motion.span
        animate={reduceMotion ? undefined : { rotate: [0, -18, 14, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
        className="flex h-4 w-4 items-center justify-center"
      >
        <RotateCw className="h-3 w-3 text-accent" strokeWidth={2.25} />
      </motion.span>
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
        {reduceMotion ? "Clique para virar" : "Arraste para virar"}
      </span>
    </motion.div>
  );
}

// Corner scanner brackets + the traveling scanline -- identical chrome on
// both faces so the object reads as one continuous card, not two different
// designs glued back to back.
function CardFrame() {
  return (
    <>
      <span className="absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-accent/70" />
      <span className="absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-accent/70" />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-accent/70" />
      <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-accent/70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-px bg-accent shadow-[0_0_16px_4px_rgba(57,213,114,0.7)] [animation:cert-scanline_3.4s_linear_infinite]"
      />
    </>
  );
}

const FACE_CLASS =
  "rounded-2xl border border-accent/30 bg-black/50 p-5 shadow-[0_20px_70px_-25px_rgba(57,213,114,0.5)] backdrop-blur-md sm:p-6 [backface-visibility:hidden]";

function MecCard() {
  const {
    rotateX,
    rotateY,
    rotateZ,
    isDragging,
    hasInteracted,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onKeyDown,
    onClick,
  } = useCardFlip();

  return (
    <div className="relative flex h-full min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-border-soft bg-surface/40 p-8 sm:p-10">
      {/* Ambient glow only -- no separate frame graphic to misalign with
          the diploma card. The neon "scanner" frame lives on the card
          itself (corner brackets + border below) so it can never drift out
          of alignment with its own content. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 -bottom-24 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="max-w-lg">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Formação com Chancela Oficial
        </p>
        <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
          MBA e Pós-Graduação em Tecnologia reconhecidos pelo{" "}
          <span className="text-accent text-glow">MEC</span>
        </h3>
      </div>

      {/* Diploma holográfico -- tratado como objeto físico: clique e segure
          para "pegar" o certificado, arraste para girar (rotação 1:1 com o
          mouse, nunca um flip automático de 180deg -- ver useCardFlip). O
          verso aparece sozinho ao cruzar ~90deg via `backface-visibility`,
          não como uma revelação pós-animação. */}
      <div
        style={{ perspective: 1200 }}
        className="relative mx-auto mt-8 w-full max-w-md flex-1"
      >
        <motion.div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          onClick={onClick}
          tabIndex={0}
          role="button"
          aria-label="Certificado do MBA DevClub -- arraste ou pressione Enter para ver o verso"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          style={{
            rotateX,
            rotateY,
            rotateZ,
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
            touchAction: "none",
            cursor: isDragging ? "grabbing" : "grab",
            // A held physical card doesn't let you highlight the text
            // printed on it, and it definitely doesn't come loose as a
            // draggable image -- both are default browser behaviors that
            // would otherwise contest the same pointerdown as our own drag
            // handling (see the note in onPointerDown).
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitUserDrag: "none",
          } as React.CSSProperties}
          className="relative w-full rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {/* Frente -- em fluxo normal, define a altura que o verso (abaixo,
              absoluto) preenche. */}
          <div className={`relative ${FACE_CLASS}`}>
            <CardFrame />
            <div className="relative flex flex-col gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent/70">
                  Certificado Digital · Validado por IA
                </p>
                <h4 className="mt-1.5 font-heading text-base leading-snug font-semibold text-foreground sm:text-lg">
                  DIPLOMA DE MBA E PÓS-GRADUAÇÃO
                </h4>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Concedido a
                </p>
                <p className="font-heading text-base font-medium text-accent">
                  ALUNO DEVCLUB
                </p>
              </div>

              {/* Rodapé: hash/QR + selo do MEC embutido como marca de
                  segurança -- dentro do padding do card, nunca sobre a
                  borda. */}
              <div className="flex items-end justify-between gap-4 border-t border-border-soft pt-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[8px] tracking-wide text-muted-foreground/80">
                    HASH 0x8F3A9C21B6E4
                  </span>
                  <div className="grid grid-cols-6 gap-[1.5px] rounded-[2px] bg-black/50 p-[3px]">
                    {QR_PATTERN.flat().map((cell, i) => (
                      <div
                        key={i}
                        className={`h-[3px] w-[3px] ${cell ? "bg-accent" : "bg-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                  <Image
                    src="/assets/bento/selo-mec.png"
                    alt="Selo do Ministério da Educação"
                    fill
                    sizes="64px"
                    draggable={false}
                    className="object-contain [animation:mec-seal-pulse_3s_ease-in-out_infinite]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verso -- absoluto, preenche a mesma área da frente; pré-girado
              180deg no eixo Y para que, com `backface-visibility:hidden`
              nas duas faces, o navegador resolva sozinho qual delas está de
              frente pra câmera em qualquer rotação composta. */}
          <div
            className={`absolute inset-0 ${FACE_CLASS}`}
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Textura de segurança sutil -- hachura diagonal fina, o tipo
                de padrão de "papel de segurança" que diferencia o verso de
                um certificado sem competir com o conteúdo. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--color-accent) 0px, var(--color-accent) 1px, transparent 1px, transparent 10px)",
              }}
            />
            <CardFrame />

            <div className="relative flex h-full flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="relative h-6 w-6 shrink-0">
                  <Image
                    src="/assets/hero/logo-devclub.svg"
                    alt=""
                    fill
                    sizes="24px"
                    draggable={false}
                    className="object-contain"
                  />
                </div>
                <span className="font-heading text-sm font-semibold tracking-wide text-foreground">
                  DevClub<span className="align-super text-[8px] text-accent">®</span>
                </span>
              </div>

              {/* O centro de gravidade do verso -- não é mais um bloco de
                  dados, é a marca. #TAPAGO como peça de identidade, não uma
                  linha de texto perdida no meio de outras informações. */}
              <div className="flex flex-1 flex-col items-start justify-center gap-2">
                <p className="font-heading text-3xl font-bold tracking-tight text-accent text-glow sm:text-4xl">
                  #TAPAGO
                </p>
                <p className="text-sm text-muted-foreground">
                  Transformando esforço em carreira.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border-soft pt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  MBA · Pós-Graduação
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  Reconhecido pelo MEC
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  Validade em todo o território nacional
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fora do `motion.div` que gira -- de propósito, pra nunca
            acompanhar a rotação 3D do card e continuar legível o tempo
            todo, inclusive no meio de um arraste. */}
        <DragHint visible={!hasInteracted} />
      </div>

      <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Diploma oficial ao final da jornada, com validade em todo o
        território nacional.
      </p>
    </div>
  );
}

const PLATFORM_CODE = `const dev = new DevClub();\ndev.transformCareer();`;
const CODE_KEYWORDS = new Set(["const", "new"]);
const CODE_IDENTIFIERS = new Set(["dev", "transformCareer"]);

function highlightCode(text: string) {
  return text.split(/(\s+|[().;])/g).map((token, index) => {
    if (token === "") return null;
    if (CODE_KEYWORDS.has(token)) {
      return (
        <span key={index} className="text-[#c792ea]">
          {token}
        </span>
      );
    }
    if (token === "DevClub") {
      return (
        <span key={index} className="text-accent">
          {token}
        </span>
      );
    }
    if (CODE_IDENTIFIERS.has(token)) {
      return (
        <span key={index} className="text-[#82aaff]">
          {token}
        </span>
      );
    }
    if (token === "(" || token === ")" || token === ";" || token === ".") {
      return (
        <span key={index} className="text-muted-foreground">
          {token}
        </span>
      );
    }
    return <span key={index}>{token}</span>;
  });
}

function TypewriterCode() {
  const reduceMotion = useReducedMotion();
  // Sempre começa vazio -- igual em servidor e cliente -- e só decide se
  // mostra o texto pronto (reduced motion) ou digita aos poucos dentro do
  // efeito abaixo, que roda apenas depois da hidratação. Decidir isso já
  // no useState (como antes) fazia a primeira renderização do cliente
  // divergir do HTML do servidor sempre que o SO do visitante já estivesse
  // com "reduzir movimento" ativado -- o mesmo tipo de mismatch que
  // Hero.tsx evita com useSyncExternalStore para o portal do header.
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    // Reduced motion never touches `displayed` at all -- the string below
    // is derived straight from `reduceMotion` at render time instead, so
    // there's nothing here to synchronize (avoids a setState-in-effect that
    // would otherwise fire on the very first paint after hydration).
    if (reduceMotion) return;

    let index = 0;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (index <= PLATFORM_CODE.length) {
        setDisplayed(PLATFORM_CODE.slice(0, index));
        index += 1;
        timeoutId = setTimeout(tick, 45);
      } else {
        timeoutId = setTimeout(() => {
          index = 0;
          setDisplayed("");
          tick();
        }, 2200);
      }
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  return (
    <div className="glass w-full max-w-[9.5rem] rounded-lg border border-border-soft p-3 shadow-xl sm:max-w-[13rem]">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
        <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
        <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
      </div>
      <pre className="min-h-[2.5rem] font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-foreground">
        {highlightCode(reduceMotion ? PLATFORM_CODE : displayed)}
        <span className="ml-0.5 inline-block h-[10px] w-[6px] animate-pulse bg-accent align-middle" />
      </pre>
    </div>
  );
}

function useLayeredParallax() {
  const reduceMotion = useReducedMotion();
  const pxRaw = useMotionValue(0);
  const pyRaw = useMotionValue(0);
  const px = useSpring(pxRaw, { stiffness: 150, damping: 18 });
  const py = useSpring(pyRaw, { stiffness: 150, damping: 18 });

  // Front layer travels roughly 3x further than the back layer for each
  // mouse move, so the two mockups visibly separate in depth instead of
  // sliding together as one flat plane.
  const backX = useTransform(px, [-0.5, 0.5], [-5, 5]);
  const backY = useTransform(py, [-0.5, 0.5], [-5, 5]);
  const frontX = useTransform(px, [-0.5, 0.5], [-16, 16]);
  const frontY = useTransform(py, [-0.5, 0.5], [-16, 16]);

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pxRaw.set((event.clientX - rect.left) / rect.width - 0.5);
    pyRaw.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    pxRaw.set(0);
    pyRaw.set(0);
  };

  return { backX, backY, frontX, frontY, onMouseMove, onMouseLeave };
}

function PlatformCard() {
  const { backX, backY, frontX, frontY, onMouseMove, onMouseLeave } =
    useLayeredParallax();

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="glass group relative flex h-full min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl p-8 transition-shadow duration-500 ease-out hover:shadow-[0_0_60px_-14px_rgba(57,213,114,0.5)] sm:p-10"
    >
      <span
        aria-hidden="true"
        className="border-beam pointer-events-none opacity-0 transition-opacity duration-300 [animation-play-state:paused] group-hover:opacity-100 group-hover:[animation-play-state:running]"
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Plataforma & Prática
          </p>
          <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
            Ambiente real de código, do primeiro dia
          </h3>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-black/30 px-2.5 py-1 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[9px] tracking-wide text-muted-foreground">
            AMBIENTE ONLINE
          </span>
        </div>
      </div>

      <div
        style={{ perspective: 1000 }}
        className="relative mt-10 h-72 w-full sm:h-64"
      >
        <motion.div
          style={{ x: backX, y: backY, z: 0 }}
          className="glow-accent absolute inset-x-2 bottom-0 h-40 overflow-hidden rounded-xl border border-border shadow-2xl sm:h-52"
        >
          <Image
            src="/assets/bento/interface-devclub.png"
            alt="Interface da plataforma DevClub"
            fill
            sizes="(min-width: 1024px) 440px, 90vw"
            className="object-cover object-top"
          />
        </motion.div>
        <motion.div
          style={{ x: frontX, y: frontY, z: 40 }}
          className="absolute inset-x-0 top-0 h-32 w-[68%] overflow-hidden rounded-xl border border-border-soft shadow-xl sm:h-48 sm:w-[85%]"
        >
          <Image
            src="/assets/bento/playground-devlcub.png"
            alt="Playground de código da DevClub"
            fill
            sizes="(min-width: 1024px) 380px, 80vw"
            className="object-cover object-top"
          />
        </motion.div>

        {/* Pinned fully inside the card's own bounds on mobile (no
            negative offset) so it never crops against the card's rounded
            corner at narrow widths -- the "poking out" flourish only
            applies from `sm` up, where there's enough width to spare. */}
        <div className="absolute right-0 bottom-0 z-10 sm:-right-4 sm:-bottom-6">
          <TypewriterCode />
        </div>
      </div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Ecossistema
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Muito além de um curso online
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <MecCard />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-2">
          <PlatformCard />
        </Reveal>
      </div>
    </section>
  );
}
