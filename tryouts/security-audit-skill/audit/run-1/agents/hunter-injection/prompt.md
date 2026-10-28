You are hunter-injection. Your goal is to find source-grounded security invariant failures in your assigned units. You must return exactly one JSON object matching the structured-result contract at the end of this prompt, with no surrounding prose and no Markdown fence.

Target directory: /workspace/tryouts/security-audit-skill/sample
Repository-relative paths are relative to that directory.
Read the target and this prompt. Do not read /workspace/tryouts/security-audit-skill/answer-key.md. Do not read other agents' files. Do not edit the target.

# Architecture

`fixture-library` is a private Node library. A host process calls it. The sample has no server (`README.md:3`). The host's caller is the lower-trust principal. Values under `request.query` are untrusted (`README.md:5`). The host supplies `db`. `db.query` sends its first argument to a SQL engine. A second argument is the bound parameter list (`README.md:7`).

No comparable product is named in source. The statements are generic SQL text.

The stack is one CommonJS file, `src/library.js`, loaded through `package.json` `"main"`. It requires Node `fs` and `path` only. There is no dependency list, lockfile, test script, CI file, container, or second deployment mode.

Entry points are the exports in `src/library.js:50-58`.

`handleLookup` (`src/library.js:19-24`) sends `request.query.id` to `findUserById` when that own property exists. Otherwise it sends `request.query.name` to `findUserByName`. `findUserByName` (`src/library.js:10-12`) concatenates `name` into SQL text and calls `db.query` with one argument. `findUserById` (`src/library.js:15-16`) keeps the SQL text constant and passes `[id]`. `describeLookup` (`src/library.js:26-28`) returns `'lookup ' + request.query.name` and calls no other sink.

`readUserFile` (`src/library.js:30-33`) joins `request.query.file` onto `data/user-files` and calls `fs.readFileSync`. No allowlist or prefix check follows the join. `readPublicDoc` (`src/library.js:36-41`) reads `request.query.doc` only when the value is exactly `readme.txt` or `notes.txt` (`src/library.js:8`). `data/private/payroll.txt` is in the tree and is not named by any reader.

`authorizationHeader` (`src/library.js:46-47`) returns `Bearer ` plus the source literal `API_TOKEN` (`src/library.js:44`). The literal is `DUMMY_NOT_A_REAL_KEY`. This file does not send the header.

Trust boundaries: caller query to library; library to the host SQL function; library to the filesystem; library to a header string the host may send. Source-visible controls are the id-versus-name branch, the bound-parameter call, and `PUBLIC_NAMES`. There is no authentication check.

No prior ledger exists.

Companion files are not selected. The sample has no model call, browser DOM, cloud or IAM config, tenant lifecycle, desktop IPC, unsafe native code, RPC schema, shared quota, dependency or CI config, or HTTP parser. `request.query` arrives already split. Ordinary classes in this run are Injection, Resource and file handling, Cryptography and secrets, Obvious things, and Wildcard. Access control, Business logic, Feature abuse and data leakage, and Chained vulnerabilities are excluded because the tree has no auth check, multi-step workflow, export or search feature, or second component that trusts the first component's output.

Profile is `quick`. Subsystem canonical value is `profile/quick/all-in-scope-subsystems`.

The parent measured the host before hunting. `unshare --user --map-root-user --net --mount` can remount a bind read-only, and a write to that mount failed with "Read-only file system". A ping to `1.1.1.1` inside that network namespace exited 2. A loop mount of a 4MiB ext2 image failed with "failed to setup loop device". `mkdir /sys/fs/cgroup/auditprobe` returned "Permission denied". Node `fs.open` rejected a directory descriptor with `ERR_INVALID_ARG_TYPE`. The same unshare still sees the rest of the host filesystem, so scratch-only writes are not enforced. This run does not execute target code.


Assigned units:

