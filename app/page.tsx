'use client';
import Image from 'next/image';
import React from 'react';
import { SelectField } from '@/components/ui/select-field';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
export default function Home() {
  const STATUS_OPTIONS = [
    { label: 'better', value: 'better' },
    { label: 'late', value: 'late' },
    { label: 'than', value: 'than' },
    { label: 'never', value: 'never' },
  ];

  const [status, setStatus] = React.useState<string>();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-img font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 dark:bg-black sm:items-start">

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium text-gray-800 hover:bg-tertiary"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium text-gray-800 hover:bg-gray-50"
            >
              Sign Up
            </Link>
            <Link
              href="/signup/crew"
              className="inline-flex h-15 w-75 items-center justify-center rounded-lg bg-white border border-brand-primary px-6 font-medium text-gray-800 hover:bg-gray-50"
            >
              Join as Crew (with code)
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
