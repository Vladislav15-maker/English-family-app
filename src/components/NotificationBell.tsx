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
import { getMockMessages } from '@/lib/mock-data'; 

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchedMessages = getMockMessages(user.id, user.role);
      // Filter for messages addressed to the user (not announcements seen by students unless they are the recipient)
      // and group messages if the user is a teacher and recipient is 'all_students'
      const relevantMessages = fetchedMessages.filter(msg => 
        msg.recipientId === user.id || (user.role === 'teacher' && msg.recipientId === 'all_students')
      );

      setNotifications(relevantMessages.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)); 
      setUnreadCount(relevantMessages.filter(msg => !msg.isRead).length);
    }
  }, [user]);


  const handleOpenChange = (open: boolean) => {
    if(open && unreadCount > 0) {
      // In a real app, you'd mark as read on interaction or when messages page is visited.
      // For now, this simulation only clears the badge visually on open.
      // setUnreadCount(0); 
      // To truly mark as read, an API call and state update in mockMessages would be needed.
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
            <DropdownMenuItem key={notification.id} asChild>
              <Link href="/messages" className="cursor-pointer">
                <div className="flex flex-col">
                  <p className="text-sm font-medium">
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