import AppImage from '@/components/ui/app-image';
import {
  FOOTER_LOGO_SIZE,
  FOOTER_LOGO_SRC,
} from '@/constants/components/footer/footer-constants';
import {
  FOOTER_COPYRIGHT_TEXT,
  FOOTER_LOGO_ALT,
  FOOTER_PRIVACY_POLICY_TEXT,
  FOOTER_TERMS_TEXT,
} from '@/locales/components/footer/footer-locales';

/**
 * Renders the site footer with brand identity, copyright, and footer links.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-[var(--brand-primary)] text-[var(--brand-white)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 text-center sm:grid-cols-3 lg:px-8">
        <AppImage
          src={FOOTER_LOGO_SRC}
          alt={FOOTER_LOGO_ALT}
          width={FOOTER_LOGO_SIZE}
          height={FOOTER_LOGO_SIZE}
          className="size-12 justify-self-center object-contain sm:justify-self-start"
        />
        <p className="justify-self-center text-sm">{FOOTER_COPYRIGHT_TEXT}</p>
        <div className="flex flex-col gap-2 justify-self-center text-sm sm:justify-self-end sm:text-right">
          <p>{FOOTER_PRIVACY_POLICY_TEXT}</p>
          <p>{FOOTER_TERMS_TEXT}</p>
        </div>
      </div>
    </footer>
  );
}
