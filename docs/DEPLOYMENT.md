# Studionet Deployment and Recovery

## Classification

`CriticalDependencyResponseMesh` is `UPGRADABLE` using GenLayer native root-slot upgraders. The constructor receives one public Studio account address and registers it in `gl.storage.Root.get().upgraders`. The same authorized address may call `upgrade(new_code)`.

The intended Studio deployer/upgrader public address must be selected and locked before anonymous `PRE_DEPLOY` review. No deployment or write is authorized before that approval.

## Draft deployment manifest

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract source: `contracts/critical_dependency_response_mesh.py`
- Constructor argument: selected Studio upgrader public address
- Linked contracts: none
- Contract address: populated after deployment
- Deployment transaction: populated after deployment
- Explorer link: populated after deployment
- Exact Git commit and source SHA-256: locked in the PRE_DEPLOY package

## Storage compatibility

Replacement code must preserve the order and types of every persistent storage field. Reordering, removing or changing a storage field requires a separately reviewed migration plan and fresh live verification.

## Required live checks

After deployment, acceptance requires `FINALIZED`, consensus success, execution success, matching deployer/origin, authoritative contract readback, deployed-source parity and the complete user-executed Studio matrix. A separate test deployment must be used for the safe upgrade rehearsal.

## Recovery limits and runbook

- If Studio local UI data resets but chain state and the recorded upgrader account remain available, import the contract by address, load the exact recorded source, verify code/source parity and continue through the authorized upgrade path if needed.
- If the recorded Studio upgrader account becomes unavailable, the existing contract may remain readable but its upgrade authority is lost. Deploy a replacement from the recorded source/constructor manifest, rerun the complete Studio matrix and update every frontend/documented address.
- If Studionet state resets, the old address and state are not recoverable. Redeploy from the exact source and manifest, rerun all live tests and update release evidence.

No private key, seed phrase, credential or wallet secret belongs in this repository or evidence package.
