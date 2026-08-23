import { describe, it, expect, vi, beforeEach } from 'vitest';
import { meshTransactions } from '../genlayer/transactions';
import * as clientModule from '../genlayer/client';

describe('MeshTransactionService Protocol and Finality', () => {
  const mockAccount = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const mockContractAddress = '0x1234567890123456789012345678901234567890';
  const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const mockProvider = { request: vi.fn() };

  let mockClient: any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue(mockContractAddress);

    mockClient = {
      writeContract: vi.fn().mockResolvedValue(mockTxHash),
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        statusName: 'FINALIZED',
        resultName: 'SUCCESS',
        txExecutionResultName: 'FINISHED_WITH_RETURN',
        transactionHash: mockTxHash,
      }),
    };

    vi.spyOn(clientModule, 'createGenlayerClient').mockReturnValue(mockClient);
  });

  it('fails closed when contract address is not configured', async () => {
    vi.spyOn(clientModule, 'getContractAddress').mockReturnValue('');
    await expect(
      meshTransactions.openGraph(mockProvider, mockAccount, 1)
    ).rejects.toThrow('Contract address is not configured or invalid');
  });

  it('executes create_incident write and awaits finality', async () => {
    const params = {
      cveId: 'CVE-2024-45216',
      cisaKevUri: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      nvdCveUri: 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2024-45216',
      osvUri: 'https://api.osv.dev/v1/vulns/CVE-2024-45216',
      primaryPackage: 'express-jwt-guard',
      snapshotHash: '0x' + 'a'.repeat(64),
      responseDeadline: 1750000000,
    };

    const receipt = await meshTransactions.createIncident(mockProvider, mockAccount, params);
    expect(receipt.status).toBe('FINALIZED');
    expect(receipt.hash).toBe(mockTxHash);
    expect(receipt.from).toBe(mockAccount);
    expect(receipt.to).toBe(mockContractAddress);

    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'create_incident',
      args: [
        params.cveId,
        params.cisaKevUri,
        params.nvdCveUri,
        params.osvUri,
        params.primaryPackage,
        params.snapshotHash,
        BigInt(params.responseDeadline),
      ],
      value: 0n,
    });
    expect(mockClient.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockTxHash,
      status: 'FINALIZED',
      interval: 2000,
      retries: 60,
    });
  });

  it('accepts the numeric finalized receipt shape returned by live Studionet', async () => {
    mockClient.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 7,
      result: 6,
      txExecutionResult: 1,
    });

    await expect(meshTransactions.openGraph(mockProvider, mockAccount, 1)).resolves.toMatchObject({
      hash: mockTxHash,
      status: 'FINALIZED',
    });
  });

  it('accepts successful execution from the simplified live leader receipt envelope', async () => {
    mockClient.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 7,
      result: 6,
      consensus_data: {
        leader_receipt: [{ execution_result: 'SUCCESS' }],
      },
    });

    await expect(meshTransactions.openGraph(mockProvider, mockAccount, 3)).resolves.toMatchObject({
      hash: mockTxHash,
      status: 'FINALIZED',
    });
  });

  it('executes open_graph write', async () => {
    const receipt = await meshTransactions.openGraph(mockProvider, mockAccount, 1);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'open_graph',
      args: [1n],
      value: 0n,
    });
  });

  it('executes register_project write', async () => {
    const receipt = await meshTransactions.registerProject(mockProvider, mockAccount, 1, {
      projectId: 'auth-svc',
      packageName: 'express-jwt-guard',
      version: '1.2.0',
    });
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'register_project',
      args: [1n, 'auth-svc', 'express-jwt-guard', '1.2.0'],
      value: 0n,
    });
  });

  it('executes add_dependency write', async () => {
    const receipt = await meshTransactions.addDependency(mockProvider, mockAccount, 1, {
      projectId: 'api-gateway',
      dependencyProjectId: 'auth-svc',
    });
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'add_dependency',
      args: [1n, 'api-gateway', 'auth-svc'],
      value: 0n,
    });
  });

  it('executes lock_graph write', async () => {
    const receipt = await meshTransactions.lockGraph(mockProvider, mockAccount, 1);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'lock_graph',
      args: [1n],
      value: 0n,
    });
  });

  it('executes triage_next write', async () => {
    const receipt = await meshTransactions.triageNext(mockProvider, mockAccount, 1, 'auth-svc');
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'triage_next',
      args: [1n, 'auth-svc'],
      value: 0n,
    });
  });

  it('executes begin_response write', async () => {
    const receipt = await meshTransactions.beginResponse(mockProvider, mockAccount, 1);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'begin_response',
      args: [1n],
      value: 0n,
    });
  });

  it('executes acknowledge_action write', async () => {
    const params = {
      projectId: 'auth-svc',
      evidenceUri: 'https://github.com/org/repo/pull/42',
      noteHash: '0x' + 'c'.repeat(64),
    };
    const receipt = await meshTransactions.acknowledgeAction(mockProvider, mockAccount, 1, params);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'acknowledge_action',
      args: [1n, params.projectId, params.evidenceUri, params.noteHash],
      value: 0n,
    });
  });

  it('executes close_incident write', async () => {
    const receipt = await meshTransactions.closeIncident(mockProvider, mockAccount, 1);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'close_incident',
      args: [1n],
      value: 0n,
    });
  });

  it('executes upgrade write', async () => {
    const newCode = new Uint8Array([1, 2, 3, 4]);
    const receipt = await meshTransactions.upgrade(mockProvider, mockAccount, newCode);
    expect(receipt.status).toBe('FINALIZED');
    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: mockContractAddress,
      functionName: 'upgrade',
      args: [newCode],
      value: 0n,
    });
  });

  it('fails closed when finalized consensus reports contract execution error', async () => {
    mockClient.waitForTransactionReceipt.mockResolvedValueOnce({
      statusName: 'FINALIZED',
      resultName: 'SUCCESS',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
    });

    await expect(
      meshTransactions.openGraph(mockProvider, mockAccount, 1)
    ).rejects.toThrow('Contract execution failed');
  });

  it('binds the exact selected EIP-6963 provider to the GenLayer client', async () => {
    await meshTransactions.openGraph(mockProvider, mockAccount, 1);
    expect(clientModule.createGenlayerClient).toHaveBeenCalledWith(
      undefined,
      mockAccount,
      mockProvider
    );
  });

  it('submits at most one write while finality is pending', async () => {
    let releaseReceipt!: () => void;
    mockClient.waitForTransactionReceipt.mockReturnValueOnce(new Promise<void>((resolve) => {
      releaseReceipt = resolve;
    }).then(() => ({
      statusName: 'FINALIZED',
      resultName: 'SUCCESS',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
    })));

    const first = meshTransactions.openGraph(mockProvider, mockAccount, 1);
    await vi.waitFor(() => expect(mockClient.writeContract).toHaveBeenCalledTimes(1));
    await expect(meshTransactions.openGraph(mockProvider, mockAccount, 1)).rejects.toThrow(
      'transaction is already in progress'
    );
    expect(mockClient.writeContract).toHaveBeenCalledTimes(1);
    releaseReceipt();
    await expect(first).resolves.toMatchObject({ status: 'FINALIZED' });
  });
});