coverage_id: src%2Flibrary.js%23describeLookup::src%2Flibrary.js%23describeLookup%20return::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Injection
surface: describeLookup concatenates a caller name into a returned string
boundary: the return value is not passed to SQL, the filesystem, or a command
subsystem: all in-scope subsystems
attack_class: Injection
ordinary_attack_class_block: ATTACK-CLASSES.md#Injection
starting_paths: src/library.js, README.md
selected_companion_blocks: none
excluded_blocks:
- AI-AND-LLM.md#Core discipline: No model, prompt, tool, or agent call is in the sample.
- AI-AND-LLM.md#Context, retrieval, and memory attack classes: No retrieval or memory store is in the sample.
- AI-AND-LLM.md#Tool and action attack classes: No tool schema or model-controlled action is in the sample.
- AI-AND-LLM.md#MCP and sub-agent trust classes: No MCP server or client is in the sample.
- AI-AND-LLM.md#Output and disclosure attack classes: No model output is handled in the sample.
- AI-AND-LLM.md#Universal moves: The AI companion is not selected.
- AI-AND-LLM.md#Validation rules: The AI companion is not selected.
- CLIENT-SIDE.md#Core discipline: No browser DOM, extension, or webview is in the sample.
- CLIENT-SIDE.md#DOM and object-state attack classes: No DOM or client object state is in the sample.
- CLIENT-SIDE.md#Cross-origin messaging and network attack classes: No browser messaging is in the sample.
- CLIENT-SIDE.md#Service-worker and browser-storage attack classes: No service worker or browser storage is in the sample.
- CLIENT-SIDE.md#Cross-site information leak classes: No browser document is in the sample.
- CLIENT-SIDE.md#UI-redress and navigation attack classes: No UI frame or navigation is in the sample.
- CLIENT-SIDE.md#Universal moves: The client-side companion is not selected.
- CLIENT-SIDE.md#Validation rules: The client-side companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Core discipline: No IAM, container, or cloud config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Workload identity and IAM attack classes: No workload identity is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Ingress, network, and control-plane attack classes: No ingress or control plane is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Container and orchestration attack classes: No container manifest is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Configuration and secret lifecycle attack classes: No cloud secret store is in the sample. The source literal is covered by Cryptography and secrets.
- CLOUD-AND-DEPLOYMENT.md#Managed storage, events, and edge attack classes: No managed storage or edge config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Universal moves: The cloud companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Validation rules: The cloud companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline: No tenant store, export, backup, or deletion flow is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Tenant and object-isolation attack classes: No tenant identifier is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Derived-data and disclosure attack classes: No cache, search, or analytics copy is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Export, backup, restore, and migration attack classes: No export or restore path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Deletion, revocation, and lifecycle attack classes: No deletion or revocation path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Universal moves: The data-lifecycle companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Validation rules: The data-lifecycle companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline: No deep link, webview, or local IPC endpoint is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Deep-link, callback, and navigation attack classes: No deep link is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Webview and native-bridge attack classes: No webview bridge is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Local IPC and exported-component attack classes: No local IPC socket is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Privileged-helper and local-file attack classes: File reads are covered by Resource and file handling. No privileged helper exists.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Application-state and device-lifecycle attack classes: No device lifecycle is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Universal moves: The desktop companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Validation rules: The desktop companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Core discipline: The only code is JavaScript. No unsafe native or kernel code is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Bounds, integer, and representation attack classes: No native memory operation is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Lifetime, type, and concurrency attack classes: No native lifetime or lock is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#FFI and ABI attack classes: No FFI boundary is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Binary loading and runtime attack classes: No binary loader is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Kernel and privileged-interface attack classes: No kernel interface is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Universal moves: The memory-safety companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Validation rules: The memory-safety companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Core discipline: No RPC schema, broker, or custom framing parser is in the sample. db.query is a host callback.
- PROTOCOLS-RPC-AND-MESSAGING.md#Framing, schema, and interpretation attack classes: No protocol schema is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#RPC identity and authorization attack classes: No RPC identity is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Broker and queue isolation attack classes: No broker or queue is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Replay, ordering, and transaction attack classes: No message transaction is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Universal moves: The protocol companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Validation rules: The protocol companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline: No shared worker, quota, or queue is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Computational amplification attack classes: No parser loop over untrusted structure is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Resource accumulation attack classes: No accumulation store is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Quota and scheduling attack classes: No quota is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Failure and recovery attack classes: No recovery workflow is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Universal moves: The availability companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Validation rules: The availability companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Core discipline: package.json has no dependencies, scripts, or CI config.
- SUPPLY-CHAIN-AND-RELEASE.md#Dependency and build-input attack classes: No third-party dependency is declared.
- SUPPLY-CHAIN-AND-RELEASE.md#CI and automation attack classes: No CI workflow is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Release and update attack classes: No release or updater is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Universal moves: The supply-chain companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Validation rules: The supply-chain companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Core discipline: No HTTP server or parser is in the sample. request.query is already split by the host.
- WEB-PROTOCOL-AND-AUTH.md#HTTP framing and cache attack classes: No HTTP parser or cache is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Browser-session attack classes: No cookie or session is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Federated-identity attack classes: No OAuth, OIDC, or SAML flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#MFA, passkey, and account-transition attack classes: No account recovery flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#API-key and mTLS attack classes: The bearer string is a source literal covered by Cryptography and secrets, not an HTTP authentication protocol.
- WEB-PROTOCOL-AND-AUTH.md#Universal moves: The HTTP companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Validation rules: The HTTP companion is not selected.
- ATTACK-CLASSES.md#Access control: The library has no authentication or authorization check. The host is the only caller, and no protected role is defined.
- ATTACK-CLASSES.md#Resource and file handling: Not this unit. File units cover readUserFile and readPublicDoc.
- ATTACK-CLASSES.md#Cryptography and secrets: Not this unit. The credential literal is covered by the authorizationHeader unit.
- ATTACK-CLASSES.md#Business logic: No multi-step workflow, quantity, expiry, or fallback role is in the sample.
- ATTACK-CLASSES.md#Feature abuse and data leakage: No export, search, preview, notification, or webhook feature is in the sample.
- ATTACK-CLASSES.md#Chained vulnerabilities and trust boundaries: No second component consumes the output of the first as a stronger guarantee.
- ATTACK-CLASSES.md#Wildcard: Not this unit. One Wildcard unit covers behavior outside the assigned classes.
- ATTACK-CLASSES.md#Obvious things: Not this unit. One Obvious things unit covers the repository-wide checklist.

