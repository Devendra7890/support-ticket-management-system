export const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const source = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    id: source._id?.toString?.() || source.id,
    name: source.name,
    email: source.email,
    role: source.role,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};
