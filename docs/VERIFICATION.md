# Verification

## Current checkpoint

This document records the corrected deployment and the current paused `POST_DEPLOY_TEST` checkpoint. It does not claim completion of the Studio matrix, live frontend verification, GitHub release, or Vercel release.

- Submission category: `PROJECT`
- Network target: GenLayer Studionet, chain ID `61999`
- Contract: `contracts/critical_dependency_response_mesh.py`
- Deployment classification: `UPGRADABLE`
- Locked Studio deployer/upgrader: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Contract source commit: `93cd81cd463d31226a2d9c9433d5695fc4fdace9`
- Contract source tree: `1810e0dab5614a78ad109e18f43861029f4fc52a`
- Contract source SHA-256: `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`

The immutable anonymous-review package envelope records the exact packaging commit and tree. They are intentionally not embedded here because a Git commit cannot contain its own hash. The source identifiers above bind the unchanged contract implementation reviewed for deployment.

## Independent local verification

Executed on 2026-08-23:

```text
python -m pip check                         PASS — No broken requirements found
genvm-lint contracts/...py                 PASS — 3 checks
python -m pytest -p no:cacheprovider -q    PASS — 30 tests
npm run typecheck                          PASS — 0 errors
npm run test -- --run                      PASS — 4 files, 28 tests
npm run build                              PASS — production build generated
git diff --check                           PASS
git status --porcelain                     PASS — clean when the review package was created
```

The Vite build reports one non-blocking bundle-size warning for the GenLayer/viem client bundle. No runtime dependency is installed to suppress it.

## Browser verification

Local browser inspection confirmed:

- missing contract configuration produces a visible blocking error and no synthetic incident/safety result;
- disclosure modal receives initial focus, hides the background from assistive technology, closes with Escape, and restores trigger focus;
- wallet connect opens an explicit chooser advertising only MetaMask, OKX Wallet and Rabby;
- with no supported injected provider, the chooser reports that state without initiating a connection;
- a reload starts disconnected.

## Live evidence status

The previous anonymous review returned `PRE_DEPLOY: APPROVED` for packaging commit `6b2cfdf7f75d29a03920a8ef49c327d62a6c1eb4`, tree `b1b6fa6badea8c551cd9cdbf95a001d6decdeb79`. Live testing subsequently invalidated that package; a refreshed `PRE_DEPLOY` review is required for the source identifiers above.

Superseded Studionet deployment:

- Contract: `0xaE316A924E2B66445E7c703A48F5a3c967Cde07E`
- Deployment transaction: `0x2a12303ab696fc41d66008b8c6db59c6420265420f1915ac85de06077520184e`
- Deployer/upgrader: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Receipt: `FINALIZED`
- Consensus: `MAJORITY_AGREE`
- Leader execution: `SUCCESS`
- Validator votes observed: `IDLE, AGREE, AGREE, IDLE, AGREE`
- Deployed code size: `67700` characters
- Deployed code SHA-256: exact match to the superseded source `42D03DC49B3D121A1CC0E7B374B2C08CD15A33F3BFD30BD3C4E00AFCAC9BB218`
- `get_limits_json`: CISA `2097152`, NVD `262144`, OSV `262144`
- `get_upgrade_status_json`: upgradable, recorded upgrader matches the locked account

Live transaction `0x9b754b1ae85c67c9b0631425de211265a44706497d20635be12f729056387a01` proved that raw response-byte hashing could not reach consensus: NVD emits a fresh top-level response `timestamp` and OSV may serialize semantically identical JSON differently per request. The transaction ended `UNDETERMINED / MAJORITY_DISAGREE`, leader execution `ERROR`, and authoritative graph state remained `GRAPH_OPEN`. The new source canonicalizes all three JSON documents and excludes only NVD's transport-level top-level `timestamp`; a regression test proves semantically identical NVD/OSV responses now lock successfully. The deployment at `0xaE316A924E2B66445E7c703A48F5a3c967Cde07E` is therefore superseded and must not be wired into the release frontend.

The earlier deployment at `0xfCe383f4B5554f98cc830dE6EB155E92bA67ba0C` also remains superseded because its 128 KB evidence-body bound was smaller than the canonical CISA KEV feed.

The primary-AI Studio matrix is not complete and no `POST_DEPLOY_TEST` verdict has been requested. The partial matrix on the superseded deployment created incident `1`, five isolated project nodes and three dependency edges using project-specific maintainer accounts, but it is retained only as failure evidence. A fresh anonymous `PRE_DEPLOY` approval, fresh deployment and complete matrix are required for the current source. Local and mocked tests do not substitute for those live artifacts.

## Known limitations

- The graph is a bounded maintainer-declared npm dependency graph, not an automated SBOM or package scanner.
- External-source availability and freshness constrain triage. Missing or malformed required evidence is recorded as `UNCERTAIN / REVIEW / INSUFFICIENT`.
- Remediation acknowledgement records a URI and note hash; it does not prove that a patch is functionally safe.
- Native upgrade authority is recoverable only while the recorded Studio upgrader account and Studionet state remain available.
