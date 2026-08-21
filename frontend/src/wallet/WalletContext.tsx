import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  EIP6963ProviderDetail,
  EIP1193Provider,
  globalEIP6963Store,
} from './eip6963';

export const STUDIONET_CHAIN_ID_DEC = 61999;
export const STUDIONET_CHAIN_ID_HEX = '0xf22f';
export const STUDIONET_RPC_URL = 'https://studio.genlayer.com/api';

export interface WalletState {
  providers: EIP6963ProviderDetail[];
  selectedProvider: EIP6963ProviderDetail | null;
  account: string | null;
  chainId: string | null;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (providerDetail: EIP6963ProviderDetail) => Promise<void>;
  disconnect: () => void;
  switchToStudionet: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<EIP6963ProviderDetail | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeListenersRef = useRef<{
    provider: EIP1193Provider;
    onAccountsChanged: (accounts: string[]) => void;
    onChainChanged: (chain: string) => void;
  } | null>(null);

  // Initialize EIP-6963 discovery without persisting or auto-connecting on reload
  useEffect(() => {
    const cleanupStore = globalEIP6963Store.init();
    const unsubscribe = globalEIP6963Store.subscribe((discovered) => {
      setProviders(discovered);
    });

    return () => {
      unsubscribe();
      cleanupStore();
    };
  }, []);

  const removeActiveListeners = useCallback(() => {
    if (activeListenersRef.current) {
      const { provider, onAccountsChanged, onChainChanged } = activeListenersRef.current;
      if (typeof provider.removeListener === 'function') {
        try {
          provider.removeListener('accountsChanged', onAccountsChanged);
          provider.removeListener('chainChanged', onChainChanged);
        } catch {
          // Ignore listener removal failure
        }
      }
      activeListenersRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    removeActiveListeners();
    setSelectedProvider(null);
    setAccount(null);
    setChainId(null);
    setIsConnecting(false);
    setError(null);
  }, [removeActiveListeners]);

  const switchToStudionet = useCallback(async () => {
    if (!selectedProvider) return;
    const provider = selectedProvider.provider;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
      });
      setChainId(STUDIONET_CHAIN_ID_HEX);
    } catch (switchError: any) {
      // 4902 means chain has not been added
      if (switchError.code === 4902 || switchError.code === -32603 || switchError?.message?.includes('Unrecognized chain')) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: STUDIONET_CHAIN_ID_HEX,
                chainName: 'GenLayer Studionet',
                nativeCurrency: {
                  name: 'GEN',
                  symbol: 'GEN',
                  decimals: 18,
                },
                rpcUrls: [STUDIONET_RPC_URL],
              },
            ],
          });
          setChainId(STUDIONET_CHAIN_ID_HEX);
        } catch (addError: any) {
          setError(addError?.message || 'Failed to add Studionet network to wallet.');
        }
      } else {
        setError(switchError?.message || 'Failed to switch network.');
      }
    }
  }, [selectedProvider]);

  const connect = useCallback(
    async (detail: EIP6963ProviderDetail) => {
      setIsConnecting(true);
      setError(null);

      removeActiveListeners();

      try {
        const provider = detail.provider;
        const accounts = (await provider.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet.');
        }

        let currentChainId = '';
        try {
          currentChainId = (await provider.request({ method: 'eth_chainId' })) as string;
        } catch {
          // Chain fetch non-fatal
        }

        const primaryAccount = accounts[0];
        setAccount(primaryAccount);
        setSelectedProvider(detail);
        setChainId(currentChainId);
        setIsModalOpen(false);

        // Bind event listeners to this exact provider
        const handleAccountsChanged = (newAccounts: string[]) => {
          if (!newAccounts || newAccounts.length === 0) {
            disconnect();
          } else {
            setAccount(newAccounts[0]);
          }
        };

        const handleChainChanged = (newChain: string) => {
          setChainId(newChain);
        };

        if (typeof provider.on === 'function') {
          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);
          activeListenersRef.current = {
            provider,
            onAccountsChanged: handleAccountsChanged,
            onChainChanged: handleChainChanged,
          };
        }
      } catch (err: any) {
        removeActiveListeners();
        setSelectedProvider(null);
        setAccount(null);
        setChainId(null);
        if (err?.code === 4001 || err?.message?.includes('User rejected') || err?.message?.includes('rejected')) {
          setError('Connection rejected by user.');
        } else {
          setError(err?.message || 'Failed to connect to wallet.');
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [disconnect, removeActiveListeners]
  );

  const openModal = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      removeActiveListeners();
    };
  }, [removeActiveListeners]);

  const isCorrectNetwork =
    chainId === STUDIONET_CHAIN_ID_HEX ||
    chainId === `0x${STUDIONET_CHAIN_ID_DEC.toString(16)}` ||
    chainId === String(STUDIONET_CHAIN_ID_DEC);

  return (
    <WalletContext.Provider
      value={{
        providers,
        selectedProvider,
        account,
        chainId,
        isCorrectNetwork,
        isConnected: Boolean(account && selectedProvider),
        isConnecting,
        error,
        isModalOpen,
        openModal,
        closeModal,
        connect,
        disconnect,
        switchToStudionet,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletState => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
