/** Check page-level rights from populated role */

export const hasPagePermission = (user, pageName, action = 'canView') => {
  if (!user) return false;
  if (user.userCategory === 'admin') return true;

  const pages = user.role?.pages || [];
  const perm = pages.find((p) => p.pageName === pageName);
  return perm ? Boolean(perm[action]) : false;
};

export const getDefaultRoute = (user) => {
  if (!user) return '/login';
  if (user.isSamplePrep) return '/workshop';
  return user.role?.dashboard || '/dashboard';
};
