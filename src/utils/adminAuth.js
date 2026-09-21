/**
 * Admin Authentication & Role-Based Access Control (RBAC) Utilities
 * Supports 5 Roles: 'admin', 'inventory', 'checker', 'staff', 'customer'
 */

export const ROLE_CONFIG = {
  admin: {
    label: 'Owner / Super Admin',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    allowedTabs: ['dashboard', 'inventory', 'production', 'stock-out', 'products', 'scan-qr', 'vouchers', 'banners', 'users'],
    defaultRoute: '/admin',
    title: 'Portal Admin & Owner'
  },
  inventory: {
    label: 'PPSI & Inventory',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    allowedTabs: ['inventory', 'production', 'stock-out', 'products', 'scan-qr'],
    defaultRoute: '/admin/inventory',
    title: 'Portal PPSI & Stok'
  },
  checker: {
    label: 'Checker & QC',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    allowedTabs: ['production', 'inventory', 'scan-qr'],
    defaultRoute: '/admin/production',
    title: 'Portal QC & Produksi'
  },
  staff: {
    label: 'Kasir & Meja Toko',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    allowedTabs: ['scan-qr'],
    defaultRoute: '/admin/scan-qr',
    title: 'Meja Kasir & Scan QR'
  }
};

/**
 * Safely decodes a JWT payload without an external library
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Retrieves the current logged in internal user details
 */
export function getAdminUser() {
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    }
  } catch {
    // Ignore JSON parse error and fallback to token
  }

  try {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        return {
          id: payload.user_id || payload.sub,
          role: payload.role || 'staff',
          full_name: payload.full_name || 'Staff'
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Returns the role of the currently authenticated admin user
 */
export function getAdminRole() {
  const user = getAdminUser();
  return user?.role || null;
}

/**
 * Returns the default landing route based on user role
 */
export function getAdminDefaultRoute(role) {
  const currentRole = role || getAdminRole();
  const config = ROLE_CONFIG[currentRole];
  return config ? config.defaultRoute : '/admin/scan-qr';
}

/**
 * Checks if a given role is allowed to access a feature or route
 */
export function isRoleAllowed(role, allowedRoles) {
  if (!role) return false;
  // Super admin always has access
  if (role === 'admin') return true;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}
