import React from 'react';
import { useWallet, STUDIONET_CHAIN_ID_DEC } from '../wallet/WalletContext';
import { getProviderBrandName } from '../wallet/eip6963';
import { UpgraderStatus } from '../genlayer/types';

interface HeaderProps {
  upgraderStatus: UpgraderStatus | null;
  onOpenNewIncidentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ upgraderStatus, onOpenNewIncidentModal }) => {
  const {
    account,
    selectedProvider,
    isConnected,
    isCorrectNetwork,
    chainId,
    openModal,
    disconnect,
    switchToStudionet,
  } = useWallet();

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const brandName = selectedProvider ? getProviderBrandName(selectedProvider) : '';

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="brand-icon" aria-hidden="true">⬢</div>
          <div>
            <h1 className="brand-title">Critical Dependency Response Mesh</h1>
            <span className="brand-tag">GenLayer Studionet • Supply-Chain Intelligence</span>
          </div>
        </div>

        <div className="header-actions">
          {/* Native Upgrader Status Indicator */}
          {upgraderStatus && (
            <div
              className="timelock-badge"
              title={`Native GenLayer Upgradability: ${
                upgraderStatus.is_upgradable
                  ? `Authorized Upgraders (${upgraderStatus.upgraders.length})`
                  : 'Upgrades Disabled'
              }`}
            >
              <span className="badge-dot badge-dot-safe" aria-hidden="true" />
              <span className="timelock-text">
                {upgraderStatus.is_upgradable
                  ? `Native Upgradable (${upgraderStatus.upgraders.length} upgrader${
                      upgraderStatus.upgraders.length === 1 ? '' : 's'
                    })`
                  : 'Upgrades Disabled'}
              </span>
            </div>
          )}

          {/* New Incident Trigger */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenNewIncidentModal}
          >
            + Disclose Incident
          </button>

          {/* Network Status / Switch */}
          {isConnected && !isCorrectNetwork && (
            <button
              type="button"
              className="btn btn-warning btn-sm"
              onClick={switchToStudionet}
              title={`Connected chain: ${chainId || 'Unknown'}. Switch to Studionet (${STUDIONET_CHAIN_ID_DEC}).`}
            >
              ⚠ Switch to Studionet
            </button>
          )}

          {isConnected && isCorrectNetwork && (
            <div className="network-status-badge">
              <span className="badge-dot badge-dot-studionet" aria-hidden="true" />
              <span className="network-name">Studionet (61999)</span>
            </div>
          )}

          {/* Wallet Connect / Account Control */}
          {!isConnected ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openModal}
            >
              Connect Wallet
            </button>
          ) : (
            <div className="account-pill-group">
              <div className="account-pill" title={account || ''}>
                <span className="provider-tag">{brandName}</span>
                <span className="account-addr">{formatAddress(account || '')}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs disconnect-btn"
                onClick={disconnect}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
