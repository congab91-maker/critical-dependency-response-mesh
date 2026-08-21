export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

// Supported set: MetaMask, OKX Wallet, Rabby
export const ALLOWED_RDNS = new Set<string>([
  'io.metamask',
  'io.metamask.mobile',
  'io.metamask.mmi',
  'io.rabby',
  'com.okex.wallet',
]);

export function isSupportedProvider(detail: EIP6963ProviderDetail): boolean {
  if (!detail || !detail.info || !detail.provider) return false;
  const rdns = (detail.info.rdns || '').trim().toLowerCase();
  return ALLOWED_RDNS.has(rdns);
}

export function getProviderBrandName(detail: EIP6963ProviderDetail): string {
  const rdns = (detail.info.rdns || '').trim().toLowerCase();
  if (rdns.startsWith('io.metamask')) return 'MetaMask';
  if (rdns.startsWith('io.rabby')) return 'Rabby';
  if (rdns.startsWith('com.okex.wallet')) return 'OKX Wallet';
  return detail.info.name || 'Unknown Wallet';
}

export class EIP6963Store {
  private providers: Map<string, EIP6963ProviderDetail> = new Map();
  private listeners: Set<(providers: EIP6963ProviderDetail[]) => void> = new Set();
  private cleanupHandler: (() => void) | null = null;
  private hasEip6963Announcements: boolean = false;

  public init(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleAnnounce = (event: Event) => {
      const customEvent = event as EIP6963AnnounceProviderEvent;
      if (!customEvent.detail || !customEvent.detail.info || !customEvent.detail.provider) return;

      const detail = customEvent.detail;
      if (isSupportedProvider(detail)) {
        this.hasEip6963Announcements = true;
        // Remove fallback if present
        if (this.providers.has('window.ethereum.fallback')) {
          this.providers.delete('window.ethereum.fallback');
        }
        // Deduplicate by UUID or RDNS
        this.providers.set(detail.info.uuid || detail.info.rdns, detail);
        this.notify();
      }
    };

    // Register listener BEFORE requesting providers
    window.addEventListener('eip6963:announceProvider', handleAnnounce);

    // Request providers
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Check for bounded window.ethereum fallback only if no EIP-6963 announcements yet
    setTimeout(() => {
      if (!this.hasEip6963Announcements && typeof window !== 'undefined') {
        const eth = (window as any).ethereum;
        if (eth && typeof eth.request === 'function') {
          let name = 'Injected Wallet';
          let rdns = 'io.metamask';
          if (eth.isRabby) {
            name = 'Rabby';
            rdns = 'io.rabby';
          } else if (eth.isOkxWallet || eth.isOKExWallet) {
            name = 'OKX Wallet';
            rdns = 'com.okex.wallet';
          } else if (eth.isMetaMask) {
            name = 'MetaMask';
            rdns = 'io.metamask';
          }

          if (ALLOWED_RDNS.has(rdns)) {
            const fallbackDetail: EIP6963ProviderDetail = {
              info: {
                uuid: 'window.ethereum.fallback',
                name,
                icon: '',
                rdns,
              },
              provider: eth,
            };
            this.providers.set('window.ethereum.fallback', fallbackDetail);
            this.notify();
          }
        }
      }
    }, 100);

    this.cleanupHandler = () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce);
    };

    return this.cleanupHandler;
  }

  public subscribe(listener: (providers: EIP6963ProviderDetail[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getProviders());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.providers.values());
  }

  public clear(): void {
    this.providers.clear();
    this.hasEip6963Announcements = false;
    this.notify();
  }

  private notify(): void {
    const list = this.getProviders();
    this.listeners.forEach((l) => l(list));
  }
}

export const globalEIP6963Store = new EIP6963Store();
