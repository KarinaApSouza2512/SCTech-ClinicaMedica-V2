export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// Quantos registros pular para chegar na pagina pedida
export function pageOffset({ page, pageSize }: PaginationParams): number {
  return (page - 1) * pageSize;
}

export function buildPage<T>(data: T[], total: number, params: PaginationParams): Paginated<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
