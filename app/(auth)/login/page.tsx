import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';
import {
  LOGIN_PAGE_CREW_SIGNUP_HREF,
  LOGIN_PAGE_IMAGE_SIZE,
  LOGIN_PAGE_IMAGE_SRC,
  LOGIN_PAGE_PANEL_CLASS_NAME,
  LOGIN_PAGE_SECONDARY_LINK_CLASS_NAME,
  LOGIN_PAGE_SIGNUP_HREF,
} from '@/constants/app/login-page-constants';
import { loginForm } from '@/locales/components/auth/login-form-locales';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Props for the login page — searchParams used to preserve
 * a post-auth redirect destination (e.g. /join/[token]).
 */
interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

/**
 * This is the server side page of login form
 * where we call the login form component
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const signupHref = redirect
    ? `${LOGIN_PAGE_SIGNUP_HREF}?redirect=${encodeURIComponent(redirect)}`
    : LOGIN_PAGE_SIGNUP_HREF;

  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-8 font-sans sm:px-6 lg:px-8">
      <section className={LOGIN_PAGE_PANEL_CLASS_NAME}>
        <div className="flex min-h-[42rem] flex-col justify-between bg-card px-6 py-6 sm:px-10 lg:px-12">
          <Logo imageClassName="h-14 w-auto rounded-lg" />

          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-semibold text-foreground">
                {loginForm.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {loginForm.description}
              </p>
            </div>

            <LoginForm redirect={redirect} />

            <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground">
              <p>
                {loginForm.dontHaveAccount}{' '}
                <Link
                  href={signupHref}
                  className={LOGIN_PAGE_SECONDARY_LINK_CLASS_NAME}
                >
                  {loginForm.signupLink}
                </Link>
              </p>
              <p>
                {loginForm.crewSignupPrompt}{' '}
                <Link
                  href={LOGIN_PAGE_CREW_SIGNUP_HREF}
                  className={LOGIN_PAGE_SECONDARY_LINK_CLASS_NAME}
                >
                  {loginForm.crewSignupLink}
                </Link>
              </p>
            </div>
          </div>

          <div aria-hidden="true" />
        </div>

        <div className="relative hidden min-h-[42rem] overflow-hidden bg-primary lg:block">
          <Image
            src={LOGIN_PAGE_IMAGE_SRC}
            alt={loginForm.imageAlt}
            width={LOGIN_PAGE_IMAGE_SIZE.width}
            height={LOGIN_PAGE_IMAGE_SIZE.height}
            priority
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/55" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-brand-white">
            <div className="max-w-md">
              <h2 className="font-heading text-3xl font-semibold leading-tight">
                {loginForm.imageTitle}
              </h2>
              <p className="mt-4 text-sm leading-6 text-brand-white/85">
                {loginForm.imageDescription}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
