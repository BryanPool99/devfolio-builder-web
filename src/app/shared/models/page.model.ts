/** Respuesta paginada genérica del backend (offset/limit). */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
