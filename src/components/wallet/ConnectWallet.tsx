'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useConnectors } from 'wagmi';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';

const CONNECTOR_ICONS: Record<string, string> = {
  'MetaMask': '🦊',
  'Injected': '🌐',
  'Coinbase Wallet': '🔵',
  'WalletConnect': '🔗',
};

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (!isConnected) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowPicker(v => !v)}
          className="px-4 py-2 rounded-lg glass border border-white/10 hover:border-indigo-500/40 text-sm font-medium text-gray-300 hover:text-white transition-all"
        >
          Connect Wallet
        </button>

        {showPicker && (
          <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
              Choose wallet
            </div>
            {connectors.map(connector => (
              <button
                key={connector.uid}
                onClick={() => { connect({ connector }); setShowPicker(false); }}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-base">{CONNECTOR_ICONS[connector.name] ?? '🔌'}</span>
                <span>{connector.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  const balStr = balance
    ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)} ${balance.symbol}`
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-emerald-500/20 hover:border-emerald-500/40 text-sm font-mono text-emerald-400 hover:text-emerald-300 transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        {short}
        <svg
          className={cn('w-3 h-3 transition-transform text-gray-500 flex-shrink-0', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 glass-dark rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
          {/* Account info */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-xs text-gray-500 mb-1">
              Connected · {chain?.name ?? 'Unknown network'}
            </div>
            <div className="font-mono text-xs text-white break-all">{address}</div>
            {balStr && (
              <div className="text-xs text-gray-400 mt-1 font-medium">{balStr}</div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(address ?? '').catch(() => {});
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-base">⎘</span>
            Copy address
          </button>

          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left border-t border-white/5"
          >
            <span className="text-base">⏻</span>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
