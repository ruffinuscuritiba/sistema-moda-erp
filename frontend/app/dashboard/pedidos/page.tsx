'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import { NewSaleModal } from '@/components/orders/NewSaleModal';

interface Order {
  id: string;
  number: number;
  status: string;
  paymentMethod: string;
  total: string;
  createdAt: string;
  customer?: { name: string };
}

const STATUS_TONE: Record<string, 'success' | 'danger' | 'default'> = {
  COMPLETED: 'success',
  CANCELLED: 'danger',
  PENDING: 'default',
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
  STORE_CREDIT: 'Crediário',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const { data } = await api.get('/orders');
    setOrders(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: string) {
    if (!confirm('Cancelar este pedido? O estoque será restaurado.')) return;
    await api.patch(`/orders/${id}/cancel`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-main">Pedidos</h1>
          <p className="text-ink-muted">Histórico de vendas da loja.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova venda
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Pagamento</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="py-2.5 text-ink-main">#{o.number}</td>
                <td className="py-2.5 text-ink-main">{o.customer?.name || 'Balcão'}</td>
                <td className="py-2.5 text-ink-muted">{PAYMENT_LABEL[o.paymentMethod]}</td>
                <td className="py-2.5 font-medium text-ink-main">{formatCurrency(o.total)}</td>
                <td className="py-2.5">
                  <Badge tone={STATUS_TONE[o.status] ?? 'default'}>{o.status}</Badge>
                </td>
                <td className="py-2.5 text-ink-muted">{formatDate(o.createdAt)}</td>
                <td className="py-2.5 text-right">
                  {o.status !== 'CANCELLED' && (
                    <button onClick={() => handleCancel(o.id)} className="text-xs text-danger hover:underline">
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <NewSaleModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
