import {
  HOME_PAGE_CREW_SIGNUP_HREF,
  HOME_PAGE_IMAGE_HEIGHT,
  HOME_PAGE_IMAGE_SRC,
  HOME_PAGE_IMAGE_WIDTH,
  HOME_PAGE_PANEL_CLASS_NAME,
  HOME_PAGE_SECONDARY_LINK_CLASS_NAME,
  HOME_PAGE_SIGNUP_HREF,
} from '@/constants/app/page-constants';
import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';
import { HOME_PAGE_MESSAGES } from '@/locales/app/page-locales';
import Link from 'next/link';

/**
 * Renders the home page login entry point.
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-8 font-sans sm:px-6 lg:px-8">
      <section className={HOME_PAGE_PANEL_CLASS_NAME}>
        <div className="flex min-h-[42rem] flex-col justify-between bg-card px-6 py-6 sm:px-10 lg:px-12">
          <Logo imageClassName="h-14 w-auto rounded-lg" />

          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-semibold text-foreground">
                {HOME_PAGE_MESSAGES.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {HOME_PAGE_MESSAGES.description}
              </p>
            </div>

            <LoginForm />

            <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground">
              <p>
                {HOME_PAGE_MESSAGES.signupPrompt}{' '}
                <Link
                  href={HOME_PAGE_SIGNUP_HREF}
                  className={HOME_PAGE_SECONDARY_LINK_CLASS_NAME}
                >
                  {HOME_PAGE_MESSAGES.signupLink}
                </Link>
              </p>
              <p>
                {HOME_PAGE_MESSAGES.crewSignupPrompt}{' '}
                <Link
                  href={HOME_PAGE_CREW_SIGNUP_HREF}
                  className={HOME_PAGE_SECONDARY_LINK_CLASS_NAME}
                >
                  {HOME_PAGE_MESSAGES.crewSignupLink}
                </Link>
              </p>
            </div>
          </div>

          <div aria-hidden="true" />
        </div>

        <div className="relative hidden min-h-[42rem] overflow-hidden bg-primary lg:block">
          <Image
            src={HOME_PAGE_IMAGE_SRC}
            alt={HOME_PAGE_MESSAGES.imageAlt}
            width={HOME_PAGE_IMAGE_WIDTH}
            height={HOME_PAGE_IMAGE_HEIGHT}
            priority
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/55" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-brand-white">
            <div className="max-w-md">
              <h2 className="font-heading text-3xl font-semibold leading-tight">
                {HOME_PAGE_MESSAGES.imageTitle}
              </h2>
              <p className="mt-4 text-sm leading-6 text-brand-white/85">
                {HOME_PAGE_MESSAGES.imageDescription}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
