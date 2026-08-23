# Studionet Deployment and Recovery

## Classification

`CriticalDependencyResponseMesh` is `UPGRADABLE` using GenLayer native root-slot upgraders. The constructor receives one public Studio account address and registers it in `gl.storage.Root.get().upgraders`. The same authorized address may call `upgrade(new_code)`.

The Studio account below is locked for anonymous `PRE_DEPLOY` review. It will serve as both deployer and native upgrader:

`0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`

The exact source package received anonymous `PRE_DEPLOY: APPROVED` before the deployment below. Changing this account or the contract source invalidates that approval and requires a refreshed review.

## Deployment manifest

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract source: `contracts/critical_dependency_response_mesh.py`
- Constructor argument: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Studio account role: deployer + native upgrader
- Linked contracts: none
- Contract address: `0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`
- Deployment transaction: `0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f`
- Explorer: `https://explorer-studio.genlayer.com/address/0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`
- Contract source commit: `93cd81cd463d31226a2d9c9433d5695fc4fdace9`
- Contract source tree: `1810e0dab5614a78ad109e18f43861029f4fc52a`
- Contract source SHA-256: `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`
- Packaging commit/tree: recorded in the immutable PRE_DEPLOY review envelope

The deployment is `FINALIZED / MAJORITY_AGREE / SUCCESS`; deployed source readback is 68,518 bytes and matches the SHA-256 above. The primary deployment was not upgraded during testing.

## Storage compatibility

Replacement code must preserve the order and types of every persistent storage field. Reordering, removing or changing a storage field requires a separately reviewed migration plan and fresh live verification.

## Superseded deployment

Deployment `0xfCe383f4B5554f98cc830dE6EB155E92bA67ba0C` finalized from the prior reviewed source, but live preflight proved its 128 KB evidence-body bound was smaller than the canonical CISA KEV feed. It is retained only as failure evidence and must not be wired into the frontend or presented as the release deployment.

Deployment `0xaE316A924E2B66445E7c703A48F5a3c967Cde07E` finalized from the next reviewed source, but live `lock_graph` proved raw NVD/OSV response-byte hashing could not reach validator consensus because transport serialization changes between requests. It is also retained only as failure evidence and must not be wired into the frontend or presented as the release deployment.

## Live acceptance and isolated upgrade rehearsal

The primary-AI Studio matrix completed lifecycle, authorization, replay, deadline, dependency-cycle, evidence-insufficiency, direct exposure, transitive/safe outcome and frozen-unresolved-cohort checks. Exact transactions and readbacks are recorded in `docs/VERIFICATION.md`.

Upgrade rehearsal used only the isolated deployment `0x7864D0551a3C90448170C039CB566f1DbB37C3b7` (deploy transaction `0x37d26ced4c1db7d8a53b13c79a08d0a356b1d4e28e5ebb83a64fd36de89de2c2`). The locked upgrader submitted the exact 68,518 source bytes through `upgrade(new_code)` in transaction `0xbe7b6454acf11e95310b33f3ed6fa6a87b58b79d5f6c97f5d83fb3d800bfcde4`; it finalized with successful consensus/execution and post-upgrade code SHA-256 `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`. Unauthorized transaction `0x126d1533ed6b7fbf43b7d1e51dca1bc70945011e343afb319c7dfdc9d9f19318` rolled back with `Unauthorized upgrader`; source hash, size and upgrader readback remained unchanged.

## Recovery limits and runbook

- If Studio local UI data resets but chain state and the recorded upgrader account remain available, import the contract by address, load the exact recorded source, verify code/source parity and continue through the authorized upgrade path if needed.
- If the recorded Studio upgrader account becomes unavailable, the existing contract may remain readable but its upgrade authority is lost. Deploy a replacement from the recorded source/constructor manifest, rerun the complete Studio matrix and update every frontend/documented address.
- If Studionet state resets, the old address and state are not recoverable. Redeploy from the exact source and manifest, rerun all live tests and update release evidence.

No private key, seed phrase, credential or wallet secret belongs in this repository or evidence package.
