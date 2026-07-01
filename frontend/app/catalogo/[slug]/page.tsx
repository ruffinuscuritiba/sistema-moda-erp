'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import { Tag } from 'lucide-react';
import { api } from '@/services/api';
import { applyStoreTheme } from '@/lib/theme';
import { formatCurrency } from '@/lib/format';

interface CatalogCompany {
  id: string;
  name: string;
  segment: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  darkMode: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  layoutType: 'GRID' | 'LIST';
  buttonRadius: 'SM' | 'MD' | 'LG' | 'FULL';
}

interface CatalogCategory {
  id: string;
  name: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  imageUrl?: string;
  salePrice: string;
  isOnSale: boolean;
  promoPrice?: string;
  effectivePrice: number;
  totalStock: number;
  condition: 'NOVO' | 'SEMINOVO' | 'USADO' | 'COM_DEFEITO';
  defectNotes?: string;
  variants: { id: string; size: string; color: string; stock: number }[];
}

const CONDITION_LABEL: Record<string, string> = {
  NOVO: 'Novo',
  SEMINOVO: 'Seminovo',
  USADO: 'Usado',
  COM_DEFEITO: 'Com defeito',
};

export default function CatalogoPage() {
  const params = useParams<{ slug: string }>();
  const [company, setCompany] = useState<CatalogCompany | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.slug) return;

    api
      .get(`/catalog/${params.slug}`)
      .then(({ data }) => {
        setCompany(data.company);
        setCategories(data.categories);
        setProducts(data.products);
        applyStoreTheme(data.company);
        api.post(`/catalog/${params.slug}/visit`, { referrer: document.referrer }).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Carregando vitrine...</div>;
  }

  if (notFound || !company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-ink-muted">
        <p className="text-lg font-medium">Loja não encontrada.</p>
        <p className="text-sm">Verifique o link do catálogo.</p>
      </div>
    );
  }

  const filteredProducts = activeCategory ? products.filter((p) => p.categoryId === activeCategory) : products;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <header
        className="relative flex flex-col items-center justify-center gap-3 px-6 py-14 text-center text-white"
        style={{
          backgroundColor: company.secondaryColor,
          backgroundImage: company.bannerUrl ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${company.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {company.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-16 w-16 rounded-full border-2 border-white/50 object-cover" />
        )}
        <h1 className="text-2xl font-semibold">{company.name}</h1>
      </header>

      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-line bg-[var(--bg-surface)] px-4 py-3">
        <button
          onClick={() => setActiveCategory(null)}
          className={clsx(
            'btn-shape shrink-0 px-4 py-2 text-sm font-medium',
            activeCategory === null ? 'bg-brand text-ink-onBrand' : 'bg-surface-main text-ink-muted',
          )}
        >
          Tudo
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={clsx(
              'btn-shape shrink-0 px-4 py-2 text-sm font-medium',
              activeCategory === c.id ? 'bg-brand text-ink-onBrand' : 'bg-surface-main text-ink-muted',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-ink-muted">Nenhuma peça encontrada nesta categoria.</p>
        ) : company.layoutType === 'LIST' ? (
          <div className="divide-y divide-line">
            {filteredProducts.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const onSale = product.isOnSale && product.promoPrice;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[var(--bg-surface)] shadow-card">
      <div className="relative aspect-square w-full bg-surface-main">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <Tag size={28} />
          </div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-1 text-xs font-semibold text-white">Promoção</span>
        )}
        {product.condition !== 'NOVO' && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
            {CONDITION_LABEL[product.condition]}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-ink-main">{product.name}</h3>
        {product.condition === 'COM_DEFEITO' && product.defectNotes && (
          <p className="mt-1 text-xs text-warning">⚠ {product.defectNotes}</p>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="text-xs text-ink-muted line-through">{formatCurrency(product.salePrice)}</span>
              <span className="font-semibold text-danger">{formatCurrency(product.effectivePrice)}</span>
            </>
          ) : (
            <span className="font-semibold text-ink-main">{formatCurrency(product.effectivePrice)}</span>
          )}
        </div>
        {product.totalStock <= 2 && product.totalStock > 0 && (
          <p className="mt-1 text-xs text-warning">Últimas peças!</p>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: CatalogProduct }) {
  const onSale = product.isOnSale && product.promoPrice;
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-main">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <Tag size={20} />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-ink-main">{product.name}</h3>
        {product.condition !== 'NOVO' && <p className="text-xs text-ink-muted">{CONDITION_LABEL[product.condition]}</p>}
        {product.condition === 'COM_DEFEITO' && product.defectNotes && (
          <p className="text-xs text-warning">⚠ {product.defectNotes}</p>
        )}
      </div>
      <div className="text-right">
        {onSale ? (
          <>
            <p className="text-xs text-ink-muted line-through">{formatCurrency(product.salePrice)}</p>
            <p className="font-semibold text-danger">{formatCurrency(product.effectivePrice)}</p>
          </>
        ) : (
          <p className="font-semibold text-ink-main">{formatCurrency(product.effectivePrice)}</p>
        )}
      </div>
    </div>
  );
}
