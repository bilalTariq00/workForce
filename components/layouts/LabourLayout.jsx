'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function LabourLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/labour/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Leave Request',
      href: '/attendance/leave-request',
      icon: Calendar,
    },
  ];

  const onToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[hsl(var(--primary))] text-white shadow-sm border-b border-[hsl(var(--primary))]/20">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h1 className="text-lg sm:text-xl font-bold">Labour Portal</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">Welcome</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-[hsl(var(--primary))] text-white transition-all duration-300 fixed lg:static inset-y-0 left-0 z-40 ${
            sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          } w-64`}
        >
          <div className="h-full flex flex-col">
            {/* Collapse Button */}
            <div className="p-4 border-b border-white/10 flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleCollapse}
                      className="text-white hover:bg-white/20 h-8 w-8"
                    >
                      {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2">
              <TooltipProvider>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => router.push(item.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-white text-[hsl(var(--primary))]'
                              : 'text-white hover:bg-white/10'
                          } ${sidebarCollapsed ? 'justify-center' : ''}`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {!sidebarCollapsed && (
                            <span className="text-sm font-medium">{item.name}</span>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right">{item.name}</TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className={`w-full text-white hover:bg-white/10 ${
                        sidebarCollapsed ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <LogOut className="h-5 w-5" />
                      {!sidebarCollapsed && (
                        <span className="ml-3">Logout</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">Logout</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
          } pl-64 lg:pl-0`}
        >
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

