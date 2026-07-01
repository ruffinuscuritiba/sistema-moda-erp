'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.accessToken, data.user, data.company);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-light flex min-h-screen bg-surface-main">
      <div className="hidden w-1/2 flex-col justify-between bg-[#0f172a] p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingBag size={24} className="text-brand" />
          Sistema Moda ERP
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            O sistema completo para o seu ponto de venda de moda.
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Brechó, loja de departamento ou grife — grade de tamanho e cor, crediário próprio,
            condicional e catálogo digital em um só lugar.
          </p>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Sistema Moda ERP</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-ink-main">Entrar</h2>
            <p className="mt-1 text-sm text-ink-muted">Acesse o painel da sua loja.</p>
          </div>

          {error && (
            <div className="rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Ainda não tem uma loja?{' '}
            <a href="/signup" className="font-medium text-brand hover:underline">
              Crie a sua agora
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
