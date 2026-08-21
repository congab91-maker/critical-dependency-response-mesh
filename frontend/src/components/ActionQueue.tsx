import React from 'react';
import { TransactionReceipt } from '../genlayer/types';

interface ActionQueueProps {
  receipts: TransactionReceipt[];
  onClearReceipts?: () => void;
}

export const ActionQueue: React.FC<ActionQueueProps> = ({ receipts, onClearReceipts }) => {
  if (receipts.length === 0) return null;

  return (
    <section className="card queue-card" aria-labelledby="queue-heading">
      <div className="queue-header">
        <h2 id="queue-heading" className="queue-title">
          Transaction Activity Log
        </h2>
        {onClearReceipts && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClearReceipts}>
            Clear Log
          </button>
        )}
      </div>

      <div className="queue-list">
        {receipts.map((r, idx) => (
          <div key={`${r.hash}-${idx}`} className={`queue-item status-${r.status.toLowerCase()}`}>
            <div className="queue-left">
              <span className={`status-indicator indicator-${r.status.toLowerCase()}`} />
              <div className="queue-meta">
                <code className="tx-hash" title={r.hash}>
                  {r.hash.slice(0, 12)}…{r.hash.slice(-8)}
                </code>
                {r.from && <span className="tx-from">From: {r.from.slice(0, 8)}…</span>}
              </div>
            </div>
            <div className="queue-right">
              <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
              {r.error && <span className="tx-error-msg">{r.error}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
