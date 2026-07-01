'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { NewConditionalModal } from '@/components/conditional/NewConditionalModal';
import { ResolveConditionalModal } from '@/components/conditional/ResolveConditionalModal';

interface ConditionalCheckout {
  id: string;
  status: string;
  dueAt: string;
  createdAt: string;
  customer: { name: string; phone?: string };
  items: any[];
}

const STATUS_LABEL: Record<string, { label: string; tone: 'default' | 'success' | 'warning' | 'danger' }> = {
  OUT: { label: 'Com o cliente', tone: 'warning' },
  RETURNED: { label: 'Devolvido', tone: 'default' },
  CONVERTED: { label: 'Convertido em venda', tone: 'success' },
  PARTIAL: { label: 'Parcialmente vendido', tone: 'success' },
};

export default function CondicionaisPage() {
  const [checkouts, setCheckouts] = useState<ConditionalCheckout[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolving, setResolving] = useState<ConditionalCheckout | null>(null);

  async function load() {
    const { data } = await api.get('/conditional');
    setCheckouts(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-main">Condicionais</h1>
          <p className="text-ink-muted">Peças que o cliente levou pra provar em casa.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Novo condicional
        </Button>
      </div>

      <div className="grid gap-4">
        {checkouts.map((c) => {
          const status = STATUS_LABEL[c.status];
          const overdue = c.status === 'OUT' && new Date(c.dueAt) < new Date();
          return (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-main">{c.customer.name}</p>
                  <p className="text-xs text-ink-muted">
                    Saiu em {formatDate(c.createdAt)} — prazo {formatDate(c.dueAt)}
                    {overdue && <span className="ml-1 text-danger">(atrasado)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {c.status === 'OUT' && (
                    <Button variant="secondary" onClick={() => setResolving(c)}>
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                {c.items.map((item) => (
                  <li key={item.id}>
                    {item.productVariant.product.name} ({item.productVariant.size}/{item.productVariant.color}) x{item.quantity}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {createOpen && (
        <NewConditionalModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {resolving && (
        <ResolveConditionalModal
          checkoutId={resolving.id}
          items={resolving.items}
          onClose={() => setResolving(null)}
          onResolved={() => {
            setResolving(null);
            load();
          }}
        />
      )}
    </div>
  );
}
