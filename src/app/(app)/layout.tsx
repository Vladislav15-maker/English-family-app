
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { UserNav } from '@/components/UserNav';
import { NotificationBell } from '@/components/NotificationBell';
import { Home, BookOpen, Users, BarChart3, MessageSquare, CalendarDays, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('student' | 'teacher')[];
}

const navItems: NavItem[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home, roles: ['student'] },
  { href: '/teacher/dashboard', label: 'Dashboard', icon: Home, roles: ['teacher'] },
  { href: '/student/units', label: 'My Units', icon: BookOpen, roles: ['student'] },
  { href: '/teacher/students', label: 'Students', icon: Users, roles: ['teacher'] },
  { href: '/teacher/units', label: 'Course Units', icon: BookOpen, roles: ['teacher'] },
  { href: '/teacher/attendance', label: 'Attendance', icon: CalendarDays, roles: ['teacher'] },
  { href: '/teacher/tests', label: 'Tests', icon: GraduationCap, roles: ['teacher'] }, 
  { href: '/student/class', label: 'My Class', icon: Users, roles: ['student'] }, 
  { href: '/student/tests', label: 'My Tests', icon: GraduationCap, roles: ['student'] }, 
  { href: '/messages', label: 'Messages', icon: MessageSquare, roles: ['student', 'teacher'] },
  { href: '/statistics', label: 'Statistics', icon: BarChart3, roles: ['student', 'teacher'] }, 
];


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading application...</div>;
  }
  
  const userRole = user.role;
  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
             <Logo />
            <div className="md:hidden"> {/* Only show trigger on mobile if sidebar is icon-collapsible */}
                <SidebarTrigger/>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {accessibleNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== `/${userRole}/dashboard` && !item.href.endsWith('/dashboard') && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
                    className="justify-start"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <Link href="/settings" legacyBehavior passHref>
             <SidebarMenuButton tooltip={{ children: "Settings", className: "bg-primary text-primary-foreground" }} className="justify-start">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </SidebarMenuButton>
           </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <div className="md:hidden"> {/* Show trigger here for smaller screens when sidebar is not icon-collapsible */}
             <SidebarTrigger />
          </div>
          <div className="flex-1 md:ml-auto md:flex-grow-0 flex items-center gap-4">
            <NotificationBell />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
