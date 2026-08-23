# Verification

## Current checkpoint

This document records the deployed and primary-AI-tested `POST_DEPLOY_TEST` candidate. GitHub/Vercel publication and the mandatory user-executed wallet E2E remain future gates and are not claimed here.

- Submission category: `PROJECT`
- Network target: GenLayer Studionet, chain ID `61999`
- Contract: `contracts/critical_dependency_response_mesh.py`
- Deployment classification: `UPGRADABLE`
- Locked Studio deployer/upgrader: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Contract source commit: `93cd81cd463d31226a2d9c9433d5695fc4fdace9`
- Contract source tree: `1810e0dab5614a78ad109e18f43861029f4fc52a`
- Contract source SHA-256: `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`

The immutable anonymous-review package envelope records the exact packaging commit and tree. They are intentionally not embedded here because a Git commit cannot contain its own hash. The source identifiers above bind the unchanged contract implementation reviewed for deployment.

- Current Studionet contract: `0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`
- Explorer: `https://explorer-studio.genlayer.com/address/0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`
- Deployment transaction: `0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f`
- Deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Deployed source: 68,518 bytes; SHA-256 exact match to the reviewed source

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

## Live Studionet proof matrix

Anonymous review returned `PRE_DEPLOY: APPROVED` for the exact source identifiers above and packaging commit `3c7d7a6767a014b4d860fdba593336f927e19faa`, tree `58b45ee71ae57445417931e972d166d2b6a856bb`. The locked Studio account then deployed and operated the current contract.

All rows below were inspected on Explorer or through allowlisted RPC fields. Successful rows are `FINALIZED / MAJORITY_AGREE / SUCCESS`; expected rejection rows are `FINALIZED / MAJORITY_AGREE / ERROR` with unchanged authoritative state.

| Proof purpose | Actor/method | Transaction | Authoritative result |
|---|---|---|---|
| Exact-source deployment | locked deployer / constructor | `0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f` | Source hash/size and native upgrader match the reviewed package |
| Five-node graph and cycle handling | coordinator + three maintainers | Explorer history on current contract | Incident 1 locked with 5 nodes, 3 edges and a two-node cycle |
| Unauthorized graph mutation | non-maintainer / `add_dependency` | `0x4dd03d431395755dcd1b9bb78870c0f550db4842c98d16c94a9cf6245ca70123` | Rejected; locked graph later retained the authorized topology |
| Canonical external snapshot consensus | coordinator / `lock_graph(1)` | `0x85b6823f206639235b2f090bd6f4194fd61aa4a6c29a9e45a3f11c0231e152be` | Graph `LOCKED`; canonical source hash reached consensus |
| Direct/transitive/safe/cycle triage | registered maintainers / `triage_next` | `0xaedec4d0e8caa1855279f628f6adaeeeadaf5a30499e471c0cf69500d647a762`, `0x9506ef6e13a7519073ab4b8b14af6f5386d61bd5509c76671998d5a4edc4de6d`, `0x4f45c1570955467ca014f47294a4636fbf326b04a30eec13ecc82d0b6e50784d`, `0xdb0d38af8357cb4a0ba1edf1de422d424ce6fc79565527221add66b60a459230`, `0x9abc666858d2be00e0bd03692d918a382527bc6d4d314068cbfaf19a0c57c5c2` | Four definitive `UNAFFECTED/NO_ACTION` outcomes and one safe `UNCERTAIN/REVIEW/INSUFFICIENT` |
| Response transition | coordinator / `begin_response(1)` | `0x26b480fd087df917fa88088033e7f3b08bdd2d81ef76203da05affeb465700e2` | Incident 1 phase `RESPONSE` |
| Deadline boundary | coordinator / early `close_incident(1)` | `0xa8b8fab499dbc19c8c4c9305ef04e6ea160e285dc9aeda7585b23f2d32603dd6` | Rejected: response deadline not elapsed; phase stayed `RESPONSE` |
| Authorized remediation acknowledgement | cycle-b maintainer | `0xb0367d3d1b5002d37093020814559d3be01c7767d47c81c00a9660ad0f396775` | Acknowledgement readback binds caller, URI and note hash |
| Replay prevention | same maintainer, repeated acknowledgement | `0xbfd7dcce04b109f0996f8e89dc6f048b37cb6090b3bf97b147caaf864bfbf2bd` | Rejected as already acknowledged; first record unchanged |
| Affected direct package | maintainer / `triage_next(2, affected)` | `0x4a6e6cded2fd70cbda3c4490f2abc9f792fdf0cc5f584b7da0dd9ea95bbfeb59` | `AFFECTED / QUARANTINE / DIRECT / HIGH` |
| Safe downstream uncertainty | maintainer / `triage_next(2, downstream)` | `0xeae036cd3b7bb82db32514b515d2d1bf24786a4673c55279435f2b1b96f81ae0` | `UNCERTAIN / REVIEW / INSUFFICIENT / LOW` |
| Unauthorized acknowledgement | wrong maintainer | `0x2bee48abff748effaed07cbfaf7037d07a3a515c370e19db4888f056083f0901` | Rejected; no acknowledgement created |
| Authorized direct remediation | affected maintainer | `0x79c4e01aa61a52e872e63f0db19b73ab325493c1124063d485a31cf4e9eeecc6` | Acknowledgement readback matches maintainer and evidence |
| Closure with frozen unresolved cohort | coordinator / `close_incident(2)` | `0xdbd6e2671bf36d03a9e0c304685ba4da99bccd62f1fe2ea040988e056429e09b` | Incident `CLOSED`; unresolved count 1 containing only `downstream` |

Two diagnostic transactions are retained explicitly: `0x98421d2988db4998951db64c27b994fc68d0eefa52d8ed1d50a8ffb7e6e322d6` and `0x28bf27568cebbee204fad36778e332ae1dc821ad2a14c65f349c2123880deb08` rolled back because the CLI interpreted an unprefixed `0x...` string argument as an integer. Corrected transactions use the CLI `str:` prefix and are listed above. They are not counted as successful proof.

## Isolated upgrade rehearsal

- Test deployment: `0x7864D0551a3C90448170C039CB566f1DbB37C3b7`
- Deployment transaction: `0x37d26ced4c1db7d8a53b13c79a08d0a356b1d4e28e5ebb83a64fd36de89de2c2`
- Authorized exact-source upgrade: `0xbe7b6454acf11e95310b33f3ed6fa6a87b58b79d5f6c97f5d83fb3d800bfcde4`
- Unauthorized negative control: `0x126d1533ed6b7fbf43b7d1e51dca1bc70945011e343afb319c7dfdc9d9f19318`
- Post-upgrade source: 68,518 bytes, SHA-256 `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`
- Post-rejection state: source and upgrader readback unchanged

The rehearsal instance is not the release contract and is not wired into the frontend.

## Superseded failure evidence

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

The two superseded deployments and their failed live probes remain historical diagnostics only. Neither address is used by the frontend or current release evidence.

## Known limitations

- The graph is a bounded maintainer-declared npm dependency graph, not an automated SBOM or package scanner.
- External-source availability and freshness constrain triage. Missing or malformed required evidence is recorded as `UNCERTAIN / REVIEW / INSUFFICIENT`.
- Remediation acknowledgement records a URI and note hash; it does not prove that a patch is functionally safe.
- Native upgrade authority is recoverable only while the recorded Studio upgrader account and Studionet state remain available.