coverage_id: src%2Flibrary.js%23findUserById::src%2Flibrary.js%23findUserById%20db.query::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Injection
surface: findUserById passes a caller id as a bound parameter
boundary: db.query receives a constant SQL text and a parameter array
subsystem: all in-scope subsystems
attack_class: Injection
ordinary_attack_class_block: ATTACK-CLASSES.md#Injection
starting_paths: src/library.js, README.md
selected_companion_blocks: none
excluded_blocks:
- AI-AND-LLM.md#Core discipline: No model, prompt, tool, or agent call is in the sample.
- AI-AND-LLM.md#Context, retrieval, and memory attack classes: No retrieval or memory store is in the sample.
- AI-AND-LLM.md#Tool and action attack classes: No tool schema or model-controlled action is in the sample.
- AI-AND-LLM.md#MCP and sub-agent trust classes: No MCP server or client is in the sample.
- AI-AND-LLM.md#Output and disclosure attack classes: No model output is handled in the sample.
- AI-AND-LLM.md#Universal moves: The AI companion is not selected.
- AI-AND-LLM.md#Validation rules: The AI companion is not selected.
- CLIENT-SIDE.md#Core discipline: No browser DOM, extension, or webview is in the sample.
- CLIENT-SIDE.md#DOM and object-state attack classes: No DOM or client object state is in the sample.
- CLIENT-SIDE.md#Cross-origin messaging and network attack classes: No browser messaging is in the sample.
- CLIENT-SIDE.md#Service-worker and browser-storage attack classes: No service worker or browser storage is in the sample.
- CLIENT-SIDE.md#Cross-site information leak classes: No browser document is in the sample.
- CLIENT-SIDE.md#UI-redress and navigation attack classes: No UI frame or navigation is in the sample.
- CLIENT-SIDE.md#Universal moves: The client-side companion is not selected.
- CLIENT-SIDE.md#Validation rules: The client-side companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Core discipline: No IAM, container, or cloud config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Workload identity and IAM attack classes: No workload identity is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Ingress, network, and control-plane attack classes: No ingress or control plane is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Container and orchestration attack classes: No container manifest is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Configuration and secret lifecycle attack classes: No cloud secret store is in the sample. The source literal is covered by Cryptography and secrets.
- CLOUD-AND-DEPLOYMENT.md#Managed storage, events, and edge attack classes: No managed storage or edge config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Universal moves: The cloud companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Validation rules: The cloud companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline: No tenant store, export, backup, or deletion flow is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Tenant and object-isolation attack classes: No tenant identifier is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Derived-data and disclosure attack classes: No cache, search, or analytics copy is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Export, backup, restore, and migration attack classes: No export or restore path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Deletion, revocation, and lifecycle attack classes: No deletion or revocation path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Universal moves: The data-lifecycle companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Validation rules: The data-lifecycle companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline: No deep link, webview, or local IPC endpoint is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Deep-link, callback, and navigation attack classes: No deep link is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Webview and native-bridge attack classes: No webview bridge is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Local IPC and exported-component attack classes: No local IPC socket is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Privileged-helper and local-file attack classes: File reads are covered by Resource and file handling. No privileged helper exists.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Application-state and device-lifecycle attack classes: No device lifecycle is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Universal moves: The desktop companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Validation rules: The desktop companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Core discipline: The only code is JavaScript. No unsafe native or kernel code is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Bounds, integer, and representation attack classes: No native memory operation is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Lifetime, type, and concurrency attack classes: No native lifetime or lock is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#FFI and ABI attack classes: No FFI boundary is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Binary loading and runtime attack classes: No binary loader is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Kernel and privileged-interface attack classes: No kernel interface is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Universal moves: The memory-safety companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Validation rules: The memory-safety companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Core discipline: No RPC schema, broker, or custom framing parser is in the sample. db.query is a host callback.
- PROTOCOLS-RPC-AND-MESSAGING.md#Framing, schema, and interpretation attack classes: No protocol schema is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#RPC identity and authorization attack classes: No RPC identity is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Broker and queue isolation attack classes: No broker or queue is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Replay, ordering, and transaction attack classes: No message transaction is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Universal moves: The protocol companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Validation rules: The protocol companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline: No shared worker, quota, or queue is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Computational amplification attack classes: No parser loop over untrusted structure is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Resource accumulation attack classes: No accumulation store is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Quota and scheduling attack classes: No quota is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Failure and recovery attack classes: No recovery workflow is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Universal moves: The availability companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Validation rules: The availability companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Core discipline: package.json has no dependencies, scripts, or CI config.
- SUPPLY-CHAIN-AND-RELEASE.md#Dependency and build-input attack classes: No third-party dependency is declared.
- SUPPLY-CHAIN-AND-RELEASE.md#CI and automation attack classes: No CI workflow is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Release and update attack classes: No release or updater is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Universal moves: The supply-chain companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Validation rules: The supply-chain companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Core discipline: No HTTP server or parser is in the sample. request.query is already split by the host.
- WEB-PROTOCOL-AND-AUTH.md#HTTP framing and cache attack classes: No HTTP parser or cache is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Browser-session attack classes: No cookie or session is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Federated-identity attack classes: No OAuth, OIDC, or SAML flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#MFA, passkey, and account-transition attack classes: No account recovery flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#API-key and mTLS attack classes: The bearer string is a source literal covered by Cryptography and secrets, not an HTTP authentication protocol.
- WEB-PROTOCOL-AND-AUTH.md#Universal moves: The HTTP companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Validation rules: The HTTP companion is not selected.
- ATTACK-CLASSES.md#Access control: The library has no authentication or authorization check. The host is the only caller, and no protected role is defined.
- ATTACK-CLASSES.md#Resource and file handling: Not this unit. File units cover readUserFile and readPublicDoc.
- ATTACK-CLASSES.md#Cryptography and secrets: Not this unit. The credential literal is covered by the authorizationHeader unit.
- ATTACK-CLASSES.md#Business logic: No multi-step workflow, quantity, expiry, or fallback role is in the sample.
- ATTACK-CLASSES.md#Feature abuse and data leakage: No export, search, preview, notification, or webhook feature is in the sample.
- ATTACK-CLASSES.md#Chained vulnerabilities and trust boundaries: No second component consumes the output of the first as a stronger guarantee.
- ATTACK-CLASSES.md#Wildcard: Not this unit. One Wildcard unit covers behavior outside the assigned classes.
- ATTACK-CLASSES.md#Obvious things: Not this unit. One Obvious things unit covers the repository-wide checklist.

