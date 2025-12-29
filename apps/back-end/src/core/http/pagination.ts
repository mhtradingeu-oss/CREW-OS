export function parsePagination(query: Record<string, unknown>) {
  const q = query as Record<string, unknown>;
  const rawPage = Number(q.page ?? q.pageNumber ?? (q as Record<string, unknown>).p);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const rawPageSize = Number(q.pageSize ?? q.limit ?? q.perPage ?? 20);
  const normalizedPageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.floor(rawPageSize) : 20;
  const pageSize = Math.min(normalizedPageSize, 100);

  return { page, pageSize };
}
