import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../http/error-message';
import { Block } from '../../shared/models/portfolio.model';
import { PublicPortfolio } from '../../shared/models/public-portfolio.model';

const DEFAULT_PAGE_SIZE = 6;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

/**
 * Tamanio de pagina alineado con el `limit` del bloque PROJECTS: el renderer
 * aplica slice(0, limit), asi que la pagina del backend debe medir lo mismo
 * para no cortar ni esconder proyectos.
 */
function projectsPageSize(blocks: Block[]): number {
  const block = blocks.find((candidate) => candidate.type === 'PROJECTS');
  if (!block) {
    return DEFAULT_PAGE_SIZE;
  }
  let raw: unknown = DEFAULT_PAGE_SIZE;
  try {
    raw = (JSON.parse(block.settings) as { limit?: unknown }).limit;
  } catch {
    raw = DEFAULT_PAGE_SIZE;
  }
  const limit =
    typeof raw === 'number' && Number.isFinite(raw) ? Math.trunc(raw) : DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(limit, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
}

/**
 * Estado del portafolio publico de un usuario en signals. Solo toca
 * GET /public/portfolios/{username}: nunca dispara el interceptor autenticado.
 */
@Injectable({ providedIn: 'root' })
export class PublicPortfolioService {
  private readonly http = inject(HttpClient);

  private readonly _portfolio = signal<PublicPortfolio | null>(null);
  private readonly _loading = signal(false);
  private readonly _notFound = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pageSize = signal(DEFAULT_PAGE_SIZE);

  private username = '';
  private aligned = false;

  readonly portfolio = this._portfolio.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly notFound = this._notFound.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  readonly blocks = computed(() => this._portfolio()?.blocks ?? []);
  readonly projects = computed(() => this._portfolio()?.projects.content ?? []);
  readonly totalElements = computed(() => this._portfolio()?.projects.totalElements ?? 0);
  readonly totalPages = computed(() => this._portfolio()?.projects.totalPages ?? 0);

  load(username: string, page = 0): void {
    if (username !== this.username) {
      this.username = username;
      this.aligned = false;
      this._pageSize.set(DEFAULT_PAGE_SIZE);
      this._portfolio.set(null);
    }
    this._loading.set(true);
    this._error.set(null);
    this._notFound.set(false);

    const params = new HttpParams().set('page', page).set('size', this._pageSize());
    this.http
      .get<PublicPortfolio>(
        `${environment.apiUrl}/public/portfolios/${encodeURIComponent(username)}`,
        { params },
      )
      .subscribe({
        next: (response) => {
          const desired = projectsPageSize(response.blocks);
          if (!this.aligned && desired !== response.projects.size) {
            // La primera respuesta revela el limit del bloque PROJECTS:
            // re-pide la pagina 0 ya con el tamanio alineado (una sola vez).
            this.aligned = true;
            this._pageSize.set(desired);
            this.load(username, 0);
            return;
          }
          this.aligned = true;
          this._portfolio.set(response);
          this._loading.set(false);
        },
        error: (err: unknown) => {
          this._loading.set(false);
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this._portfolio.set(null);
            this._notFound.set(true);
            return;
          }
          this._error.set(httpErrorMessage(err));
        },
      });
  }
}
