import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../http/error-message';
import { Page } from '../../shared/models/page.model';
import { Project, ProjectRequest } from '../../shared/models/project.model';

export const PROJECTS_PAGE_SIZE = 10;

/**
 * Estado del listado de proyectos en signals (app zoneless: los signals
 * disparan el change detection). Expongo solo lectura con asReadonly().
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  private readonly _projects = signal<Project[]>([]);
  private readonly _page = signal(0);
  private readonly _size = signal(PROJECTS_PAGE_SIZE);
  private readonly _totalElements = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly projects = this._projects.asReadonly();
  readonly page = this._page.asReadonly();
  readonly size = this._size.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = computed(() => Math.ceil(this._totalElements() / this._size()));
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(() => !this._loading() && this._projects().length === 0);

  load(page = this._page(), size = this._size()): void {
    this._loading.set(true);
    this._error.set(null);
    const params = new HttpParams().set('page', page).set('size', size);
    this.http.get<Page<Project>>(`${environment.apiUrl}/portfolio/projects`, { params }).subscribe({
      next: (response) => {
        this._projects.set(response.content);
        this._page.set(response.page);
        this._size.set(response.size);
        this._totalElements.set(response.totalElements);
        this._loading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(httpErrorMessage(err));
        this._loading.set(false);
      },
    });
  }

  reload(): void {
    this.load(this._page(), this._size());
  }

  create(request: ProjectRequest): Observable<Project> {
    return this.http
      .post<Project>(`${environment.apiUrl}/portfolio/projects`, request)
      .pipe(tap(() => this.reload()));
  }

  update(id: number, request: ProjectRequest): Observable<Project> {
    return this.http
      .put<Project>(`${environment.apiUrl}/portfolio/projects/${id}`, request)
      .pipe(tap(() => this.reload()));
  }

  /** Alterna la visibilidad reutilizando update con los datos actuales. */
  toggleVisibility(project: Project): Observable<Project> {
    const request: ProjectRequest = {
      title: project.title,
      description: project.description,
      repositoryUrl: project.repositoryUrl,
      liveDemoUrl: project.liveDemoUrl,
      imageUrl: project.imageUrl,
      technologyIds: project.technologies.map((tech) => tech.id),
      visible: !project.visible,
    };
    return this.update(project.id, request);
  }

  remove(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/portfolio/projects/${id}`)
      .pipe(tap(() => this.reload()));
  }
}
