import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from './wallet/WalletContext';
import { WalletModal } from './wallet/WalletModal';
import { Header } from './components/Header';
import { IncidentSummary } from './components/IncidentSummary';
import { GraphWorkspace } from './components/GraphWorkspace';
import { OperationalRail } from './components/OperationalRail';
import { UnresolvedDashboard } from './components/UnresolvedDashboard';
import { ActionQueue } from './components/ActionQueue';
import { TransactionBanner } from './components/TransactionBanner';
import { Footer } from './components/Footer';
import { meshRepository } from './genlayer/repository';
import { meshTransactions } from './genlayer/transactions';
import { getContractAddress } from './genlayer/client';
import {
  Incident,
  IncidentGraph,
  IncidentSummary as IncidentSummaryType,
  UnresolvedRecord,
  UpgraderStatus,
  TransactionReceipt,
} from './genlayer/types';

export const App: React.FC = () => {
  const { account, selectedProvider } = useWallet();

  // Core mesh state
  const [incidents, setIncidents] = useState<IncidentSummaryType[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(1);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [graph, setGraph] = useState<IncidentGraph>({ incident_id: 1, nodes: [], edges: [] });
  const [unresolved, setUnresolved] = useState<UnresolvedRecord[]>([]);
  const [upgraderStatus, setUpgraderStatus] = useState<UpgraderStatus | null>(null);
  const [isLoadingMesh, setIsLoadingMesh] = useState<boolean>(true);

  // Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState<boolean>(false);

  // Acknowledge modal state
  const [ackModalProjectId, setAckModalProjectId] = useState<string | null>(null);
  const [ackModalUri, setAckModalUri] = useState('');
  const [ackModalNoteHash, setAckModalNoteHash] = useState('');

  // New incident form state
  const [newCveId, setNewCveId] = useState('');
  const [newCisaUri, setNewCisaUri] = useState('');
  const [newNvdUri, setNewNvdUri] = useState('');
  const [newOsvUri, setNewOsvUri] = useState('');
  const [newPrimaryPkg, setNewPrimaryPkg] = useState('');
  const [newSnapshotHash, setNewSnapshotHash] = useState('');
  const [newDeadlineHours, setNewDeadlineHours] = useState('72');

  const contractConfigured = Boolean(getContractAddress());

  // Focus trap references for accessible modals
  const discloseModalRef = useRef<HTMLDivElement>(null);
  const ackModalRef = useRef<HTMLDivElement>(null);
  const firstDiscloseInputRef = useRef<HTMLInputElement>(null);
  const firstAckInputRef = useRef<HTMLInputElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Fetch all summaries & upgrader status
  const refreshMeshState = useCallback(async () => {
    if (!getContractAddress()) {
      setIsLoadingMesh(false);
      setErrorMessage(
        'Contract address is not configured. Please set VITE_CONTRACT_ADDRESS in your environment.'
      );
      return;
    }

    setIsLoadingMesh(true);
    try {
      const [summaries, upgrader] = await Promise.all([
        meshRepository.getIncidentSummaries(),
        meshRepository.getUpgraderStatus(),
      ]);
      setIncidents(summaries);
      setUpgraderStatus(upgrader);

      if (summaries.length > 0) {
        const activeId = summaries.some((s) => s.incident_id === selectedIncidentId)
          ? selectedIncidentId
          : summaries[0].incident_id;
        setSelectedIncidentId(activeId);

        const [inc, g, unres] = await Promise.all([
          meshRepository.getIncident(activeId),
          meshRepository.getIncidentGraph(activeId),
          meshRepository.getUnresolvedRecords(activeId),
        ]);
        setSelectedIncident(inc);
        setGraph(g);
        setUnresolved(unres);

        if (g.nodes.length > 0 && !selectedNodeId) {
          setSelectedNodeId(g.nodes[0].project_id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load mesh data:', err);
      setErrorMessage(`Failed to load contract state: ${err?.message || err}`);
      throw err;
    } finally {
      setIsLoadingMesh(false);
    }
  }, [selectedIncidentId, selectedNodeId]);

  useEffect(() => {
    void refreshMeshState().catch(() => {
      // The refresh function already exposes the failure through the visible error banner.
    });
  }, [refreshMeshState]);

  // Handle modal keyboard accessibility & focus management
  useEffect(() => {
    if (isNewIncidentModalOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement;
      setTimeout(() => firstDiscloseInputRef.current?.focus(), 50);
    } else if (ackModalProjectId) {
      lastActiveElementRef.current = document.activeElement as HTMLElement;
      setTimeout(() => firstAckInputRef.current?.focus(), 50);
    } else if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  }, [isNewIncidentModalOpen, ackModalProjectId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isNewIncidentModalOpen) setIsNewIncidentModalOpen(false);
        if (ackModalProjectId) setAckModalProjectId(null);
      }
      if (e.key === 'Tab') {
        const modal = isNewIncidentModalOpen ? discloseModalRef.current : ackModalRef.current;
        if (!modal) return;
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
          )
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewIncidentModalOpen, ackModalProjectId]);

  useEffect(() => {
    const modalOpen = isNewIncidentModalOpen || Boolean(ackModalProjectId);
    const background = Array.from(document.querySelectorAll<HTMLElement>('.app-header, .app-container, .app-footer'));
    background.forEach((element) => {
      element.inert = modalOpen;
      if (modalOpen) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
    });
    return () => background.forEach((element) => {
      element.inert = false;
      element.removeAttribute('aria-hidden');
    });
  }, [isNewIncidentModalOpen, ackModalProjectId]);

  const handleSelectIncident = (id: number) => {
    setIsLoadingMesh(true);
    setSelectedIncidentId(id);
    setSelectedNodeId(null);
  };

  // Transaction Handlers
  const handleOpenGraph = async (incidentId: number) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage('Advancing incident phase to GRAPH_OPEN…');
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.openGraph(selectedProvider.provider, account, incidentId);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncident(incidentId);
      if (readback?.phase !== 'GRAPH_OPEN') throw new Error('Finalized transaction readback did not confirm GRAPH_OPEN.');
      await refreshMeshState();
      setStatusMessage(`Phase advanced to GRAPH_OPEN. Consensus finalized and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to open graph.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockGraph = async (incidentId: number) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage('Locking claim graph for AI triage…');
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.lockGraph(selectedProvider.provider, account, incidentId);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncident(incidentId);
      if (readback?.phase !== 'LOCKED') throw new Error('Finalized transaction readback did not confirm LOCKED.');
      await refreshMeshState();
      setStatusMessage(`Graph locked on-chain. Consensus finalized and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to lock incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBeginResponse = async (incidentId: number) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage('Advancing incident to RESPONSE phase…');
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.beginResponse(selectedProvider.provider, account, incidentId);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncident(incidentId);
      if (readback?.phase !== 'RESPONSE') throw new Error('Finalized transaction readback did not confirm RESPONSE.');
      await refreshMeshState();
      setStatusMessage(`Incident response window opened. Consensus finalized and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to begin response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseIncident = async (incidentId: number) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage('Closing incident lifecycle and sealing unresolved records…');
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.closeIncident(selectedProvider.provider, account, incidentId);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncident(incidentId);
      if (readback?.phase !== 'CLOSED') throw new Error('Finalized transaction readback did not confirm CLOSED.');
      await refreshMeshState();
      setStatusMessage(`Incident closed and sealed. Consensus finalized and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to close incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterProject = async (
    incidentId: number,
    params: { projectId: string; packageName: string; version: string }
  ) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage(`Registering project ${params.projectId}…`);
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.registerProject(selectedProvider.provider, account, incidentId, params);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncidentGraph(incidentId);
      if (!readback.nodes.some((node) => node.project_id === params.projectId.toLowerCase())) {
        throw new Error(`Finalized transaction readback did not confirm project ${params.projectId}.`);
      }
      await refreshMeshState();
      setSelectedNodeId(params.projectId);
      setStatusMessage(`Project ${params.projectId} registered on-chain and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to register project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDependency = async (
    incidentId: number,
    params: { projectId: string; dependencyProjectId: string }
  ) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage(`Adding dependency edge: ${params.projectId} -> ${params.dependencyProjectId}…`);
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.addDependency(selectedProvider.provider, account, incidentId, params);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncidentGraph(incidentId);
      if (!readback.edges.some((edge) => edge.from_project === params.projectId.toLowerCase() && edge.to_project === params.dependencyProjectId.toLowerCase())) {
        throw new Error('Finalized transaction readback did not confirm the dependency edge.');
      }
      await refreshMeshState();
      setStatusMessage(`Dependency edge added on-chain and verified.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to add dependency edge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriageNext = async (incidentId: number, projectId: string) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage(`Executing validator AI consensus triage for ${projectId}…`);
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.triageNext(selectedProvider.provider, account, incidentId, projectId);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncidentGraph(incidentId);
      if (!readback.nodes.some((node) => node.project_id === projectId && node.has_triage)) {
        throw new Error(`Finalized transaction readback did not confirm triage for ${projectId}.`);
      }
      await refreshMeshState();
      setStatusMessage(`Validator triage consensus reached and verified for ${projectId}.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to execute node triage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledgeAction = async (
    incidentId: number,
    params: { projectId: string; evidenceUri: string; noteHash: string }
  ) => {
    if (!account || !selectedProvider) return;
    setIsSubmitting(true);
    setStatusMessage(`Submitting action acknowledgement for ${params.projectId}…`);
    setErrorMessage(null);
    try {
      const receipt = await meshTransactions.acknowledgeAction(selectedProvider.provider, account, incidentId, params);
      setReceipts((prev) => [receipt, ...prev]);
      const readback = await meshRepository.getIncidentGraph(incidentId);
      if (!readback.nodes.some((node) => node.project_id === params.projectId && node.acknowledgement_note_hash === params.noteHash.toLowerCase())) {
        throw new Error(`Finalized transaction readback did not confirm acknowledgement for ${params.projectId}.`);
      }
      setAckModalProjectId(null);
      setAckModalUri('');
      setAckModalNoteHash('');
      await refreshMeshState();
      setStatusMessage(`Action acknowledged on-chain and verified for ${params.projectId}.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to acknowledge action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedProvider) return;
    if (!newCveId || !newPrimaryPkg) return;

    let finalSnapshotHash = newSnapshotHash.trim();
    if (!finalSnapshotHash) {
      setErrorMessage('A real frozen snapshot hash is required.');
      return;
    } else if (!finalSnapshotHash.startsWith('0x')) {
      finalSnapshotHash = '0x' + finalSnapshotHash;
    }

    setIsSubmitting(true);
    setStatusMessage(`Disclosing new incident for ${newCveId}…`);
    setErrorMessage(null);
    try {
      const submittedCve = newCveId.trim().toUpperCase();
      const deadlineSec = Math.floor(Date.now() / 1000) + parseInt(newDeadlineHours || '72', 10) * 3600;
      const receipt = await meshTransactions.createIncident(selectedProvider.provider, account, {
        cveId: newCveId.trim(),
        cisaKevUri:
          newCisaUri.trim() ||
          'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
        nvdCveUri:
          newNvdUri.trim() ||
          `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${newCveId.trim()}`,
        osvUri: newOsvUri.trim() || `https://api.osv.dev/v1/vulns/${newCveId.trim()}`,
        primaryPackage: newPrimaryPkg.trim(),
        snapshotHash: finalSnapshotHash,
        responseDeadline: deadlineSec,
      });
      setReceipts((prev) => [receipt, ...prev]);
      const summaries = await meshRepository.getIncidentSummaries();
      if (!summaries.some((incident) => incident.cve_id === submittedCve)) {
        throw new Error(`Finalized transaction readback did not confirm incident ${submittedCve}.`);
      }
      setIsNewIncidentModalOpen(false);
      setNewCveId('');
      setNewPrimaryPkg('');
      setNewCisaUri('');
      setNewNvdUri('');
      setNewOsvUri('');
      setNewSnapshotHash('');
      await refreshMeshState();
      setStatusMessage(`New incident disclosed on-chain and verified: ${submittedCve}.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Failed to disclose incident.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="app-root">
      <Header
        upgraderStatus={upgraderStatus}
        onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)}
      />

      <main className="app-container">
        {!contractConfigured && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠</span>
            <div className="alert-content">
              <strong>Contract Configuration Required</strong>
              <p>
                No GenLayer contract address is configured. Please specify <code>VITE_CONTRACT_ADDRESS</code> in your environment or <code>.env</code> file.
              </p>
            </div>
          </div>
        )}

        <TransactionBanner
          statusMessage={statusMessage}
          errorMessage={errorMessage}
          onDismissError={() => setErrorMessage(null)}
        />

        <IncidentSummary
          incidents={incidents}
          selectedIncident={selectedIncident}
          isLoading={isLoadingMesh}
          onSelectIncident={handleSelectIncident}
        />

        <div className="dashboard-grid">
          <div className="main-col">
            {selectedIncident && (
              <>
                <GraphWorkspace
                  graph={graph}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                  onTriggerTriage={(id) => handleTriageNext(selectedIncident.incident_id, id)}
                  onAcknowledge={(id) => {
                    setAckModalProjectId(id);
                    setAckModalUri('');
                    setAckModalNoteHash('');
                  }}
                  isTriageAllowed={selectedIncident.phase === 'LOCKED'}
                  isAckAllowed={selectedIncident.phase === 'RESPONSE'}
                />

                <UnresolvedDashboard
                  unresolved={unresolved}
                  isClosed={selectedIncident.phase === 'CLOSED'}
                />
              </>
            )}
          </div>

          <div className="side-col">
            <OperationalRail
              incident={selectedIncident}
              graph={graph}
              onOpenGraph={handleOpenGraph}
              onLockGraph={handleLockGraph}
              onBeginResponse={handleBeginResponse}
              onCloseIncident={handleCloseIncident}
              onRegisterProject={handleRegisterProject}
              onAddDependency={handleAddDependency}
              onTriageNext={handleTriageNext}
              onAcknowledgeAction={handleAcknowledgeAction}
              isSubmitting={isSubmitting}
            />

            <ActionQueue
              receipts={receipts}
              onClearReceipts={() => setReceipts([])}
            />
          </div>
        </div>
      </main>

      <Footer />
      <WalletModal />

      {/* Accessible Disclose Incident Modal */}
      {isNewIncidentModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclose-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewIncidentModalOpen(false);
          }}
        >
          <div className="modal-card" ref={discloseModalRef}>
            <div className="modal-header">
              <div>
                <h2 id="disclose-modal-title" className="modal-title">
                  Disclose New Incident
                </h2>
                <p className="modal-subtitle">
                  Initialize consensus coordination for a zero-day or CVE vulnerability.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIsNewIncidentModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncidentSubmit} className="rail-panel">
              <div className="form-group">
                <label htmlFor="new-cve-id" className="form-label">
                  CVE Identifier *
                </label>
                <input
                  ref={firstDiscloseInputRef}
                  id="new-cve-id"
                  type="text"
                  className="input-field"
                  placeholder="e.g. CVE-2024-45216"
                  value={newCveId}
                  onChange={(e) => setNewCveId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-primary-pkg" className="form-label">
                  Primary Affected Package (npm) *
                </label>
                <input
                  id="new-primary-pkg"
                  type="text"
                  className="input-field"
                  placeholder="e.g. express-jwt-guard"
                  value={newPrimaryPkg}
                  onChange={(e) => setNewPrimaryPkg(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-cisa-uri" className="form-label">
                  CISA KEV Reference URI (cisa.gov)
                </label>
                <input
                  id="new-cisa-uri"
                  type="url"
                  className="input-field"
                  placeholder="https://www.cisa.gov/..."
                  value={newCisaUri}
                  onChange={(e) => setNewCisaUri(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-nvd-uri" className="form-label">
                  NVD CVE JSON URI (nvd.nist.gov)
                </label>
                <input
                  id="new-nvd-uri"
                  type="url"
                  className="input-field"
                  placeholder="https://services.nvd.nist.gov/rest/json/cves/2.0?..."
                  value={newNvdUri}
                  onChange={(e) => setNewNvdUri(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-osv-uri" className="form-label">
                  OSV Vulnerability URI (api.osv.dev)
                </label>
                <input
                  id="new-osv-uri"
                  type="url"
                  className="input-field"
                  placeholder="https://api.osv.dev/v1/vulns/..."
                  value={newOsvUri}
                  onChange={(e) => setNewOsvUri(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="new-snapshot-hash" className="form-label">
                    Frozen Snapshot Hash (0x + 64 hex characters) *
                  </label>
                  <input
                    id="new-snapshot-hash"
                    type="text"
                    className="input-field"
                    placeholder="0x..."
                    value={newSnapshotHash}
                    onChange={(e) => setNewSnapshotHash(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="new-deadline" className="form-label">
                    Response Window (Hours)
                  </label>
                  <input
                    id="new-deadline"
                    type="number"
                    min="1"
                    max="720"
                    className="input-field"
                    value={newDeadlineHours}
                    onChange={(e) => setNewDeadlineHours(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={!newCveId || !newPrimaryPkg || !/^0x[0-9a-fA-F]{64}$/.test(newSnapshotHash) || isSubmitting}
              >
                {isSubmitting ? 'Submitting to Studionet…' : 'Disclose Incident On-Chain'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Acknowledge Action Modal */}
      {ackModalProjectId && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ack-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAckModalProjectId(null);
          }}
        >
          <div className="modal-card" ref={ackModalRef}>
            <div className="modal-header">
              <div>
                <h2 id="ack-modal-title" className="modal-title">
                  Acknowledge Action for {ackModalProjectId}
                </h2>
                <p className="modal-subtitle">
                  Submit remediation pull request or patch evidence hash on-chain.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setAckModalProjectId(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedIncident || !ackModalProjectId || !ackModalUri) return;
                let finalHash = ackModalNoteHash.trim();
                if (!finalHash) return;
                if (!finalHash.startsWith('0x')) {
                  finalHash = '0x' + finalHash;
                }
                if (!/^0x[0-9a-fA-F]{64}$/.test(finalHash)) return;
                handleAcknowledgeAction(selectedIncident.incident_id, {
                  projectId: ackModalProjectId,
                  evidenceUri: ackModalUri.trim(),
                  noteHash: finalHash,
                });
              }}
              className="rail-panel"
            >
              <div className="form-group">
                <label htmlFor="ack-evidence-uri" className="form-label">
                  Remediation Evidence URI *
                </label>
                <input
                  ref={firstAckInputRef}
                  id="ack-evidence-uri"
                  type="url"
                  className="input-field"
                  placeholder="https://github.com/org/repo/pull/123"
                  value={ackModalUri}
                  onChange={(e) => setAckModalUri(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ack-note-hash" className="form-label">
                  Note Hash (0x + 64 hex characters) *
                </label>
                <input
                  id="ack-note-hash"
                  type="text"
                  className="input-field"
                  placeholder="0x..."
                  value={ackModalNoteHash}
                  onChange={(e) => setAckModalNoteHash(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={!ackModalUri || isSubmitting}
              >
                {isSubmitting ? 'Submitting to Studionet…' : 'Submit Action Acknowledgement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
