import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import Image from 'next/image';
import { loginForm } from '@/locales/components/auth/login-form';

/**
 * This is the server side page of login form
 * where we call the login form component
 */
export default function LoginPage() {
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
            className="h-auto w-auto pt-6 pb-4"
          />
          <h1 className="text-3xl font-bold">{loginForm.title}</h1>
          <p className="mt-2 text-gray-600">{loginForm.description}</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-gray-600">
          {loginForm.dontHaveAccount}{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            {loginForm.signupLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
