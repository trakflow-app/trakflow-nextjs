'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginForm } from '@/locales/components/auth/login-form-locales';
import { login } from '@/lib/auth/actions';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Login form for authenticated user
 */
export default function LoginForm() {
  /** * state: returns the { error: string } from your action
   * formAction: the optimized function to pass to the form
   * isPending: replaces your manual 'loading' state automatically
   */
  const [state, formAction, isPending] = useActionState(login, null);

  // Keep local state only for the password toggle (purely UI)
  const [showPassword, setShowPassword] = useState(false);
  /**
   * UI form
   */
  return (
    <form action={formAction} className="space-y-6">
      {/* Displays the error returned by the server action */}
      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">{loginForm.email.label}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={loginForm.email.placeholder}
            disabled={isPending}
            aria-invalid={Boolean(state?.error)}
          />
        </div>

        <div>
          <Label htmlFor="password">{loginForm.password.label}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder={loginForm.password.placeholder}
              disabled={isPending}
              className="pr-10"
              aria-invalid={Boolean(state?.error)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? loginForm.hidePassword : loginForm.showPassword
              }
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="remember_me">{loginForm.rememberMe}</Label>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? loginForm.loading : loginForm.submitButton}
      </Button>
    </form>
  );
}
