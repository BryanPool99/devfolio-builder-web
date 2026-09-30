import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../models/project.model';
import { Block } from '../../models/portfolio.model';
import {
  AboutSettings,
  ContactSettings,
  CustomHtmlSettings,
  EducationSettings,
  ExperienceSettings,
  HeroSettings,
  ProjectsSettings,
  SkillsSettings,
  catalogEntry,
} from '../../models/block-catalog.model';

/**
 * Render read-only de los bloques del portafolio. Lo usan el preview del
 * editor (interactive=true: emite select al clicar un bloque) y la vista
 * publica (interactive=false), que ademas inyecta sus propios proyectos via
 * el input `projects` (por defecto lee ProjectService autenticado).
 */
@Component({
  selector: 'app-block-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './block-renderer.html',
  styleUrl: './block-renderer.scss',
})
export class BlockRendererComponent {
  private readonly projectService = inject(ProjectService);

  readonly blocks = input.required<Block[]>();
  readonly selectedId = input<number | null>(null);
  readonly interactive = input(false);
  readonly projects = input<Project[] | undefined>(undefined);
  readonly select = output<number>();

  private readonly serviceProjects = this.projectService.projects;
  readonly effectiveProjects = computed(() => this.projects() ?? this.serviceProjects());

  readonly blockEntries = computed(() =>
    this.blocks().map((block) => ({ block, entry: catalogEntry(block.type) })),
  );

  settings<T>(block: Block): T {
    try {
      return JSON.parse(block.settings) as T;
    } catch {
      return {} as T;
    }
  }

  heroSettings(block: Block): HeroSettings {
    return this.settings<HeroSettings>(block);
  }

  aboutSettings(block: Block): AboutSettings {
    return this.settings<AboutSettings>(block);
  }

  skillsSettings(block: Block): SkillsSettings {
    return this.settings<SkillsSettings>(block);
  }

  projectsSettings(block: Block): ProjectsSettings {
    return this.settings<ProjectsSettings>(block);
  }

  experienceSettings(block: Block): ExperienceSettings {
    return this.settings<ExperienceSettings>(block);
  }

  educationSettings(block: Block): EducationSettings {
    return this.settings<EducationSettings>(block);
  }

  contactSettings(block: Block): ContactSettings {
    return this.settings<ContactSettings>(block);
  }

  customHtml(block: Block): string {
    return this.settings<CustomHtmlSettings>(block).html ?? '';
  }

  /** Icono material segun el dominio del enlace social. */
  socialIcon(url: string): string {
    const value = (url ?? '').toLowerCase();
    if (value.includes('github')) return 'code';
    if (value.includes('linkedin')) return 'work';
    if (value.includes('twitter') || value.includes('x.com')) return 'alternate_email';
    if (value.includes('instagram')) return 'photo_camera';
    if (value.includes('youtube')) return 'smart_display';
    if (value.includes('behance') || value.includes('dribbble')) return 'palette';
    if (value.includes('tel:')) return 'call';
    if (value.includes('wa.me') || value.includes('whatsapp')) return 'chat';
    return 'link';
  }

  limitedProjects(settings: ProjectsSettings): Project[] {
    const limit = settings.limit > 0 ? settings.limit : 6;
    return this.effectiveProjects().slice(0, limit);
  }

  onBlockClick(block: Block): void {
    if (this.interactive()) {
      this.select.emit(block.id);
    }
  }
}
