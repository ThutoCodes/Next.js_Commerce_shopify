'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * EIP-6963 events allow for discovering multiple wallet providers.
 * We define the event types to avoid using `any`.
 */
interface EIP6963AnnounceProviderEvent extends Event {
  detail: {
    info: {
      rdns: string;
    };
    provider: EIP1193Provider;
  };
}

/**
 * Represents a wallet provider that conforms to EIP-1193.
 */
interface EIP1193Provider {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}
/**
 * Custom hook to manage MetaMask wallet connection and state.
 */
export function useMetaMask() {
  const [provider, setProvider] = useState<EIP1193Provider | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    // EIP-6963 allows for discovering multiple wallet providers.
    // We prioritize MetaMask if it's available.
    function onAnnounceProvider(event: Event) {
      const { info, provider } = (event as EIP6963AnnounceProviderEvent).detail;
      if (info.rdns === 'io.metamask') {
        setProvider(provider);
      }
    }
    
    // Listen for providers being announced
    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);

    // Also check for an existing ethereum provider in case the event has already fired
    // or for environments that don't support EIP-6963.
    const checkExistingProvider = () => {
      if (window.ethereum?.isMetaMask) {
        setProvider(window.ethereum);
      }
    };
    checkExistingProvider();

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
  setAccount(accounts.length > 0 ? accounts[0] ?? null : null);

    };

    provider.request({ method: 'eth_accounts' }).then(handleAccountsChanged).catch(console.error);
    provider.on('accountsChanged', handleAccountsChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [provider]);

  const connectWallet = useCallback(async () => {
    if (!provider) {
      alert('MetaMask is not installed. Please consider installing it!');
      return;
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAccount(accounts?.[0] ?? null);
    } catch (error: any) {
      if (error.code === 4001) {
        alert('You rejected the connection. Please try again if you changed your mind.');
      } else {
        console.error('An error occurred while connecting to MetaMask:', error);
        alert('An unexpected error occurred. Please check your MetaMask wallet and try again.');
      }
    }
  }, [provider]);

  return {
    provider,
    account,
    connectWallet
  };
}