import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { httpErrorMessage } from '../../../core/http/error-message';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectRequest } from '../../../shared/models/project.model';
import { Technology } from '../../../shared/models/catalog.model';

export interface ProjectFormData {
  project: Project | null;
}

/**
 * Dialogo crear/editar proyecto. Al guardar exitosamente se cierra con el
 * Project resultante; el padre muestra snackbar. ProjectService.create/update
 * recargan la lista internamente (tap -> reload).
 */
@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
})
export class ProjectFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  readonly catalog = inject(CatalogService);
  private readonly dialogRef = inject(MatDialogRef<ProjectFormComponent, Project>);

  readonly data = inject<ProjectFormData>(MAT_DIALOG_DATA, { optional: true }) ?? {
    project: null,
  };

  readonly isEdit = this.data.project != null;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(2000)],
    repositoryUrl: ['', Validators.maxLength(500)],
    liveDemoUrl: ['', Validators.maxLength(500)],
    imageUrl: ['', Validators.maxLength(500)],
    technologyIds: this.fb.nonNullable.control<number[]>([]),
    visible: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    this.catalog.load();
    const project = this.data.project;
    if (project) {
      this.form.patchValue({
        title: project.title,
        description: project.description ?? '',
        repositoryUrl: project.repositoryUrl ?? '',
        liveDemoUrl: project.liveDemoUrl ?? '',
        imageUrl: project.imageUrl ?? '',
        technologyIds: project.technologies.map((tech) => tech.id),
        visible: project.visible,
      });
    }
  }

  technologiesByCategory(categoryId: number): Technology[] {
    return this.catalog.technologies().filter((tech) => tech.categoryId === categoryId);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const raw = this.form.getRawValue();
    const request: ProjectRequest = {
      title: raw.title.trim(),
      description: emptyToNull(raw.description),
      repositoryUrl: emptyToNull(raw.repositoryUrl),
      liveDemoUrl: emptyToNull(raw.liveDemoUrl),
      imageUrl: emptyToNull(raw.imageUrl),
      technologyIds: raw.technologyIds,
      visible: raw.visible,
    };

    this.saving.set(true);
    this.error.set(null);

    const operation$ = this.isEdit
      ? this.projectService.update(this.data.project!.id, request)
      : this.projectService.create(request);

    operation$.subscribe({
      next: (project) => {
        this.saving.set(false);
        this.dialogRef.close(project);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(httpErrorMessage(err));
      },
    });
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
