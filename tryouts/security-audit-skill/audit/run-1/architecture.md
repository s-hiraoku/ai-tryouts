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
