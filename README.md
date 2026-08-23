# Critical Dependency Response Mesh

An Intelligent Contract coordination mesh that turns public vulnerability evidence and maintainer-declared dependency claims into consensus-backed incident triage and an immutable response ledger on GenLayer Studionet.

## Verified links

- **Studionet contract:** [`0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`](https://explorer-studio.genlayer.com/address/0x671Fe675c98690068f822a6a51DA7c639CAC0ce3)
- **Deployment transaction:** [`0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f`](https://explorer-studio.genlayer.com/tx/0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f)
- **Verification evidence:** [`docs/VERIFICATION.md`](docs/VERIFICATION.md)
- **Live app:** pending publication and mandatory user-executed wallet E2E; no live URL is claimed yet

## Trust problem

During a critical open-source vulnerability, downstream maintainers cannot safely rely on upstream self-reporting alone, while one registry or scanner should not unilaterally decide the incident outcome. Maintainers may omit dependency edges, overstate a fixed version, or delay acknowledging remediation. The contract makes every claim attributable to an address, freezes the declared graph and public evidence snapshot, and records validator-consensus triage and response status on-chain.

The graph remains a maintainer-declared claim graph—not an automated SBOM—and acknowledgement records evidence of action rather than proving that a patch is functionally safe.

## Why GenLayer is essential

Validators fetch three public sources that a deterministic contract cannot evaluate alone: CISA KEV for exploitation status, NVD CVE 2.0 for CVE identity and descriptions, and OSV for affected/fixed npm SemVer ranges. They validate a frozen canonical-JSON snapshot, traverse the bounded dependency graph, and agree on the normalized consequence recorded for each project.

Evidence failure never defaults to safety. Missing, malformed, changed, rate-limited, or insufficient evidence maps to `UNCERTAIN / REVIEW / INSUFFICIENT`. Consensus results drive consequential on-chain transitions, remediation acknowledgement eligibility, and the final unresolved cohort.

## How it works

1. A coordinator discloses a CVE with canonical source URLs, vulnerable package, snapshot hash, and response deadline.
2. Maintainers register project/version claims and dependency edges while the graph is open.
3. The coordinator locks the graph only after validators reproduce the frozen evidence digest.
4. Any caller can trigger project triage; validators classify direct and transitive exposure until every node is processed.
5. The coordinator opens response; each registered maintainer can acknowledge only its own project with a public remediation URI and note hash.
6. At or after the deadline, the coordinator closes the incident and freezes every unacknowledged affected project in the unresolved cohort.

The frontend exposes each phase's applicable controls, graph visualization, and an accessible table. Wallet connection always begins with an explicit MetaMask, OKX Wallet or Rabby selector.

## Architecture

- **Intelligent Contract:** `contracts/critical_dependency_response_mesh.py` is the sole authority for actors, lifecycle, graph claims, evidence digest, triage records, acknowledgements and closure.
- **Frontend:** React 19, TypeScript and Vite in `frontend/`; reads contract state and submits wallet-signed writes through `genlayer-js 1.1.8`.
- **Wallet discovery:** strict EIP-6963 discovery for MetaMask, OKX Wallet and Rabby only; no default provider or silent account request.
- **Tests:** Direct Mode contract tests under `tests/` and Vitest frontend tests under `frontend/src/__tests__/`.
- **Infrastructure:** one non-economic contract; no custom backend, database, indexer, relayer, token or off-chain source of truth.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for storage and consensus details.

## Intelligent Contract

The lifecycle is strictly ordered:

```text
DISCLOSED -> GRAPH_OPEN -> LOCKED -> TRIAGED -> RESPONSE -> CLOSED
```

Key writes are `create_incident`, `open_graph`, `register_project`, `add_dependency`, `lock_graph`, `triage_next`, `begin_response`, `acknowledge_action`, and `close_incident`. The coordinator owns phase transitions; initial registration binds each project to its maintainer; graph writes are maintainer-authorized; triage triggering is permissionless; acknowledgements are maintainer-only.

The graph is capped at 24 nodes, 64 edges and 8 traversal hops. Canonical source identity, JSON normalization, snapshot parity and CVE binding are validated before triage. Validator outputs are normalized into exposure, action, reason, confidence and evidence-status fields before storage. This project is non-economic and holds no funds.

## Transaction lifecycle

1. The user explicitly selects an available supported wallet and approves the account request.
2. Inputs are validated before the selected provider signs and submits the transaction.
3. The UI displays pending status and waits for terminal finality.
4. Success requires `FINALIZED`, consensus agreement, leader execution `SUCCESS`, and authoritative contract readback.
5. Finalized errors, wallet rejection, timeout and malformed readback remain visible failures and retryable where applicable.
6. Duplicate-sensitive contract methods reject replay.
7. A full page reload returns to disconnected state and requires a fresh wallet choice.

## Run locally

Prerequisites: Node.js 22.x, npm 12.x, Python 3.12+ (verified with 3.13), `uv`, GenLayer CLI 0.39.2 and `genvm-lint 0.11.0`.

```powershell
uv venv --python 3.13 .venv
uv pip install --python .\.venv\Scripts\python.exe -r requirements.txt

Set-Location frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The frontend environment is intentionally small:

```dotenv
VITE_CONTRACT_ADDRESS=0x671Fe675c98690068f822a6a51DA7c639CAC0ce3
VITE_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

No private key, seed phrase or wallet credential belongs in either environment file.

## Tests and verification

Verified on 2026-08-23:

```powershell
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\genvm-lint.exe contracts\critical_dependency_response_mesh.py
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider -q

Set-Location frontend
npm run typecheck
npm run test -- --run
npm run build
```

Current results: dependency check PASS; GenVM lint 3 checks PASS; 30 contract tests PASS; TypeScript PASS; 4 Vitest files / 28 frontend tests PASS; production build PASS. Vite reports one reviewed non-blocking chunk-size warning for the GenLayer/viem client bundle.

The complete chronological Studio ledger—including failed attempts and retries—is in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Deployment

- Network: GenLayer Studionet
- Chain ID: `61999` (`0xf22f`)
- RPC: `https://studio.genlayer.com/api`
- Current contract: `0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`
- Exact deployed source: 68,518 bytes; SHA-256 `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`
- Deployment: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Classification: upgradable; native upgrader is recorded in the secret-free deployment manifest

Recovery, isolated upgrade rehearsal and superseded deployment history are documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Security and trust boundaries

- Contract authorization, not UI visibility, controls every privileged write.
- Coordinator inputs cannot inject a verdict; validators derive normalized consequences from frozen public evidence and graph claims.
- Maintainers can update only their own claims and acknowledge only their own projects.
- HTTPS hosts and canonical API paths are allowlisted; private-network and arbitrary evidence URLs are rejected.
- Snapshot drift, malformed JSON and unavailable evidence fail closed or remain retryable.
- Contract input validation bounds identifiers, versions, graph size, traversal depth, URLs and evidence sizes.
- No browser user needs the Studio deployer/upgrader identity.

See [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md) for the adversarial matrix.

## Known limitations

- Only npm package names and exact SemVer versions are supported.
- The graph reflects maintainer declarations and may be incomplete or inaccurate; it is not repository scanning or a signed SBOM.
- External-source freshness and availability constrain triage. Safe insufficiency is useful uncertainty, not proof of absence.
- A remediation URI and note hash prove an attributable acknowledgement, not patch correctness or software safety.
- Studionet is a development network; this release is not a production vulnerability authority.
- GitHub/Vercel publication and the mandatory independent-wallet live web E2E remain pending and are not claimed complete in this revision.
