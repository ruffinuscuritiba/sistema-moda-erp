'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditLimit: string;
  creditBalance: string;
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', creditLimit: '0' });
  const [saving, setSaving] = useState(false);

  async function load(query?: string) {
    const { data } = await api.get('/customers', { params: query ? { search: query } : {} });
    setCustomers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', { ...form, creditLimit: Number(form.creditLimit) });
      setModalOpen(false);
      setForm({ name: '', phone: '', email: '', creditLimit: '0' });
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-main">Clientes</h1>
          <p className="text-ink-muted">Cadastro e limite de crediário próprio.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Novo cliente
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-sm gap-2">
        <Input placeholder="Buscar por nome ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">
          <Search size={16} />
        </Button>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Contato</th>
              <th className="pb-2 font-medium">Limite</th>
              <th className="pb-2 font-medium">Usado</th>
              <th className="pb-2 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => {
              const limit = Number(c.creditLimit);
              const used = Number(c.creditBalance);
              const over = used > limit;
              return (
                <tr key={c.id}>
                  <td className="py-2.5 font-medium text-ink-main">{c.name}</td>
                  <td className="py-2.5 text-ink-muted">{c.phone || c.email || '—'}</td>
                  <td className="py-2.5 text-ink-main">{formatCurrency(limit)}</td>
                  <td className="py-2.5 text-ink-main">{formatCurrency(used)}</td>
                  <td className="py-2.5">
                    <Badge tone={over ? 'danger' : used > 0 ? 'warning' : 'success'}>
                      {over ? 'Limite excedido' : used > 0 ? 'Com saldo devedor' : 'Em dia'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-sm space-y-4 rounded-lg bg-surface-card p-6 shadow-deep">
            <h2 className="text-lg font-semibold text-ink-main">Novo cliente</h2>
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input
              label="Limite de crediário"
              type="number"
              value={form.creditLimit}
              onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
            />
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
