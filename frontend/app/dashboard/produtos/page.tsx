'use client';

import { useEffect, useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { ProductFormModal, ProductFormValues } from '@/components/products/ProductFormModal';

export interface Category {
  id: string;
  name: string;
}

export interface Variant {
  id?: string;
  size: string;
  color: string;
  stock: number;
  minimumStock?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  imageUrl?: string;
  costPrice: string;
  salePrice: string;
  isConsigned: boolean;
  consignorName?: string;
  commissionPercent?: string;
  condition: 'NOVO' | 'SEMINOVO' | 'USADO' | 'COM_DEFEITO';
  defectNotes?: string;
  isOnSale: boolean;
  promoPrice?: string;
  variants: Variant[];
}

const CONDITION_LABEL: Record<string, { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'brand' }> = {
  NOVO: { label: 'Novo', tone: 'success' },
  SEMINOVO: { label: 'Seminovo', tone: 'brand' },
  USADO: { label: 'Usado', tone: 'warning' },
  COM_DEFEITO: { label: 'Com defeito', tone: 'danger' },
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
    setProducts(productsRes.data);
    setCategories(categoriesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(values: ProductFormValues) {
    if (editing) {
      await api.patch(`/products/${editing.id}`, values);
    } else {
      await api.post('/products', values);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este produto?')) return;
    await api.delete(`/products/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-main">Produtos</h1>
          <p className="text-ink-muted">Grade de tamanho e cor, estado da peça e promoções.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Novo produto
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-muted">Carregando...</p>
      ) : products.length === 0 ? (
        <Card className="text-center text-ink-muted">Nenhum produto cadastrado ainda.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            const condition = CONDITION_LABEL[product.condition];
            return (
              <Card key={product.id} className="flex flex-col">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-surface-main">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-muted">
                      <Tag size={28} />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-ink-main">{product.name}</h3>
                    {product.isOnSale && <Badge tone="danger">Promoção</Badge>}
                  </div>
                  {product.category && <p className="text-xs text-ink-muted">{product.category.name}</p>}

                  <div className="mt-2 flex items-center gap-2">
                    {product.isOnSale && product.promoPrice ? (
                      <>
                        <span className="text-sm text-ink-muted line-through">{formatCurrency(product.salePrice)}</span>
                        <span className="font-semibold text-danger">{formatCurrency(product.promoPrice)}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-ink-main">{formatCurrency(product.salePrice)}</span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={condition.tone}>{condition.label}</Badge>
                    {product.isConsigned && <Badge tone="default">Consignado</Badge>}
                    <Badge tone={totalStock === 0 ? 'danger' : 'default'}>{totalStock} un.</Badge>
                  </div>

                  {product.condition === 'COM_DEFEITO' && product.defectNotes && (
                    <p className="mt-2 text-xs text-warning">⚠ {product.defectNotes}</p>
                  )}

                  <div className="mt-auto flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setEditing(product);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(product.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          categories={categories}
          product={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
