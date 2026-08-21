# Critical Dependency Response Mesh — Architecture Specification

## 1. System Overview

The **Critical Dependency Response Mesh** is an Intelligent Contract decentralized application deployed on GenLayer Studionet. It provides a neutral, tamper-resistant coordination mesh for security incidents and critical supply-chain vulnerabilities affecting multi-project software dependency graphs.

In modern software ecosystems (specifically npm), vulnerabilities often ripple through deep, interconnected dependency trees. When a critical CVE is actively exploited in the wild, project maintainers and incident coordinators face severe coordination challenges:
- Maintainers may understate or misjudge exposure to avoid downtime or liability.
- Downstream dependents lack verifiable proof of whether upstream components are affected or remediated.
- Centralized trackers can be manipulated, out of date, or opaque in their triage decisions.

The Critical Dependency Response Mesh addresses this coordination failure by employing GenLayer Intelligent Contracts. GenLayer validators independently fetch public vulnerability evidence, evaluate registered project dependency claims, reach consensus on exposure classification and remediation actions, record immutable maintainer acknowledgements, and seal the incident with an immutable unresolved set.

## 2. Non-Economic Single-Contract Design

The architecture is strictly non-economic and operates via a single Intelligent Contract:
- **Contract**: `contracts/critical_dependency_response_mesh.py` (`CriticalDependencyResponseMesh`)
- **Network**: GenLayer Studionet (Chain ID `61999` / `0xf22f`)
- **No auxiliary infrastructure**: No backend server, off-chain database, custom indexer, relayer, scheduler, or subgraphs.
- **No economic layer**: No tokens, staking, slashing, bounties, or payment flows.

## 3. Evidence Boundary and Source-of-Truth Model

The incident authority is strictly bound to three canonical public evidence sources:
1. **CISA KEV (Known Exploited Vulnerabilities)**: Establishes exploitation status and government-cataloged context.
2. **NVD CVE Record**: Binds canonical CVE identifier and standardized vulnerability descriptions.
3. **OSV Vulnerability Record**: Supplies machine-readable affected/fixed SemVer version ranges for the npm package ecosystem.

### Scope Boundaries:
- **npm Ecosystem Only**: The scope is strictly bounded to npm packages (unscoped `package` or scoped `@scope/package`).
- **Maintainer Claim Graph**: The graph is a bounded, maintainer-registered claim graph for a specific incident. It is not an automated repository scanner or complete ecosystem-wide SBOM.
- **Remediation Acknowledgement**: A maintainer's acknowledgement records evidence of response (e.g., commit/PR URI and note hash); it does not certify cryptographic or functional safety of the patch.

## 4. State Machine & Lifecycle

The incident state machine transitions strictly linearly through six canonical phases:

```
[DISCLOSED] ──► [GRAPH_OPEN] ──► [LOCKED] ──► [TRIAGED] ──► [RESPONSE] ──► [CLOSED]
```

1. **DISCLOSED**:
   - Incident is initialized by an incident coordinator with frozen parameters: CVE ID, CISA KEV URI, NVD URI, OSV URI, primary vulnerable package, coordinator snapshot hash, and response deadline.
2. **GRAPH_OPEN**:
   - Project maintainers register project nodes (unique project ID, package name, exact SemVer version). First registrant address becomes the immutable maintainer owner.
   - Maintainers declare directed dependency edges (`add_dependency`) from their project to registered upstream projects.
3. **LOCKED**:
   - Coordinator freezes the dependency graph. The contract computes a deterministic SHA-256 graph hash over all sorted nodes and edges.
   - Graph mutations are permanently disabled.
4. **TRIAGED**:
   - Anyone may permissionlessly trigger `triage_node` for registered project nodes.
   - Validators independently fetch external sources, traverse the registered graph, and reach consensus on exposure.
   - When all registered nodes are triaged, the incident transitions to `TRIAGED`.
5. **RESPONSE**:
   - Coordinator opens the response phase (`begin_response`).
   - Maintainers of affected/uncertain projects record remediation actions with public evidence URIs and note hashes (`acknowledge_action`).
6. **CLOSED**:
   - At or after the response deadline (`now_ts >= response_deadline`), coordinator closes the incident (`close_incident`).
   - An immutable unresolved cohort is sealed containing all projects requiring action that lacked valid acknowledgements.

