'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { hasPermission } from '@/lib/utils/permissions';
import { hasModuleAccess } from '@/lib/config/modules';
import * as Icons from 'lucide-react';

/**
 * StatsCard Component
 * 
 * Renders a stats card that only shows if user has permission
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {React.ReactNode} props.children - Stats content
 * @param {string} props.icon - Icon name (e.g., "Clock", "DollarSign")
 * @param {string} props.requiredPermission - Permission in format "module:action"
 * @param {string} props.requiredModule - Module code (checks for any permission)
 * @param {string} props.iconColor - Optional icon color class
 */
export default function StatsCard({
  title,
  description,
  children,
  icon,
  requiredPermission,
  requiredModule,
  iconColor = 'text-primary',
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
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

  // If no requirements specified, show content
  if (!requiredPermission && !requiredModule) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}


