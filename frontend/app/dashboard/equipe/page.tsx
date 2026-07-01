'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor(a)',
  CASHIER: 'Caixa',
};

export default function EquipePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SELLER' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/users');
    setMembers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', form);
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'SELLER' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível criar o usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member: Member) {
    await api.patch(`/users/${member.id}`, { isActive: !member.isActive });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-main">Equipe</h1>
          <p className="text-ink-muted">Usuários com acesso ao painel e ao PDV.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Novo usuário
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">E-mail</th>
              <th className="pb-2 font-medium">Função</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2.5 font-medium text-ink-main">{m.name}</td>
                <td className="py-2.5 text-ink-muted">{m.email}</td>
                <td className="py-2.5 text-ink-muted">{ROLE_LABEL[m.role] ?? m.role}</td>
                <td className="py-2.5">
                  <Badge tone={m.isActive ? 'success' : 'danger'}>{m.isActive ? 'Ativo' : 'Inativo'}</Badge>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => toggleActive(m)} className="text-xs text-brand hover:underline">
                    {m.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-sm space-y-4 rounded-lg bg-surface-card p-6 shadow-deep">
            <h2 className="text-lg font-semibold text-ink-main">Novo usuário</h2>
            {error && <div className="rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">{error}</div>}
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input
              label="Senha"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-main">Função</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main"
              >
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                Salvar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
