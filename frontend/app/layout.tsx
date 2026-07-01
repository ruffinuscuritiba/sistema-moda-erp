import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema Moda ERP',
  description: 'Plataforma multi-loja para brechós, lojas de departamento e grandes marcas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="theme-light">
      <body>{children}</body>
    </html>
  );
}
