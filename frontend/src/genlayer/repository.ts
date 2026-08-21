import { defaultGenlayerClient, getContractAddress } from './client';
import {
  Incident,
  IncidentGraph,
  IncidentSummary,
  UnresolvedRecord,
  UpgraderStatus,
  LimitsConfig,
  ClaimNode,
  ClaimEdge,
} from './types';

const PHASES = new Set(['DISCLOSED', 'GRAPH_OPEN', 'LOCKED', 'TRIAGED', 'RESPONSE', 'CLOSED']);
const CLASSIFICATIONS = new Set(['', 'AFFECTED', 'UNAFFECTED', 'UNCERTAIN']);
const ACTIONS = new Set(['', 'QUARANTINE', 'REVIEW', 'MONITOR', 'NO_ACTION']);
const IMPACT_KINDS = new Set(['', 'DIRECT', 'TRANSITIVE', 'NONE', 'INSUFFICIENT']);
const CONFIDENCE_BANDS = new Set(['', 'HIGH', 'MEDIUM', 'LOW']);

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function textField(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} must be ${allowEmpty ? 'a string' : 'a non-empty string'}`);
  }
  return value;
}

function numberField(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function boolField(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

function enumField(value: unknown, allowed: Set<string>, label: string): string {
  const parsed = textField(value, label, true);
  if (!allowed.has(parsed)) throw new Error(`${label} has unsupported value: ${parsed}`);
  return parsed;
}

function parseJson(raw: unknown, label: string): unknown {
  if (typeof raw !== 'string' || raw.length === 0) throw new Error(`${label} must be a JSON string`);
  return JSON.parse(raw);
}

export class MeshRepository {
  private ensureContractAddress(): `0x${string}` {
    const address = getContractAddress();
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error(
        'Contract address is not configured or invalid. Please configure VITE_CONTRACT_ADDRESS in your environment.'
      );
    }
    return address as `0x${string}`;
  }

  public async getIncidentCount(): Promise<number> {
    const address = this.ensureContractAddress();
    try {
      const raw = await defaultGenlayerClient.readContract({
        address,
        functionName: 'get_incident_count',
        args: [],
      });
      const count = Number(raw);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid incident count');
      return count;
    } catch (err: any) {
      throw new Error(`Failed to read incident count from contract: ${err?.message || err}`);
    }
  }

  public async getIncident(incidentId: number): Promise<Incident | null> {
    const address = this.ensureContractAddress();
    try {
      const jsonStr = (await defaultGenlayerClient.readContract({
        address,
        functionName: 'get_incident_json',
        args: [BigInt(incidentId)],
      })) as string;

      const data = record(parseJson(jsonStr, 'incident'), 'incident');
      const phase = enumField(data.phase, PHASES, 'incident.phase') as Incident['phase'];

      return {
        incident_id: numberField(data.incident_id, 'incident.incident_id'),
        cve_id: textField(data.cve_id, 'incident.cve_id'),
        cisa_kev_uri: textField(data.cisa_kev_uri, 'incident.cisa_kev_uri'),
        nvd_cve_uri: textField(data.nvd_cve_uri, 'incident.nvd_cve_uri'),
        osv_uri: textField(data.osv_uri, 'incident.osv_uri'),
        primary_package: textField(data.primary_package, 'incident.primary_package'),
        snapshot_hash: textField(data.snapshot_hash, 'incident.snapshot_hash'),
        response_deadline: numberField(data.response_deadline, 'incident.response_deadline'),
        coordinator: textField(data.coordinator, 'incident.coordinator'),
        phase,
        graph_hash: textField(data.graph_hash, 'incident.graph_hash', true),
        project_count: numberField(data.project_count, 'incident.project_count'),
        edge_count: numberField(data.edge_count, 'incident.edge_count'),
        triaged_node_count: numberField(data.triaged_node_count, 'incident.triaged_node_count'),
        unresolved_count: numberField(data.unresolved_count, 'incident.unresolved_count'),
        closed_at: numberField(data.closed_at, 'incident.closed_at'),
      };
    } catch (err: any) {
      throw new Error(`Failed to read incident ${incidentId} from contract: ${err?.message || err}`);
    }
  }

  public async getIncidentSummaries(): Promise<IncidentSummary[]> {
    const count = await this.getIncidentCount();
    if (count === 0) return [];

    const summaries: IncidentSummary[] = [];
    for (let i = 1; i <= count; i++) {
      const inc = await this.getIncident(i);
      if (inc) {
        summaries.push({
          incident_id: inc.incident_id,
          cve_id: inc.cve_id,
          primary_package: inc.primary_package,
          phase: inc.phase,
          response_deadline: inc.response_deadline,
          total_registered_projects: inc.project_count,
          triaged_count: inc.triaged_node_count,
          acknowledged_count: 0,
          unresolved_count: inc.unresolved_count,
        });
      }
    }
    return summaries;
  }

  public async getIncidentGraph(incidentId: number): Promise<IncidentGraph> {
    const address = this.ensureContractAddress();
    try {
      const [projectsJsonStr, edgesJsonStr] = await Promise.all([
        defaultGenlayerClient.readContract({
          address,
          functionName: 'get_projects_json',
          args: [BigInt(incidentId), BigInt(0), BigInt(50)],
        }) as Promise<string>,
        defaultGenlayerClient.readContract({
          address,
          functionName: 'get_edges_json',
          args: [BigInt(incidentId), BigInt(0), BigInt(100)],
        }) as Promise<string>,
      ]);

      const rawProjects = parseJson(projectsJsonStr, 'projects');
      const rawEdges = parseJson(edgesJsonStr, 'edges');
      if (!Array.isArray(rawProjects) || !Array.isArray(rawEdges)) {
        throw new Error('projects and edges views must return JSON arrays');
      }

      const nodes: ClaimNode[] = rawProjects.map((value, index) => {
        const p = record(value, `projects[${index}]`);
        const hasTriage = boolField(p.has_triage, `projects[${index}].has_triage`);
        return {
          project_id: textField(p.project_id, `projects[${index}].project_id`),
          maintainer_address: textField(p.maintainer, `projects[${index}].maintainer`),
          declared_package: textField(p.package_name, `projects[${index}].package_name`),
          declared_version: textField(p.version, `projects[${index}].version`),
          registered_at: numberField(p.registered_at, `projects[${index}].registered_at`),
          has_triage: hasTriage,
          classification: hasTriage ? enumField(p.classification, CLASSIFICATIONS, 'classification') : 'UNASSESSED',
          recommended_action: hasTriage ? enumField(p.action, ACTIONS, 'action') : 'PENDING',
          impact_kind: enumField(p.impact_kind, IMPACT_KINDS, 'impact_kind'),
          confidence_band: enumField(p.confidence_band, CONFIDENCE_BANDS, 'confidence_band'),
          reason_code: textField(p.reason_code, 'reason_code', true),
          triage_notes: textField(p.reason, 'reason', true),
          triaged_at: numberField(p.triaged_at, 'triaged_at'),
          acknowledged: boolField(p.has_acknowledgement, 'has_acknowledgement'),
          acknowledged_at: numberField(p.ack_acknowledged_at, 'ack_acknowledged_at'),
          acknowledgement_caller: textField(p.ack_caller, 'ack_caller', true),
          acknowledgement_uri: textField(p.ack_evidence_uri, 'ack_evidence_uri', true),
          acknowledgement_note_hash: textField(p.ack_note_hash, 'ack_note_hash', true),
        };
      });

      const edges: ClaimEdge[] = rawEdges.map((value, index) => {
        const e = record(value, `edges[${index}]`);
        return {
          from_project: textField(e.from_project_id, `edges[${index}].from_project_id`),
          to_project: textField(e.to_project_id, `edges[${index}].to_project_id`),
        };
      });

      return {
        incident_id: incidentId,
        nodes,
        edges,
      };
    } catch (err: any) {
      throw new Error(`Failed to read graph for incident ${incidentId}: ${err?.message || err}`);
    }
  }

  public async getUnresolvedRecords(incidentId: number): Promise<UnresolvedRecord[]> {
    const address = this.ensureContractAddress();
    try {
      const jsonStr = (await defaultGenlayerClient.readContract({
        address,
        functionName: 'get_unresolved_json',
        args: [BigInt(incidentId)],
      })) as string;

      const raw = parseJson(jsonStr, 'unresolved records');
      if (!Array.isArray(raw)) throw new Error('unresolved records must be a JSON array');
      return raw.map((value, index) => {
        const r = record(value, `unresolved[${index}]`);
        return {
          project_id: textField(r.project_id, `unresolved[${index}].project_id`),
          package_name: textField(r.package_name, `unresolved[${index}].package_name`),
          version: textField(r.version, `unresolved[${index}].version`),
          maintainer: textField(r.maintainer, `unresolved[${index}].maintainer`),
          classification: enumField(r.classification, CLASSIFICATIONS, 'classification'),
          action: enumField(r.action, ACTIONS, 'action'),
          impact_kind: enumField(r.impact_kind, IMPACT_KINDS, 'impact_kind'),
          confidence_band: enumField(r.confidence_band, CONFIDENCE_BANDS, 'confidence_band'),
          reason_code: textField(r.reason_code, 'reason_code'),
          reason: textField(r.reason, 'reason'),
        };
      });
    } catch (err: any) {
      throw new Error(`Failed to read unresolved records for incident ${incidentId}: ${err?.message || err}`);
    }
  }

  public async getUpgraderStatus(): Promise<UpgraderStatus> {
    const address = this.ensureContractAddress();
    try {
      const jsonStr = (await defaultGenlayerClient.readContract({
        address,
        functionName: 'get_upgrade_status_json',
        args: [],
      })) as string;

      const data = record(parseJson(jsonStr, 'upgrade status'), 'upgrade status');
      if (!Array.isArray(data.upgraders) || !data.upgraders.every((v) => typeof v === 'string')) {
        throw new Error('upgrade status upgraders must be a string array');
      }
      return {
        upgraders: data.upgraders,
        code_size_bytes: numberField(data.code_size_bytes, 'upgrade status.code_size_bytes'),
        is_upgradable: boolField(data.is_upgradable, 'upgrade status.is_upgradable'),
      };
    } catch (err: any) {
      throw new Error(`Failed to read upgrader status: ${err?.message || err}`);
    }
  }

  public async getLimits(): Promise<LimitsConfig> {
    const address = this.ensureContractAddress();
    try {
      const jsonStr = (await defaultGenlayerClient.readContract({
        address,
        functionName: 'get_limits_json',
        args: [],
      })) as string;

      const data = record(parseJson(jsonStr, 'limits'), 'limits');
      return {
        max_incidents: numberField(data.max_incidents, 'limits.max_incidents'),
        max_nodes_per_incident: numberField(data.max_nodes_per_incident, 'limits.max_nodes_per_incident'),
        max_edges_per_incident: numberField(data.max_edges_per_incident, 'limits.max_edges_per_incident'),
        max_outgoing_edges_per_node: numberField(data.max_outgoing_edges_per_node, 'limits.max_outgoing_edges_per_node'),
        max_traversal_depth: numberField(data.max_traversal_depth, 'limits.max_traversal_depth'),
        max_uri_length: numberField(data.max_uri_length, 'limits.max_uri_length'),
        max_id_length: numberField(data.max_id_length, 'limits.max_id_length'),
        max_note_hash_length: numberField(data.max_note_hash_length, 'limits.max_note_hash_length'),
      };
    } catch (err: any) {
      throw new Error(`Failed to read contract limits: ${err?.message || err}`);
    }
  }
}

export const meshRepository = new MeshRepository();
