import { db } from '@/db';
import { userRoles, roles, rolePermissions as rolePermissionsTable, permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type RoleName = 
  | 'Dealer Admin' 
  | 'Sales Executive' 
  | 'Service Technician' 
  | 'Inventory Manager' 
  | 'Customer Support'
  | 'HR & Admin'
  | 'Customer';

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Role-based permissions matrix
export const rolePermissions: Record<RoleName, string[]> = {
  'Dealer Admin': [
    'sales.*',
    'service.*',
    'inventory.*',
    'finance.*',
    'crm.*',
    'hr.*',
    'reports.*',
    'qa.*',
    'settings.*',
  ],
  'Sales Executive': [
    'sales.view',
    'sales.create',
    'sales.edit',
    'leads.view',
    'leads.create',
    'leads.edit',
    'test-drives.view',
    'test-drives.create',
    'quotations.view',
    'quotations.create',
    'bookings.view',
    'bookings.create',
    'customers.view',
    'vehicles.view',
  ],
  'Service Technician': [
    'service.view',
    'service.create',
    'service.edit',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'job-cards.view',
    'job-cards.create',
    'job-cards.edit',
    'diagnostics.view',
    'diagnostics.create',
    'service-quotations.view',
    'service-quotations.create',
    'spare-parts.view',
  ],
  'Inventory Manager': [
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'inventory.delete',
    'vehicles.view',
    'vehicles.create',
    'vehicles.edit',
    'spare-parts.view',
    'spare-parts.create',
    'spare-parts.edit',
    'vendors.view',
    'vendors.create',
    'vendors.edit',
    'purchase-orders.view',
    'purchase-orders.create',
    'purchase-orders.edit',
    'reports.view',
  ],
  'Customer Support': [
    'customers.view',
    'leads.view',
    'appointments.view',
    'appointments.create',
    'service-history.view',
    'notifications.view',
    'notifications.create',
  ],
  'HR & Admin': [
    'hr.view',
    'hr.create',
    'hr.edit',
    'employees.view',
    'employees.create',
    'employees.edit',
    'payroll.view',
    'payroll.create',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
  ],
  'Customer': [
    'quotations.view',
    'bookings.view',
    'service-history.view',
    'loyalty.view',
  ],
};

export async function getUserRoles(userId: string) {
  const userRoleRecords = await db
    .select({
      roleId: userRoles.roleId,
      roleName: roles.name,
      branchId: userRoles.branchId,
      department: userRoles.department,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return userRoleRecords;
}

export async function getUserPermissions(userId: string) {
  // Get user's roles
  const userRoleRecords = await getUserRoles(userId);
  const roleIds = userRoleRecords.map(r => r.roleId);

  if (roleIds.length === 0) {
    return [];
  }

  // Get all permissions for these roles
  const userPermissions = await db
    .select({
      resource: permissions.resource,
      action: permissions.action,
      description: permissions.description,
    })
    .from(rolePermissionsTable)
    .innerJoin(permissions, eq(rolePermissionsTable.permissionId, permissions.id))
    .where(
      // Check if roleId is in the array of user's role IDs
      eq(rolePermissionsTable.roleId, roleIds[0])
    );

  // For multiple roles, we need to fetch permissions for each role
  if (roleIds.length > 1) {
    for (let i = 1; i < roleIds.length; i++) {
      const additionalPerms = await db
        .select({
          resource: permissions.resource,
          action: permissions.action,
          description: permissions.description,
        })
        .from(rolePermissionsTable)
        .innerJoin(permissions, eq(rolePermissionsTable.permissionId, permissions.id))
        .where(eq(rolePermissionsTable.roleId, roleIds[i]));
      
      userPermissions.push(...additionalPerms);
    }
  }

  // Remove duplicates based on resource + action combination
  const uniquePermissions = Array.from(
    new Map(
      userPermissions.map(p => [`${p.resource}:${p.action}`, p])
    ).values()
  );

  return uniquePermissions;
}

export function hasPermission(userRoles: RoleName[], permission: string): boolean {
  for (const role of userRoles) {
    const permissions = rolePermissions[role] || [];
    
    for (const p of permissions) {
      // Exact match
      if (p === permission) return true;
      
      // Wildcard match (e.g., 'sales.*' matches 'sales.view')
      if (p.endsWith('.*')) {
        const module = p.slice(0, -2);
        if (permission.startsWith(module + '.')) return true;
      }
    }
  }
  
  return false;
}

export function canAccessModule(userRoles: RoleName[], module: string): boolean {
  return hasPermission(userRoles, `${module}.view`) || 
         hasPermission(userRoles, `${module}.*`);
}