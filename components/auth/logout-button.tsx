'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth/actions';
import { LogOut } from 'lucide-react';
import { logoutButton } from '@/locales/components/auth/logout-button';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

/**
 * Logout button
 */
export default function LogoutButton({
  variant = 'ghost',
  className,
}: LogoutButtonProps) {
  /** Loading state */
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logout();
  }

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? logoutButton.loading : logoutButton.submitButton}
    </Button>
  );
}
