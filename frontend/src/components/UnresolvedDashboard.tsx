import React from 'react';
import { UnresolvedRecord } from '../genlayer/types';

interface UnresolvedDashboardProps {
  unresolved: UnresolvedRecord[];
  isClosed: boolean;
}

export const UnresolvedDashboard: React.FC<UnresolvedDashboardProps> = ({
  unresolved,
  isClosed,
}) => {
  if (unresolved.length === 0) {
    return (
      <section className="card unresolved-card" aria-labelledby="unresolved-heading">
        <div className="unresolved-header">
          <div>
            <h2 id="unresolved-heading" className="unresolved-title">
              Unresolved Incident Ledger
            </h2>
            <p className="unresolved-subtitle">
              Affected or uncertain dependency nodes requiring security intervention.
            </p>
          </div>
          <span className="badge badge-safe">0 Unresolved Projects</span>
        </div>
        <div className="unresolved-empty-box">
          <span className="clean-icon" aria-hidden="true">🛡</span>
          <p>All affected dependencies have been acknowledged or triaged clean.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card unresolved-card" aria-labelledby="unresolved-heading">
      <div className="unresolved-header">
        <div>
          <h2 id="unresolved-heading" className="unresolved-title">
            Unresolved Incident Ledger
          </h2>
          <p className="unresolved-subtitle">
            {isClosed
              ? 'These dependency projects remained unacknowledged at incident closure and are immutably recorded.'
              : 'Affected projects currently awaiting maintainer remediation.'}
          </p>
        </div>
        <span className="badge badge-quarantine">
          {unresolved.length} Unresolved Project{unresolved.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-responsive">
        <table className="unresolved-table" aria-label="Unresolved dependencies ledger">
          <thead>
            <tr>
              <th scope="col">Project ID</th>
              <th scope="col">Package & Version</th>
              <th scope="col">Maintainer Address</th>
              <th scope="col">Classification</th>
              <th scope="col">Action</th>
              <th scope="col">Reason</th>
            </tr>
          </thead>
          <tbody>
            {unresolved.map((record) => (
              <tr key={record.project_id}>
                <td>
                  <strong>{record.project_id}</strong>
                </td>
                <td>
                  <code>{record.package_name}</code>@{record.version}
                </td>
                <td>
                  <code className="addr-code">{record.maintainer}</code>
                </td>
                <td>
                  <span
                    className={`badge ${
                      record.classification === 'AFFECTED'
                        ? 'badge-quarantine'
                        : 'badge-uncertain'
                    }`}
                  >
                    {record.classification}
                  </span>
                </td>
                <td>
                  <span className="badge badge-action">{record.action}</span>
                </td>
                <td className="notes-cell">
                  <small>{record.reason || 'Pending validator consensus reason'}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
