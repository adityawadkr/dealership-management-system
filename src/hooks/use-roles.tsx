"use client";

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { RoleName, canAccessModule, hasPermission } from '@/lib/rbac';

export function useRoles() {
  const { data: session, isPending } = useSession();
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!session?.user?.id) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user-roles?user_id=${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
          }
        });

        if (!response.ok) {
          setRoles([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // Fetch role names
        const roleNames = await Promise.all(
          data.data.map(async (ur: any) => {
            const roleResponse = await fetch(`/api/roles?id=${ur.roleId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
              }
            });
            const roleData = await roleResponse.json();
            return roleData.data?.name as RoleName;
          })
        );

        setRoles(roleNames.filter(Boolean));
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    if (!isPending) {
      fetchRoles();
    }
  }, [session?.user?.id, isPending]);

  return {
    roles,
    loading: loading || isPending,
    hasPermission: (permission: string) => hasPermission(roles, permission),
    canAccessModule: (module: string) => canAccessModule(roles, module),
    isAdmin: roles.includes('Dealer Admin'),
  };
}