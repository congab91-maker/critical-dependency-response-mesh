# Studionet Deployment and Recovery

## Classification

`CriticalDependencyResponseMesh` is `UPGRADABLE` using GenLayer native root-slot upgraders. The constructor receives one public Studio account address and registers it in `gl.storage.Root.get().upgraders`. The same authorized address may call `upgrade(new_code)`.

The Studio account below is locked for anonymous `PRE_DEPLOY` review. It will serve as both deployer and native upgrader:

`0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`

No deployment or write is authorized before `PRE_DEPLOY` approval. Changing this account invalidates that approval and requires a refreshed review.

## Draft deployment manifest

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract source: `contracts/critical_dependency_response_mesh.py`
- Constructor argument: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Studio account role: deployer + native upgrader
- Linked contracts: none
- Contract address: populated after deployment
- Deployment transaction: populated after deployment
- Explorer link: populated after deployment
- Contract source commit: `1f381646bc81e989621324e527b3659581cb445d`
- Contract source tree: `32ade3d654b009c32d9351f74e9e7b200706df52`
- Contract source SHA-256: `42D03DC49B3D121A1CC0E7B374B2C08CD15A33F3BFD30BD3C4E00AFCAC9BB218`
- Packaging commit/tree: recorded in the immutable PRE_DEPLOY review envelope

## Storage compatibility

Replacement code must preserve the order and types of every persistent storage field. Reordering, removing or changing a storage field requires a separately reviewed migration plan and fresh live verification.

## Superseded deployment

Deployment `0xfCe383f4B5554f98cc830dE6EB155E92bA67ba0C` finalized from the prior reviewed source, but live preflight proved its 128 KB evidence-body bound was smaller than the canonical CISA KEV feed. It is retained only as failure evidence and must not be wired into the frontend or presented as the release deployment.

## Required live checks

After deployment, acceptance requires `FINALIZED`, consensus success, execution success, matching deployer/origin, authoritative contract readback, deployed-source parity and the complete primary-AI-executed Studio matrix. A separate test deployment must be used for the safe upgrade rehearsal.

## Recovery limits and runbook

- If Studio local UI data resets but chain state and the recorded upgrader account remain available, import the contract by address, load the exact recorded source, verify code/source parity and continue through the authorized upgrade path if needed.
- If the recorded Studio upgrader account becomes unavailable, the existing contract may remain readable but its upgrade authority is lost. Deploy a replacement from the recorded source/constructor manifest, rerun the complete Studio matrix and update every frontend/documented address.
- If Studionet state resets, the old address and state are not recoverable. Redeploy from the exact source and manifest, rerun all live tests and update release evidence.

No private key, seed phrase, credential or wallet secret belongs in this repository or evidence package.
