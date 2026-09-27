import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../http/error-message';
import { Block } from '../../shared/models/portfolio.model';

/**
 * Estado de los bloques del portafolio en signals.
 *
 * Guardado con semantica replace-all: PUT /portfolio/blocks recibe la lista
 * COMPLETA en su orden final como [{type, settings}] y regenera los ids,
 * por eso no se propagan ids al backend.
 */
@Injectable({ providedIn: 'root' })
export class BlockService {
  private readonly http = inject(HttpClient);

  private readonly _blocks = signal<Block[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _dirty = signal(false);

  readonly blocks = this._blocks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly dirty = this._dirty.asReadonly();

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<Block[]>(`${environment.apiUrl}/portfolio/blocks`).subscribe({
      next: (blocks) => {
        this._blocks.set(blocks);
        this._dirty.set(false);
        this._loading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(httpErrorMessage(err));
        this._loading.set(false);
      },
    });
  }

  /** Reemplaza la lista local (añadir, borrar, reordenar) y marca dirty. */
  replaceAll(blocks: Block[]): void {
    this._blocks.set(blocks);
    this._dirty.set(true);
  }

  save(): Observable<Block[]> {
    const body = this._blocks().map((block) => ({
      type: block.type,
      settings: block.settings,
    }));
    this._saving.set(true);
    this._error.set(null);
    return this.http.put<Block[]>(`${environment.apiUrl}/portfolio/blocks`, body).pipe(
      tap({
        next: (saved) => {
          this._blocks.set(saved);
          this._dirty.set(false);
          this._saving.set(false);
        },
        error: (err: unknown) => {
          this._error.set(httpErrorMessage(err));
          this._saving.set(false);
        },
      }),
    );
  }
}
