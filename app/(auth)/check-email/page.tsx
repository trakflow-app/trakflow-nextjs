import Link from 'next/link';

/**
 * Placeholder page shown after signup when email confirmation is required.
 */
export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-gray-600">
            We sent you a confirmation link. Open your email and verify your
            account before logging in.
          </p>
          <Link
            href="/login"
            className="inline-block font-medium text-blue-600 hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
