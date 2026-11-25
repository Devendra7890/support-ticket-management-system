export const buildTicketSnapshot = (ticket) => {
  if (!ticket) return null;

  const source = typeof ticket.toObject === 'function' ? ticket.toObject() : ticket;

  return {
    id: source._id,
    title: source.title,
    description: source.description,
    category: source.category,
    priority: source.priority,
    status: source.status,
    createdBy: source.createdBy?._id || source.createdBy,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};
