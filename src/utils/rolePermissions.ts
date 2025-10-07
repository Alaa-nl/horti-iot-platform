/**
 * Role-based access control utility
 * Defines which roles can access which dashboards
 *
 * Note: 'grower' and 'farmer' are treated as the same role (both display as "Farmer")
 * Total roles: 3 roles - admin, researcher, farmer
 * UI only shows: Admin, Researcher, Farmer
 */

export type UserRole = 'admin' | 'researcher' | 'grower' | 'farmer';

export interface DashboardAccess {
  admin: boolean;
  researcher: boolean;
  farmer: boolean; // grower and farmer are the same role
}

/**
 * Defines which roles can access which dashboards
 *
 * Role structure:
 * - Admin: Can access ALL dashboards (admin, researcher, farmer)
 * - Researcher: Can access researcher and farmer dashboards
 * - Farmer: Can access farmer and researcher dashboards (grower DB redirects to farmer)
 */
export const DASHBOARD_PERMISSIONS: Record<string, UserRole[]> = {
  admin: ['admin'], // Only admin can access admin dashboard
  researcher: ['admin', 'researcher', 'grower', 'farmer'], // All roles can access researcher dashboard
  grower: ['admin', 'researcher', 'grower', 'farmer'], // All roles can access farmer dashboard (grower and farmer are same)
  farmer: ['admin', 'researcher', 'grower', 'farmer'], // Same as grower
};

/**
 * Check if a user role has access to a specific dashboard
 */
export const canAccessDashboard = (userRole: UserRole, dashboard: string): boolean => {
  const allowedRoles = DASHBOARD_PERMISSIONS[dashboard];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

/**
 * Get all dashboards accessible by a specific role
 */
export const getAccessibleDashboards = (userRole: UserRole): string[] => {
  return Object.keys(DASHBOARD_PERMISSIONS).filter(dashboard =>
    DASHBOARD_PERMISSIONS[dashboard].includes(userRole)
  );
};

/**
 * Get the default dashboard for a specific role
 */
export const getDefaultDashboard = (userRole: UserRole): string => {
  return userRole; // Default dashboard matches the role name
};
