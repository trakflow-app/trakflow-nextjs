import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HardHat, House } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  NOT_FOUND_HOME_HREF,
  NOT_FOUND_LOGIN_HREF,
} from '@/constants/app/not-found-page-constants';
import { NOT_FOUND_PAGE_MESSAGES } from '@/locales/app/not-found-locales';

export const metadata: Metadata = {
  title: NOT_FOUND_PAGE_MESSAGES.metadataTitle,
};

/**
 * Renders the global fallback page for routes that do not exist.
 */
export default function NotFound() {
  return (
    <main className="landing-grid relative flex flex-1 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-24 right-0 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 left-0 size-80 rounded-full bg-secondary/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <Logo
          href={NOT_FOUND_HOME_HREF}
          imageClassName="h-14 w-auto rounded-lg"
        />

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-20 lg:py-20">
          <div className="flex max-w-xl flex-col items-start gap-7">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {NOT_FOUND_PAGE_MESSAGES.eyebrow}
            </div>

            <div className="flex flex-col gap-5">
              <p className="font-mono text-sm font-semibold text-muted-foreground">
                {NOT_FOUND_PAGE_MESSAGES.errorCode}
              </p>
              <h1 className="max-w-lg font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {NOT_FOUND_PAGE_MESSAGES.title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                {NOT_FOUND_PAGE_MESSAGES.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={NOT_FOUND_HOME_HREF}>
                  <House data-icon="inline-start" />
                  {NOT_FOUND_PAGE_MESSAGES.homeAction}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={NOT_FOUND_LOGIN_HREF}>
                  {NOT_FOUND_PAGE_MESSAGES.loginAction}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-2 rounded-3xl border border-primary/25"
            />
            <div className="relative min-h-96 overflow-hidden rounded-3xl bg-brand-primary p-8 text-brand-white shadow-xl sm:p-12">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-16 font-mono text-[12rem] font-bold leading-none text-brand-white/5 sm:text-[16rem]"
              >
                {NOT_FOUND_PAGE_MESSAGES.errorCode}
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-14 h-6 -rotate-3 bg-primary/90"
              />

              <div className="relative flex min-h-72 flex-col justify-end gap-6">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-white/10 ring-1 ring-brand-white/15">
                  <HardHat className="size-7" strokeWidth={1.75} />
                </div>
                <div className="flex max-w-md flex-col gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {NOT_FOUND_PAGE_MESSAGES.illustrationLabel}
                  </p>
                  <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                    {NOT_FOUND_PAGE_MESSAGES.illustrationTitle}
                  </h2>
                  <p className="text-sm leading-6 text-brand-white/70 sm:text-base">
                    {NOT_FOUND_PAGE_MESSAGES.illustrationDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
