'use client';

import { useEffect, useState } from 'react';
import { Plus, Smartphone, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import { ConnectionQrModal } from '@/components/whatsapp/ConnectionQrModal';

interface Connection {
  id: string;
  name: string;
  isActive: boolean;
  phoneNumber: string | null;
  createdAt: string;
}

export default function WhatsappIaPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [qrConnectionId, setQrConnectionId] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get('/whatsapp-ai/connections');
    setConnections(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setError('');
    if (!name.trim()) {
      setError('Dê um nome para a conexão (ex: "WhatsApp da loja").');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/whatsapp-ai/connections', { name });
      setName('');
      await load();
      setQrConnectionId(data.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível criar a conexão.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conexão? O número precisará escanear o QR Code novamente para reconectar.')) return;
    await api.delete(`/whatsapp-ai/connections/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-main">WhatsApp IA</h1>
        <p className="text-ink-muted">
          Conecte o WhatsApp da loja para que a assistente virtual ajude clientes a escolher peças e monte pedidos
          automaticamente. Pedidos feitos pelo WhatsApp entram como reserva — o cliente prova e paga na loja.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-medium text-ink-main">Nova conexão</h2>
        {error && (
          <div className="rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nome da conexão"
              placeholder="Ex: WhatsApp da loja"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} loading={creating}>
            <Plus size={16} /> Criar conexão
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Número</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Criada em</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {connections.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 text-ink-main">{c.name}</td>
                <td className="py-2.5 text-ink-muted">{c.phoneNumber ?? '—'}</td>
                <td className="py-2.5">
                  <Badge tone={c.isActive ? 'success' : 'warning'}>{c.isActive ? 'Conectado' : 'Aguardando QR Code'}</Badge>
                </td>
                <td className="py-2.5 text-ink-muted">{formatDate(c.createdAt)}</td>
                <td className="py-2.5 text-right">
                  <div className="flex justify-end gap-3">
                    {!c.isActive && (
                      <button
                        onClick={() => setQrConnectionId(c.id)}
                        className="flex items-center gap-1 text-xs text-brand hover:underline"
                      >
                        <Smartphone size={14} /> Ver QR Code
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {connections.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-muted">
                  Nenhuma conexão criada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {qrConnectionId && (
        <ConnectionQrModal
          connectionId={qrConnectionId}
          onClose={() => setQrConnectionId(null)}
          onConnected={() => {
            setQrConnectionId(null);
            load();
          }}
        />
      )}
    </div>
  );
}
