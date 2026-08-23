import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletProvider } from '../wallet/WalletContext';
import { Header } from '../components/Header';
import { IncidentSummary } from '../components/IncidentSummary';
import { GraphWorkspace } from '../components/GraphWorkspace';
import { isResponseWindowElapsed, OperationalRail } from '../components/OperationalRail';
import { UnresolvedDashboard } from '../components/UnresolvedDashboard';
import { Footer } from '../components/Footer';
import { Incident, IncidentGraph, IncidentSummary as IncidentSummaryType } from '../genlayer/types';

const mockIncident: Incident = {
  incident_id: 1,
  cve_id: 'CVE-2024-45216',
  cisa_kev_uri: 'https://cisa.gov/kev',
  nvd_cve_uri: 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2024-45216',
  osv_uri: 'https://api.osv.dev/v1/vulns/CVE-2024-45216',
  primary_package: 'express-jwt-guard',
  snapshot_hash: '0x' + '1'.repeat(64),
  response_deadline: Math.floor(Date.now() / 1000) + 7200,
  coordinator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  phase: 'RESPONSE',
  graph_hash: '0x' + '2'.repeat(64),
  project_count: 2,
  edge_count: 1,
  triaged_node_count: 2,
  unresolved_count: 0,
  closed_at: 0,
};

const mockSummary: IncidentSummaryType = {
  incident_id: 1,
  cve_id: 'CVE-2024-45216',
  primary_package: 'express-jwt-guard',
  phase: 'RESPONSE',
  response_deadline: Math.floor(Date.now() / 1000) + 7200,
  total_registered_projects: 2,
  triaged_count: 2,
  acknowledged_count: 1,
  unresolved_count: 0,
};

const mockGraph: IncidentGraph = {
  incident_id: 1,
  nodes: [
    {
      project_id: 'auth-svc',
      maintainer_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      declared_package: 'express-jwt-guard',
      declared_version: '1.2.0',
      registered_at: 500,
      has_triage: true,
      classification: 'AFFECTED',
      recommended_action: 'QUARANTINE',
      impact_kind: 'DIRECT',
      confidence_band: 'HIGH',
      reason_code: 'DIRECT_SEMVER_MATCH',
      triage_notes: 'Urgent quarantine required.',
      triaged_at: 1000,
      acknowledged: false,
      acknowledged_at: 0,
      acknowledgement_caller: '',
      acknowledgement_uri: '',
      acknowledgement_note_hash: '',
    },
    {
      project_id: 'api-svc',
      maintainer_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      declared_package: 'api-proxy-core',
      declared_version: '1.0.0',
      registered_at: 600,
      has_triage: true,
      classification: 'AFFECTED',
      recommended_action: 'REVIEW',
      impact_kind: 'TRANSITIVE_DEPENDENCY_RISK',
      confidence_band: 'MEDIUM',
      reason_code: 'TRANSITIVE_PATH_FOUND',
      triage_notes: 'Review dependency connection.',
      triaged_at: 1100,
      acknowledged: true,
      acknowledged_at: 1200,
      acknowledgement_caller: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      acknowledgement_uri: 'https://github.com/org/api-svc/pull/1',
      acknowledgement_note_hash: '0x' + '3'.repeat(64),
    },
  ],
  edges: [
    {
      from_project: 'api-svc',
      to_project: 'auth-svc',
    },
  ],
};