coverage_id: src%2Flibrary.js%23findUserByName::src%2Flibrary.js%23findUserByName%20db.query::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Injection
surface: findUserByName concatenates a caller name into SQL
boundary: db.query receives that SQL text as its only argument
subsystem: all in-scope subsystems
attack_class: Injection
ordinary_attack_class_block: ATTACK-CLASSES.md#Injection
starting_paths: src/library.js, README.md
selected_companion_blocks: none
excluded_blocks:
- AI-AND-LLM.md#Core discipline: No model, prompt, tool, or agent call is in the sample.
- AI-AND-LLM.md#Context, retrieval, and memory attack classes: No retrieval or memory store is in the sample.
- AI-AND-LLM.md#Tool and action attack classes: No tool schema or model-controlled action is in the sample.
- AI-AND-LLM.md#MCP and sub-agent trust classes: No MCP server or client is in the sample.
- AI-AND-LLM.md#Output and disclosure attack classes: No model output is handled in the sample.
- AI-AND-LLM.md#Universal moves: The AI companion is not selected.
- AI-AND-LLM.md#Validation rules: The AI companion is not selected.
- CLIENT-SIDE.md#Core discipline: No browser DOM, extension, or webview is in the sample.
- CLIENT-SIDE.md#DOM and object-state attack classes: No DOM or client object state is in the sample.
- CLIENT-SIDE.md#Cross-origin messaging and network attack classes: No browser messaging is in the sample.
- CLIENT-SIDE.md#Service-worker and browser-storage attack classes: No service worker or browser storage is in the sample.
- CLIENT-SIDE.md#Cross-site information leak classes: No browser document is in the sample.
- CLIENT-SIDE.md#UI-redress and navigation attack classes: No UI frame or navigation is in the sample.
- CLIENT-SIDE.md#Universal moves: The client-side companion is not selected.
- CLIENT-SIDE.md#Validation rules: The client-side companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Core discipline: No IAM, container, or cloud config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Workload identity and IAM attack classes: No workload identity is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Ingress, network, and control-plane attack classes: No ingress or control plane is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Container and orchestration attack classes: No container manifest is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Configuration and secret lifecycle attack classes: No cloud secret store is in the sample. The source literal is covered by Cryptography and secrets.
- CLOUD-AND-DEPLOYMENT.md#Managed storage, events, and edge attack classes: No managed storage or edge config is in the sample.
- CLOUD-AND-DEPLOYMENT.md#Universal moves: The cloud companion is not selected.
- CLOUD-AND-DEPLOYMENT.md#Validation rules: The cloud companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline: No tenant store, export, backup, or deletion flow is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Tenant and object-isolation attack classes: No tenant identifier is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Derived-data and disclosure attack classes: No cache, search, or analytics copy is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Export, backup, restore, and migration attack classes: No export or restore path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Deletion, revocation, and lifecycle attack classes: No deletion or revocation path is in the sample.
- DATA-ISOLATION-AND-LIFECYCLE.md#Universal moves: The data-lifecycle companion is not selected.
- DATA-ISOLATION-AND-LIFECYCLE.md#Validation rules: The data-lifecycle companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline: No deep link, webview, or local IPC endpoint is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Deep-link, callback, and navigation attack classes: No deep link is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Webview and native-bridge attack classes: No webview bridge is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Local IPC and exported-component attack classes: No local IPC socket is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Privileged-helper and local-file attack classes: File reads are covered by Resource and file handling. No privileged helper exists.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Application-state and device-lifecycle attack classes: No device lifecycle is in the sample.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Universal moves: The desktop companion is not selected.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md#Validation rules: The desktop companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Core discipline: The only code is JavaScript. No unsafe native or kernel code is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Bounds, integer, and representation attack classes: No native memory operation is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Lifetime, type, and concurrency attack classes: No native lifetime or lock is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#FFI and ABI attack classes: No FFI boundary is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Binary loading and runtime attack classes: No binary loader is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Kernel and privileged-interface attack classes: No kernel interface is in the sample.
- MEMORY-SAFETY-AND-BINARY.md#Universal moves: The memory-safety companion is not selected.
- MEMORY-SAFETY-AND-BINARY.md#Validation rules: The memory-safety companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Core discipline: No RPC schema, broker, or custom framing parser is in the sample. db.query is a host callback.
- PROTOCOLS-RPC-AND-MESSAGING.md#Framing, schema, and interpretation attack classes: No protocol schema is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#RPC identity and authorization attack classes: No RPC identity is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Broker and queue isolation attack classes: No broker or queue is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Replay, ordering, and transaction attack classes: No message transaction is in the sample.
- PROTOCOLS-RPC-AND-MESSAGING.md#Universal moves: The protocol companion is not selected.
- PROTOCOLS-RPC-AND-MESSAGING.md#Validation rules: The protocol companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline: No shared worker, quota, or queue is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Computational amplification attack classes: No parser loop over untrusted structure is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Resource accumulation attack classes: No accumulation store is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Quota and scheduling attack classes: No quota is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Failure and recovery attack classes: No recovery workflow is in the sample.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Universal moves: The availability companion is not selected.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Validation rules: The availability companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Core discipline: package.json has no dependencies, scripts, or CI config.
- SUPPLY-CHAIN-AND-RELEASE.md#Dependency and build-input attack classes: No third-party dependency is declared.
- SUPPLY-CHAIN-AND-RELEASE.md#CI and automation attack classes: No CI workflow is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Release and update attack classes: No release or updater is in the sample.
- SUPPLY-CHAIN-AND-RELEASE.md#Universal moves: The supply-chain companion is not selected.
- SUPPLY-CHAIN-AND-RELEASE.md#Validation rules: The supply-chain companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Core discipline: No HTTP server or parser is in the sample. request.query is already split by the host.
- WEB-PROTOCOL-AND-AUTH.md#HTTP framing and cache attack classes: No HTTP parser or cache is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Browser-session attack classes: No cookie or session is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#Federated-identity attack classes: No OAuth, OIDC, or SAML flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#MFA, passkey, and account-transition attack classes: No account recovery flow is in the sample.
- WEB-PROTOCOL-AND-AUTH.md#API-key and mTLS attack classes: The bearer string is a source literal covered by Cryptography and secrets, not an HTTP authentication protocol.
- WEB-PROTOCOL-AND-AUTH.md#Universal moves: The HTTP companion is not selected.
- WEB-PROTOCOL-AND-AUTH.md#Validation rules: The HTTP companion is not selected.
- ATTACK-CLASSES.md#Access control: The library has no authentication or authorization check. The host is the only caller, and no protected role is defined.
- ATTACK-CLASSES.md#Resource and file handling: Not this unit. File units cover readUserFile and readPublicDoc.
- ATTACK-CLASSES.md#Cryptography and secrets: Not this unit. The credential literal is covered by the authorizationHeader unit.
- ATTACK-CLASSES.md#Business logic: No multi-step workflow, quantity, expiry, or fallback role is in the sample.
- ATTACK-CLASSES.md#Feature abuse and data leakage: No export, search, preview, notification, or webhook feature is in the sample.
- ATTACK-CLASSES.md#Chained vulnerabilities and trust boundaries: No second component consumes the output of the first as a stronger guarantee.
- ATTACK-CLASSES.md#Wildcard: Not this unit. One Wildcard unit covers behavior outside the assigned classes.
- ATTACK-CLASSES.md#Obvious things: Not this unit. One Obvious things unit covers the repository-wide checklist.

