'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  switchToCorrectNetwork: () => Promise<void>;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

const PASEO_ASSET_HUB_CHAIN_ID = 420420422;

export function SimpleWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === PASEO_ASSET_HUB_CHAIN_ID;

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        setProvider(provider);
        setSigner(signer);
        setAddress(accounts[0]);
        setChainId(Number(network.chainId));
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  };

  const switchToCorrectNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${PASEO_ASSET_HUB_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${PASEO_ASSET_HUB_CHAIN_ID.toString(16)}`,
                  chainName: 'Paseo Asset Hub',
                  nativeCurrency: {
                    name: 'PAS',
                    symbol: 'PAS',
                    decimals: 18,
                  },
                  rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
                  blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io'],
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add network:', addError);
          }
        }
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_accounts', []);
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            
            setProvider(provider);
            setSigner(signer);
            setAddress(accounts[0]);
            setChainId(Number(network.chainId));
          }
        } catch (error) {
          console.error('Failed to check connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  const value: WalletContextType = {
    address,
    isConnected,
    isCorrectNetwork,
    chainId,
    connectWallet,
    disconnect,
    switchToCorrectNetwork,
    provider,
    signer,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useSimpleWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useSimpleWallet must be used within SimpleWalletProvider');
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
} 