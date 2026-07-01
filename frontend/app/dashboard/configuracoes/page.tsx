'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { applyStoreTheme } from '@/lib/theme';

interface Settings {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  darkMode: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  layoutType: 'GRID' | 'LIST';
  buttonRadius: 'SM' | 'MD' | 'LG' | 'FULL';
}

const RADIUS_OPTIONS: { value: Settings['buttonRadius']; label: string }[] = [
  { value: 'SM', label: 'Reto' },
  { value: 'MD', label: 'Suave' },
  { value: 'LG', label: 'Arredondado' },
  { value: 'FULL', label: 'Pílula' },
];

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/company/settings').then((r) => setSettings(r.data));
  }, []);

  if (!settings) return <p className="text-ink-muted">Carregando...</p>;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const { data } = await api.patch('/company/settings', settings);
      setSettings(data);
      applyStoreTheme(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-main">Configurações</h1>
        <p className="text-ink-muted">Identidade visual e layout do catálogo digital.</p>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-ink-main">Identidade visual</h2>
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Cor de destaque" value={settings.primaryColor} onChange={(v) => update('primaryColor', v)} />
          <ColorField label="Cor secundária" value={settings.secondaryColor} onChange={(v) => update('secondaryColor', v)} />
          <ColorField label="Cor de fundo" value={settings.backgroundColor} onChange={(v) => update('backgroundColor', v)} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="URL do logo" value={settings.logoUrl ?? ''} onChange={(e) => update('logoUrl', e.target.value)} />
          <Input label="URL do banner" value={settings.bannerUrl ?? ''} onChange={(e) => update('bannerUrl', e.target.value)} />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink-main">
          <input type="checkbox" checked={settings.darkMode} onChange={(e) => update('darkMode', e.target.checked)} />
          Modo escuro no catálogo digital
        </label>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-ink-main">Layout do catálogo</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update('layoutType', 'GRID')}
            className={clsx(
              'flex items-center gap-2 rounded-md border-2 p-4 text-sm font-medium',
              settings.layoutType === 'GRID' ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-muted',
            )}
          >
            <LayoutGrid size={18} /> Grade (fotos grandes)
          </button>
          <button
            type="button"
            onClick={() => update('layoutType', 'LIST')}
            className={clsx(
              'flex items-center gap-2 rounded-md border-2 p-4 text-sm font-medium',
              settings.layoutType === 'LIST' ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-muted',
            )}
          >
            <List size={18} /> Lista (mais itens visíveis)
          </button>
        </div>

        <p className="mb-2 mt-5 text-sm font-medium text-ink-main">Formato dos botões</p>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('buttonRadius', opt.value)}
              className={clsx(
                'border-2 px-2 py-2 text-xs font-medium',
                settings.buttonRadius === opt.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-muted',
              )}
              style={{
                borderRadius: opt.value === 'SM' ? '4px' : opt.value === 'MD' ? '10px' : opt.value === 'LG' ? '16px' : '9999px',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          Salvar configurações
        </Button>
        {saved && <span className="text-sm text-success">Salvo!</span>}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-main">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 cursor-pointer rounded-md border border-line" />
        <span className="text-xs text-ink-muted">{value}</span>
      </div>
    </div>
  );
}
