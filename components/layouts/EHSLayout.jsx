'use client';

import { useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  FileText,
  MessageSquare,
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

export default function EHSLayout({ children }) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Helper function to mark active state
  const markActive = (items) => {
    return items.map(item => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(item.href + '/'),
    }));
  };

  // Main navigation items organized by category
  const allMainMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/ehs/dashboard',
      description: 'Overview & statistics',
    },
    {
      title: 'Messages',
      icon: MessageSquare,
      href: '/chat',
      description: 'Real-time chat',
    },
  ];

  const allSafetyMenuItems = [
    {
      title: 'Incidents',
      icon: AlertTriangle,
      href: '/ehs/incidents',
      description: 'Triage & investigation',
    },
    {
      title: 'Inspections',
      icon: ClipboardCheck,
      href: '/ehs/inspections',
      description: 'Site inspections & audits',
    },
  ];

  const allComplianceMenuItems = [
    {
      title: 'Training',
      icon: GraduationCap,
      href: '/ehs/training',
      description: 'Training register',
    },
    {
      title: 'Certifications',
      icon: Award,
      href: '/hr/certifications',
      description: 'Validate certifications',
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    const markActive = (items) => {
      return items.map(item => ({
        ...item,
        active: pathname === item.href || pathname.startsWith(item.href + '/'),
      }));
    };

    if (!session?.user) {
      return {
        main: markActive(allMainMenuItems),
        safety: markActive(allSafetyMenuItems),
        compliance: markActive(allComplianceMenuItems),
        all: markActive([...allMainMenuItems, ...allSafetyMenuItems, ...allComplianceMenuItems]),
      };
    }

    // Create user object for permission checking
    const user = {
      role: session.user.role,
      roleTemplateId: session.user.roleTemplateId,
      purchasedModules: session.user.purchasedModules || [],
    };

    const allItems = [...allMainMenuItems, ...allSafetyMenuItems, ...allComplianceMenuItems];
    const filtered = filterMenuItemsByPermissions(allItems, user);
    
    // Separate back into categories
    const main = filtered.filter(item => allMainMenuItems.some(m => m.href === item.href));
    const safety = filtered.filter(item => allSafetyMenuItems.some(s => s.href === item.href));
    const compliance = filtered.filter(item => allComplianceMenuItems.some(c => c.href === item.href));
    
    return {
      main: markActive(main),
      safety: markActive(safety),
      compliance: markActive(compliance),
      all: markActive(filtered),
    };
  }, [session, pathname]);

  const mainMenuItems = filteredMenuItems.main;
  const safetyMenuItems = filteredMenuItems.safety;
  const complianceMenuItems = filteredMenuItems.compliance;
  const allMenuItems = filteredMenuItems.all;

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
            className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white hover:bg-primary/90 shadow-lg"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-primary">
          <SidebarContent
            menuItems={allMenuItems}
            session={session}
            onLogout={handleLogout}
            onItemClick={() => setSidebarOpen(false)}
            mainMenuItems={mainMenuItems}
            safetyMenuItems={safetyMenuItems}
            complianceMenuItems={complianceMenuItems}
          />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-primary/20 bg-primary overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}>
          <SidebarContent
            menuItems={allMenuItems}
            session={session}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            mainMenuItems={mainMenuItems}
            safetyMenuItems={safetyMenuItems}
            complianceMenuItems={complianceMenuItems}
          />
        </aside>

        {/* Main Content */}
        <div className={`flex-1 w-full transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}>
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-primary text-white">
            <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/20 flex-shrink-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">EHS Portal</h1>
                    {session?.user?.name && (
                      <p className="text-xs text-white/80 hidden sm:block truncate">{session.user.name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="hidden sm:block text-xs sm:text-sm text-white/90 truncate max-w-[120px] sm:max-w-none">
                  {session?.user?.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20 hover:text-white flex-shrink-0 px-2 sm:px-3"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-3 sm:p-4 lg:p-6 xl:p-8 w-full min-w-0 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}

/**
 * Sidebar Content Component
 * Displays navigation menu, user info, and logout button
 */
function SidebarContent({ 
  menuItems, 
  session, 
  onLogout, 
  onItemClick, 
  collapsed, 
  onToggleCollapse,
  mainMenuItems = [],
  safetyMenuItems = [],
  complianceMenuItems = [],
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex h-14 sm:h-16 items-center border-b border-white/20 px-3 lg:px-6 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-semibold text-white block truncate text-sm sm:text-base">EHS Portal</span>
                {session?.user?.name && (
                  <span className="text-xs text-white/70 truncate max-w-[140px] block">
                    {session.user.name}
                  </span>
                )}
              </div>
            )}
          </div>
          {onToggleCollapse && (
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
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
          {/* Main Menu Section */}
          {!collapsed && mainMenuItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-3 mb-2">
                Main
              </p>
              <div className="space-y-1">
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-sm font-medium transition-colors touch-manipulation ${
                        item.active
                          ? 'bg-white text-primary font-semibold'
                          : 'text-white hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs opacity-70 truncate">{item.description}</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safety Section */}
          {!collapsed && safetyMenuItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-3 mb-2">
                Safety Management
              </p>
              <div className="space-y-1">
                {safetyMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-sm font-medium transition-colors touch-manipulation ${
                        item.active
                          ? 'bg-white text-primary font-semibold'
                          : 'text-white hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs opacity-70 truncate">{item.description}</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compliance Section */}
          {!collapsed && complianceMenuItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-3 mb-2">
                Compliance
              </p>
              <div className="space-y-1">
                {complianceMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-sm font-medium transition-colors touch-manipulation ${
                        item.active
                          ? 'bg-white text-primary font-semibold'
                          : 'text-white hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs opacity-70 truncate">{item.description}</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsed View - Show all items as icons only */}
          {collapsed && (
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const linkContent = (
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={`flex items-center justify-center rounded-lg px-3 py-2.5 sm:py-3 text-sm font-medium transition-colors touch-manipulation ${
                      item.active
                        ? 'bg-white text-primary font-semibold'
                        : 'text-white hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                  </Link>
                );

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs opacity-80">{item.description}</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-white/20 p-3 sm:p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || 'User'}
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
                className={`w-full text-white hover:bg-white/20 hover:text-white touch-manipulation ${
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

