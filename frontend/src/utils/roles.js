export const USER_ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
});

export const getPostAuthPath = (role) => {
  if (role === USER_ROLES.ADMIN) {
    return '/admin';
  }
  return '/app';
};
