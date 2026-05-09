import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'text-primary': 'var(--color-text-primary)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        heading: ['var(--font-family-brand)'],
        mono: ['var(--font-family-mono)'],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
      },
      borderRadius: {
        md: 'var(--radius-md)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      animation: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
      },
      easing: {
        standard: 'var(--easing-standard)',
      },
    },
  },
};

export default config;
