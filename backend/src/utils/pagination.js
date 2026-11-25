/**
 * Shared list pagination helpers for consistent API metadata and stable sorting.
 */

export const buildPaginationMeta = ({ total, page, limit }) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
};

/**
 * Primary sort field plus `_id` tie-breaker for deterministic paging.
 * When sorting by `_id` itself, only `_id` is used.
 */
export const buildStableSort = (sortBy, sortOrder = 'desc') => {
  const direction = sortOrder === 'asc' ? 1 : -1;

  if (sortBy === '_id') {
    return { _id: direction };
  }

  return {
    [sortBy]: direction,
    _id: direction,
  };
};
