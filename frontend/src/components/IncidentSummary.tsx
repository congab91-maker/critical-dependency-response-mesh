import React, { useEffect, useState } from 'react';
import { Incident, IncidentSummary as IncidentSummaryType } from '../genlayer/types';

interface IncidentSummaryProps {
  incidents: IncidentSummaryType[];
  selectedIncident: Incident | null;
  isLoading?: boolean;
  onSelectIncident: (id: number) => void;
}

export const IncidentSummary: React.FC<IncidentSummaryProps> = ({
  incidents,
  selectedIncident,
  isLoading = false,
  onSelectIncident,
}) => {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!selectedIncident || selectedIncident.phase === 'CLOSED') return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [selectedIncident]);

  if (isLoading) {
    return (
      <div className="card summary-empty" role="status" aria-live="polite">
        <p>Loading finalized incident state from GenLayer Studionet…</p>
      </div>
    );
  }

  if (!selectedIncident) {
    return (
      <div className="card summary-empty">
        <p>No active incident selected. Disclose a new incident or select one above.</p>
      </div>
    );
  }

  const formatTimestamp = (ts: number) => {
    if (!ts || ts === 0) return 'None';
    return new Date(ts * 1000).toLocaleString();
  };

  const getPhaseClass = (phase: string) => {
    switch (phase) {
      case 'DISCLOSED':
        return 'phase-disclosed';
      case 'GRAPH_OPEN':
        return 'phase-graph-open';
      case 'LOCKED':
        return 'phase-locked';
      case 'TRIAGED':
        return 'phase-triaged';
      case 'RESPONSE':
        return 'phase-response';
      case 'CLOSED':
        return 'phase-closed';
      default:
        return '';
    }
  };

  const now = Math.floor(nowMs / 1000);
  const isDeadlinePassed = selectedIncident.response_deadline > 0 && now > selectedIncident.response_deadline;
  const remainingSeconds = Math.max(0, selectedIncident.response_deadline - now);
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const remainingDisplaySeconds = remainingSeconds % 60;

  return (
    <section className="card incident-summary-card" aria-labelledby="incident-summary-heading">
      {/* Incident Switcher Tabs */}
      <div className="incident-tabs-bar">
        <span className="tabs-label">Active Incidents:</span>
        <div className="tabs-scroll" role="tablist">
          {incidents.map((inc) => (
            <button
              key={inc.incident_id}
              role="tab"
              aria-selected={inc.incident_id === selectedIncident.incident_id}
              className={`incident-tab ${inc.incident_id === selectedIncident.incident_id ? 'active' : ''}`}
              onClick={() => onSelectIncident(inc.incident_id)}
            >
              <span className="tab-cve">{inc.cve_id}</span>
              <span className={`badge badge-xs ${getPhaseClass(inc.phase)}`}>{inc.phase}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="summary-header">
        <div>
          <div className="summary-tags">
            <span className={`badge badge-phase ${getPhaseClass(selectedIncident.phase)}`}>
              Phase: {selectedIncident.phase}
            </span>
            <span className="badge badge-mono">Incident #{selectedIncident.incident_id}</span>
            {selectedIncident.phase === 'CLOSED' && (
              <span className="badge badge-sealed">🔒 Sealed at {formatTimestamp(selectedIncident.closed_at)}</span>
            )}
          </div>
          <h2 id="incident-summary-heading" className="summary-title">
            {selectedIncident.cve_id} — Package: <code className="pkg-code">{selectedIncident.primary_package}</code>
          </h2>
        </div>

        <div className="deadline-box">
          <div className="deadline-title">Response Window</div>
          <div className={`deadline-value ${isDeadlinePassed ? 'deadline-expired' : ''}`}>
            {selectedIncident.phase === 'CLOSED'
              ? 'Lifecycle Closed'
              : isDeadlinePassed
              ? 'Deadline Passed'
              : `${remainingHours}h ${remainingMinutes}m ${remainingDisplaySeconds}s remaining`}
          </div>
          <div className="deadline-date">Deadline: {formatTimestamp(selectedIncident.response_deadline)}</div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-num">{selectedIncident.project_count}</span>
          <span className="metric-label">Registered Projects</span>
        </div>
        <div className="metric-box">
          <span className="metric-num">{selectedIncident.edge_count}</span>
          <span className="metric-label">Dependency Edges</span>
        </div>
        <div className="metric-box">
          <span className="metric-num metric-triaged">{selectedIncident.triaged_node_count}</span>
          <span className="metric-label">AI Consensus Triaged</span>
        </div>
        <div className="metric-box">
          <span className={`metric-num ${selectedIncident.unresolved_count > 0 ? 'metric-unresolved' : ''}`}>
            {selectedIncident.unresolved_count}
          </span>
          <span className="metric-label">Unresolved At Closure</span>
        </div>
      </div>

      {/* Evidence & Hash Details */}
      <div className="evidence-grid">
        <div className="evidence-item">
          <span className="evidence-label">CISA KEV Reference:</span>
          <a
            href={selectedIncident.cisa_kev_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="evidence-link"
          >
            {selectedIncident.cisa_kev_uri || 'None'} ↗
          </a>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">NVD CVE Reference:</span>
          <a
            href={selectedIncident.nvd_cve_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="evidence-link"
          >
            {selectedIncident.nvd_cve_uri || 'None'} ↗
          </a>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">OSV Registry Reference:</span>
          <a
            href={selectedIncident.osv_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="evidence-link"
          >
            {selectedIncident.osv_uri || 'None'} ↗
          </a>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">Snapshot Hash:</span>
          <code className="hash-code" title={selectedIncident.snapshot_hash}>
            {selectedIncident.snapshot_hash
              ? `${selectedIncident.snapshot_hash.slice(0, 14)}…${selectedIncident.snapshot_hash.slice(-8)}`
              : 'None'}
          </code>
        </div>
      </div>
    </section>
  );
};
