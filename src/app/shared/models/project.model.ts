export interface TechnologySummary {
  id: number;
  name: string;
  iconUrl: string | null;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  repositoryUrl: string | null;
  liveDemoUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  technologies: TechnologySummary[];
  /** false: el proyecto no aparece en el portafolio público. */
  visible: boolean;
}

/** Cuerpo de POST/PUT /portfolio/projects. */
export interface ProjectRequest {
  title: string;
  description: string | null;
  repositoryUrl: string | null;
  liveDemoUrl: string | null;
  imageUrl: string | null;
  technologyIds: number[];
  visible: boolean;
}
