'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Eye, Package, ShoppingCart, TriangleAlert } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';

interface VisitStats {
  total: number;
  last7Days: number;
  last30Days: number;
}

export default function DashboardPage() {
  const { company, user } = useAuthStore();
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [visits, setVisits] = useState<VisitStats>({ total: 0, last7Days: 0, last30Days: 0 });
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const catalogUrl = company ? `${origin}/catalogo/${company.slug}` : '';

  useEffect(() => {
    Promise.all([
      api.get('/products').then((r) => setProductCount(r.data.length)),
      api.get('/stock/low').then((r) => setLowStockCount(r.data.length)),
      api.get('/orders').then((r) => {
        const today = new Date().toDateString();
        const todayOrders = r.data.filter((o: any) => new Date(o.createdAt).toDateString() === today && o.status !== 'CANCELLED');
        setOrdersToday(todayOrders.length);
        setRevenueToday(todayOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0));
      }),
      api.get('/catalog/visits').then((r) => setVisits(r.data)),
    ]).catch(() => {});
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-main">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-ink-muted">Aqui está o resumo da {company?.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Faturamento hoje</span>
            <ShoppingCart size={18} className="text-brand" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-ink-main">{formatCurrency(revenueToday)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Vendas hoje</span>
            <ShoppingCart size={18} className="text-brand" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-ink-main">{ordersToday}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Produtos ativos</span>
            <Package size={18} className="text-brand" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-ink-main">{productCount}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Estoque baixo</span>
            <TriangleAlert size={18} className="text-warning" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-ink-main">{lowStockCount}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-ink-main">Catálogo Digital</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Compartilhe o link da sua vitrine online com seus clientes.
            </p>
            <code className="mt-2 inline-block rounded-md bg-surface-main px-2 py-1 text-xs text-ink-muted">
              {catalogUrl}
            </code>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={copyLink}>
              <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <a href={catalogUrl} target="_blank" rel="noreferrer">
              <Button>
                <ExternalLink size={16} /> Abrir catálogo
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Eye size={14} /> Últimos 7 dias
            </div>
            <p className="mt-1 text-lg font-semibold text-ink-main">{visits.last7Days}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Eye size={14} /> Últimos 30 dias
            </div>
            <p className="mt-1 text-lg font-semibold text-ink-main">{visits.last30Days}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Eye size={14} /> Total de visitas
            </div>
            <p className="mt-1 text-lg font-semibold text-ink-main">{visits.total}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
