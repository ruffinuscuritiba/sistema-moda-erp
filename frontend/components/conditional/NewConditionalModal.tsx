'use client';

import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProductOption {
  id: string;
  name: string;
  variants: { id: string; size: string; color: string; stock: number }[];
}

interface Customer {
  id: string;
  name: string;
}

export function NewConditionalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<{ productVariantId: string; label: string; quantity: number }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  }, []);

  function addItem(product: ProductOption, variantId: string) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    setItems((prev) => [...prev, { productVariantId: variant.id, label: `${product.name} (${variant.size}/${variant.color})`, quantity: 1 }]);
  }

  async function handleSubmit() {
    setError('');
    if (!customerId) {
      setError('Selecione o cliente que vai levar as peças.');
      return;
    }
    if (items.length === 0) {
      setError('Adicione ao menos uma peça.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/conditional', {
        customerId,
        dueAt: new Date(dueAt).toISOString(),
        items: items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível registrar o condicional.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-surface-card shadow-deep">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-main">Novo condicional (leva pra provar)</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-main">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-main">Cliente</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main"
              >
                <option value="">Selecione...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Prazo de devolução" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-main">Peças</p>
            <div className="space-y-2">
              {products.map((product) => (
                <details key={product.id} className="rounded-md border border-line p-2">
                  <summary className="cursor-pointer text-sm text-ink-main">{product.name}</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        disabled={v.stock === 0}
                        onClick={() => addItem(product, v.id)}
                        className="rounded-md border border-line px-2 py-1 text-xs text-ink-main hover:border-brand disabled:opacity-40"
                      >
                        {v.size}/{v.color} ({v.stock})
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink-main">{item.label}</span>
                  <button onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Registrar saída
          </Button>
        </div>
      </div>
    </div>
  );
}
