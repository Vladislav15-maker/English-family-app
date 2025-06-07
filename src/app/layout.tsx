import type { Metadata } from 'next';
import './globals.css';
// import { Toaster } from "@/components/ui/toaster"; // Временно закомментировано
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'EnglishFamily',
  description: 'English for the Family',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body 
        className="font-body antialiased"
        style={
          {
            '--font-body': "'PT Sans', sans-serif",
            '--font-headline': "'Literata', serif",
            '--font-code': "'Source Code Pro', monospace",
          } as React.CSSProperties
        }
      >
        <AuthProvider>
          {children}
          {/* <Toaster /> */} {/* Временно закомментировано */}
        </AuthProvider>
      </body>
    </html>
  );
}
