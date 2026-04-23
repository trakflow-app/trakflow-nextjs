import Link from 'next/link';
import { cn } from '@/lib/utils';

const BRAND_NAME = 'TrakFlow';
const HOME_LINK_LABEL = `Go to ${BRAND_NAME} home`;
const LOGO_SRC = '/trakflow-text-logo.svg';
const LOGO_ALT = `${BRAND_NAME} logo`;
const LOGO_WIDTH = 100;
const LOGO_HEIGHT = 100;

type LogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function Logo({
  href,
  className,
  imageClassName,
  showText = true,
}: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={LOGO_SRC}
        alt={showText ? '' : LOGO_ALT}
        aria-hidden={showText}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={imageClassName}
      />
    </div>
  );

  return href ? (
    <Link href={href} aria-label={HOME_LINK_LABEL}>
      {content}
    </Link>
  ) : (
    content
  );
}
