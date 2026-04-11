'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 text-center">
        <div>
          <h1 className="text-4xl font-bold">Welcome to TrakFlow</h1>
          <p className="mt-4 text-gray-600">Manage your crew with ease</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 font-medium text-white hover:bg-blue-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 px-6 font-medium text-gray-800 hover:bg-gray-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
