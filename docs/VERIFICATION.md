# Verification

## Current checkpoint

This document records pre-deployment evidence only. It does not claim a Studionet deployment, live contract verification, GitHub release, or Vercel release.

- Submission category: `PROJECT`
- Network target: GenLayer Studionet, chain ID `61999`
- Contract: `contracts/critical_dependency_response_mesh.py`
- Deployment classification: `UPGRADABLE`
- Contract source SHA-256: `3FE9C2F8423CA03CC8ECC021A0E7263F7443C43DF446EC2FA0D264E50DBC3A16`

## Independent local verification

Executed on 2026-08-22:

```text
python -m pip check                         PASS — No broken requirements found
genvm-lint contracts/...py                 PASS — 3 checks
python -m pytest -p no:cacheprovider -q    PASS — 25 tests
npm run typecheck                          PASS — 0 errors
npm run test -- --run                      PASS — 4 files, 28 tests
npm run build                              PASS — production build generated
git diff --check                           PASS
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

Studionet contract address, deployment transaction, Explorer links, Studio matrix and live frontend evidence are intentionally absent until their governed stages. Local and mocked tests do not substitute for those artifacts.

## Known limitations

- The graph is a bounded maintainer-declared npm dependency graph, not an automated SBOM or package scanner.
- External-source availability and freshness constrain triage. Missing or malformed required evidence is recorded as `UNCERTAIN / REVIEW / INSUFFICIENT`.
- Remediation acknowledgement records a URI and note hash; it does not prove that a patch is functionally safe.
- Native upgrade authority is recoverable only while the recorded Studio upgrader account and Studionet state remain available.
