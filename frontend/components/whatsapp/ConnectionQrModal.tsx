'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { api } from '@/services/api';

interface Props {
  connectionId: string;
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectionQrModal({ connectionId, onClose, onConnected }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const { data } = await api.get(`/whatsapp-ai/connections/${connectionId}/qr`);
        if (data.isActive) {
          setConnected(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(onConnected, 1200);
          return;
        }
        setQrCode(data.qrCode ?? null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Não foi possível buscar o QR Code.');
      }
    }

    poll();
    timerRef.current = setInterval(poll, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionId, onConnected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-surface-card shadow-deep">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-main">Conectar WhatsApp</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-main">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          {error && <p className="text-sm text-danger">{error}</p>}

          {connected ? (
            <p className="text-sm font-medium text-success">✅ Conectado! Já pode receber pedidos.</p>
          ) : qrCode ? (
            <>
              <Image
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code do WhatsApp"
                width={256}
                height={256}
                unoptimized
                className="h-64 w-64 rounded-md border border-line"
              />
              <p className="text-sm text-ink-muted">Abra o WhatsApp no celular da loja → Aparelhos conectados → escaneie o código.</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Gerando QR Code...</p>
          )}
        </div>
      </div>
    </div>
  );
}
