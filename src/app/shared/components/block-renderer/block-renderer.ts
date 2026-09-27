import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ProjectService } from '../../../core/services/project.service';
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
 * editor (interactive=true: emite select al clicar un bloque) y, en la Fase 3,
 * la vista publica (interactive=false).
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
  readonly select = output<number>();

  readonly projects = this.projectService.projects;

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

  limitedProjects(settings: ProjectsSettings) {
    const limit = settings.limit > 0 ? settings.limit : 6;
    return this.projects().slice(0, limit);
  }

  onBlockClick(block: Block): void {
    if (this.interactive()) {
      this.select.emit(block.id);
    }
  }
}
