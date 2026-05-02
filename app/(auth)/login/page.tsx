import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import Image from 'next/image';
import { loginForm } from '@/locales/components/auth/login-form-locales';

/**
 * Props for the login page — searchParams used to preserve
 * a post-auth redirect destination (e.g. /join/[token]).
 */
interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

/**
 * This is the server side page of login form
 * where we call the login form component
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center flex flex-col items-center">
          {/* Logo */}
          <Image
            src="/trakflow-logo.png"
            alt="TrakFlow logo"
            width={500}
            height={100}
            priority
            className="w-auto h-auto"
          />
          <h1 className="text-3xl font-bold">{loginForm.title}</h1>
          <p className="mt-2 text-gray-600">{loginForm.description}</p>
        </div>

        <LoginForm redirect={redirect} />

        <p className="text-center text-sm text-gray-600">
          {loginForm.dontHaveAccount}{' '}
          {/* Pass the redirect param to signup so it survives if the user
              needs to create an account before claiming an invite. */}
          <Link
            href={
              redirect
                ? `/signup?redirect=${encodeURIComponent(redirect)}`
                : '/signup'
            }
            className="font-medium text-blue-600 hover:underline"
          >
            {loginForm.signupLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
