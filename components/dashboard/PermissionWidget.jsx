'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, hasModulePermission } from '@/lib/utils/permissions';
import { hasModuleAccess } from '@/lib/config/modules';

/**
 * PermissionWidget Component
 * 
 * Only renders children if user has the required permission
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if permission granted
 * @param {string} props.requiredPermission - Permission in format "module:action" (e.g., "hrm:view")
 * @param {string} props.requiredModule - Module code (checks for any permission on module)
 * @param {React.ReactNode} props.fallback - Optional fallback content if permission denied
 */
export default function PermissionWidget({ 
  children, 
  requiredPermission, 
  requiredModule,
  fallback = null 
}) {
  const { data: session } = useSession();

  if (!session?.user) {
    return fallback;
  }

  const user = {
    role: session.user.role,
    roleTemplateId: session.user.roleTemplateId,
    purchasedModules: session.user.purchasedModules || [],
  };

  // Admin always has access
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check module-level access
  if (requiredModule) {
    hasAccess = hasModuleAccess(user, requiredModule);
  }

  // Check specific permission
  if (requiredPermission) {
    const [module, action] = requiredPermission.split(':');
    hasAccess = hasPermission(user, module, action);
  }

  // If no requirements specified, show content
  if (!requiredPermission && !requiredModule) {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}


