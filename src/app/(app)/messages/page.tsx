"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { mockMessages, mockStudents, mockTeacher, getMockMessages } from '@/lib/mock-data';
import type { Message } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>(''); // studentId or 'teacher' or 'all_students'
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null); // Used to filter displayed messages

  useEffect(() => {
    if (user) {
      setMessages(getMockMessages(user.id, user.role).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      // Auto-select first conversation partner or teacher for students
      if (user.role === 'student') {
        const teacherMessages = messages.filter(m => m.senderId === mockTeacher.id || m.recipientId === mockTeacher.id);
        if(teacherMessages.length > 0) {
            setActiveConversationId(mockTeacher.id);
            setSelectedRecipient(mockTeacher.id); // Default to teacher for students
        }
      }
    }
  }, [user]); // messages dependency removed to avoid loop on setMessages

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  
  const getConversationPartners = () => {
    if (!user) return [];
    const partners = new Map<string, { id: string, name: string, type: 'student' | 'teacher' | 'group'}>();
    messages.forEach(msg => {
      if (msg.senderId !== user.id && msg.senderId !== 'all_students') {
        partners.set(msg.senderId, {id: msg.senderId, name: msg.senderName, type: msg.senderId.startsWith('teacher-') ? 'teacher' : 'student'});
      }
      if (msg.recipientId !== user.id && msg.recipientId !== 'all_students') {
        const recipientUser = mockStudents.find(s => s.id === msg.recipientId) || (msg.recipientId === mockTeacher.id ? mockTeacher : null);
        if (recipientUser) {
           partners.set(recipientUser.id, {id: recipientUser.id, name: recipientUser.name, type: recipientUser.role });
        }
      }
    });
    if (user.role === 'student' && !partners.has(mockTeacher.id)) {
        partners.set(mockTeacher.id, {id: mockTeacher.id, name: mockTeacher.name, type: 'teacher'});
    }
    return Array.from(partners.values());
  }
  
  const conversationPartners = getConversationPartners();

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user || !selectedRecipient) {
        toast({title: "Error", description: "Please select a recipient and type a message.", variant: "destructive"});
        return;
    }
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      recipientId: selectedRecipient,
      content: newMessage,
      timestamp: new Date(),
      isRead: false,
    };
    // In a real app, this would be sent to a backend
    setMessages(prev => [...prev, newMsg]); 
    mockMessages.push(newMsg); // Add to global mock for persistence in session
    setNewMessage('');
    toast({title: "Message Sent!", description: "Your message has been sent successfully."});
  };
  
  const displayedMessages = activeConversationId
    ? messages.filter(msg => 
        (msg.senderId === user?.id && msg.recipientId === activeConversationId) ||
        (msg.senderId === activeConversationId && msg.recipientId === user?.id) ||
        (msg.recipientId === 'all_students' && user?.role === 'student') // Show group messages to students
      )
    : [];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 h-[calc(100vh-var(--header-height,4rem)-2rem)] flex flex-col md:flex-row gap-4">
      {/* Contacts/Conversations List */}
      <Card className="w-full md:w-1/3 lg:w-1/4 shadow-xl flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Conversations</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent>
            {conversationPartners.map(partner => (
              <Button 
                key={partner.id} 
                variant={activeConversationId === partner.id ? "secondary" : "ghost"} 
                className="w-full justify-start mb-2 p-2 h-auto"
                onClick={() => {setActiveConversationId(partner.id); setSelectedRecipient(partner.id);}}
              >
                <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getInitials(partner.name)}</AvatarFallback>
                </Avatar>
                {partner.name}
              </Button>
            ))}
            {user?.role === 'teacher' && (
                 <Button 
                    variant={activeConversationId === 'all_students' ? "secondary" : "ghost"} 
                    className="w-full justify-start mb-2 p-2 h-auto"
                    onClick={() => {setActiveConversationId('all_students'); setSelectedRecipient('all_students');}}
                >
                    <Users className="h-6 w-6 mr-2 text-primary"/> All Students (Announcement)
                </Button>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Message Display and Input Area */}
      <Card className="w-full md:w-2/3 lg:w-3/4 shadow-xl flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">
            {activeConversationId && (conversationPartners.find(p=>p.id === activeConversationId)?.name || (activeConversationId === 'all_students' ? 'All Students' : 'Select a conversation'))}
          </CardTitle>
          <CardDescription>View and send messages.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow p-4 border-t border-b">
          <CardContent className="space-y-4">
            {displayedMessages.length === 0 && activeConversationId && <p className="text-muted-foreground text-center">No messages yet in this conversation. Start typing!</p>}
            {displayedMessages.length === 0 && !activeConversationId && <p className="text-muted-foreground text-center">Select a conversation to view messages.</p>}
            {displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.senderId === user?.id ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{getInitials(msg.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "p-3 rounded-lg max-w-[70%]",
                    msg.senderId === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.senderId === user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </CardContent>
        </ScrollArea>
        {activeConversationId && (
        <CardFooter className="p-4">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              className="flex-1"
              rows={1}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !selectedRecipient}>
              <Send className="h-4 w-4 mr-0 sm:mr-2"/> <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </CardFooter>
        )}
      </Card>
    </div>
  );
}
