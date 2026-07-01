'use client';

import { useEffect } from 'react';
import { applyStoreTheme, StoreTheme } from '@/lib/theme';

export function ThemeProvider({ theme, children }: { theme: StoreTheme; children: React.ReactNode }) {
  useEffect(() => {
    applyStoreTheme(theme);
  }, [theme.primaryColor, theme.darkMode, theme.buttonRadius]);

  return <>{children}</>;
}
