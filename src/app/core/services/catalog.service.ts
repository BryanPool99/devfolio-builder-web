import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../http/error-message';
import { Category, Technology } from '../../shared/models/catalog.model';

/** Catálogo global (categories/technologies): se carga una vez y se cachea. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly loaded = signal(false);

  private readonly _categories = signal<Category[]>([]);
  private readonly _technologies = signal<Technology[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly technologies = this._technologies.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(): void {
    if (this.loaded() || this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      categories: this.http.get<Category[]>(`${environment.apiUrl}/categories`),
      technologies: this.http.get<Technology[]>(`${environment.apiUrl}/technologies`),
    })
      .pipe(tap(() => this.loaded.set(true)))
      .subscribe({
        next: ({ categories, technologies }) => {
          this._categories.set(categories);
          this._technologies.set(technologies);
          this._loading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(httpErrorMessage(err));
          this._loading.set(false);
        },
      });
  }
}
