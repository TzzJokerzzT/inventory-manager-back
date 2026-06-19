import type { PaginationParams, PaginationQuery } from "../types/pagination.ts";

export function parsePagination(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? "10", 10)));
  return { page, limit };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}