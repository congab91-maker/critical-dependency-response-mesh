# Verification

## Current checkpoint

This document records the deployed contract, public repository, production frontend, and user-authorized OKX-wallet E2E. The final anonymous `POST_GITHUB_VERCEL_FINAL` checkpoint remains pending and is not claimed here.

Release publication and wallet E2E are complete; final anonymous review remains pending:

- Public repository: `https://github.com/congab91-maker/critical-dependency-response-mesh`
- Public branch: `master`
- Deployed frontend source commit: `2a97feda18431bf3e4b4091f3790a6fdb6dc5288`
- Deployed frontend source tree: `feac8285c5a707bbed0513146ed53bbe3618c0be`
- Live app: `https://critical-dependency-response-mesh.vercel.app`
- Vercel project: `brunogg/critical-dependency-response-mesh`
- Final packaging deployment: `dpl_8joW11ue9WNDYqTFZs5MEdSbr5KB` (`READY`), byte-identical frontend bundle to deployed frontend source commit above
- Production bundle check: correct contract/RPC and visible per-second local countdown; deadline-gated close; truthful transient-read loading state; graph/table; exact EIP-6963 OKX routing; reload disconnected
- User wallet E2E: PASS through incident #3 `DISCLOSED → GRAPH_OPEN → LOCKED → TRIAGED → RESPONSE → CLOSED`; final anonymous approval remains pending

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

Executed on 2026-08-24:

```text
python -m pip check                         PASS — No broken requirements found
genvm-lint contracts/...py                 PASS — 3 checks
python -m pytest -p no:cacheprovider -q    PASS — 30 tests
npm run typecheck                          PASS — 0 errors
npm run test -- --run                      PASS — 4 files, 38 tests
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
- slow Studionet reads display a truthful live-region loading state instead of a false empty-incident message.
- response countdown updates locally every second without RPC; close is absent before `RESPONSE` and disabled until the on-chain deadline;
- one shared Studionet read client serializes calls, deduplicates identical in-flight reads, retries only transient/429 failures at most three times with bounded exponential backoff and `Retry-After`, and performs no continuous read polling;
- one write authorization can call `writeContract` at most once while finality/readback is pending.

## Production OKX-wallet E2E — incident 3

Executed on the stable Vercel URL using the user's explicitly selected EIP-6963 OKX provider (`com.okex.wallet`) and account `0x5d598f10a428fb2039edbc3ace83351650b286e0`. Each successful write reached `FINALIZED`, consensus acceptance, execution `SUCCESS`, and the advertised authoritative readback before the next write. No private wallet material was recorded.

| Step | Transaction | Authoritative result |
|---|---|---|
| create incident | `0xa591d7211f48cfed03549f36a8276e1574862ea3c71583472038c9a62c0d1046` | incident #3 `DISCLOSED`, CVE-2021-23337 / lodash |
| open graph | `0xbbd677296c6cf253b25efc1fd627a33aa13036cca70736d4ab6187a30b9f1abb` | `GRAPH_OPEN` |
| register direct | `0xb6dac06f86109e1bbfd27c287966bcced49d9653d2dccbaa75fb9dd9d82e910a` | `judge-lodash-direct` owned by OKX account |
| register consumer | `0x29a77cefeb113cd6dd018bcca70b923be7f558b6f6f659806919873490cea773` | `judge-consumer-app` owned by OKX account |
| add dependency | `0x53d65578b0fd3b5ab0af5eb4699e0000184b60bec009a1de8fec530403c704f1` | consumer → direct edge persisted |
| lock graph | `0x4afba2c4357096fbae3bc8158e667b3683991e5e16b48d2cd6be01bc5bd10f60` | `LOCKED`, 2 nodes / 1 edge |
| triage direct | `0xae77b88ecf2f61de56c73407e46c6bb421766152752e65fb158c51c7d7982b1d` | safe insufficiency `UNCERTAIN / REVIEW / INSUFFICIENT` |
| triage consumer | `0xda8155e39d0281b9229fd773732480b293de04c5372a4e31a77c8f64124a8814` | same safe insufficiency; phase `TRIAGED` |
| begin response | `0x9510de7ed284d93102b3d7a3cbb7d3207f268a8a40f179186f3da9b55fd23b2e` | `RESPONSE` |
| acknowledge direct | `0x49a270b2ae37489d758688f6be968ff62771b9ed35feb29b60bcf8fa0a53b943` | URI/hash exact; acknowledged |
| acknowledge consumer | `0x4a905dbb5f526e08d0fc6c7e346622963ab97f608c3034539f9abec8de2d53f0` | URI/hash exact; acknowledged; pending count 0 |
| close after deadline | `0x802b7f760c1b85a4401fd280bff877196be21ae5d8e288ccb26b8064d9ea8ae4` | `CLOSED`, sealed `2026-08-24 00:57:19 +07:00`, unresolved 0 |

Post-close full reload returned disconnected, loaded incident #3 as `CLOSED`, retained both acknowledgements and graph/table state, and showed unresolved count 0. The live countdown was directly observed changing from `0h 5m 33s` to `0h 5m 29s` over four seconds without a contract read.

## Live Studionet transaction ledger

Anonymous review returned `PRE_DEPLOY: APPROVED` for the exact source identifiers above and packaging commit `3c7d7a6767a014b4d860fdba593336f927e19faa`, tree `58b45ee71ae57445417931e972d166d2b6a856bb`. The locked Studio account then deployed and operated the current contract.

Every attempted required Studio transaction is recorded below, including setup writes, expected negative controls, malformed CLI attempts and retries. Each transaction was independently read through Studionet RPC and/or Explorer. `F/A/S` means `FINALIZED / MAJORITY_AGREE / SUCCESS`; `F/A/E` means `FINALIZED / MAJORITY_AGREE / ERROR`. An expected rejection is a test PASS only when authoritative state readback is unchanged.

Exact aliases used in every row:

- `MAIN` = `0x671Fe675c98690068f822a6a51DA7c639CAC0ce3`; `ISO` = `0x7864D0551a3C90448170C039CB566f1DbB37C3b7`.
- `SRC` = exact 68,518-byte contract source with SHA-256 `9A0DD1219504190383C0896D26A1CDB4BE9142DA940E7598B93EDA3D42FAE7C0`.
- `C` (coordinator/deployer/upgrader) = `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`; `A` = `0x1e92a89a414d0e1c9536810c95454dc7e767aafa`; `B` = `0x32edace6602b4594f6b2661e27ea1fa7fe7a9487`; `D` = `0x67e0d5971d5bf8b5b0ab8eb7a78be893f68fa713`; `X` (unauthorized upgrader) = `0xf5c66e5155a62e27047ad4cce729593d6b9c03fc`.
- `EVID` = (`CVE-2025-54313`, `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`, `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2025-54313`, `https://api.osv.dev/v1/vulns/GHSA-f29h-pxvx-f335`, `eslint-config-prettier`, snapshot `0xa657633a847f4e359022394644eca8bb654c963c66070881b501ae770ddb6d8a`).
- `ACK1` = (`cycle-b`, `https://example.com/remediation/cve-2025-54313/cycle-b`, `0x1f8e2da38cfcfbe1bf11a0a42d324ee10bcc293511507067cc1f52c2eaa9af25`); `ACK2` = (`affected`, `https://example.com/remediation/cve-2025-54313/affected`, `0x6c386a24123de2eb0d9ffbfbfff56c0da7fc5cd005b5b39a0f0e738e86eafe3d`).

