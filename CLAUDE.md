@AGENTS.md

# 🎨 DEVCLUB LANDING PAGE - DESIGN SYSTEM & ENGENHARIA AVANÇADA

## 🚀 Filosofia Visual & Motion Design (Cinematográfico)
* **Visual High-Tech / Cyberpunk Elegante:** Uso de iluminação verde neon (`#39D372`), sombras profundas, desfoques de lente e profundidade de campo.
* **Física de Animação de Cinema:** NUNCA crie animações secas ou instantâneas. Use `scrub` suavizado (`1.5` a `2`) no ScrollTrigger para criar amortecimento e inércia de scroll.
* **Ealings Obrigatórios:** Utilize `power3.out`, `expo.out` ou `power2.inOut` do GSAP para acelerações/desacelerações naturais.

---

## 🎬 DIRETRIZES DA ANIMAÇÃO DOS CACOS DA LOGO (FASE DE IMPACTO 3D)

 Ao construir ou animar a Logo Desconstruída do DevClub:
1. **Origem nas 4 Pontas:** Os cacos de vidro/fragmentos neon devem iniciar dispersos fora da área visível (saindo dos 4 cantos da tela: superior esquerdo, superior direito, inferior esquerdo e inferior direito).
2. **Convergência e Consolidação:** Conforme o usuário rola o scroll, os cacos convergem para o centro com escala, rotação 3D (`rotateX`, `rotateY`) e opacidade dinâmica, formando a logo completa no centro.
3. **Transição para o Header (Diagonal Superior Esquerda):** Após a montagem no centro, a logo consolidada deve fazer uma transição fluida, diminuindo a escala e se deslocando em diagonal em direção à marca no canto superior esquerdo (Header).
4. **Isolamento Alpha:** Imagens de fragmentos e logos devem utilizar remoção de fundo (transparência real) ou `mix-blend-mode: screen` com alto contraste, impedindo qualquer bloco/caixa fantasma no fundo.

---

## 🛠️ REGRAS TÉCNICAS E ESTAQUE RECOMENDADA

### GSAP & ScrollTrigger Best Practices
* Sempre registre os plugins: `gsap.registerPlugin(ScrollTrigger)`.
* Duração e Pins: Use valores baseados na altura de tela dinâmicos: `end: () => "+=" + (window.innerHeight * 3)`.
* Limpeza de Hooks React: Todo código GSAP dentro de React deve ser envelopado em `gsap.context()` dentro de `useLayoutEffect` ou `useEffect` com função de cleanup.

### Qualidade Visual & Testes via Puppeteer
* Sempre que finalizar uma refatoração de layout/animação, utilize a ferramenta do Puppeteer para tirar screenshots/navegar no `http://localhost:3000` e avaliar visualmente se há inconsistências de renderização.
* Antes de dar o commit, confirme que `npm run build` ou `npx tsc --noEmit` rodam com zero erros.