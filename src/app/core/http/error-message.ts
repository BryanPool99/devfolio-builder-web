import { HttpErrorResponse } from '@angular/common/http';

/**
 * El backend responde con ProblemDetail (RFC 7807): { title, status, detail }.
 * Extrae `detail` como mensaje mostrable; si no hay, genera uno genérico.
 */
export function httpErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const detail = (error.error as { detail?: string } | null)?.detail;
    if (detail) {
      return detail;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
    if (error.status === 404) {
      return 'Recurso no encontrado';
    }
    if (error.status >= 500) {
      return 'Error interno del servidor';
    }
  }
  return 'Ocurrió un error inesperado';
}
