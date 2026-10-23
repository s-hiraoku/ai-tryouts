# Needs validation

These leads have no severity. They are not confirmed vulnerabilities.

## Untrusted caller name is concatenated into SQL passed to db.query

Fingerprint `src/library.js:findUserByName:name-sql-concatenation`.

The host's caller reaches `handleLookup` in `src/library.js`. When `request.query` has no own `id`, line 23 passes `request.query.name` to `findUserByName`. Line 11 concatenates that name into SQL text. Line 12 calls `db.query` with that text only. `findUserById` keeps its SQL text constant and passes `[id]`. That control does not apply to the name path.

Blocker. The run did not observe the argument list `db.query` receives.

Local plan. In an approved sandbox, call `handleLookup` with a `db.query` that records its arguments and a name that contains a quote. Record the argument list. Do not send the statement to a shared database.

## readUserFile joins a caller path and reads it without a directory check

Fingerprint `src/library.js:readUserFile:path.join:request.query.file`.

`readUserFile` takes `request.query.file` at line 31, joins it to `data/user-files` at line 32, and returns `fs.readFileSync` at line 33. No allowlist follows the join. `readPublicDoc` does have an allowlist, and that check is not on this path.

Blocker. The returned file text was not observed.

Local plan. On an isolated copy, call `readUserFile` for `hello.txt` and for the parent-segment path of `data/private/payroll.txt`. Compare the returned strings with those files. Stop after those two calls.

Owner check. Ask whether the host passes the caller's `request.query.file` into `readUserFile` and whether that process can read `data/private`. Do not send a request to a live host.
