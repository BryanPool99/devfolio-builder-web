import { CanDeactivateFn } from '@angular/router';

import type { EditorComponent } from './editor';

/** Evita perder cambios sin guardar al salir del editor. */
export const editorDirtyGuard: CanDeactivateFn<EditorComponent> = (component) =>
  !component.blockService.dirty() ||
  window.confirm('Tienes cambios sin guardar. ¿Salir del editor de todos modos?');
