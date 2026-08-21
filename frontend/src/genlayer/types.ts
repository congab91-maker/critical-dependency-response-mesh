export type IncidentPhase =
  | 'DISCLOSED'
  | 'GRAPH_OPEN'
  | 'LOCKED'
  | 'TRIAGED'
  | 'RESPONSE'
  | 'CLOSED';

export type NodeClassification =
  | 'UNASSESSED'
  | 'AFFECTED'
  | 'UNAFFECTED'
  | 'UNCERTAIN';

export type RecommendedAction =
  | 'PENDING'
  | 'QUARANTINE'
  | 'REVIEW'
  | 'MONITOR'
  | 'NO_ACTION';

export interface IncidentSummary {
  incident_id: number;
  cve_id: string;
  primary_package: string;
  phase: IncidentPhase;
  response_deadline: number;
  total_registered_projects: number;
  triaged_count: number;
  acknowledged_count: number;
  unresolved_count: number;
}

export interface Incident {
  incident_id: number;
  cve_id: string;
  cisa_kev_uri: string;
  nvd_cve_uri: string;
  osv_uri: string;
  primary_package: string;
  snapshot_hash: string;
  response_deadline: number;
  coordinator: string;
  phase: IncidentPhase;
  graph_hash: string;
  project_count: number;
  edge_count: number;
  triaged_node_count: number;
  unresolved_count: number;
  closed_at: number;
}

export interface ClaimNode {
  project_id: string;
  maintainer_address: string;
  declared_package: string;
  declared_version: string;
  registered_at: number;
  has_triage: boolean;
  classification: string;
  recommended_action: string;
  impact_kind: string;
  confidence_band: string;
  reason_code: string;
  triage_notes: string;
  triaged_at: number;
  acknowledged: boolean;
  acknowledged_at: number;
  acknowledgement_caller: string;
  acknowledgement_uri: string;
  acknowledgement_note_hash: string;
}

export interface ClaimEdge {
  from_project: string;
  to_project: string;
  package_spec?: string;
}

export interface IncidentGraph {
  incident_id: number;
  nodes: ClaimNode[];
  edges: ClaimEdge[];
}

export interface UnresolvedRecord {
  project_id: string;
  package_name: string;
  version: string;
  maintainer: string;
  classification: string;
  action: string;
  impact_kind: string;
  confidence_band: string;
  reason_code: string;
  reason: string;
}

export interface UpgraderStatus {
  upgraders: string[];
  code_size_bytes: number;
  is_upgradable: boolean;
}

export interface LimitsConfig {
  max_incidents: number;
  max_nodes_per_incident: number;
  max_edges_per_incident: number;
  max_outgoing_edges_per_node: number;
  max_traversal_depth: number;
  max_uri_length: number;
  max_id_length: number;
  max_note_hash_length: number;
}

export interface TransactionReceipt {
  hash: string;
  status: 'FINALIZED' | 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'UNDETERMINED';
  from?: string;
  to?: string;
  error?: string;
}
