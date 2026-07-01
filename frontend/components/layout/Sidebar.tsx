'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  Users,
  ShoppingCart,
  Repeat,
  CreditCard,
  UserCog,
  Settings,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const NAV = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Shirt },
  { href: '/dashboard/estoque', label: 'Estoque', icon: Boxes },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/condicionais', label: 'Condicionais', icon: Repeat },
  { href: '/dashboard/crediario', label: 'Crediário', icon: CreditCard },
  { href: '/dashboard/equipe', label: 'Equipe', icon: UserCog },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { company, user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-surface-sidebar px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2 text-white">
        <ShoppingBag size={20} className="text-brand" />
        <span className="truncate font-semibold">{company?.name ?? 'Minha Loja'}</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-brand text-ink-onSidebarActive' : 'text-ink-onSidebar hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="truncate px-3 text-xs text-ink-onSidebar">{user?.name}</p>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-onSidebar hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
