import React, { useState } from 'react';
import { Incident, IncidentGraph } from '../genlayer/types';
import { useWallet } from '../wallet/WalletContext';

interface OperationalRailProps {
  incident: Incident | null;
  graph: IncidentGraph;
  onOpenGraph: (incidentId: number) => Promise<void>;
  onLockGraph: (incidentId: number) => Promise<void>;
  onBeginResponse: (incidentId: number) => Promise<void>;
  onCloseIncident: (incidentId: number) => Promise<void>;
  onRegisterProject: (
    incidentId: number,
    params: { projectId: string; packageName: string; version: string }
  ) => Promise<void>;
  onAddDependency: (
    incidentId: number,
    params: { projectId: string; dependencyProjectId: string }
  ) => Promise<void>;
  onTriageNext: (incidentId: number, projectId: string) => Promise<void>;
  onAcknowledgeAction: (
    incidentId: number,
    params: { projectId: string; evidenceUri: string; noteHash: string }
  ) => Promise<void>;
  isSubmitting: boolean;
}

export const OperationalRail: React.FC<OperationalRailProps> = ({
  incident,
  graph,
  onOpenGraph,
  onLockGraph,
  onBeginResponse,
  onCloseIncident,
  onRegisterProject,
  onAddDependency,
  onTriageNext,
  onAcknowledgeAction,
  isSubmitting,
}) => {
  const { isConnected, isCorrectNetwork, openModal } = useWallet();

  const [activeTab, setActiveTab] = useState<'lifecycle' | 'register' | 'edge' | 'triage' | 'ack'>('lifecycle');

  // Register Project form state
  const [projectId, setProjectId] = useState('');
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('');

  // Add Dependency form state
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');

  // Triage state
  const [triageProjectId, setTriageProjectId] = useState('');

  // Ack state
  const [ackProjectId, setAckProjectId] = useState('');
  const [ackUri, setAckUri] = useState('');
  const [ackNoteHash, setAckNoteHash] = useState('');

  if (!incident) {
    return (
      <aside className="card rail-card">
        <p className="text-muted">Select an incident to perform operations.</p>
      </aside>
    );
  }

  const untriagedNodes = graph.nodes.filter((n) => n.classification === 'UNASSESSED');
  const unackNodes = graph.nodes.filter(
    (n) =>
      !n.acknowledged &&
      (n.classification === 'UNCERTAIN' ||
        n.classification === 'AFFECTED')
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !packageName) return;
    await onRegisterProject(incident.incident_id, {
      projectId: projectId.trim(),
      packageName: packageName.trim(),
      version: version.trim() || '1.0.0',
    });
    setProjectId('');
    setPackageName('');
    setVersion('');
  };

  const handleEdgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeFrom || !edgeTo) return;
    await onAddDependency(incident.incident_id, {
      projectId: edgeFrom.trim(),
      dependencyProjectId: edgeTo.trim(),
    });
    setEdgeFrom('');
    setEdgeTo('');
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageProjectId) return;
    await onTriageNext(incident.incident_id, triageProjectId);
  };

  const handleAckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackProjectId || !ackUri || incident.phase !== 'RESPONSE') return;
    let finalHash = ackNoteHash.trim();
    if (!finalHash) return;
    if (!finalHash.startsWith('0x')) {
      finalHash = '0x' + finalHash;
    }
    if (!/^0x[0-9a-fA-F]{64}$/.test(finalHash)) return;
    await onAcknowledgeAction(incident.incident_id, {
      projectId: ackProjectId.trim(),
      evidenceUri: ackUri.trim(),
      noteHash: finalHash,
    });
    setAckUri('');
    setAckNoteHash('');
  };

  return (
    <aside className="card rail-card" aria-labelledby="operational-rail-heading">
      <div className="rail-header">
        <h2 id="operational-rail-heading" className="rail-title">
          Operational Rail
        </h2>
        <span className="badge badge-phase-sm">{incident.phase}</span>
      </div>

      {!isConnected ? (
        <div className="wallet-gate-prompt">
          <p>Connect your wallet to sign transactions on Studionet.</p>
          <button type="button" className="btn btn-primary btn-sm btn-block" onClick={openModal}>
            Connect Wallet
          </button>
        </div>
      ) : !isCorrectNetwork ? (
        <div className="alert alert-warning">
          <p>Please switch your wallet to GenLayer Studionet (Chain ID 61999) to submit operations.</p>
        </div>
      ) : (
        <div className="rail-content">
          {/* Operations Navigation Tabs */}
          <div className="rail-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'lifecycle'}
              className={`rail-tab ${activeTab === 'lifecycle' ? 'active' : ''}`}
              onClick={() => setActiveTab('lifecycle')}
            >
              Lifecycle
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`rail-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'edge'}
              className={`rail-tab ${activeTab === 'edge' ? 'active' : ''}`}
              onClick={() => setActiveTab('edge')}
            >
              Add Edge
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'triage'}
              className={`rail-tab ${activeTab === 'triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('triage')}
            >
              Triage ({untriagedNodes.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ack'}
              className={`rail-tab ${activeTab === 'ack' ? 'active' : ''}`}
              onClick={() => setActiveTab('ack')}
            >
              Acknowledge ({unackNodes.length})
            </button>
          </div>

          {/* Tab 1: Lifecycle Controls */}
          {activeTab === 'lifecycle' && (
            <div className="rail-panel" role="tabpanel">
              <h3 className="panel-title">Lifecycle Operations</h3>
              <p className="panel-desc">
                Current incident is in <strong>{incident.phase}</strong> phase.
              </p>

              <div className="lifecycle-actions">
                {incident.phase === 'DISCLOSED' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={isSubmitting}
                    onClick={() => onOpenGraph(incident.incident_id)}
                  >
                    Open Graph (Advance to GRAPH_OPEN) →
                  </button>
                )}

                {incident.phase === 'GRAPH_OPEN' && (
                  <button
                    type="button"
                    className="btn btn-warning btn-block"
                    disabled={isSubmitting}
                    onClick={() => onLockGraph(incident.incident_id)}
                  >
                    🔒 Lock Graph (Advance to LOCKED)
                  </button>
                )}

                {incident.phase === 'LOCKED' && (
                  <div className="info-box">
                    <p>
                      Graph is locked. Run AI validator consensus triage on all registered nodes in the <strong>Triage</strong> tab to advance to <strong>TRIAGED</strong>.
                    </p>
                  </div>
                )}

                {incident.phase === 'TRIAGED' && (
                  <div className="lifecycle-button-group">
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      disabled={isSubmitting}
                      onClick={() => onBeginResponse(incident.incident_id)}
                    >
                      🚀 Begin Response Window (Advance to RESPONSE)
                    </button>
                    <button
                      type="button"
                      className="btn btn-quarantine btn-block"
                      disabled={isSubmitting}
                      onClick={() => onCloseIncident(incident.incident_id)}
                    >
                      Close Lifecycle & Seal Unresolved
                    </button>
                  </div>
                )}

                {incident.phase === 'RESPONSE' && (
                  <div className="lifecycle-button-group">
                    <div className="info-box">
                      <p>
                        Response window active. Maintainers can submit remediation evidence in the <strong>Acknowledge</strong> tab.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-quarantine btn-block"
                      disabled={isSubmitting}
                      onClick={() => onCloseIncident(incident.incident_id)}
                    >
                      Close Lifecycle & Seal Unresolved
                    </button>
                  </div>
                )}

                {incident.phase === 'CLOSED' && (
                  <div className="alert alert-info">
                    <p>Incident lifecycle is permanently closed. Unresolved records are immutably sealed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Register Project Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="rail-panel" role="tabpanel">
              <h3 className="panel-title">Register Project</h3>
              <p className="panel-desc">
                {incident.phase === 'GRAPH_OPEN'
                  ? 'Register project node and declared npm package.'
                  : `Project registration is locked in ${incident.phase} phase.`}
              </p>

              <div className="form-group">
                <label htmlFor="field-project-id" className="form-label">
                  Project Identifier *
                </label>
                <input
                  id="field-project-id"
                  type="text"
                  className="input-field"
                  placeholder="e.g. auth-gateway-service"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="field-package-name" className="form-label">
                  Package Name (npm) *
                </label>
                <input
                  id="field-package-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. express-jwt-guard"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="field-version" className="form-label">
                  Declared SemVer Version *
                </label>
                <input
                  id="field-version"
                  type="text"
                  className="input-field"
                  placeholder="e.g. 1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
              >
                {isSubmitting ? 'Registering…' : 'Register Project'}
              </button>
            </form>
          )}

          {/* Tab 3: Add Edge Form */}
          {activeTab === 'edge' && (
            <form onSubmit={handleEdgeSubmit} className="rail-panel" role="tabpanel">
              <h3 className="panel-title">Add Dependency Edge</h3>
              <p className="panel-desc">
                Declare downstream consumption relationship between projects.
              </p>

              <div className="form-group">
                <label htmlFor="field-edge-from" className="form-label">
                  From Project (Consumer) *
                </label>
                <select
                  id="field-edge-from"
                  className="input-field"
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
                  required
                >
                  <option value="">-- Select Consumer Project --</option>
                  {graph.nodes.map((n) => (
                    <option key={n.project_id} value={n.project_id}>
                      {n.project_id} ({n.declared_package})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="field-edge-to" className="form-label">
                  To Project (Dependency) *
                </label>
                <select
                  id="field-edge-to"
                  className="input-field"
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
                  required
                >
                  <option value="">-- Select Dependency Project --</option>
                  {graph.nodes.map((n) => (
                    <option key={n.project_id} value={n.project_id}>
                      {n.project_id} ({n.declared_package})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={incident.phase !== 'GRAPH_OPEN' || isSubmitting}
              >
                {isSubmitting ? 'Adding…' : 'Add Dependency Edge'}
              </button>
            </form>
          )}

          {/* Tab 4: AI Triage Execution */}
          {activeTab === 'triage' && (
            <form onSubmit={handleTriageSubmit} className="rail-panel" role="tabpanel">
              <h3 className="panel-title">AI Consensus Triage</h3>
              <p className="panel-desc">
                Validators independently fetch official CISA KEV, NVD CVE, and OSV sources and execute LLM judgment to classify dependency impact.
              </p>

              {untriagedNodes.length === 0 ? (
                <div className="alert alert-success">
                  <p>✓ All registered nodes in this incident have been triaged.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="field-triage-node" className="form-label">
                      Select Untriaged Project *
                    </label>
                    <select
                      id="field-triage-node"
                      className="input-field"
                      value={triageProjectId}
                      onChange={(e) => setTriageProjectId(e.target.value)}
                      disabled={incident.phase !== 'LOCKED' || isSubmitting}
                      required
                    >
                      <option value="">-- Select Project to Triage --</option>
                      {untriagedNodes.map((n) => (
                        <option key={n.project_id} value={n.project_id}>
                          {n.project_id} ({n.declared_package}@{n.declared_version})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={incident.phase !== 'LOCKED' || !triageProjectId || isSubmitting}
                  >
                    {isSubmitting ? 'Triaging with Validators…' : '⚡ Run Validator Triage'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Tab 5: Remediation Acknowledgement */}
          {activeTab === 'ack' && (
            <form onSubmit={handleAckSubmit} className="rail-panel" role="tabpanel">
              <h3 className="panel-title">Acknowledge Action</h3>
              <p className="panel-desc">
                Maintainer records remediation patch evidence URI and note hash on-chain.
              </p>

              {unackNodes.length === 0 ? (
                <div className="alert alert-success">
                  <p>✓ No pending unacknowledged affected projects.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="field-ack-node" className="form-label">
                      Affected Project *
                    </label>
                    <select
                      id="field-ack-node"
                      className="input-field"
                      value={ackProjectId}
                      onChange={(e) => setAckProjectId(e.target.value)}
                      disabled={isSubmitting || incident.phase !== 'RESPONSE'}
                      required
                    >
                      <option value="">-- Select Project --</option>
                      {unackNodes.map((n) => (
                        <option key={n.project_id} value={n.project_id}>
                          {n.project_id} [{n.classification}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="field-ack-uri" className="form-label">
                      Evidence URI *
                    </label>
                    <input
                      id="field-ack-uri"
                      type="url"
                      className="input-field"
                      placeholder="https://github.com/org/repo/pull/123"
                      value={ackUri}
                      onChange={(e) => setAckUri(e.target.value)}
                      disabled={isSubmitting || incident.phase !== 'RESPONSE'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="field-ack-note-hash" className="form-label">
                      Note Hash (0x + 64 hex characters) *
                    </label>
                    <input
                      id="field-ack-note-hash"
                      type="text"
                      className="input-field"
                      placeholder="0x..."
                      value={ackNoteHash}
                      onChange={(e) => setAckNoteHash(e.target.value)}
                      disabled={isSubmitting || incident.phase !== 'RESPONSE'}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary btn-block"
                    disabled={
                      !ackProjectId ||
                      !ackUri ||
                      incident.phase !== 'RESPONSE' ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? 'Submitting…' : '✓ Submit Action Acknowledgement'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}
    </aside>
  );
};
