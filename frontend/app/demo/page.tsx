'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Ponto de entrada público de demonstração — usado pelo hub /demo do
 * R_FoodSaaS ("parte do mesmo ecossistema") e por qualquer link direto de
 * marketing. Entra automaticamente numa conta já seedada (sem senha, sem
 * formulário) e cai direto no painel — a tela de login fica reservada só
 * pra loja real.
 *
 * `?niche=` (opcional, ex. /demo?niche=otica) leva pra uma demo temática
 * dedicada — nome da loja, cor e catálogo próprios do tipo de negócio (ver
 * DEMO_NICHES no backend) — em vez da conta genérica "Loja Demo Moda" que
 * era usada antes não importa qual tag o visitante clicou no hub.
 */
function DemoRedirect() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const niche = useSearchParams().get('niche') ?? undefined;

  useEffect(() => {
    let cancelled = false;

    api
      .post('/auth/demo-access', { niche })
      .then(({ data }) => {
        if (cancelled) return;
        setAuth(data.accessToken, data.user, data.company);
        // Navegação hard: garante que /dashboard monta já com o token no
        // localStorage/cookie (mesmo cuidado documentado em /login).
        window.location.href = '/dashboard';
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível abrir a demonstração agora. Tente novamente em instantes.');
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth, niche]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <a href="/login" className="text-sm text-indigo-400 underline">
            Ir para o login
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Abrindo demonstração...</p>
      )}
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <DemoRedirect />
    </Suspense>
  );
}