Selected blocks, copied verbatim:

**Injection**
(subagent_type: `general`)
Trace untrusted input from entry point to dangerous sink. What counts as a "dangerous sink" depends on the application:
- Web apps: SQL queries, HTML output, shell commands, template engines, file paths, HTTP redirects, deserialization
- Libraries: any function that processes caller-supplied data without validation — buffer operations, parsers, format strings
- CLI tools: shell command construction, file path handling, environment variable interpolation
- Services: query construction, message serialization, log injection, LDAP/XPATH queries
- Client-side (browser/JS): DOM XSS, prototype pollution, `postMessage`/origin trust, and other browser-side classes — covered by the [CLIENT-SIDE.md](CLIENT-SIDE.md) companion blocks when selected

Do not stop at the obvious direct paths. Look for indirect injection: data stored safely, then retrieved and used in a dangerous context by different code. Look for injection through field names, keys, headers, and metadata — not just values. Look for injection into secondary systems (logs, caches, search indexes, analytics).

Sandbox is not approved for this run. Measured on this host: unshare --user --map-root-user --net --mount can remount a bind read-only. A ping to 1.1.1.1 inside that network namespace exited 2. mount of a 4MiB ext2 image failed: failed to setup loop device. mkdir /sys/fs/cgroup/auditprobe failed: Permission denied. node fs.open rejected a directory descriptor with ERR_INVALID_ARG_TYPE. The unshare still sees the host filesystem outside the remounted path, so scratch-only writes are not enforced. Do not execute target code. Do not propose verdict confirmed. Use proposed_verdict needs_validation when the source trace is real and the missing fact is a bounded local result or a deployment fact. Name that sandbox gap in blockers when it is the reason you cannot confirm. If a source-visible control already prevents the effect, return no candidate for that unit and set disposition covered.