## 5. Nondeterministic Execution & Consensus Model

Every web request and semantic classification runs inside GenLayer's nondeterministic execution harness via `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`.

### Leader Execution (`leader_fn`):
1. Verifies exact SemVer syntax of the target node.
2. Fetches CISA KEV, NVD CVE, and OSV sources over HTTPS.
3. Validates CVE identity matching across all sources.
4. Validates npm ecosystem matching in OSV.
5. Evaluates direct exposure (if package equals primary vulnerable package) against OSV version ranges.
6. Evaluates transitive exposure via bounded BFS graph traversal (up to depth 8) with cycle tracking.
7. Emits structured decision object with:
   - `classification`: `AFFECTED | UNAFFECTED | UNCERTAIN`
   - `action`: `QUARANTINE | REVIEW | MONITOR | NO_ACTION`
   - `impact_kind`: `DIRECT | TRANSITIVE | NONE | INSUFFICIENT`
   - `confidence_band`: `HIGH | MEDIUM | LOW`
   - `reason_code`: Bounded enum
   - `reason`: Bounded explanation string (<= 512 chars)

### Validator Consensus (`validator_fn`):
- Each validator independently runs `leader_fn()` by refetching external sources and evaluating the frozen graph.
- Validates the complete output schema and enum constraints.
- Compares the consequence-bearing tuple: `(classification, action, impact_kind)`.
- If any element of the tuple differs or validation fails, consensus is rejected and contract state remains unmutated and retryable.

### Safe Consequence & Insufficiency Rules:
- Direct exposure -> `AFFECTED / QUARANTINE / DIRECT`
- Transitive exposure -> `AFFECTED / REVIEW / TRANSITIVE`
- No dependency path -> `UNAFFECTED / NO_ACTION / NONE`
- Missing/invalid version, dead source, malformed JSON, CVE identity mismatch, ecosystem mismatch, or depth cap exceeded -> `UNCERTAIN / REVIEW / INSUFFICIENT`. Missing or conflicting evidence never defaults to `UNAFFECTED` or `NO_ACTION`.

## 6. Deterministic Architectural Bounds

| Dimension | Fixed Limit |
|---|---|
| Maximum Incidents | 32 |
| Maximum Nodes per Incident | 24 |
| Maximum Dependency Edges per Incident | 64 |
| Maximum Outgoing Edges per Node | 8 |
| Maximum Traversal Depth | 8 hops |
| Maximum URI Length | 512 chars |
| Maximum Project/Package ID Length | 96 chars |
| Maximum Note Hash Length | 128 chars |

## 7. Storage Architecture

All persistent contract state uses GenVM runtime-managed `TreeMap` and `DynArray` collections:
- `incident_*`: Core incident metadata, phases, timestamps, and hashes.
- `project_*`: Registered project claims, package names, SemVer versions, and maintainer addresses.
- `edge_*`, `node_outgoing_edge_*`: Directed dependency graph relationships.
- `triage_*`: Consensus-backed triage outcomes, reason codes, and timestamps.
- `ack_*`: Maintainer remediation acknowledgements.
- `unresolved_*`: Immutable closed-incident unresolved project IDs.

## 8. Upgradability & Governance

The contract uses GenLayer's native upgradability mechanism:
- Authorized addresses are registered in `gl.storage.Root.get().upgraders` during deployment.
- `upgrade(new_code)` replaces the root code only when invoked by an authorized upgrader; GenVM's locked root slots reject unauthorized callers.
- Storage layout compatibility remains an operational requirement for every replacement version.

## 9. Frontend Architecture & Wallet Gate

The frontend is a lightweight, responsive React + TypeScript + Vite application:
- **EIP-6963 Wallet Integration**: Dynamically discovers injected providers via `eip6963:announceProvider` and strictly filters to supported wallets: MetaMask, OKX Wallet, and Rabby.
- **No Silent Fallback**: Clicking Connect opens an accessible modal listing detected supported wallets. Reload always starts disconnected.
- **Transaction Flow**: Validation -> Wallet Selection -> Signing -> Hash -> Consensus/Finality -> State Readback.
- **Graph Workspace**: Interactive, accessible SVG/DOM dependency graph viewer with full keyboard navigation and text-equivalent path explorer.
