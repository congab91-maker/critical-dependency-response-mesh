import { createClient, chains } from 'genlayer-js';
import { STUDIONET_RPC_URL } from '../wallet/WalletContext';
import type { EIP1193Provider } from '../wallet/eip6963';

export const getRpcEndpoint = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GENLAYER_RPC_URL) {
    return import.meta.env.VITE_GENLAYER_RPC_URL;
  }
  return STUDIONET_RPC_URL;
};

export const getContractAddress = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS.trim();
  }
  return '';
};

export const createGenlayerClient = (
  endpoint?: string,
  account?: string,
  provider?: EIP1193Provider
) => {
  const rpcUrl = endpoint || getRpcEndpoint();
  return createClient({
    endpoint: rpcUrl,
    chain: chains.studionet,
    ...(account ? { account: account as `0x${string}` } : {}),
    ...(provider ? { provider: provider as any } : {}),
  });
};

export const defaultGenlayerClient = createGenlayerClient();
