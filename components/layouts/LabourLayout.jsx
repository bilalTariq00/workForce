'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Award,
  Menu,
  User,
  Wrench,
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

export default function LabourLayout({ children }) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/labour/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Tools',
      href: '/attendance/tools',
      icon: Wrench,
    },
    {
      title: 'Messages',
      href: '/chat',
      icon: MessageSquare,
    },
    {
      title: 'Leave Request',
      href: '/attendance/leave-request',
      icon: Calendar,
    },
    {
      title: 'Certifications',
      href: '/attendance/certifications',
      icon: Award,
    },
  ].map(item => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(item.href + '/'),
  }));

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
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">Labour Portal</h1>
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
function SidebarContent({ menuItems, session, onLogout, onItemClick, collapsed, onToggleCollapse }) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex h-14 sm:h-16 items-center border-b border-white/20 px-3 lg:px-6 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-semibold text-white block truncate text-sm sm:text-base">Labour Portal</span>
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
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const linkContent = (
              <Link
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-sm font-medium transition-colors touch-manipulation ${
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

