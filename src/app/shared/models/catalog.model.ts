export interface Category {
  id: number;
  name: string;
}

export interface Technology {
  id: number;
  name: string;
  iconUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
}
