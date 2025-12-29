export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export function buildPagination({ page = 1, pageSize = 20 }: PaginationParams) {
  const take = Math.min(pageSize, 100);
  const skip = (page - 1) * take;
  return { skip, take };
}