No carried prior confirmed records.
Peer-owned coverage IDs you must not duplicate:
sample%23repository-tree::sample%23source-literals::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Obvious%20things
src%2Flibrary.js%23authorizationHeader::src%2Flibrary.js%23API_TOKEN::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Cryptography%20and%20secrets
src%2Flibrary.js%23module.exports::sample%23unassigned-behavior::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Wildcard
src%2Flibrary.js%23readPublicDoc::src%2Flibrary.js%23PUBLIC_NAMES::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Resource%20and%20file%20handling
src%2Flibrary.js%23readUserFile::src%2Flibrary.js%23USER_FILES::profile%2Fquick%2Fall-in-scope-subsystems::ATTACK-CLASSES.md%23Resource%20and%20file%20handling

Your scratch directory is /workspace/tryouts/security-audit-skill/audit/run-1/agents/hunter-injection/scratch. Do not write it. Your artifacts directory is parent-owned. Promotion allowlist is empty. Per-file byte limit is 0. Cumulative byte limit is 0. Safe agent id: hunter-injection.

Artifact promotion procedure (trusted parent-side code only):
Reference only for you: the parent performs these steps; you never perform them.

Before execution, the parent opens and retains trusted, non-inheritable directory
descriptors for the agent's scratch/ and artifacts/ roots, and records an allowlist
of expected scratch-relative artifact files plus explicit per-file and cumulative
byte limits. Never pass those descriptors to the agent or sandbox. After the sandbox
and all its processes terminate, trusted parent-side code promotes each allowlisted
file separately:

1. Validate the declared relative path: reject absolute, empty, `.`, `..`, or
   symlinked components.
2. Walk each parent component from the retained scratch-root descriptor with
   no-follow directory-relative operations; never reopen by path.
3. Open the leaf no-follow and nonblocking.
4. Verify with `fstat` that it is a regular file with link count exactly one and
   within the recorded per-file and cumulative byte limits.
5. Enforce those limits again while reading from that descriptor.
6. Copy exactly the verified size, repeat `fstat`, and reject a changed identity,
   type, link count, or size.
7. For the destination, walk every parent component from the retained
   artifacts-root descriptor with no-follow directory-relative operations; require
   each existing component to be a real directory, and create any missing directory
   exclusively before reopening and verifying it no-follow.
8. Create the leaf exclusively without following links, verify that the opened
   destination is a regular file with link count exactly one, and copy from the
   verified source descriptor without reopening either path.
9. Use equivalent race-safe APIs on non-POSIX systems.
10. Never recursively copy or glob scratch, extract an archive into artifacts, or
    open or promote a symlink, FIFO, socket, device, directory, hard-linked file,
    changing file, or file that exceeds its bound.
11. If any check is unavailable, cannot be enforced, or fails, discard the scratch
    entry; if it is decisive evidence, retain `needs_validation` with the exact
    promotion blocker.

## Candidate gate

1. A candidate needs a complete repository-relative source trace and evidence for the
   claimed root cause, including the strongest source-visible control.
2. A proposed confirmed record needs a bounded local observed result, meaningful impact
   across a stated boundary, complete conditions, and no visible preventing layer.
3. Do not strengthen a crash into code execution, ordinary work into shared availability,
   or a same-principal action into privilege gain.
4. If a required fact is not source-visible or locally observable, use
   needs_validation. Name exact blockers; do not give it severity or speculative completion.
5. A missing best practice with no affected principal/resource is excluded or hardening,
   not a finding. A candidate disproved by source is not needs_validation.
