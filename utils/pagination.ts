// Helpers for the backend's paginated list envelope.
//
// List endpoints now return their `data` as an object, not a bare array:
//   { results: [...], count, page, page_size, total_pages, next, previous }
// Picker/autocomplete endpoints still return a bare array. `unwrapPage`
// normalizes both shapes so callers always get `{ results, ...meta }`.

export interface PageMeta {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface Page<T> extends PageMeta {
  results: T[];
}

export const emptyPageMeta: PageMeta = {
  count: 0,
  page: 1,
  page_size: 0,
  total_pages: 1,
  next: null,
  previous: null,
};

export const unwrapPage = <T>(data: unknown): Page<T> => {
  // Bare array (pickers, or a pre-pagination backend) — treat as a single page.
  if (Array.isArray(data)) {
    return {
      results: data as T[],
      count: data.length,
      page: 1,
      page_size: data.length,
      total_pages: 1,
      next: null,
      previous: null,
    };
  }
  // Paginated envelope.
  if (data && typeof data === "object" && Array.isArray((data as any).results)) {
    const d = data as any;
    return {
      results: d.results as T[],
      count: d.count ?? d.results.length,
      page: d.page ?? 1,
      page_size: d.page_size ?? d.results.length,
      total_pages: d.total_pages ?? 1,
      next: d.next ?? null,
      previous: d.previous ?? null,
    };
  }
  return { results: [], ...emptyPageMeta };
};

export const toPageMeta = (p: PageMeta): PageMeta => ({
  count: p.count,
  page: p.page,
  page_size: p.page_size,
  total_pages: p.total_pages,
  next: p.next,
  previous: p.previous,
});
