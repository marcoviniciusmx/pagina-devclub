export const DEVCLUB_URL = "https://www.devclub.com.br/";
export const STUDENT_AREA_URL = "https://aulas.devclub.com.br/";

export type StackItem = {
  name: string;
  icon: string;
};

// Mock/placeholder data for the expanded stack marquee. JavaScript,
// TypeScript, React and Node.js keep their real hand-authored brand marks;
// the rest use simplified monogram badges (not official trademarked logos)
// generated for this redesign -- swap in official SVGs per tool if exact
// branding is needed later.
export const stackItems: StackItem[] = [
  { name: "JavaScript", icon: "/assets/tech-stack/javascript.svg" },
  { name: "TypeScript", icon: "/assets/tech-stack/typescript.svg" },
  { name: "React", icon: "/assets/tech-stack/react.svg" },
  { name: "Next.js", icon: "/assets/tech-stack/nextjs.svg" },
  { name: "Node.js", icon: "/assets/tech-stack/node.svg" },
  { name: "Python", icon: "/assets/tech-stack/python.svg" },
  { name: "OpenAI API", icon: "/assets/tech-stack/openai.svg" },
  { name: "LangChain", icon: "/assets/tech-stack/langchain.svg" },
  { name: "TailwindCSS", icon: "/assets/tech-stack/tailwindcss.svg" },
  { name: "Docker", icon: "/assets/tech-stack/docker.svg" },
  { name: "PostgreSQL", icon: "/assets/tech-stack/postgresql.svg" },
  { name: "GraphQL", icon: "/assets/tech-stack/graphql.svg" },
  { name: "NestJS", icon: "/assets/tech-stack/nestjs.svg" },
  { name: "Redis", icon: "/assets/tech-stack/redis.svg" },
  { name: "Vue.js", icon: "/assets/tech-stack/vuejs.svg" },
  { name: "AWS", icon: "/assets/tech-stack/aws.svg" },
  { name: "Kubernetes", icon: "/assets/tech-stack/kubernetes.svg" },
  { name: "Fastify", icon: "/assets/tech-stack/fastify.svg" },
];

export type CompanyItem = {
  name: string;
  icon?: string;
};

// Real companies/institutions. Icons are official vector logos sourced from
// each brand's own press kit or Wikimedia Commons -- NOT hand-drawn
// approximations (reproducing a trademark from memory risks an inaccurate,
// unauthorized copy, so every icon here traces back to a real source file).
// OAB has no `icon` because no legitimate SVG could be sourced anywhere
// (its official brand kit only publishes a PDF manual) -- it falls back to
// a plain text wordmark instead of a fabricated logo.
// IMPORTANT: the eyebrow copy above this row states these are real
// companies where DevClub alumni are employed -- verify that claim is
// accurate (documented hires) for every entry below before shipping.
export const companyItems: CompanyItem[] = [
  { name: "iFood", icon: "/assets/empresas/ifood.svg" },
  { name: "Itaú", icon: "/assets/empresas/itau.svg" },
  { name: "Nubank", icon: "/assets/empresas/nubank.svg" },
  { name: "VTEX", icon: "/assets/empresas/vtex.svg" },
  { name: "OAB" },
  { name: "USP", icon: "/assets/empresas/usp.svg" },
  { name: "Santander", icon: "/assets/empresas/santander.svg" },
  { name: "Mercado Livre", icon: "/assets/empresas/mercadolivre.svg" },
  { name: "Ambev", icon: "/assets/empresas/ambev.svg" },
];

// Invented wordmarks with no real-world counterpart -- added purely to
// thicken the flip-grid showcase below (client explicitly signed off on
// trading strict accuracy for visual density here). Kept in their own list
// so they never mix into `companyItems`, which other parts of the site may
// rely on as the real, verified-hire source of truth.
export const showcaseFillerItems: CompanyItem[] = [
  { name: "Nimbus" },
  { name: "Vertex Labs" },
  { name: "Solstice" },
  { name: "Northline" },
  { name: "Cobalt" },
  { name: "Orbital" },
  { name: "Havenly" },
  { name: "Quantalink" },
  { name: "Brightforge" },
  { name: "Meridian" },
  { name: "Pulseware" },
];

// Combined pool for the flip-grid: real employers first, fictional filler
// after -- the grid distributes this round-robin across its cells, so real
// logos still surface early/often instead of only the filler being visible
// on first paint.
export const companyShowcaseItems: CompanyItem[] = [
  ...companyItems,
  ...showcaseFillerItems,
];

export type Mentor = {
  name: string;
  role: string;
  image: string;
};