6. Use the same source-derived fingerprint for the same root cause in every state.
   It must match `^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$` and must not include a line,
   wave, agent, severity, or verdict.
7. Return an empty candidate array when nothing survives these gates.

erability Hunting

### Phase 2: Run coverage-led hunting waves

The parent assigns `planned` ledger units to `general` agents. Use enough focused hunters to cover the units without combining unrelated boundaries. One hunter may own closely related units in one subsystem; no unit may be silently unassigned because of an agent-count limit — a unit the budget cannot reach is explicitly `deferred` with reason `budget_cannot_reserve_critics_and_validation`.

When a budget or profile caps hunter count, assign units in priority order and record the ordering rationale in the ledger. Rank by: (1) unauthenticated or lowest-trust entry surfaces before authenticated ones; (2) boundaries protecting the most valuable resources (credentials, cross-tenant data, code execution, release authority); (3) prior-run gaps, revalidation targets, and changed source before same-source re-passes; (4) units whose class historically yields confirmed findings for this target type over speculative ones. Ties break lexicographically by `coverage_id` so runs stay deterministic.

Before launch, the parent changes assigned units to `in_progress`, sets a canonical lowercase `agent_id`, and creates that agent's `scratch/` and parent-owned `artifacts/`. Hunters read source and parent-provided context, write only to their unique `scratch/`, and return one structured result through the Task tool. They never write retained artifacts or edit target source, `architecture.md`, `coverage-ledger.json`, `findings.json`, or another agent's files.

## Required hunter prompt

Every hunter prompt contains these parts in this order:

1. A two-sentence role preamble: the hunter's goal is to find source-grounded security invariant failures in its assigned units, and it must return exactly one JSON object matching the structured-result contract at the end of this prompt.
2. `architecture.md` verbatim.
3. Assigned coverage IDs, subsystem, boundary, repository-relative starting paths, and each unit's assignment block map from `coverage-ledger.json`.
4. The exact selected blocks, copied verbatim: each selected ordinary attack-class block from `ATTACK-CLASSES.md`, and from each selected companion its `Core discipline`, each chosen attack-class subsection, `Universal moves`, and `Validation rules`. Ordinary blocks are self-contained and carry no companion-style `Core discipline`, `Universal moves`, or `Validation rules` sections. Do not send block or companion names alone.
5. Explicit excluded ordinary and companion blocks with a reason for each exclusion.
6. The core hunting method below, followed by the promotion procedure block.
7. The core validation rules below.
8. Carried same-source prior confirmed exclusions, each limited to fingerprint, title, and root cause, plus peer-owned current coverage IDs that this hunter must not duplicate.
9. The unique scratch/artifact paths, safe agent ID, predeclared promotion allowlist and byte limits, and the structured-result contract, including the Structured hunter result block below and the `confirmed` and `needs_validation` branches of `report-schema.json` copied verbatim.

A prompt may select several companion blocks when the same path crosses several domains. Keep their constraints together. Scope is the hunter's coverage obligation, not permission to duplicate excluded work. If an unexpected different boundary appears, return it under `uncovered` so the parent creates a stable ledger unit and assigns it in the next wave.

#### Core hunting method — include in every hunter prompt

Structured hunter result. Return exactly one JSON object with this shape:
{
  "units": [
    {
      "coverage_id": "one assigned ID",
      "disposition": "covered|candidate|blocked",
      "reviewed_paths": ["repo/relative/path"],
      "checks": [
        {
          "agent_id": "hunter-injection",
          "reviewed_paths": ["repo/relative/path owned by this check"],
          "invariant": "specific control checked for this unit",
          "method": "source",
          "result": "what source established",
          "artifact": null
        }
      ],
      "candidate_fingerprints": [],
      "unresolved": []
    }
  ],
  "candidates": [],
  "hardening": [],
  "uncovered": []
}

Each candidates entry uses proposed_verdict instead of verdict.
proposed_verdict needs_validation requires fingerprint, title, description, claimed_root_cause, trace, evidence, blockers, validation_plan.
Do not include severity, execution, remediation, reason, or root_cause on a needs_validation candidate.
A trace starts with entrypoint and ends with sink. Intermediate steps are propagation.
fingerprint matches ^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$ and contains no line number, wave, agent, severity, or verdict.
Every assigned coverage ID appears exactly once.
method is source and artifact is null.
A covered unit has nonempty reviewed_paths and checks, no unresolved fact, and no candidate.
A candidate unit has the same owned evidence and lists the linked fingerprints.
A blocked unit has nonempty paths, checks, and unresolved facts, and no fingerprint.

Confirmed and needs_validation branches of report-schema.json, copied verbatim. Ignore the confirmed branch for proposals in this run because execution is not approved. Use the needs_validation branch, with proposed_verdict in place of verdict:

