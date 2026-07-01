'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const NICHES = [
  {
    value: 'BRECHO',
    label: 'Brechó',
    emoji: '👗',
    color: '#b45309',
    description: 'Peças únicas, consignação e desapego chique.',
  },
  {
    value: 'DEPARTAMENTO',
    label: 'Loja de Departamento',
    emoji: '🏬',
    color: '#4f46e5',
    description: 'Múltiplos setores, grade completa e giro rápido.',
  },
  {
    value: 'MODA',
    label: 'Moda / Grandes Marcas',
    emoji: '✨',
    color: '#b8860b',
    description: 'Grife, curadoria e experiência premium.',
  },
] as const;

type Segment = (typeof NICHES)[number]['value'];

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<1 | 2>(1);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = NICHES.find((n) => n.value === segment);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segment) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', { companyName, segment, name, email, password });
      setAuth(data.accessToken, data.user, data.company);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível criar sua loja.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-light min-h-screen bg-surface-main px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center gap-2 text-lg font-semibold text-ink-main">
          <ShoppingBag size={22} className="text-brand" />
          Sistema Moda ERP
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-ink-main">Qual é o seu tipo de loja?</h1>
            <p className="mt-1 text-ink-muted">
              Sua loja já nasce configurada: categorias, produtos de exemplo e cores prontas para o seu nicho.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {NICHES.map((niche) => (
                <button
                  key={niche.value}
                  type="button"
                  onClick={() => setSegment(niche.value)}
                  className={clsx(
                    'relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-elevated',
                    segment === niche.value ? 'border-transparent shadow-elevated' : 'border-line bg-surface-card',
                  )}
                  style={segment === niche.value ? { borderColor: niche.color, backgroundColor: `${niche.color}0d` } : undefined}
                >
                  {segment === niche.value && (
                    <span
                      className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: niche.color }}
                    >
                      <Check size={14} />
                    </span>
                  )}
                  <span className="text-3xl">{niche.emoji}</span>
                  <h3 className="mt-3 font-semibold text-ink-main">{niche.label}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{niche.description}</p>
                </button>
              ))}
            </div>

            <Button className="mt-8" disabled={!segment} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && selected && (
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-6 flex items-center gap-1 text-sm text-ink-muted hover:text-ink-main"
            >
              <ArrowLeft size={16} /> Voltar
            </button>

            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: `${selected.color}1a`, color: selected.color }}
            >
              {selected.emoji} {selected.label}
            </span>

            <h1 className="mt-4 text-2xl font-semibold text-ink-main">Crie sua loja</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}
              <Input label="Nome da loja" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              <Input label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label="Senha"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Criar minha loja
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
