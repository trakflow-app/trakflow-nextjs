import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Renders authentication pages with public site chrome.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
