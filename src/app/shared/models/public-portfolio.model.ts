import { Page } from './page.model';
import { Block } from './portfolio.model';
import { Project } from './project.model';

/** Respuesta de GET /api/v1/public/portfolios/{username} (sin autenticacion). */
export interface PublicPortfolio {
  username: string;
  title: string;
  published: boolean;
  blocks: Block[];
  projects: Page<Project>;
}
