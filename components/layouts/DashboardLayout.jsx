'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Building2,
  FileText,
  Settings,
  QrCode,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Award,
  Wrench,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { filterMenuItemsByPermissions } from '@/lib/utils/navigation';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure we're on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define all menu items
  const allMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/hr/dashboard',
    },
    {
      title: 'Role Templates',
      icon: Shield,
      href: '/admin/role-templates',
    },
    {
      title: 'Sites',
      icon: Building2,
      href: '/hr/sites',
    },
    {
      title: 'Tools',
      icon: Wrench,
      href: '/hr/tools',
    },
    {
      title: 'Messages',
      icon: MessageSquare,
      href: '/chat',
    },
    {
      title: 'QR Code',
      icon: QrCode,
      href: '/hr/qr-display',
    },
    {
      title: 'Timesheets',
      icon: Clock,
      href: '/hr/timesheets',
    },
    {
      title: 'Leave Requests',
      icon: Calendar,
      href: '/hr/leave-requests',
    },
    {
      title: 'Certifications',
      icon: Award,
      href: '/hr/certifications',
    },
    {
      title: 'Payroll',
      icon: DollarSign,
      href: '/hr/payroll',
    },
    {
      title: 'Reports',
      icon: FileText,
      href: '/hr/reports',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/hr/settings',
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    // During SSR or before mount, return all items to match server render
    // But ensure Role Templates is always included if user might be admin/hr_officer
    if (!mounted || status === 'loading' || !session?.user) {
      const items = allMenuItems.map(item => ({
        ...item,
        active: pathname === item.href || pathname.startsWith(item.href + '/'),
      }));
      return items;
    }

    // Create user object for permission checking
    // Use stable references to prevent unnecessary re-renders
    const user = {
      role: session.user.role,
      roleTemplateId: session.user.roleTemplateId,
      purchasedModules: session.user.purchasedModules || [],
    };

    const userRole = user.role || session?.user?.role;
    
    // Filter menu items
    let filtered = filterMenuItemsByPermissions(allMenuItems, user);
    
    // ALWAYS ensure Role Templates is shown for admin and hr_officer
    // This is a critical menu item that should never be filtered out for these roles
    const roleTemplatesItem = allMenuItems.find(item => item.href === '/admin/role-templates');
    
    if (roleTemplatesItem && (userRole === 'admin' || userRole === 'hr_officer')) {
      // Remove any existing instance first (in case filter already included it or removed it)
      filtered = filtered.filter(item => item.href !== '/admin/role-templates');
      // Always add it at the end for admin/hr_officer - this ensures it's visible
      filtered.push({
        ...roleTemplatesItem,
        title: 'Role Templates',
        icon: Shield,
        href: '/admin/role-templates',
      });
    }
    
    const finalItems = filtered.map(item => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(item.href + '/'),
    }));

    // Debug: Log menu items (remove in production)
    if (process.env.NODE_ENV === 'development') {
      const hasRoleTemplates = finalItems.some(item => item.href === '/admin/role-templates');
      if (!hasRoleTemplates && (userRole === 'admin' || userRole === 'hr_officer')) {
        console.warn('[DashboardLayout] Role Templates missing from menu items!', {
          userRole,
          menuItemsCount: finalItems.length,
          menuHrefs: finalItems.map(m => m.href),
        });
      }
    }

    return finalItems;
  }, [mounted, status, session?.user?.role, session?.user?.roleTemplateId, session?.user?.purchasedModules, pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-primary">
          <SidebarContent
            menuItems={menuItems}
            session={session}
            onLogout={handleLogout}
            onItemClick={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-primary/20 bg-primary overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}>
          <SidebarContent
            menuItems={menuItems}
            session={session}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>

        {/* Main Content */}
        <div className={`flex-1 w-full transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}>
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-primary text-white">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/20 flex-shrink-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <h1 className="text-lg sm:text-xl font-semibold text-white truncate">HR Dashboard</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="hidden sm:block text-xs sm:text-sm text-white/90 truncate max-w-[120px] sm:max-w-none">
                  {session?.user?.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8 w-full min-w-0 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ menuItems, session, onLogout, onItemClick, collapsed, onToggleCollapse }) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center border-b border-white/20 px-3 lg:px-6 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-white whitespace-nowrap">Workforce</span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="hidden lg:flex text-white hover:bg-white/20 flex-shrink-0 h-8 w-8"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const linkContent = (
              <Link
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  item.active
                    ? 'bg-white text-primary font-semibold'
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-white/20 p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-white/70 truncate">{session?.user?.email}</p>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className={`w-full text-white hover:bg-white/20 hover:text-white ${
                  collapsed ? 'justify-center px-0' : 'justify-start'
                }`}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

