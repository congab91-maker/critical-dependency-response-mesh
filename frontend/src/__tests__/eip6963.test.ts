import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSupportedProvider,
  getProviderBrandName,
  EIP6963Store,
  EIP6963ProviderDetail,
} from '../wallet/eip6963';

describe('EIP-6963 Store and Provider Validation', () => {
  let store: EIP6963Store;

  beforeEach(() => {
    store = new EIP6963Store();
  });

  it('validates supported RDNS for MetaMask, Rabby, and OKX Wallet', () => {
    const metamask: EIP6963ProviderDetail = {
      info: {
        uuid: 'meta-1',
        name: 'MetaMask',
        icon: '',
        rdns: 'io.metamask',
      },
      provider: { request: async () => [] },
    };

    const rabby: EIP6963ProviderDetail = {
      info: {
        uuid: 'rabby-1',
        name: 'Rabby Wallet',
        icon: '',
        rdns: 'io.rabby',
      },
      provider: { request: async () => [] },
    };

    const okx: EIP6963ProviderDetail = {
      info: {
        uuid: 'okx-1',
        name: 'OKX Wallet',
        icon: '',
        rdns: 'com.okex.wallet',
      },
      provider: { request: async () => [] },
    };

    const phantom: EIP6963ProviderDetail = {
      info: {
        uuid: 'phantom-1',
        name: 'Phantom',
        icon: '',
        rdns: 'app.phantom',
      },
      provider: { request: async () => [] },
    };

    expect(isSupportedProvider(metamask)).toBe(true);
    expect(isSupportedProvider(rabby)).toBe(true);
    expect(isSupportedProvider(okx)).toBe(true);
    expect(isSupportedProvider(phantom)).toBe(false);

    expect(getProviderBrandName(metamask)).toBe('MetaMask');
    expect(getProviderBrandName(rabby)).toBe('Rabby');
    expect(getProviderBrandName(okx)).toBe('OKX Wallet');
    expect(getProviderBrandName(phantom)).toBe('Phantom');
  });

  it('subscribes and notifies on provider updates', () => {
    let notified: EIP6963ProviderDetail[] = [];
    const unsubscribe = store.subscribe((list) => {
      notified = list;
    });

    expect(notified).toEqual([]);

    store.init();
    unsubscribe();
  });
});