export const mentors: Mentor[] = [
  {
    name: "Rodolfo Mori",
    role: "Fundador & Mentoria Estratégica",
    image: "/assets/mentores/rodolfo-cutout.png",
  },
  {
    name: "Andrey",
    role: "Mentoria Técnica & Code Review",
    image: "/assets/mentores/andrey-mentor-cutout.png",
  },
  {
    name: "Fernanda",
    role: "Preparação Recruiter, LinkedIn & Entrevistas",
    image: "/assets/mentores/fernanda-recuiter-cutout.png",
  },
  {
    name: "Juliana",
    role: "Preparação Recruiter, LinkedIn & Entrevistas",
    image: "/assets/mentores/juliana-recruiter-cutout.png",
  },
  {
    name: "Márcio",
    role: "Suporte Emocional, Mindset & Performance",
    image: "/assets/mentores/marcio-terapeuta-cutout.png",
  },
];

// A "Jornada DevClub" (src/components/sections/Jornada.tsx) substitui a
// antiga grade de formações em accordion por uma narrativa única de
// evolução do aluno.
export type JourneyStep = {
  id: string;
  title: string;
  description: string;
  // Tecnologias/temas daquela fase -- vazio nos checkpoints que marcam um
  // momento (entrada, diploma, comunidade) em vez de um conjunto de skills.
  techs: string[];
};

export const journeySteps: JourneyStep[] = [
  {
    id: "entrada",
    title: "Você entra no DevClub",
    description:
      "O primeiro passo de uma jornada que transforma quem você é como profissional.",
    techs: [],
  },
  {
    id: "fundamentos",
    title: "Aprende os fundamentos",
    description:
      "A base sólida que sustenta toda a evolução: a lógica por trás de qualquer aplicação.",
    techs: ["HTML", "CSS", "JavaScript"],
  },
  {
    id: "frontend",
    title: "Evolui para Front-End",
    description:
      "Domina a criação de interfaces modernas e constrói projetos reais para o portfólio.",
    techs: ["React", "Next.js", "TailwindCSS"],
  },
  {
    id: "fullstack",
    title: "Torna-se Full Stack",
    description:
      "Passa a dominar o back-end inteiro: APIs, banco de dados e arquitetura de sistemas.",
    techs: ["Node.js", "TypeScript", "PostgreSQL"],
  },
  {
    id: "ia",
    title: "Aprende Inteligência Artificial",
    description:
      "Cria sistemas autônomos e aplica IA generativa em produtos reais.",
    techs: ["ChatGPT", "Claude", "n8n"],
  },
  {
    id: "monetizacao",
    title: "Aprende a ganhar dinheiro",
    description:
      "Transforma conhecimento técnico em faturamento: primeiros clientes, primeiros contratos.",
    techs: ["Criação de Sites", "Prospecção", "Vendas", "Freelancing"],
  },
  {
    id: "diploma",
    title: "Conquista o diploma reconhecido pelo MEC",
    description:
      "A formação se torna oficial: um diploma de pós-graduação reconhecido em todo o território nacional.",
    techs: [],
  },
  {
    id: "comunidade",
    title: "Continua fazendo parte da comunidade DevClub",
    description:
      "A jornada não termina na formatura: mentoria, networking e evolução contínua.",
    techs: [],
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Preciso ter experiência prévia com programação?",
    answer:
      "Não. A formação DevClub foi desenhada para começar do zero, com uma trilha progressiva que leva você do primeiro código até projetos reais prontos para o mercado.",
  },
  {
    question: "Quanto tempo por dia eu preciso estudar?",
    answer:
      "A formação é pensada para quem concilia estudo com trabalho ou outras responsabilidades. Você avança no seu ritmo, com uma rotina de estudo flexível apoiada pela mentoria.",
  },
  {
    question: "Que tipo de suporte eu tenho durante o curso?",
    answer:
      "Mentoria 360°: acompanhamento técnico com code review, preparação para entrevistas e LinkedIn com recrutadoras, e suporte de mindset e performance para os momentos difíceis da jornada.",
  },
  {
    question: "O diploma tem validade oficial?",
    answer:
      "Sim. O MBA em Inteligência Artificial do ecossistema DevClub são reconhecidos pelo MEC, com emissão de diploma oficial ao final da formação.",
  },
];

export type Testimonial = {
  studentName: string;
  role: string;
  /** https://www.youtube.com/watch?v=<id> */
  youtubeId: string;
  thumbnail: string;
};

export const testimonials: Testimonial[] = [
  {
    studentName: "Annanda Farias",
    role: "Contratada como Programadora",
    youtubeId: "DqsZ_iy0p6U",
    thumbnail: "/assets/bento/interface-devclub.png",
  },
  {
    studentName: "Bruno Barbosa",
    role: "Contratado como Programador",
    youtubeId: "kKU8nFsSY8M",
    thumbnail: "/assets/bento/playground-devlcub.png",
  },
  {
    studentName: "Alexandre Nascimento",
    role: "Contratado como Programador",
    youtubeId: "sHiiEM_xPdE",
    thumbnail: "/assets/hero/rodolfo-programador.png",
  },
];
