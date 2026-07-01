'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';

interface ConditionalItem {
  id: string;
  productVariantId: string;
  quantity: number;
  unitPrice: string;
  productVariant: { size: string; color: string; product: { name: string } };
}

export function ResolveConditionalModal({
  checkoutId,
  items,
  onClose,
  onResolved,
}: {
  checkoutId: string;
  items: ConditionalItem[];
  onClose: () => void;
  onResolved: () => void;
}) {
  const [kept, setKept] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(variantId: string) {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await api.patch(`/conditional/${checkoutId}/resolve`, { keptVariantIds: Array.from(kept) });
      onResolved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-card p-6 shadow-deep">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-main">O que o cliente ficou?</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-main">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-3 rounded-md border border-line p-3 text-sm">
              <input type="checkbox" checked={kept.has(item.productVariantId)} onChange={() => toggle(item.productVariantId)} />
              <span className="flex-1 text-ink-main">
                {item.productVariant.product.name} ({item.productVariant.size}/{item.productVariant.color})
              </span>
              <span className="text-ink-muted">{formatCurrency(item.unitPrice)}</span>
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          As peças não marcadas voltam automaticamente para o estoque. As marcadas viram uma venda.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
