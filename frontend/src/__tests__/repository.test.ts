import { describe, it, expect, vi, beforeEach } from 'vitest';
import { meshRepository } from '../genlayer/repository';
import * as clientModule from '../genlayer/client';

describe('MeshRepository Protocol and View Parsing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fails closed and throws actionable error when contract address is unset', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue('');
    await expect(meshRepository.getIncidentCount()).rejects.toThrow(
      'Contract address is not configured or invalid'
    );
  });

  it('parses incident count from contract view', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract').mockResolvedValueOnce(3n as any);

    const count = await meshRepository.getIncidentCount();
    expect(count).toBe(3);
    expect(clientModule.defaultGenlayerClient.readContract).toHaveBeenCalledWith({
      address: '0x1234567890123456789012345678901234567890',
      functionName: 'get_incident_count',
      args: [],
    });
  });

  it('retries transient RPC read failures before surfacing an error', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract')
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce(3n as any);

    await expect(meshRepository.getIncidentCount()).resolves.toBe(3);
    expect(clientModule.defaultGenlayerClient.readContract).toHaveBeenCalledTimes(2);
  });

  it('parses get_incident_json correctly into typed Incident', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    const mockJson = JSON.stringify({
      incident_id: 1,
      cve_id: 'CVE-2024-45216',
      cisa_kev_uri: 'https://cisa.gov/kev',
      nvd_cve_uri: 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2024-45216',
      osv_uri: 'https://api.osv.dev/v1/vulns/CVE-2024-45216',
      primary_package: 'express-jwt-guard',
      snapshot_hash: '0x' + 'a'.repeat(64),
      response_deadline: 1750000000,
      coordinator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      phase: 'RESPONSE',
      graph_hash: '0x' + 'b'.repeat(64),
      project_count: 3,
      edge_count: 2,
      triaged_node_count: 3,
      unresolved_count: 1,
      closed_at: 0,
    });
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract').mockResolvedValueOnce(mockJson as any);

    const inc = await meshRepository.getIncident(1);
    expect(inc).not.toBeNull();
    expect(inc?.cve_id).toBe('CVE-2024-45216');
    expect(inc?.primary_package).toBe('express-jwt-guard');
    expect(inc?.phase).toBe('RESPONSE');
    expect(inc?.project_count).toBe(3);
  });

  it('rejects malformed contract JSON instead of coercing it', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract').mockResolvedValueOnce(
      JSON.stringify({ incident_id: '1', phase: 'RESPONSE' }) as any
    );

    await expect(meshRepository.getIncident(1)).rejects.toThrow(
      'incident.incident_id must be a non-negative safe integer'
    );
  });

  it('parses get_projects_json and get_edges_json into IncidentGraph', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    const mockProjectsJson = JSON.stringify([
      {
        project_id: 'auth-gateway-svc',
        package_name: 'express-jwt-guard',
        version: '1.2.0',
        maintainer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        registered_at: 1000,
        has_triage: true,
        classification: 'AFFECTED',
        action: 'QUARANTINE',
        impact_kind: 'DIRECT',
        confidence_band: 'HIGH',
        reason_code: 'DIRECT_SEMVER_MATCH',
        reason: 'Consensus verified vulnerability match.',
        triaged_at: 1100,
        has_acknowledgement: false,
        ack_caller: '',
        ack_evidence_uri: '',
        ack_note_hash: '',
        ack_acknowledged_at: 0,
      },
    ]);
    const mockEdgesJson = JSON.stringify([
      {
        from_project_id: 'api-proxy-core',
        to_project_id: 'auth-gateway-svc',
        package_spec: '',
      },
    ]);

    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract')
      .mockResolvedValueOnce(mockProjectsJson as any)
      .mockResolvedValueOnce(mockEdgesJson as any);

    const graph = await meshRepository.getIncidentGraph(1);
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].project_id).toBe('auth-gateway-svc');
    expect(graph.nodes[0].classification).toBe('AFFECTED');
    expect(graph.nodes[0].recommended_action).toBe('QUARANTINE');
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].from_project).toBe('api-proxy-core');
    expect(graph.edges[0].to_project).toBe('auth-gateway-svc');
  });

  it('parses get_unresolved_json correctly', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    const mockUnresolvedJson = JSON.stringify([
      {
        project_id: 'auth-gateway-svc',
        package_name: 'express-jwt-guard',
        version: '1.2.0',
        maintainer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        classification: 'AFFECTED',
        action: 'QUARANTINE',
        impact_kind: 'DIRECT',
        confidence_band: 'HIGH',
        reason_code: 'DIRECT_SEMVER_MATCH',
        reason: 'Consensus verified vulnerability match.',
      },
    ]);
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract').mockResolvedValueOnce(mockUnresolvedJson as any);

    const unresolved = await meshRepository.getUnresolvedRecords(1);
    expect(unresolved.length).toBe(1);
    expect(unresolved[0].project_id).toBe('auth-gateway-svc');
    expect(unresolved[0].classification).toBe('AFFECTED');
  });

  it('parses get_upgrade_status_json correctly', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(
      '0x1234567890123456789012345678901234567890'
    );
    const mockUpgradeJson = JSON.stringify({
      upgraders: ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
      code_size_bytes: 4096,
      is_upgradable: true,
    });
    vi.spyOn(clientModule.defaultGenlayerClient, 'readContract').mockResolvedValueOnce(mockUpgradeJson as any);

    const status = await meshRepository.getUpgraderStatus();
    expect(status.is_upgradable).toBe(true);
    expect(status.upgraders.length).toBe(1);
    expect(status.code_size_bytes).toBe(4096);
  });
});