describe('Frontend UI Components', () => {
  it('shows a truthful loading state before finalized incident reads complete', () => {
    render(
      <IncidentSummary
        incidents={[]}
        selectedIncident={null}
        isLoading
        onSelectIncident={() => undefined}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading finalized incident state from GenLayer Studionet'
    );
    expect(screen.queryByText(/No active incident selected/i)).not.toBeInTheDocument();
  });

  it('renders Header with native upgrader status', () => {
    const handleOpenModal = vi.fn();
    render(
      <WalletProvider>
        <Header
          upgraderStatus={{
            upgraders: ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
            code_size_bytes: 4096,
            is_upgradable: true,
          }}
          onOpenNewIncidentModal={handleOpenModal}
        />
      </WalletProvider>
    );

    expect(screen.getByText('Critical Dependency Response Mesh')).toBeInTheDocument();
    expect(screen.getByText('Native Upgradable (1 upgrader)')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('renders IncidentSummary with metrics and evidence links', () => {
    const onSelect = vi.fn();
    render(
      <IncidentSummary
        incidents={[mockSummary]}
        selectedIncident={mockIncident}
        onSelectIncident={onSelect}
      />
    );

    expect(screen.getByRole('heading', { name: /CVE-2024-45216/ })).toBeInTheDocument();
    expect(screen.getByText('Registered Projects')).toBeInTheDocument();
    expect(screen.getByText('AI Consensus Triaged')).toBeInTheDocument();
    expect(screen.getByText('CISA KEV Reference:')).toBeInTheDocument();
  });

  it('renders GraphWorkspace in visual mode and switches to accessible table mode', () => {
    const onSelectNode = vi.fn();
    render(
      <GraphWorkspace
        graph={mockGraph}
        selectedNodeId="auth-svc"
        onSelectNode={onSelectNode}
      />
    );

    expect(screen.getByText('Dependency Claim Graph')).toBeInTheDocument();
    expect(
      screen.getByText('2 registered project nodes, 1 declared dependency edges')
    ).toBeInTheDocument();
    expect(screen.getByText('Visual Graph')).toBeInTheDocument();
    expect(screen.getByText('Accessible Table')).toBeInTheDocument();

    // Inspector shows selected node heading
    expect(screen.getByRole('heading', { name: 'auth-svc' })).toBeInTheDocument();
    expect(screen.getByText('Action: QUARANTINE')).toBeInTheDocument();

    // Toggle to accessible table
    fireEvent.click(screen.getByText('Accessible Table'));
    expect(
      screen.getByRole('table', { name: 'Registered dependency claims table' })
    ).toBeInTheDocument();
  });

  it('renders UnresolvedDashboard with active records', () => {
    render(
      <UnresolvedDashboard
        unresolved={[
          {
            project_id: 'auth-svc',
            package_name: 'express-jwt-guard',
            version: '1.2.0',
            maintainer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            classification: 'AFFECTED',
            action: 'QUARANTINE',
            impact_kind: 'DIRECT',
            confidence_band: 'HIGH',
            reason_code: 'DIRECT_SEMVER_MATCH',
            reason: 'Urgent quarantine required.',
          },
        ]}
        isClosed={false}
      />
    );

    expect(screen.getByText('Unresolved Incident Ledger')).toBeInTheDocument();
    expect(screen.getByText('1 Unresolved Project')).toBeInTheDocument();
    expect(screen.getByText('auth-svc')).toBeInTheDocument();
  });

  it('renders OperationalRail with lifecycle controls', () => {
    const onOpenGraph = vi.fn();
    const onLockGraph = vi.fn();
    const onBeginResponse = vi.fn();
    const onCloseIncident = vi.fn();
    const onRegisterProject = vi.fn();
    const onAddDependency = vi.fn();
    const onTriageNext = vi.fn();
    const onAcknowledgeAction = vi.fn();

    render(
      <WalletProvider>
        <OperationalRail
          incident={{ ...mockIncident, phase: 'TRIAGED' }}
          graph={mockGraph}
          onOpenGraph={onOpenGraph}
          onLockGraph={onLockGraph}
          onBeginResponse={onBeginResponse}
          onCloseIncident={onCloseIncident}
          onRegisterProject={onRegisterProject}
          onAddDependency={onAddDependency}
          onTriageNext={onTriageNext}
          onAcknowledgeAction={onAcknowledgeAction}
          isSubmitting={false}
        />
      </WalletProvider>
    );

    expect(screen.getByText('Operational Rail')).toBeInTheDocument();
  });

  it('allows closure only when the response deadline has elapsed', () => {
    expect(isResponseWindowElapsed(1_000, 999_999)).toBe(false);
    expect(isResponseWindowElapsed(1_000, 1_000_000)).toBe(true);
  });

  it('renders Footer with GenLayer Studionet details', () => {
    render(<Footer />);
    expect(screen.getByText('Target Network:')).toBeInTheDocument();
    expect(screen.getByText('GenLayer Studionet (61999)')).toBeInTheDocument();
    expect(screen.getByText('3-Source Official LLM Triage (CISA / NVD / OSV)')).toBeInTheDocument();
  });
});
