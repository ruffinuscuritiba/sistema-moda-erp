'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';

interface Movement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason?: string;
  createdAt: string;
  productVariant: { size: string; color: string; product: { name: string } };
}

interface LowStockItem {
  id: string;
  size: string;
  color: string;
  stock: number;
  minimumStock: number;
  product: { name: string; imageUrl?: string };
}

const TYPE_LABEL: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Saída',
  SALE: 'Venda',
  RETURN: 'Devolução',
  ADJUSTMENT: 'Ajuste',
  LOSS: 'Perda',
};

export default function EstoquePage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [movementsRes, lowStockRes] = await Promise.all([api.get('/stock/movements'), api.get('/stock/low')]);
    setMovements(movementsRes.data);
    setLowStock(lowStockRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdjust(variantId: string) {
    const quantityRaw = prompt('Quantidade a adicionar (entrada de estoque):');
    if (!quantityRaw) return;
    const quantity = Number(quantityRaw);
    if (!quantity || quantity <= 0) return;
    await api.post('/stock/adjust', { productVariantId: variantId, type: 'ENTRY', quantity, reason: 'Reposição manual' });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-main">Estoque</h1>
        <p className="text-ink-muted">Movimentações e alertas de reposição.</p>
      </div>

      {lowStock.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2 text-warning">
            <TriangleAlert size={18} />
            <h2 className="font-semibold">Peças com estoque baixo</h2>
          </div>
          <div className="divide-y divide-line">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-main">{item.product.name}</p>
                  <p className="text-ink-muted">
                    {item.size} / {item.color} — {item.stock} un. (mínimo: {item.minimumStock})
                  </p>
                </div>
                <Button variant="secondary" onClick={() => handleAdjust(item.id)}>
                  Repor
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold text-ink-main">Movimentações recentes</h2>
        {loading ? (
          <p className="text-ink-muted">Carregando...</p>
        ) : (
          <div className="divide-y divide-line">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-main">
                    {m.productVariant.product.name}{' '}
                    <span className="text-ink-muted">
                      ({m.productVariant.size} / {m.productVariant.color})
                    </span>
                  </p>
                  <p className="text-xs text-ink-muted">{m.reason || formatDate(m.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Badge tone={m.type === 'SALE' || m.type === 'EXIT' || m.type === 'LOSS' ? 'danger' : 'success'}>
                    {TYPE_LABEL[m.type] ?? m.type} — {m.quantity}
                  </Badge>
                  <p className="mt-1 text-xs text-ink-muted">
                    {m.previousStock} → {m.currentStock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
