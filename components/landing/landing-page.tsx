import {
  ArrowRight,
  Boxes,
  Check,
  ClipboardCheck,
  HardHat,
  PackageCheck,
  Users,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  HOME_PAGE_ANCHORS,
  HOME_PAGE_CONTAINER_CLASS_NAME,
  HOME_PAGE_IMAGE_SIZE,
  HOME_PAGE_IMAGE_SRC,
  HOME_PAGE_LOGIN_HREF,
  HOME_PAGE_SECONDARY_IMAGE_SRC,
  HOME_PAGE_SIGNUP_HREF,
} from '@/constants/app/page-constants';
import { HOME_PAGE_MESSAGES } from '@/locales/app/page-locales';

const FEATURE_ICONS = [ClipboardCheck, PackageCheck, Wrench] as const;
const TRUST_ICONS = [HardHat, Boxes, Users] as const;

/**
 * Renders the public landing page and its marketing sections.
 */
export function LandingPage() {
  return (
    <main className="overflow-hidden bg-background">
      <header className="border-b border-border bg-background">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} flex h-20 items-center justify-between gap-6`}
        >
          <Logo href="/" imageClassName="h-11 w-auto" className="shrink-0" />

          <nav
            aria-label={HOME_PAGE_MESSAGES.navigation.menuLabel}
            className="hidden items-center gap-8 md:flex"
          >
            <Link
              href={HOME_PAGE_ANCHORS.features}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {HOME_PAGE_MESSAGES.navigation.features}
            </Link>
            <Link
              href={HOME_PAGE_ANCHORS.workflow}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {HOME_PAGE_MESSAGES.navigation.workflow}
            </Link>
            <Link
              href={HOME_PAGE_ANCHORS.pricing}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {HOME_PAGE_MESSAGES.navigation.pricing}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href={HOME_PAGE_LOGIN_HREF}>
                {HOME_PAGE_MESSAGES.navigation.login}
              </Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href={HOME_PAGE_SIGNUP_HREF}>
                {HOME_PAGE_MESSAGES.navigation.getStarted}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="landing-grid border-b border-border">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} grid min-h-[44rem] items-center gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24`}
        >
          <div className="flex flex-col items-start gap-7">
            <p className="border-l-2 border-primary pl-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {HOME_PAGE_MESSAGES.hero.eyebrow}
            </p>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
                {HOME_PAGE_MESSAGES.hero.titleStart}{' '}
                <span className="text-primary">
                  {HOME_PAGE_MESSAGES.hero.titleAccent}
                </span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {HOME_PAGE_MESSAGES.hero.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={HOME_PAGE_SIGNUP_HREF}>
                  {HOME_PAGE_MESSAGES.hero.primaryAction}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={HOME_PAGE_ANCHORS.features}>
                  {HOME_PAGE_MESSAGES.hero.secondaryAction}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl pb-8 pl-5 sm:pl-10">
            <div className="absolute inset-x-0 bottom-0 top-8 -rotate-2 border border-border bg-card shadow-lg" />
            <div className="relative aspect-[4/3] overflow-hidden border border-foreground/20 bg-muted shadow-xl">
              <Image
                src={HOME_PAGE_IMAGE_SRC}
                alt={HOME_PAGE_MESSAGES.hero.imageAlt}
                width={HOME_PAGE_IMAGE_SIZE.width}
                height={HOME_PAGE_IMAGE_SIZE.height}
                priority
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/10" />
            </div>
            <div className="absolute bottom-0 left-0 border border-primary bg-primary px-5 py-4 text-primary-foreground shadow-lg">
              <p className="font-heading text-xl font-semibold">
                {HOME_PAGE_MESSAGES.hero.statValue}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/80">
                {HOME_PAGE_MESSAGES.hero.statLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} flex flex-col items-center justify-between gap-8 py-8 lg:flex-row`}
        >
          <p className="text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:text-left">
            {HOME_PAGE_MESSAGES.trust.label}
          </p>
          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {HOME_PAGE_MESSAGES.trust.items.map((item, index) => {
              const Icon = TRUST_ICONS[index];

              return (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 border-l border-border text-sm font-medium text-foreground first:border-l-0"
                >
                  <Icon className="text-primary" aria-hidden="true" />
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="bg-brand-primary text-brand-white">
        <div className={`${HOME_PAGE_CONTAINER_CLASS_NAME} py-20 lg:py-28`}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {HOME_PAGE_MESSAGES.features.eyebrow}
              </p>
              <h2 className="max-w-xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {HOME_PAGE_MESSAGES.features.title}
              </h2>
            </div>
            <p className="max-w-2xl self-end text-base leading-7 text-brand-white/65 lg:justify-self-end">
              {HOME_PAGE_MESSAGES.features.description}
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-brand-white/15 bg-brand-white/15 md:grid-cols-3">
            {HOME_PAGE_MESSAGES.features.items.map((feature, index) => {
              const Icon = FEATURE_ICONS[index];

              return (
                <article
                  key={feature.title}
                  className="flex min-h-72 flex-col justify-between gap-10 bg-brand-primary p-7 sm:p-9"
                >
                  <Icon className="text-primary" aria-hidden="true" />
                  <div className="flex flex-col gap-3">
                    <h3 className="font-heading text-xl font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-brand-white/65">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-grid border-b border-border">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} grid gap-14 py-20 lg:grid-cols-2 lg:items-center lg:py-28`}
        >
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden border border-border bg-muted shadow-lg">
              <Image
                src={HOME_PAGE_SECONDARY_IMAGE_SRC}
                alt={HOME_PAGE_MESSAGES.workflow.imageAlt}
                width={HOME_PAGE_IMAGE_SIZE.width}
                height={HOME_PAGE_IMAGE_SIZE.height}
                className="size-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-5 -z-10 size-40 bg-primary/15" />
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {HOME_PAGE_MESSAGES.workflow.eyebrow}
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {HOME_PAGE_MESSAGES.workflow.title}
              </h2>
              <p className="max-w-xl leading-7 text-muted-foreground">
                {HOME_PAGE_MESSAGES.workflow.description}
              </p>
            </div>

            <div className="flex flex-col">
              {HOME_PAGE_MESSAGES.workflow.steps.map((step) => (
                <article
                  key={step.number}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-t border-border py-5"
                >
                  <span className="font-mono text-sm font-semibold text-primary">
                    {step.number}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-muted">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-28`}
        >
          <div className="flex flex-col items-start gap-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {HOME_PAGE_MESSAGES.pricing.eyebrow}
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {HOME_PAGE_MESSAGES.pricing.title}
            </h2>
            <p className="max-w-lg leading-7 text-muted-foreground">
              {HOME_PAGE_MESSAGES.pricing.description}
            </p>
          </div>

          <Card className="rounded-none border-foreground/20 shadow-lg">
            <CardHeader className="gap-3 border-b border-border p-7 sm:p-9">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {HOME_PAGE_MESSAGES.pricing.cardLabel}
              </p>
              <CardTitle className="font-heading text-2xl leading-tight sm:text-3xl">
                {HOME_PAGE_MESSAGES.pricing.cardTitle}
              </CardTitle>
              <CardDescription className="max-w-2xl leading-6">
                {HOME_PAGE_MESSAGES.pricing.cardDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-7 sm:grid-cols-2 sm:p-9">
              {HOME_PAGE_MESSAGES.pricing.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check aria-hidden="true" />
                  </span>
                  {feature}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border p-7 sm:flex-row sm:items-center sm:p-9">
              <Button size="lg" asChild>
                <Link href={HOME_PAGE_SIGNUP_HREF}>
                  {HOME_PAGE_MESSAGES.pricing.action}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href={HOME_PAGE_LOGIN_HREF}>
                  {HOME_PAGE_MESSAGES.pricing.secondaryAction}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="bg-brand-primary text-brand-white">
        <div
          className={`${HOME_PAGE_CONTAINER_CLASS_NAME} flex flex-col items-center gap-6 py-20 text-center lg:py-24`}
        >
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {HOME_PAGE_MESSAGES.callToAction.eyebrow}
          </p>
          <h2 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {HOME_PAGE_MESSAGES.callToAction.title}
          </h2>
          <p className="max-w-xl leading-7 text-brand-white/65">
            {HOME_PAGE_MESSAGES.callToAction.description}
          </p>
          <Button size="lg" asChild>
            <Link href={HOME_PAGE_SIGNUP_HREF}>
              {HOME_PAGE_MESSAGES.callToAction.action}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
