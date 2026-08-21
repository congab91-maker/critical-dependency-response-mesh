import React from 'react';

interface TransactionBannerProps {
  statusMessage: string | null;
  errorMessage: string | null;
  onDismissError?: () => void;
}

export const TransactionBanner: React.FC<TransactionBannerProps> = ({
  statusMessage,
  errorMessage,
  onDismissError,
}) => {
  if (!statusMessage && !errorMessage) return null;

  return (
    <div className="banner-container" role="status">
      {statusMessage && (
        <div className="banner banner-info">
          <span className="banner-icon">ℹ</span>
          <span className="banner-text">{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="banner banner-error">
          <span className="banner-icon">⚠</span>
          <span className="banner-text">{errorMessage}</span>
          {onDismissError && (
            <button
              type="button"
              className="btn btn-ghost btn-xs banner-dismiss"
              onClick={onDismissError}
              aria-label="Dismiss error banner"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};