| ID | Contract / actor | Exact call arguments | Expected | Transaction / lifecycle | Authoritative pre → post readback; actual | Verdict |
|---|---|---|---|---|---|---|
| D00 | MAIN/SRC · C | deploy(`SRC`, upgrader=`C`) | deploy exact package | `0x2fd647ea2cfa1ca6116b4e28d8626db668396a2f3cc7e6c20ecbd08d601c9d2f` · F/A/S | absent → code SHA/size exact; upgrader=`C` | PASS |
| I1-01 | MAIN/SRC · C | create_incident(`EVID`, deadline=`1788029137`) | incident 1 | `0x508f785f59642c22a5c89e4911df9d8858cf48272a9e599ec6dcc57a071574c4` · F/A/S | incident_count 0→1; phase `DISCLOSED` | PASS |
| I1-02 | MAIN/SRC · C | open_graph(1) | open graph | `0x713090c55422c0531020bd961239dec72d57219e50c41fbd01ba84b05e7d6205` · F/A/S | `DISCLOSED`→`GRAPH_OPEN` | PASS |
| I1-03 | MAIN/SRC · A | register_project(1,`direct`,`eslint-config-prettier`,`10.1.8`) | add node | `0x9fb36bccdee8415d36412df3c5c7815e5c7767ba3d6c466a0f6582bab117f5ab` · F/A/S | projects 0→1; owner A | PASS |
| I1-04 | MAIN/SRC · B | register_project(1,`transitive`,`consumer-app`,`1.0.0`) | add node | `0x8237322262da7c60515df9ca257582b9ce4a0a4a499fdde4f55323c66bef3e82` · F/A/S | projects 1→2; owner B | PASS |
| I1-05 | MAIN/SRC · D | register_project(1,`safe`,`left-pad`,`1.3.0`) | add node | `0xd3febd9e2529d20f8cf1fd9ffd156c2e40c3924ca911378c7a0142c7b77c52a5` · F/A/S | projects 2→3; owner D | PASS |
| I1-06 | MAIN/SRC · A | register_project(1,`cycle-a`,`cycle-a-package`,`1.0.0`) | add node | `0xf33f30265c4a645efafae08497265056183bf7d75be9ba9fa41fa9b399e3699e` · F/A/S | projects 3→4; owner A | PASS |
| I1-07 | MAIN/SRC · B | register_project(1,`cycle-b`,`cycle-b-package`,`1.0.0`) | add node | `0x09e2fe0588e8065158b7e039bbb0078ac68cb922f37eb439e3223b78cf0f4fe5` · F/A/S | projects 4→5; owner B | PASS |
| I1-08 | MAIN/SRC · A | register_project(1,`cycle-a`,`cycle-a-package`,`1.0.0`) | owner update/idempotent count | `0xc1fc2779db9276b8d21e54f11f6219f598d6b971a0bbb92a89d893bef7f03160` · F/A/S | projects 5→5; claim unchanged | PASS |
| I1-09 | MAIN/SRC · B | add_dependency(1,`transitive`,`direct`) | add edge | `0x8bce7de0ec981fce8e07c6bfd1f735edf24331f5acd84ae1ac0ad9e1000e17e1` · F/A/S | edges 0→1 | PASS |
| I1-10 | MAIN/SRC · A | add_dependency(1,`cycle-a`,`cycle-b`) | add edge | `0xe2e3dab3c39557a75c5cda2feef04b1b8d9584a9c676cfcdf54d3e9474012147` · F/A/S | edges 1→2 | PASS |
| I1-11 | MAIN/SRC · B | add_dependency(1,`cycle-b`,`cycle-a`) | add edge/cycle | `0x1a0e8b230c6cbcd3b0dccb9db6818aebba68682518a29c3f1fbdc3ddaf4cab37` · F/A/S | edges 2→3; cycle frozen later | PASS |
| I1-12 | MAIN/SRC · D | add_dependency(1,`transitive`,`safe`) | reject non-owner | `0x4dd03d431395755dcd1b9bb78870c0f550db4842c98d16c94a9cf6245ca70123` · F/A/E | edges 3→3; unauthorized source maintainer | PASS |
| I1-13 | MAIN/SRC · C | open_graph(1) | reject repeated transition | `0xef836a68e9836591a12a2ed7eadfe19b598f82efad7dd163c70addb799e58bcb` · F/A/E | phase `GRAPH_OPEN`→unchanged | PASS |
| I1-14 | MAIN/SRC · C | lock_graph(1) | canonical evidence lock | `0x85b6823f206639235b2f090bd6f4194fd61aa4a6c29a9e45a3f11c0231e152be` · F/A/S | phase `GRAPH_OPEN`→`LOCKED`; 5 nodes/3 edges | PASS |
| I1-15 | MAIN/SRC · A | triage_next(1,`direct`) | direct safe classification | `0xaedec4d0e8caa1855279f628f6adaeeeadaf5a30499e471c0cf69500d647a762` · F/A/S | triaged 0→1; `UNAFFECTED/NO_ACTION` | PASS |
| I1-16 | MAIN/SRC · B | triage_next(1,`transitive`) | transitive safe classification | `0x9506ef6e13a7519073ab4b8b14af6f5386d61bd5509c76671998d5a4edc4de6d` · F/A/S | triaged 1→2; `UNAFFECTED/NO_ACTION` | PASS |
| I1-17 | MAIN/SRC · D | triage_next(1,`safe`) | unrelated safe classification | `0x4f45c1570955467ca014f47294a4636fbf326b04a30eec13ecc82d0b6e50784d` · F/A/S | triaged 2→3; `UNAFFECTED/NO_ACTION` | PASS |
| I1-18 | MAIN/SRC · A | triage_next(1,`cycle-a`) | cycle terminates | `0xdb0d38af8357cb4a0ba1edf1de422d424ce6fc79565527221add66b60a459230` · F/A/S | triaged 3→4; `UNAFFECTED/NO_ACTION` | PASS |
| I1-19 | MAIN/SRC · B | triage_next(1,`cycle-b`) | safe insufficiency | `0x9abc666858d2be00e0bd03692d918a382527bc6d4d314068cbfaf19a0c57c5c2` · F/A/S | triaged 4→5; phase `TRIAGED`; `UNCERTAIN/REVIEW/INSUFFICIENT` | PASS |
| I1-20 | MAIN/SRC · C | begin_response(0) | reject missing incident | `0x2c0d4062f7dd021cf7bf19b3b8e1b7f09a1146bb2f684dd0f228782abedc816b` · F/A/E | incident 1 remains `TRIAGED`; “Incident does not exist” | PASS |
| I1-21 | MAIN/SRC · D | acknowledge_action(1,`cycle-b`,`https://github.com/genlayerlabs/genlayer-js/commit/0000000000000000000000000000000000000000`, integer `77194726158210796949047323339125271902179989777093709359638389338608753093290`) | diagnostic rejection | `0xc27fe51add2c9e94c5a3fdba6b21652064bce4f575daf81c372b39be0754cc65` · F/A/E | phase remains `TRIAGED`; no acknowledgement | PASS |
| I1-22 | MAIN/SRC · B | acknowledge_action(1,`cycle-b`,`https://github.com/genlayerlabs/genlayer-js/commit/1111111111111111111111111111111111111111`, integer `84914198774031876643952055673037799092397988754803080295602228272469628402619`) | diagnostic rejection | `0x60767a2b30349785619cb5314617820488aa94a835faf701c4b61a38ce35afb3` · F/A/E | phase remains `TRIAGED`; no acknowledgement | PASS |
| I1-23 | MAIN/SRC · B | acknowledge_action(1,`cycle-b`,`https://github.com/genlayerlabs/genlayer-js/commit/2222222222222222222222222222222222222222`, integer `92633671389852956338856788006950326282615987732512451231566067206330503711948`) | diagnostic rejection | `0x33a92fb5464142eeae28cf470dbf2e152c1f9afdf7752301b59310b4f39bf5b3` · F/A/E | phase remains `TRIAGED`; no acknowledgement | PASS |
| I1-24 | MAIN/SRC · C | close_incident(0) | reject missing incident | `0x758150186fe48852d91f6b362af55e6b6480361502b08bcea1d226b3a2bb19bf` · F/A/E | incident 1 unchanged; “Incident does not exist” | PASS |
| I2-01 | MAIN/SRC · C | create_incident(`EVID`, deadline=`1787425422`) | incident 2 | `0x2121a343b380e352b011debc6ebb60fb62c3b46ac22cde7fcf1798b1e8cc6d64` · F/A/S | incident_count 1→2; phase `DISCLOSED` | PASS |
| I2-02 | MAIN/SRC · C | open_graph(2) | open graph | `0x0f948af92577e4ddc7767ecd74e652a2759d4d24b757e4aa039f329bae9ccd12` · F/A/S | `DISCLOSED`→`GRAPH_OPEN` | PASS |
| I2-03 | MAIN/SRC · A | register_project(2,`affected`,`eslint-config-prettier`,`10.1.7`) | add affected node | `0x451259168e0a3862ef3446551b94b14aa28374d0acbcae856039151eea1e6621` · F/A/S | projects 0→1; owner A | PASS |
| I2-04 | MAIN/SRC · B | register_project(2,`downstream`,`consumer-app`,`1.0.0`) | add downstream node | `0x54ed57d52eb1ddf684cf3b2b8e67c90c606a16950fddffee2fd5d7968e7d4530` · F/A/S | projects 1→2; owner B | PASS |
| I2-05 | MAIN/SRC · B | add_dependency(2,`downstream`,`affected`) | add edge | `0xdc660bdcdc013359533ee1cdac3f8bf0781dad2edd52a63097b3538602a4cd86` · F/A/S | edges 0→1 | PASS |
| I2-06 | MAIN/SRC · C | lock_graph(2) | canonical evidence lock | `0x2211aaa5729a59d3b44a9e7bd7d8457948094032059f7f617a40523724441e97` · F/A/S | `GRAPH_OPEN`→`LOCKED`; 2 nodes/1 edge | PASS |
| I2-07 | MAIN/SRC · A | triage_next(2,`affected`) | affected classification | `0x4a6e6cded2fd70cbda3c4490f2abc9f792fdf0cc5f584b7da0dd9ea95bbfeb59` · F/A/S | triaged 0→1; `AFFECTED/QUARANTINE/DIRECT/HIGH` | PASS |
| I2-08 | MAIN/SRC · A | triage_next(2,`affected`) | reject duplicate | `0x98421d2988db4998951db64c27b994fc68d0eefa52d8ed1d50a8ffb7e6e322d6` · F/A/E | triaged 1→1; already triaged | PASS |
| I2-09 | MAIN/SRC · B | triage_next(2,`downstream`) | downstream safe insufficiency | `0xeae036cd3b7bb82db32514b515d2d1bf24786a4673c55279435f2b1b96f81ae0` · F/A/S | triaged 1→2; phase `TRIAGED`; `UNCERTAIN/REVIEW/INSUFFICIENT/LOW` | PASS |
| I2-10 | MAIN/SRC · B | triage_next(2,`downstream`) | reject after transition | `0x74585295899ce3abdd8d4f0f581c19456ae5023bbfc40d0f77ad8a398ec866b3` · F/A/E | phase/triaged unchanged; expected `LOCKED`, got `TRIAGED` | PASS |
| I2-11 | MAIN/SRC · C | begin_response(2) | start response | `0xbe8bcbb802a41762482da4feb717751fe50d728c09d855665be58f68d5abafc6` · F/A/S | `TRIAGED`→`RESPONSE` | PASS |
| I2-12 | MAIN/SRC · B | acknowledge_action(2, ACK2 URI, unprefixed 0x note parsed as integer) | reject wrong maintainer/type diagnostic | `0x2bee48abff748effaed07cbfaf7037d07a3a515c370e19db4888f056083f0901` · F/A/E | acknowledged false→false; no record | PASS |
| I2-13 | MAIN/SRC · A | acknowledge_action(2, ACK2 URI, unprefixed 0x note parsed as integer) | reject malformed type | `0x28bf27568cebbee204fad36778e332ae1dc821ad2a14c65f349c2123880deb08` · F/A/E | acknowledged false→false; “note_hash must be a string” | PASS |
| I2-14 | MAIN/SRC · A | acknowledge_action(2,`ACK2`) | accept remediation | `0x79c4e01aa61a52e872e63f0db19b73ab325493c1124063d485a31cf4e9eeecc6` · F/A/S | acknowledged false→true; caller/URI/hash exact | PASS |
| I2-15 | MAIN/SRC · C | close_incident(2) | close after deadline | `0xdbd6e2671bf36d03a9e0c304685ba4da99bccd62f1fe2ea040988e056429e09b` · F/A/S | `RESPONSE`→`CLOSED`; unresolved=[`downstream`] | PASS |
| I1-25 | MAIN/SRC · C | begin_response(1) | start response | `0x26b480fd087df917fa88088033e7f3b08bdd2d81ef76203da05affeb465700e2` · F/A/S | `TRIAGED`→`RESPONSE` | PASS |
| I1-26 | MAIN/SRC · C | close_incident(1) | reject before deadline | `0xa8b8fab499dbc19c8c4c9305ef04e6ea160e285dc9aeda7585b23f2d32603dd6` · F/A/E | `RESPONSE`→unchanged; deadline not elapsed | PASS |
| I1-27 | MAIN/SRC · B | acknowledge_action(1,`ACK1`) | accept remediation | `0xb0367d3d1b5002d37093020814559d3be01c7767d47c81c00a9660ad0f396775` · F/A/S | cycle-b acknowledged false→true; caller/URI/hash exact | PASS |
| I1-28 | MAIN/SRC · B | acknowledge_action(1,`ACK1`) | reject replay | `0xbfd7dcce04b109f0996f8e89dc6f048b37cb6090b3bf97b147caaf864bfbf2bd` · F/A/E | acknowledgement unchanged; already acknowledged | PASS |
| U-01 | ISO/SRC · C | deploy(`SRC`, upgrader=`C`) | isolated rehearsal | `0x37d26ced4c1db7d8a53b13c79a08d0a356b1d4e28e5ebb83a64fd36de89de2c2` · F/A/S | absent→code SHA/size exact; upgrader=`C` | PASS |
| U-02 | ISO/SRC · C | native upgrade(`SRC`) | authorized exact-source upgrade | `0xbe7b6454acf11e95310b33f3ed6fa6a87b58b79d5f6c97f5d83fb3d800bfcde4` · F/A/S | code SHA exact→exact; upgrader remains C | PASS |
| U-03 | ISO/SRC · X | native upgrade(`SRC`) | reject unauthorized upgrade | `0x126d1533ed6b7fbf43b7d1e51dca1bc70945011e343afb319c7dfdc9d9f19318` · F/A/E | code SHA/upgrader unchanged; “Unauthorized upgrader” | PASS |

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
