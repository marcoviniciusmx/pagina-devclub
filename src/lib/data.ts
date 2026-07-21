export const DEVCLUB_URL = "https://www.devclub.com.br/";

export type StackItem = {
  name: string;
  icon: string;
};

export const stackItems: StackItem[] = [
  { name: "HTML5", icon: "/assets/tech-stack/html-5.svg" },
  { name: "CSS3", icon: "/assets/tech-stack/css-3.svg" },
  { name: "JavaScript", icon: "/assets/tech-stack/javascript.svg" },
  { name: "TypeScript", icon: "/assets/tech-stack/typescript.svg" },
  { name: "React", icon: "/assets/tech-stack/react.svg" },
  { name: "Node.js", icon: "/assets/tech-stack/node.svg" },
];

export type CompanyItem = {
  name: string;
  icon: string;
};

export const companyItems: CompanyItem[] = [
  { name: "iFood", icon: "/assets/empresas/ifood.svg" },
  { name: "Itaú", icon: "/assets/empresas/itau.svg" },
  { name: "Nubank", icon: "/assets/empresas/nubank.svg" },
  { name: "VTEX", icon: "/assets/empresas/vtex.svg" },
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
    image: "/assets/mentores/fernanda-recruiter-cutout.png",
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

export type GradeArea = {
  title: string;
  description: string;
  icon: string | null;
};

export const gradeAreas: GradeArea[] = [
  {
    title: "Front-End",
    description:
      "Construção de interfaces modernas com HTML, CSS, JavaScript, TypeScript e React — do fundamento à componentização.",
    icon: "/assets/tech-stack/react.svg",
  },
  {
    title: "Back-End",
    description:
      "APIs, autenticação e lógica de servidor com Node.js e TypeScript, prontas para escalar em produção.",
    icon: "/assets/tech-stack/node.svg",
  },
  {
    title: "Banco de Dados",
    description:
      "Modelagem, consultas e integração de bancos relacionais e não relacionais no fluxo real de uma aplicação.",
    icon: null,
  },
  {
    title: "Mobile",
    description:
      "Aplicação dos mesmos fundamentos de React para construir experiências mobile multiplataforma.",
    icon: null,
  },
  {
    title: "Inteligência Artificial",
    description:
      "Uso prático de IA generativa no dia a dia de desenvolvimento — do prompt à automação de tarefas de código.",
    icon: null,
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
      "Sim. O MBA e a Pós-Graduação em Tecnologia do ecossistema DevClub são reconhecidos pelo MEC, com emissão de diploma oficial ao final da formação.",
  },
];

export type Testimonial = {
  studentName: string;
  role: string;
  /**
   * Placeholder YouTube video ID — replace with the real testimonial video ID.
   * https://www.youtube.com/watch?v=<id>
   */
  youtubeId: string;
  thumbnail: string;
};

export const testimonials: Testimonial[] = [
  {
    studentName: "Aluno DevClub",
    role: "Contratado como Dev Front-End",
    youtubeId: "VIDEO_ID_1",
    thumbnail: "/assets/bento/interface-devclub.png",
  },
  {
    studentName: "Aluno DevClub",
    role: "Contratado como Dev Back-End",
    youtubeId: "VIDEO_ID_2",
    thumbnail: "/assets/bento/playground-devlcub.png",
  },
  {
    studentName: "Aluno DevClub",
    role: "Transição de carreira concluída",
    youtubeId: "VIDEO_ID_3",
    thumbnail: "/assets/hero/rodolfo-programador.png",
  },
];
