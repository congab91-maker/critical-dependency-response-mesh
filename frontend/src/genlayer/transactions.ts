import { createGenlayerClient, getContractAddress } from './client';
import { TransactionReceipt } from './types';
import type { EIP1193Provider } from '../wallet/eip6963';
import { TransactionStatus, type Hash } from 'genlayer-js/types';

export interface CreateIncidentParams {
  cveId: string;
  cisaKevUri: string;
  nvdCveUri: string;
  osvUri: string;
  primaryPackage: string;
  snapshotHash: string;
  responseDeadline: number;
}

export interface RegisterProjectParams {
  projectId: string;
  packageName: string;
  version: string;
}

export interface AddDependencyParams {
  projectId: string;
  dependencyProjectId: string;
}

export interface AcknowledgeActionParams {
  projectId: string;
  evidenceUri: string;
  noteHash: string;
}

export class MeshTransactionService {
  private ensureContractAddress(): `0x${string}` {
    const address = getContractAddress();
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error(
        'Contract address is not configured or invalid. Please configure VITE_CONTRACT_ADDRESS in your environment.'
      );
    }
    return address as `0x${string}`;
  }

  private async executeContractWrite(
    provider: EIP1193Provider,
    account: string,
    functionName: string,
    args: any[]
  ): Promise<TransactionReceipt> {
    const contractAddress = this.ensureContractAddress();
    if (!account || !account.startsWith('0x')) {
      throw new Error('Valid connected wallet account address is required to execute transactions.');
    }

    try {
      const client = createGenlayerClient(undefined, account, provider);
      const txHash = (await client.writeContract({
        address: contractAddress,
        functionName,
        args,
        value: 0n,
      })) as `0x${string}`;

      if (!txHash) {
        throw new Error('Write contract invocation did not return a transaction hash.');
      }

      // Await finality receipt from GenLayer consensus
      const receipt = await client.waitForTransactionReceipt({
        hash: txHash as Hash,
        status: TransactionStatus.FINALIZED,
        interval: 2000,
        retries: 60,
      });

      const finalizedStatus = receipt.statusName ?? receipt.status;
      if (String(finalizedStatus) !== 'FINALIZED' && String(finalizedStatus) !== '7') {
        throw new Error(`Transaction did not finalize (status: ${String(finalizedStatus)})`);
      }
      const consensusResult = receipt.resultName ?? receipt.result;
      if (!['SUCCESS', 'AGREE', 'MAJORITY_AGREE', '1', '6'].includes(String(consensusResult))) {
        throw new Error(`Consensus result was not successful (result: ${String(consensusResult)})`);
      }
      const receiptEnvelope = receipt as any;
      const leaderReceipt = receiptEnvelope.consensus_data?.leader_receipt?.[0];
      const executionResult =
        receipt.txExecutionResultName ??
        receipt.txExecutionResult ??
        leaderReceipt?.execution_result ??
        leaderReceipt?.genvm_result;
      if (!['SUCCESS', 'FINISHED_WITH_RETURN', '1'].includes(String(executionResult))) {
        throw new Error(
          `Contract execution failed (execution: ${String(executionResult)})`
        );
      }

      return {
        hash: txHash,
        status: 'FINALIZED',
        from: account,
        to: contractAddress,
      };
    } catch (err: any) {
      const msg = err?.message || 'Transaction submission failed.';
      throw new Error(`Write failed for ${functionName}: ${msg}`);
    }
  }

  public async createIncident(
    provider: EIP1193Provider,
    account: string,
    params: CreateIncidentParams
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'create_incident', [
      params.cveId,
      params.cisaKevUri,
      params.nvdCveUri,
      params.osvUri,
      params.primaryPackage,
      params.snapshotHash,
      BigInt(params.responseDeadline),
    ]);
  }

  public async openGraph(
    provider: EIP1193Provider,
    account: string,
    incidentId: number
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'open_graph', [BigInt(incidentId)]);
  }

  public async registerProject(
    provider: EIP1193Provider,
    account: string,
    incidentId: number,
    params: RegisterProjectParams
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'register_project', [
      BigInt(incidentId),
      params.projectId,
      params.packageName,
      params.version,
    ]);
  }

  public async addDependency(
    provider: EIP1193Provider,
    account: string,
    incidentId: number,
    params: AddDependencyParams
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'add_dependency', [
      BigInt(incidentId),
      params.projectId,
      params.dependencyProjectId,
    ]);
  }

  public async lockGraph(
    provider: EIP1193Provider,
    account: string,
    incidentId: number
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'lock_graph', [BigInt(incidentId)]);
  }

  public async triageNext(
    provider: EIP1193Provider,
    account: string,
    incidentId: number,
    projectId: string
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'triage_next', [BigInt(incidentId), projectId]);
  }

  public async beginResponse(
    provider: EIP1193Provider,
    account: string,
    incidentId: number
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'begin_response', [BigInt(incidentId)]);
  }

  public async acknowledgeAction(
    provider: EIP1193Provider,
    account: string,
    incidentId: number,
    params: AcknowledgeActionParams
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'acknowledge_action', [
      BigInt(incidentId),
      params.projectId,
      params.evidenceUri,
      params.noteHash,
    ]);
  }

  public async closeIncident(
    provider: EIP1193Provider,
    account: string,
    incidentId: number
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'close_incident', [BigInt(incidentId)]);
  }

  public async upgrade(
    provider: EIP1193Provider,
    account: string,
    newCode: Uint8Array
  ): Promise<TransactionReceipt> {
    return this.executeContractWrite(provider, account, 'upgrade', [newCode]);
  }
}

export const meshTransactions = new MeshTransactionService();
