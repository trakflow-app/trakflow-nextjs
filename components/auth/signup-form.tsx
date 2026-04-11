'use client';
import { useActionState, useState } from 'react';
import { signupForm } from '@/locales/components/auth/signup-form';
import { PASSWORD_LENGTH } from '@/constants/components/auth/signup-form-constant';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signup } from '@/lib/auth/actions';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Signup form for the new users
 */
export default function SignupForm() {
  /**
   * useActionState to link the form to the server action.
   * 'state' will capture the { error: string } returned by the server.
   */
  const [state, formAction, isPending] = useActionState(signup, null);

  /** Local error state for client-side specific checks */
  const [clientError, setClientError] = useState<string | null>(null);

  // Keep local state only for the password toggle (purely UI)
  const [showPassword, setShowPassword] = useState(false);

  /**
   * This wrapper handles client-side validation before
   * triggering the actual server action.
   */
  async function handleAction(formData: FormData) {
    setClientError(null);

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    // Password Match Check
    if (password !== confirmPassword) {
      setClientError(signupForm.passwordMismatch);
      return;
    }

    // Length Check
    if (password.length < PASSWORD_LENGTH) {
      setClientError(signupForm.passwordTooShort);
      return;
    }

    // If all good, trigger the server action
    formAction(formData);
  }

  // Combine server errors and client errors for display
  const activeError = clientError || state?.error;

  return (
    <form action={handleAction} className="space-y-6">
      {activeError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {activeError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">{signupForm.fullName.label}</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder={signupForm.fullName.placeholder}
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="email">{signupForm.email.label}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={signupForm.email.placeholder}
            disabled={isPending}
            className="pr-10"
          />
        </div>

        <div>
          <Label htmlFor="password">{signupForm.password.label}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder={signupForm.password.placeholder}
              minLength={PASSWORD_LENGTH}
              disabled={isPending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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

        <div>
          <Label htmlFor="confirm_password">
            {signupForm.confirmPassword.label}
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder={signupForm.confirmPassword.placeholder}
              minLength={8}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? signupForm.loading : signupForm.submitButton}
      </Button>
    </form>
  );
}
