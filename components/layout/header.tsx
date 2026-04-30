import type { User } from '@supabase/supabase-js';
import {
  HeaderNavigation,
  type HeaderUser,
} from '@/components/layout/header-navigation';
import { Logo } from '@/components/ui/logo';
import {
  HEADER_AVATAR_METADATA_KEYS,
  HEADER_HOME_HREF,
  HEADER_INNER_CLASS_NAME,
  HEADER_SHELL_CLASS_NAME,
} from '@/constants/components/layout/header-constants';
import { HEADER_GUEST_USER_LABEL } from '@/locales/components/layout/header-locales';
import { createClient } from '@/lib/supabase/server';

function hasSupabaseEnvironment() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function getCurrentHeaderUser() {
  if (!hasSupabaseEnvironment()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function getMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];

  return typeof value === 'string' && value.trim() ? value : undefined;
}

function mapHeaderUser(user: User | null): HeaderUser | null {
  if (!user) {
    return null;
  }

  const name =
    getMetadataString(user, HEADER_AVATAR_METADATA_KEYS.fullName) ??
    getMetadataString(user, HEADER_AVATAR_METADATA_KEYS.name) ??
    user.email ??
    HEADER_GUEST_USER_LABEL;
  const avatarUrl =
    getMetadataString(user, HEADER_AVATAR_METADATA_KEYS.avatarUrl) ??
    getMetadataString(user, HEADER_AVATAR_METADATA_KEYS.picture);

  return {
    name,
    avatarUrl,
  };
}

/**
 * Renders the sticky site header with auth-aware navigation.
 */
export async function Header() {
  const user = await getCurrentHeaderUser();
  const headerUser = mapHeaderUser(user);

  return (
    <header className={HEADER_SHELL_CLASS_NAME}>
      <div className={HEADER_INNER_CLASS_NAME}>
        <Logo href={HEADER_HOME_HREF} imageClassName="h-8 w-auto" />
        <HeaderNavigation user={headerUser} />
      </div>
    </header>
  );
}
