'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { applyStoreTheme } from '@/lib/theme';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();

    api
      .get('/company/settings')
      .then(({ data }) => applyStoreTheme(data))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [hydrate]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-main text-ink-muted">Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-surface-main">
      <Sidebar />
      <main className="admin-page flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