{
  "$comment": "Top-level contract for findings.json. validate-findings.cjs interprets and checks this schema directly.",
  "type": "array",
  "items": {
    "oneOf": [
      {
        "type": "object",
        "description": "A source-grounded vulnerability that was independently demonstrated.",
        "properties": {
          "verdict": {
            "type": "string",
            "const": "confirmed"
          },
          "fingerprint": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$",
            "description": "A stable source-derived identifier that does not change between validation states."
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "root_cause": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "intended_behavior": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "trace": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "kind": {
                  "type": "string",
                  "enum": ["entrypoint", "propagation", "sink"]
                },
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "scope": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["kind", "file", "line", "scope", "description"],
              "additionalProperties": false
            }
          },
          "evidence": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["file", "line", "description"],
              "additionalProperties": false
            }
          },
          "conditions": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "kind": {
                  "type": "string",
                  "enum": ["authentication_level", "authorization_role", "user_interaction", "system_configuration", "network_routing", "environmental_dependency", "data_state", "timing_dependency", "third_party_dependency"]
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["kind", "description"],
              "additionalProperties": false
            }
          },
          "execution": {
            "type": "object",
            "description": "Target-neutral reproduction in the target's native interface.",
            "properties": {
              "attacker_perspective": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              },
              "payloads": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": true,
                "items": {
                  "type": "string"
                }
              },
              "instructions": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "observed_result": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              }
            },
            "required": ["attacker_perspective", "payloads", "instructions", "observed_result"],
            "additionalProperties": false
          },
          "remediation": {
            "type": "object",
            "properties": {
              "strategy": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              },
              "code_changes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "file_name": {
                      "type": "string",
                      "minLength": 1
                    },
                    "fixed_code": {
                      "type": "string"
                    }
                  },
                  "required": ["file_name", "fixed_code"],
                  "additionalProperties": false
                }
              }
            },
            "required": ["strategy"],
            "additionalProperties": false
          },
          "severity": {
            "type": "object",
            "properties": {
              "likelihood": {
                "type": "object",
                "properties": {
                  "score": {
                    "type": "string",
                    "enum": ["informational", "low", "medium", "high", "critical"]
                  },
                  "reason": {
                    "type": "string",
                    "minLength": 1,
                    "visibleContent": true
                  }
                },
                "required": ["score", "reason"],
                "additionalProperties": false
              },
              "impact": {
                "type": "object",
                "properties": {
                  "score": {
                    "type": "string",
                    "enum": ["informational", "low", "medium", "high", "critical"]
                  },
                  "reason": {
                    "type": "string",
                    "minLength": 1,
                    "visibleContent": true
                  }
                },
                "required": ["score", "reason"],
                "additionalProperties": false
              },
              "overall_severity": {
                "type": "string",
                "enum": ["informational", "low", "medium", "high", "critical"]
              }
            },
            "required": ["likelihood", "impact", "overall_severity"],
            "additionalProperties": false
          },
          "confidence": {
            "type": "object",
            "properties": {
              "score": {
                "type": "string",
                "enum": ["low", "medium", "high"]
              },
              "reason": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              }
            },
            "required": ["score", "reason"],
            "additionalProperties": false
          }
        },
        "required": ["verdict", "fingerprint", "title", "description", "root_cause", "intended_behavior", "trace", "evidence", "conditions", "execution", "remediation", "severity", "confidence"],
        "additionalProperties": false
      },
      {
        "type": "object",
        "description": "A source-grounded candidate whose decisive validation is blocked.",
        "properties": {
          "verdict": {
            "type": "string",
            "const": "needs_validation"
          },
          "fingerprint": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$"
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "claimed_root_cause": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "trace": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "kind": {
                  "type": "string",
                  "enum": ["entrypoint", "propagation", "sink"]
                },
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "scope": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["kind", "file", "line", "scope", "description"],
              "additionalProperties": false
            }
          },
          "evidence": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["file", "line", "description"],
              "additionalProperties": false
            }
          },
          "blockers": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "validation_plan": {
            "type": "object",
            "properties": {
              "local": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              },
              "deployment": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              }
            },
            "additionalProperties": false
          }
        },
        "required": ["verdict", "fingerprint", "title", "description", "claimed_root_cause", "trace", "evidence", "blockers", "validation_plan"],
        "additionalProperties": false
      },
      {
        "type": "object",
        "description": "A source-grounded candidate refuted during validation.",
        "properties": {
          "verdict": {
            "type": "string",
            "const": "rejected"
          },
          "fingerprint": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$"
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "claimed_root_cause": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "trace": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "kind": {
                  "type": "string",
                  "enum": ["entrypoint", "propagation", "sink"]
                },
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "scope": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["kind", "file", "line", "scope", "description"],
              "additionalProperties": false
            }
          },
          "evidence": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "file": {
                  "type": "string",
                  "minLength": 1
                },
                "line": {
                  "type": "integer",
                  "minimum": 1
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "visibleContent": true
                }
              },
              "required": ["file", "line", "description"],
              "additionalProperties": false
            }
          },
          "reason": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          }
        },
        "required": ["verdict", "fingerprint", "title", "description", "claimed_root_cause", "trace", "evidence", "reason"],
        "additionalProperties": false
      }
    ]
  }
}

