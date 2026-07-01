export interface StoreTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  darkMode?: boolean;
  layoutType?: string;
  buttonRadius?: 'SM' | 'MD' | 'LG' | 'FULL';
}

const RADIUS_MAP: Record<string, string> = {
  SM: '6px',
  MD: '10px',
  LG: '16px',
  FULL: '9999px',
};

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function shade(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.max(0, Math.min(255, Math.round(c + amount))));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Aplica a identidade visual da loja (cor de marca + raio de botão + modo claro/escuro) na página inteira. */
export function applyStoreTheme(theme: StoreTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme.primaryColor) {
    root.style.setProperty('--color-brand', theme.primaryColor);
    root.style.setProperty('--color-brand-hover', shade(theme.primaryColor, -20));
    root.style.setProperty('--color-brand-light', `${theme.primaryColor}1a`);
  }

  if (theme.buttonRadius) {
    root.style.setProperty('--radius-button', RADIUS_MAP[theme.buttonRadius] ?? RADIUS_MAP.MD);
  }

  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(theme.darkMode ? 'theme-dark' : 'theme-light');
}
