# Verification

## Current checkpoint

This document records pre-deployment evidence only. It does not claim a Studionet deployment, live contract verification, GitHub release, or Vercel release.

- Submission category: `PROJECT`
- Network target: GenLayer Studionet, chain ID `61999`
- Contract: `contracts/critical_dependency_response_mesh.py`
- Deployment classification: `UPGRADABLE`
- Locked Studio deployer/upgrader: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Contract source commit: `1f381646bc81e989621324e527b3659581cb445d`
- Contract source tree: `32ade3d654b009c32d9351f74e9e7b200706df52`
- Contract source SHA-256: `42D03DC49B3D121A1CC0E7B374B2C08CD15A33F3BFD30BD3C4E00AFCAC9BB218`

The immutable anonymous-review package envelope records the exact packaging commit and tree. They are intentionally not embedded here because a Git commit cannot contain its own hash. The source identifiers above bind the unchanged contract implementation reviewed for deployment.

## Independent local verification

Executed on 2026-08-22:

```text
python -m pip check                         PASS — No broken requirements found
genvm-lint contracts/...py                 PASS — 3 checks
python -m pytest -p no:cacheprovider -q    PASS — 29 tests
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

The earlier exact-source deployment at `0xfCe383f4B5554f98cc830dE6EB155E92bA67ba0C` finalized successfully, but live preflight found that the canonical CISA KEV feed exceeded the prior 128 KB application bound. That deployment is superseded and is not a release candidate. A fresh `PRE_DEPLOY` approval and deployment are required for the corrected source above. Studio matrix and live frontend evidence remain incomplete; local and mocked tests do not substitute for those artifacts.

## Known limitations

- The graph is a bounded maintainer-declared npm dependency graph, not an automated SBOM or package scanner.
- External-source availability and freshness constrain triage. Missing or malformed required evidence is recorded as `UNCERTAIN / REVIEW / INSUFFICIENT`.
- Remediation acknowledgement records a URI and note hash; it does not prove that a patch is functionally safe.
- Native upgrade authority is recoverable only while the recorded Studio upgrader account and Studionet state remain available.
