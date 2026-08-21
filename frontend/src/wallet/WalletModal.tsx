import React, { useEffect, useRef } from 'react';
import { useWallet } from './WalletContext';
import { getProviderBrandName } from './eip6963';

export const WalletModal: React.FC = () => {
  const {
    isModalOpen,
    closeModal,
    providers,
    connect,
    isConnecting,
    error,
    clearError,
  } = useWallet();

  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    lastActiveRef.current = document.activeElement as HTMLElement;
    const modal = modalRef.current;
    const background = Array.from(document.querySelectorAll<HTMLElement>('.app-header, .app-container, .app-footer'));
    background.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
    window.setTimeout(() => modal?.querySelector<HTMLElement>('button:not([disabled]), a[href]')?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
      if (e.key === 'Tab' && modal) {
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      background.forEach((element) => {
        element.inert = false;
        element.removeAttribute('aria-hidden');
      });
      lastActiveRef.current?.focus();
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card" ref={modalRef}>
        <div className="modal-header">
          <div>
            <h2 id="wallet-modal-title" className="modal-title">
              Connect Web3 Wallet
            </h2>
            <p className="modal-subtitle">
              EIP-6963 Multi-Injected Discovery on GenLayer Studionet
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠</span>
            <div className="alert-content">
              <strong>Connection Error</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="provider-list">
          {providers.length === 0 ? (
            <div className="empty-provider-box">
              <div className="empty-icon">🔌</div>
              <h3 className="empty-title">No Supported Wallets Detected</h3>
              <p className="empty-desc">
                This project supports <strong>MetaMask</strong>, <strong>OKX Wallet</strong>, or <strong>Rabby</strong> via EIP-6963 multi-injected discovery.
              </p>
              <div className="supported-links">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-card"
                >
                  MetaMask
                </a>
                <a
                  href="https://www.okx.com/web3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-card"
                >
                  OKX Wallet
                </a>
                <a
                  href="https://rabby.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-card"
                >
                  Rabby
                </a>
              </div>
            </div>
          ) : (
            providers.map((p) => {
              const brandName = getProviderBrandName(p);
              const key = p.info.uuid || p.info.rdns;
              return (
                <button
                  key={key}
                  type="button"
                  className="provider-item"
                  onClick={() => connect(p)}
                  disabled={isConnecting}
                >
                  <div className="provider-info-left">
                    {p.info.icon ? (
                      <img
                        src={p.info.icon}
                        alt=""
                        className="provider-icon"
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="provider-icon-placeholder" aria-hidden="true">
                        ⬡
                      </div>
                    )}
                    <div className="provider-text">
                      <span className="provider-name">{brandName}</span>
                      <span className="provider-rdns">{p.info.rdns}</span>
                    </div>
                  </div>
                  <span className="provider-action">
                    {isConnecting ? 'Connecting…' : 'Connect →'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <div className="network-pill">
            <span className="dot dot-studionet" />
            <span>Target: GenLayer Studionet (Chain ID 61999)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
