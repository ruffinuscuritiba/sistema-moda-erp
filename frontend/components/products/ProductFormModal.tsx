'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category, Product, Variant } from '@/app/dashboard/produtos/page';

export interface ProductFormValues {
  name: string;
  description?: string;
  categoryId?: string;
  imageUrl?: string;
  costPrice: number;
  salePrice: number;
  isConsigned: boolean;
  consignorName?: string;
  consignorPhone?: string;
  commissionPercent?: number;
  condition: string;
  defectNotes?: string;
  isOnSale: boolean;
  promoPrice?: number;
  variants: Variant[];
}

export function ProductFormModal({
  categories,
  product,
  onClose,
  onSave,
}: {
  categories: Category[];
  product: Product | null;
  onClose: () => void;
  onSave: (values: ProductFormValues) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? '0');
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? '');
  const [isConsigned, setIsConsigned] = useState(product?.isConsigned ?? false);
  const [consignorName, setConsignorName] = useState(product?.consignorName ?? '');
  const [commissionPercent, setCommissionPercent] = useState(product?.commissionPercent ?? '30');
  const [condition, setCondition] = useState(product?.condition ?? 'NOVO');
  const [defectNotes, setDefectNotes] = useState(product?.defectNotes ?? '');
  const [isOnSale, setIsOnSale] = useState(product?.isOnSale ?? false);
  const [promoPrice, setPromoPrice] = useState(product?.promoPrice ?? '');
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.length ? product.variants : [{ size: 'M', color: 'Único', stock: 1, minimumStock: 0 }],
  );
  const [saving, setSaving] = useState(false);

  function updateVariant(index: number, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { size: '', color: 'Único', stock: 0, minimumStock: 0 }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        isConsigned,
        consignorName: isConsigned ? consignorName : undefined,
        commissionPercent: isConsigned ? Number(commissionPercent) : undefined,
        condition,
        defectNotes: condition === 'COM_DEFEITO' ? defectNotes : undefined,
        isOnSale,
        promoPrice: isOnSale ? Number(promoPrice) : undefined,
        variants: variants.filter((v) => v.size.trim().length > 0),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-surface-card shadow-deep"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-main">{product ? 'Editar produto' : 'Novo produto'}</h2>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink-main">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Input label="Nome da peça" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-main">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input label="URL da imagem" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço de custo" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            <Input label="Preço de venda" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
          </div>

          {/* Estado da peça / defeito */}
          <div className="rounded-md border border-line p-4">
            <label className="text-sm font-medium text-ink-main">Estado da peça</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['NOVO', 'SEMINOVO', 'USADO', 'COM_DEFEITO'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`rounded-md border px-2 py-2 text-xs font-medium ${
                    condition === c ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-muted'
                  }`}
                >
                  {c === 'COM_DEFEITO' ? 'Com defeito' : c.charAt(0) + c.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {condition === 'COM_DEFEITO' && (
              <div className="mt-3">
                <Input
                  label="Descreva o defeito (transparência gera confiança)"
                  placeholder="ex: mancha pequena na barra"
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Consignação */}
          <div className="rounded-md border border-line p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-main">
              <input type="checkbox" checked={isConsigned} onChange={(e) => setIsConsigned(e.target.checked)} />
              Peça consignada (brechó)
            </label>
            {isConsigned && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Input label="Nome do fornecedor" value={consignorName} onChange={(e) => setConsignorName(e.target.value)} />
                <Input
                  label="Comissão do fornecedor (%)"
                  type="number"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Promoção */}
          <div className="rounded-md border border-line p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-main">
              <input type="checkbox" checked={isOnSale} onChange={(e) => setIsOnSale(e.target.checked)} />
              Peça em promoção / queima de estoque
            </label>
            {isOnSale && (
              <div className="mt-3">
                <Input label="Preço promocional" type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
              </div>
            )}
          </div>

          {/* Grade tamanho x cor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-ink-main">Grade (tamanho x cor)</label>
              <Button type="button" variant="secondary" onClick={addVariant}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_36px] items-end gap-2">
                  <Input label={i === 0 ? 'Tamanho' : undefined} value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} />
                  <Input label={i === 0 ? 'Cor' : undefined} value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} />
                  <Input
                    label={i === 0 ? 'Estoque' : undefined}
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                  />
                  <Input
                    label={i === 0 ? 'Mínimo' : undefined}
                    type="number"
                    value={v.minimumStock ?? 0}
                    onChange={(e) => updateVariant(i, { minimumStock: Number(e.target.value) })}
                  />
                  <button type="button" onClick={() => removeVariant(i)} className="mb-0.5 text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
