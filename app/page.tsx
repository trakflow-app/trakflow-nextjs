'use client';
import { HOME_PAGE_MESSAGES } from '@/locales/app/page-locales';
import Link from 'next/link';

/**
 * Renders the home page navigation entry points.
 */
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-img font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium mt-4 mb-4 text-gray-800 hover:bg-tertiary"
            >
              {HOME_PAGE_MESSAGES.loginLink}
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium mb-4 text-gray-800 hover:bg-tertiary"
            >
              {HOME_PAGE_MESSAGES.signupLink}
            </Link>
            <Link
              href="/signup/crew"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium mb-4 text-gray-800 hover:bg-tertiary"
            >
              {HOME_PAGE_MESSAGES.crewSignupLink}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
