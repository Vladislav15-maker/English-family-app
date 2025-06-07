"use client";

import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Message } from '@/types';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockMessages, mockMessages, saveMessages } from '@/lib/mock-data'; // mockMessages for potential direct manipulation if needed

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // getMockMessages now reads from localStorage-backed mockMessages
      const fetchedMessages = getMockMessages(user.id, user.role);
      
      const relevantMessages = fetchedMessages.filter(msg => 
        msg.recipientId === user.id || (user.role === 'teacher' && msg.recipientId === 'all_students') || (msg.recipientId === 'all_students' && user.role === 'student')
      );

      setNotifications(relevantMessages.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)); 
      setUnreadCount(relevantMessages.filter(msg => !msg.isRead && msg.recipientId !== user.id ).length); // Only count unread if not self-sent
    }
  }, [user]);

  // Periodically check for new messages to update badge - a bit of a hack for mock environment
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const currentMessages = getMockMessages(user.id, user.role);
      const relevant = currentMessages.filter(msg => 
        msg.recipientId === user.id || (user.role === 'teacher' && msg.recipientId === 'all_students') || (msg.recipientId === 'all_students' && user.role === 'student')
      );
      const newUnreadCount = relevant.filter(msg => !msg.isRead && msg.senderId !== user.id).length; // Don't count own messages as unread for badge
      if (newUnreadCount !== unreadCount) {
        setUnreadCount(newUnreadCount);
        setNotifications(relevant.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, unreadCount]);


  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0 && user) {
      // Mark messages as read when dropdown is opened
      let changed = false;
      mockMessages.forEach(msg => {
        if ((msg.recipientId === user.id || (msg.recipientId === 'all_students' && user.role === 'student')) && !msg.isRead) {
          msg.isRead = true;
          changed = true;
        }
      });
      if (changed) {
        saveMessages(); // Save changes to localStorage
        setUnreadCount(0); // Update UI immediately
        // Refresh notifications list to show them as read (or implement more granular state)
        const refreshedMessages = getMockMessages(user.id, user.role);
        setNotifications(refreshedMessages.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
      }
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild className={!notification.isRead && notification.senderId !== user?.id ? "font-bold" : ""}>
              <Link href="/messages" className="cursor-pointer">
                <div className="flex flex-col">
                  <p className="text-sm">
                    {notification.senderId === 'all_students' ? 'Announcement' : notification.senderName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{notification.content}</p>
                  <p className="text-xs text-muted-foreground self-end">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/messages" className="flex items-center justify-center text-primary">
            <MessageSquare className="mr-2 h-4 w-4" />
            View all messages
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
