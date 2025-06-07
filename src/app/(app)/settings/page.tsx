
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Cog } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-foreground flex items-center">
            <Cog className="mr-3 h-8 w-8 text-primary" />
            Settings
          </CardTitle>
          <CardDescription>
            Manage your application settings and preferences here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is a placeholder for the settings page. More options will be available soon.
            </p>
            {/* Example Setting Item */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
              </div>
              {/* In a real app, you'd use a Switch component here */}
              <button 
                onClick={() => alert('Theme toggle functionality coming soon!')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Toggle Theme (Coming Soon)
              </button>
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">Manage your notification preferences.</p>
              </div>
              <button 
                onClick={() => alert('Notification settings functionality coming soon!')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Manage (Coming Soon)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
