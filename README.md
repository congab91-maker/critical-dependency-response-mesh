# Critical Dependency Response Mesh

An Intelligent Contract coordination mesh on GenLayer Studionet for public supply-chain vulnerability incidents, maintainer dependency claim graphs, consensus-based triage, and remediation tracking.

## 1. The Trust Problem

When a critical vulnerability (such as an actively exploited CVE in the CISA KEV catalog) affects widely shared open-source packages, coordinating the response across dependent projects is fraught with friction and misaligned incentives:
- Downstream software maintainers often do not know whether their specific dependency chains are affected or if their upstream dependencies have applied fixes.
- Project maintainers may minimize or delay acknowledging vulnerability exposure due to reputational concerns or operational inertia.
- Traditional vulnerability registries and dependency scanners either operate as centralized authorities or rely solely on local static analysis without decentralized consensus or tamper-proof response tracking.

## 2. Why GenLayer

GenLayer Intelligent Contracts enable decentralized validator consensus over real-time web evidence and semantic graph analysis:
- **Consensus-Backed Triage**: Independent validators fetch authoritative public records (CISA KEV, NVD CVE, OSV) and evaluate exposure across a registered dependency graph.
- **Fail-Safe Insufficiency**: When evidence is missing, conflicting, or unreachable, GenLayer validators reach consensus on `UNCERTAIN / REVIEW / INSUFFICIENT`, preventing unsafe `UNAFFECTED` defaults.
- **Immutable Response Ledger**: Triage classifications, maintainer remediation acknowledgements with evidence URIs, and the final unresolved cohort are recorded directly on-chain without centralized intermediaries.

## 3. Architecture

- **Intelligent Contract**: `contracts/critical_dependency_response_mesh.py` (`CriticalDependencyResponseMesh`)
- **Direct-Mode Test Suite**: `tests/` using `genlayer-test==0.29.2`
- **Frontend DApp**: Single React + TypeScript + Vite application in `frontend/` utilizing `genlayer-js: 1.1.8` and native EIP-6963 wallet discovery (MetaMask, OKX Wallet, Rabby).
- **Network**: GenLayer Studionet (Chain ID `61999` / `0xf22f`, RPC: `https://studio.genlayer.com/api`).
- **Design Philosophy**: Non-economic, single-contract architecture with no custom backends, databases, indexers, relayers, or tokens.

## 4. State Machine

The lifecycle of an incident transitions through six discrete phases:

```
DISCLOSED ──► GRAPH_OPEN ──► LOCKED ──► TRIAGED ──► RESPONSE ──► CLOSED
```

1. **DISCLOSED**: Coordinator initializes incident with CVE ID, CISA/NVD/OSV URLs, primary vulnerable package, snapshot hash, and response deadline.
2. **GRAPH_OPEN**: Project maintainers register project IDs, canonical npm package names, exact SemVer versions, and dependency edges.
3. **LOCKED**: Validators verify the framed canonical-JSON CISA/NVD/OSV digest against the declared snapshot hash; the coordinator then freezes the graph and its deterministic SHA-256 graph hash.
4. **TRIAGED**: Permissionless callers trigger `triage_next` for each node; validators reach consensus on direct and transitive exposure. Moves to `TRIAGED` once all nodes are processed.
5. **RESPONSE**: Coordinator opens response phase; maintainers submit remediation acknowledgements with public PR/commit URIs and note hashes.
6. **CLOSED**: At or after the response deadline, coordinator closes the incident; unacknowledged affected nodes are permanently recorded in the immutable unresolved cohort.

## 5. Evidence Boundaries and Limitations

- **Ecosystem**: npm only (canonical unscoped names or `@scope/package`).
- **Evidence Model**: CISA KEV binds exploitation status; NVD binds CVE identity and descriptions; OSV binds affected/fixed SemVer version ranges.
- **Canonical Sources**: Incidents accept only the canonical CISA KEV JSON feed, the NVD CVE 2.0 endpoint queried for the exact incident CVE, and an `api.osv.dev/v1/vulns/{id}` record whose structured ID or alias matches that CVE.
- **Frozen Snapshot**: Each response must be valid JSON and is serialized deterministically as UTF-8 with sorted keys and compact separators. NVD's generated top-level transport `timestamp` is excluded; no other evidence field is removed. `snapshot_hash` is the SHA-256 digest of those canonical JSON bytes framed as `CISA\0...\0NVD\0...\0OSV\0...`. Lock rejects malformed or mismatched content; triage reverts on later semantic content drift so no node consumes mixed-version evidence.
- **Maintainer Claim Graph**: The graph is explicitly a bounded maintainer claim graph for the incident (max 24 nodes, max 64 edges, max depth 8 hops). It is not an automated scanner or complete SBOM.
- **Acknowledgement Meaning**: An acknowledgement records evidence of maintainer action; it does not certify cryptographic or functional safety of the patch.

## 6. Project Setup & Local Verification

### Prerequisites

- Node.js `22.x` and npm `12.x`
- Python `3.13` (or `3.12+`)
- `uv` (recommended) or virtualenv
- `genlayer CLI 0.39.2` and `genvm-lint 0.11.0`

### Step-by-Step Commands

1. **Create and Activate Virtual Environment**:
   ```bash
   uv venv --python 3.13 .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # POSIX:
   source .venv/bin/activate
   ```

2. **Install Python Dependencies**:
   ```bash
   uv pip install --python .\.venv\Scripts\python.exe -r requirements.txt
   ```

3. **Verify Dependencies**:
   ```bash
   python -m pip check
   ```

4. **Lint Contract with GenVM Linter**:
   ```bash
   genvm-lint contracts\critical_dependency_response_mesh.py
   ```

5. **Run Direct-Mode Contract Tests**:
   ```bash
   pytest tests/ -v -p no:cacheprovider
   ```

6. **Install Frontend Dependencies & Build**:
   ```bash
   cd frontend
   npm ci
   npm run typecheck
   npm run test
   npm run build
   ```

## 7. Current Project Status

- **Phase**: Studionet deployment and live contract verification complete; release preparation pending.
- **Contract**: Verified deployment at [`0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`](https://explorer-studio.genlayer.com/address/0x671Fe675c98690068f822a6a51DA7c639CAC0ce3).
- **Frontend**: Implementation and unit/integration test suite complete and configured for the verified Studionet contract.
- **Release**: GitHub/Vercel publication and the mandatory user-executed wallet E2E are not yet complete.

See [`docs/VERIFICATION.md`](docs/VERIFICATION.md) for exact local evidence and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Studionet deployment/recovery runbook.
