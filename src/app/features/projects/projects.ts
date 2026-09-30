import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { httpErrorMessage } from '../../core/http/error-message';
import { PROJECTS_PAGE_SIZE, ProjectService } from '../../core/services/project.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Project } from '../../shared/models/project.model';
import { ProjectFormComponent } from './project-form/project-form';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent implements OnInit {
  readonly service = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly deletingId = signal<number | null>(null);
  readonly togglingId = signal<number | null>(null);

  ngOnInit(): void {
    this.service.load(0, PROJECTS_PAGE_SIZE);
  }

  onPage(event: PageEvent): void {
    this.service.load(event.pageIndex, event.pageSize);
  }

  openCreate(): void {
    this.dialog
      .open(ProjectFormComponent, { data: { project: null } })
      .afterClosed()
      .subscribe((project: Project | null) => {
        if (project) {
          this.snackBar.open(`Proyecto "${project.title}" creado`, 'Cerrar', { duration: 4000 });
        }
      });
  }

  openEdit(project: Project): void {
    this.dialog
      .open(ProjectFormComponent, { data: { project } })
      .afterClosed()
      .subscribe((updated: Project | null) => {
        if (updated) {
          this.snackBar.open(`Proyecto "${updated.title}" actualizado`, 'Cerrar', {
            duration: 4000,
          });
        }
      });
  }

  toggleVisibility(project: Project): void {
    this.togglingId.set(project.id);
    this.service.toggleVisibility(project).subscribe({
      next: (updated) => {
        this.togglingId.set(null);
        this.snackBar.open(
          updated.visible
            ? `Proyecto "${updated.title}" publicado`
            : `Proyecto "${updated.title}" oculto en tu portafolio`,
          'Cerrar',
          { duration: 4000 },
        );
      },
      error: (err: unknown) => {
        this.togglingId.set(null);
        this.snackBar.open(httpErrorMessage(err), 'Cerrar', { duration: 6000 });
      },
    });
  }

  confirmDelete(project: Project): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar proyecto',
          message: `¿Seguro que quieres eliminar "${project.title}"? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.delete(project);
        }
      });
  }

  private delete(project: Project): void {
    this.deletingId.set(project.id);
    this.service.remove(project.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.snackBar.open(`Proyecto "${project.title}" eliminado`, 'Cerrar', { duration: 4000 });
      },
      error: (err: unknown) => {
        this.deletingId.set(null);
        this.snackBar.open(httpErrorMessage(err), 'Cerrar', { duration: 6000 });
      },
    });
  }

  trackById(_index: number, project: Project): number {
    return project.id;
  }
}
