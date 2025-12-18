'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { hasPermission } from '@/lib/utils/permissions';
import { hasModuleAccess } from '@/lib/config/modules';
import * as Icons from 'lucide-react';

/**
 * QuickActionCard Component
 * 
 * Renders a quick action card that only shows if user has permission
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string} props.href - Link destination
 * @param {string} props.icon - Icon name (e.g., "Clock", "DollarSign")
 * @param {string} props.requiredPermission - Permission in format "module:action"
 * @param {string} props.requiredModule - Module code (checks for any permission)
 * @param {string|Array} props.requiredPermissions - Array of permissions (user needs at least one)
 * @param {React.ReactNode} props.children - Optional additional content
 */
export default function QuickActionCard({
  title,
  description,
  href,
  icon,
  requiredPermission,
  requiredModule,
  requiredPermissions,
  children,
}) {
  // Get icon component from string name
  const Icon = icon && typeof icon === 'string' ? Icons[icon] : null;
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = {
    role: session.user.role,
    roleTemplateId: session.user.roleTemplateId,
    purchasedModules: session.user.purchasedModules || [],
  };

  // Admin always has access
  if (user.role === 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Link href={href}>
            <Button className="w-full" variant="outline">
              {title}
            </Button>
          </Link>
          {children}
        </CardContent>
      </Card>
    );
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

  // Check multiple permissions (user needs at least one)
  if (requiredPermissions && Array.isArray(requiredPermissions)) {
    hasAccess = requiredPermissions.some(perm => {
      const [module, action] = perm.split(':');
      return hasPermission(user, module, action);
    });
  }

  // If no requirements specified, show content
  if (!requiredPermission && !requiredModule && !requiredPermissions) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button className="w-full" variant="outline">
            {title}
          </Button>
        </Link>
        {children}
      </CardContent>
    </Card>
  );
}


