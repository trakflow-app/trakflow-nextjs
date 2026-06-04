import {
  HOME_PAGE_CREW_SIGNUP_HREF,
  HOME_PAGE_LOGIN_HREF,
  HOME_PAGE_NAVIGATION_LINK_CLASS_NAME,
  HOME_PAGE_PRIMARY_NAVIGATION_LINK_CLASS_NAME,
  HOME_PAGE_SIGNUP_HREF,
} from '@/constants/app/page-constants';
import { Header } from '@/components/layout/header';
import { HOME_PAGE_MESSAGES } from '@/locales/app/page-locales';
import Link from 'next/link';

/**
 * Renders the home page navigation entry points.
 */
export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-col flex-1 items-center justify-center bg-img font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 dark:bg-black sm:items-start">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <div className="flex flex-col gap-4">
              <Link
                href={HOME_PAGE_LOGIN_HREF}
                className={HOME_PAGE_PRIMARY_NAVIGATION_LINK_CLASS_NAME}
              >
                {HOME_PAGE_MESSAGES.loginLink}
              </Link>
              <Link
                href={HOME_PAGE_SIGNUP_HREF}
                className={HOME_PAGE_NAVIGATION_LINK_CLASS_NAME}
              >
                {HOME_PAGE_MESSAGES.signupLink}
              </Link>
              <Link
                href={HOME_PAGE_CREW_SIGNUP_HREF}
                className={HOME_PAGE_NAVIGATION_LINK_CLASS_NAME}
              >
                {HOME_PAGE_MESSAGES.crewSignupLink}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
