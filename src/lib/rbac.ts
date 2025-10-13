import { db } from '@/db';
import { userRoles, roles } from '@/db/schema';
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

export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const userRoleRecords = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return userRoleRecords.map(r => r.roleName as RoleName);
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