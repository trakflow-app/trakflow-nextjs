import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

interface JoinLayoutProps {
  children: ReactNode;
}

/**
 * Renders invite pages with public site chrome.
 */
export default function JoinLayout({ children }: JoinLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
