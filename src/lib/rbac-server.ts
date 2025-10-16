import { db } from '@/db';
import { userRoles, roles, rolePermissions as rolePermissionsTable, permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

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