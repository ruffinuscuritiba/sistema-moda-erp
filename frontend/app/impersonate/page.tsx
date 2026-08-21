'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Ponto de entrada pra impersonação vinda do painel agregador (SaaS Control
 * Center, outro domínio) — recebe token+usuário+empresa via query string e
 * grava via setAuth (mesmo mecanismo do login normal), depois entra no painel.
 */
export default function ImpersonatePage() {
  return (
    <Suspense fallback={null}>
      <ImpersonateHandler />
    </Suspense>
  );
}

function ImpersonateHandler() {
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    const userB64 = params.get('user');
    const companyB64 = params.get('company');

    if (!token || !userB64 || !companyB64) {
      setError('Link de acesso inválido ou incompleto.');
      return;
    }

    try {
      const user = JSON.parse(atob(decodeURIComponent(userB64)));
      const company = JSON.parse(atob(decodeURIComponent(companyB64)));
      setAuth(token, user, company);
      window.location.href = '/dashboard';
    } catch {
      setError('Não foi possível processar o link de acesso.');
    }
  }, [params, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      {error ? <p className="text-red-400 text-sm">{error}</p> : <p className="text-sm text-gray-400">Entrando...</p>}
    </div>
  );
}
