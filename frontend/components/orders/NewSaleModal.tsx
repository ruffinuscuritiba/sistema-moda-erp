'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';

interface ProductOption {
  id: string;
  name: string;
  salePrice: string;
  isOnSale: boolean;
  promoPrice?: string;
  variants: { id: string; size: string; color: string; stock: number }[];
}

interface Customer {
  id: string;
  name: string;
}

interface CartLine {
  productVariantId: string;
  label: string;
  unitPrice: number;
  quantity: number;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'STORE_CREDIT', label: 'Crediário da loja' },
];

export function NewSaleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerId, setCustomerId] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  }, []);

  function addLine(product: ProductOption, variantId: string) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    const unitPrice = product.isOnSale && product.promoPrice ? Number(product.promoPrice) : Number(product.salePrice);
    setCart((prev) => [
      ...prev,
      { productVariantId: variant.id, label: `${product.name} (${variant.size}/${variant.color})`, unitPrice, quantity: 1 },
    ]);
  }

  function updateQuantity(index: number, quantity: number) {
    setCart((prev) => prev.map((line, i) => (i === index ? { ...line, quantity } : line)));
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  async function handleSubmit() {
    setError('');
    if (cart.length === 0) {
      setError('Adicione ao menos um item.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/orders', {
        customerId: customerId || undefined,
        paymentMethod,
        discount: Number(discount || 0),
        installmentsCount: paymentMethod === 'STORE_CREDIT' ? Number(installmentsCount) : undefined,
        items: cart.map((l) => ({ productVariantId: l.productVariantId, quantity: l.quantity })),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível concluir a venda.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-surface-card shadow-deep">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-main">Nova venda</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-main">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-md border border-danger/30 bg-[rgb(239_68_68_/_0.08)] px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {products.map((product) => (
              <details key={product.id} className="rounded-md border border-line p-2">
                <summary className="cursor-pointer text-sm font-medium text-ink-main">
                  {product.name} — {formatCurrency(product.isOnSale && product.promoPrice ? product.promoPrice : product.salePrice)}
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock === 0}
                      onClick={() => addLine(product, v.id)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-ink-main hover:border-brand disabled:opacity-40"
                    >
                      {v.size}/{v.color} ({v.stock})
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-line pt-4">
            {cart.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum item no carrinho ainda.</p>
            ) : (
              cart.map((line, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1 text-ink-main">{line.label}</span>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQuantity(i, Number(e.target.value))}
                    className="w-16 rounded-md border border-line px-2 py-1 text-center"
                  />
                  <span className="w-24 text-right text-ink-main">{formatCurrency(line.unitPrice * line.quantity)}</span>
                  <button onClick={() => removeLine(i)} className="text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-main">Forma de pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-main">Cliente {paymentMethod === 'STORE_CREDIT' && '(obrigatório)'}</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main"
              >
                <option value="">Sem cliente identificado</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {paymentMethod === 'STORE_CREDIT' && (
              <Input
                label="Número de parcelas"
                type="number"
                min={1}
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
              />
            )}

            <Input label="Desconto (R$)" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <div>
            <p className="text-sm text-ink-muted">Total</p>
            <p className="text-xl font-semibold text-ink-main">{formatCurrency(total)}</p>
          </div>
          <Button onClick={handleSubmit} loading={saving}>
            Finalizar venda
          </Button>
        </div>
      </div>
    </div>
  );
}
