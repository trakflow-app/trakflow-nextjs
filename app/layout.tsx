import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/sonner';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

import './globals.css';

export const metadata: Metadata = {
  title: 'TrakFlow',
  description: 'Manage your construction projects efficiently',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
