'use client';
import Image from 'next/image';
import React from 'react';
import { SelectField } from '@/components/ui/select-field';
import Link from 'next/link';
import { AppImage } from '@/components/ui/app-image';
export default function Home() {
  const STATUS_OPTIONS = [
    { label: 'better', value: 'better' },
    { label: 'late', value: 'late' },
    { label: 'than', value: 'than' },
    { label: 'never', value: 'never' },
  ];

  const [status, setStatus] = React.useState<string>();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <AppImage
          className="dark:invert"
          src="/trakflow-logo.png"
          alt="TrakFlow logo"
          width={100}
          height={20}
          rounded="none"
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
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
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <SelectField
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            placeholder="Select an option"
          />
        </div>
      </main>
    </div>
  );
}
