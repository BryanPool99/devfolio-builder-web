/**
 * Catalogo de tipos de bloque del portafolio: la fuente de verdad de los
 * tipos es el frontend (el backend acepta cualquier string). Cada tipo
 * define la forma de su `settings` (persistido como string JSON en la API).
 */
export type BlockType =
  'HERO' | 'ABOUT' | 'SKILLS' | 'PROJECTS' | 'EXPERIENCE' | 'EDUCATION' | 'CONTACT' | 'CUSTOM_HTML';

export interface HeroSettings {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

export interface AboutSettings {
  title: string;
  body: string;
}

export interface SkillsSettings {
  title: string;
  items: string[];
}

export interface ProjectsSettings {
  title: string;
  limit: number;
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  /** Opcional: se omite en la vista cuando esta vacio. */
  description: string;
  /** Tecnologias/habilidades usadas en el puesto (chips en la vista). Opcional en bloques guardados antes de la v1. */
  technologies?: string[];
  /** Funciones desempenadas (lista <ul> en la vista). Opcional en bloques guardados antes de la v1. */
  functions?: string[];
}

export interface ExperienceSettings {
  title: string;
  items: ExperienceItem[];
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
}

export interface EducationSettings {
  title: string;
  items: EducationItem[];
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface ContactSettings {
  email: string;
  /** Opcional: bloques guardados sin redes. */
  socialLinks?: ContactLink[];
}

export interface CustomHtmlSettings {
  html: string;
}

export interface BlockCatalogEntry {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  /** Settings por defecto al añadir el bloque. */
  createDefault: () => unknown;
}

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = [
  {
    type: 'HERO',
    label: 'Hero',
    icon: 'featured_play_list',
    description: 'Encabezado principal con título y llamada a la acción',
    createDefault: (): HeroSettings => ({
      title: 'Hola, soy tu nombre',
      subtitle: 'Breve descripción de lo que haces',
      ctaText: 'Ver proyectos',
      ctaLink: '#projects',
      imageUrl: '',
    }),
  },
  {
    type: 'ABOUT',
    label: 'Sobre mí',
    icon: 'person',
    description: 'Texto de presentación personal',
    createDefault: (): AboutSettings => ({
      title: 'Sobre mí',
      body: 'Cuéntale a los visitantes quién eres y qué te apasiona.',
    }),
  },
  {
    type: 'SKILLS',
    label: 'Habilidades',
    icon: 'psychology',
    description: 'Lista de habilidades o tecnologías',
    createDefault: (): SkillsSettings => ({
      title: 'Habilidades',
      items: [],
    }),
  },
  {
    type: 'PROJECTS',
    label: 'Proyectos',
    icon: 'folder',
    description: 'Rejilla con tus proyectos del portafolio',
    createDefault: (): ProjectsSettings => ({ title: 'Proyectos', limit: 6 }),
  },
  {
    type: 'EXPERIENCE',
    label: 'Experiencia',
    icon: 'work',
    description: 'Historial de experiencia laboral',
    createDefault: (): ExperienceSettings => ({ title: 'Experiencia', items: [] }),
  },
  {
    type: 'EDUCATION',
    label: 'Formación',
    icon: 'school',
    description: 'Titulaciones y cursos',
    createDefault: (): EducationSettings => ({ title: 'Formación', items: [] }),
  },
  {
    type: 'CONTACT',
    label: 'Contacto',
    icon: 'mail',
    description: 'Email y enlaces a redes sociales',
    createDefault: (): ContactSettings => ({ email: '', socialLinks: [] }),
  },
];

/**
 * HTML personalizado: fuera de la paleta "Añadir bloque" por ahora, pero
 * sigue registrado en CATALOG_BY_TYPE para que los bloques CUSTOM_HTML
 * ya guardados mantengan su etiqueta, icono y settings por defecto.
 */
const CUSTOM_HTML_ENTRY: BlockCatalogEntry = {
  type: 'CUSTOM_HTML',
  label: 'HTML personalizado',
  icon: 'code',
  description: 'Bloque libre editado con GrapesJS',
  createDefault: (): CustomHtmlSettings => ({ html: '<p>Escribe tu HTML aquí…</p>' }),
};

const CATALOG_BY_TYPE = new Map(
  [...BLOCK_CATALOG, CUSTOM_HTML_ENTRY].map((entry) => [entry.type, entry]),
);

export function catalogEntry(type: string): BlockCatalogEntry | undefined {
  return CATALOG_BY_TYPE.get(type as BlockType);
}

export function isKnownBlockType(type: string): type is BlockType {
  return CATALOG_BY_TYPE.has(type as BlockType);
}
