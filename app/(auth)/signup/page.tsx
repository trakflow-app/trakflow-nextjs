import SignupForm from '@/components/auth/signup-form';
import Link from 'next/link';
import Image from 'next/image';
import { signupForm } from '@/locales/components/auth/signup-form-locales';

/**
 * This is the server side page of login form
 * where we call the login form component
 */
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center flex flex-col items-center">
          {/* Logo*/}
          <Image
            src="/trakflow-logo.png"
            alt="TrakFlow logo"
            width={500}
            height={100}
            priority
            className="w-auto h-auto"
          />

          <h1 className="text-3xl font-bold">{signupForm.title}</h1>
          <p className="mt-2 text-gray-600">{signupForm.description}</p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-gray-600">
          {signupForm.alreadyHaveAnAccount}{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            {signupForm.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
