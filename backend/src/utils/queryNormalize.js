/**
 * Treat blank query-string values as omitted filters.
 */
export const emptyToUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};
