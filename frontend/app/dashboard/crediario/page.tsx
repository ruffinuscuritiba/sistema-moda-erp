'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';

interface Installment {
  id: string;
  number: number;
  amount: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  customer: { name: string; phone?: string };
  order: { number: number };
}

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'default',
  PAID: 'success',
  OVERDUE: 'danger',
};

export default function CrediarioPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);

  async function load() {
    const { data } = await api.get('/installments');
    setInstallments(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePay(id: string) {
    if (!confirm('Confirmar recebimento desta parcela?')) return;
    await api.patch(`/installments/${id}/pay`);
    load();
  }

  const overdueCount = installments.filter((i) => i.status === 'OVERDUE' || (i.status === 'PENDING' && new Date(i.dueDate) < new Date())).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-main">Crediário</h1>
        <p className="text-ink-muted">
          Parcelas do crediário próprio da loja. {overdueCount > 0 && <span className="text-danger">{overdueCount} em atraso.</span>}
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Pedido</th>
              <th className="pb-2 font-medium">Parcela</th>
              <th className="pb-2 font-medium">Valor</th>
              <th className="pb-2 font-medium">Vencimento</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {installments.map((i) => (
              <tr key={i.id}>
                <td className="py-2.5 text-ink-main">{i.customer.name}</td>
                <td className="py-2.5 text-ink-muted">#{i.order.number}</td>
                <td className="py-2.5 text-ink-muted">{i.number}</td>
                <td className="py-2.5 font-medium text-ink-main">{formatCurrency(i.amount)}</td>
                <td className="py-2.5 text-ink-muted">{formatDate(i.dueDate)}</td>
                <td className="py-2.5">
                  <Badge tone={STATUS_TONE[i.status]}>{i.status === 'PAID' ? 'Pago' : i.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}</Badge>
                </td>
                <td className="py-2.5 text-right">
                  {i.status !== 'PAID' && (
                    <Button variant="secondary" onClick={() => handlePay(i.id)}>
                      Receber
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
