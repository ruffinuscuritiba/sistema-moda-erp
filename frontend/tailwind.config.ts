import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          light: 'var(--color-brand-light)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        surface: {
          main: 'var(--bg-main)',
          card: 'var(--bg-surface)',
          sidebar: 'var(--bg-sidebar)',
        },
        ink: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          onBrand: 'var(--text-on-brand)',
          onSidebar: 'var(--text-on-sidebar)',
          onSidebarActive: 'var(--text-on-sidebar-active)',
        },
        line: 'var(--border-color)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        elevated: 'var(--shadow-md)',
        deep: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
