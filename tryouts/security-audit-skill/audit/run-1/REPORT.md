# Report

This is a quick, partial pass. It is not complete coverage of `fixture-library`. No prior ledger existed. Budget was unset. The source ref is commit `c8dcfc74bd1f52ae812c741f4e14b5d03d1194ae`, and the sample worktree was clean when the run started. The run did not execute target code. A read-only bind and a network namespace were available. Scratch-only writes, a size-limited scratch filesystem, and cgroup limits were not. Twelve agent calls ran. Four were reconnaissance, five were hunters, one was the final critic, and two were verifiers.

The critic returned no missing units and no reassignments.

## Posture

The library trusts the host and does not trust `request.query`. Two leads remain because the source trace is real and the local result was not observed. Nothing in this run is a confirmed vulnerability.

## Confirmed findings

No confirmed findings.

## Needs validation

| Title | Trace | Blocker | Next local step |
| --- | --- | --- | --- |
| Untrusted caller name is concatenated into SQL passed to `db.query` | `src/library.js` `handleLookup` to `findUserByName` to `db.query` | The argument list `db.query` receives was not observed | Call `handleLookup` with a recording `db.query` inside an approved sandbox |
| `readUserFile` joins a caller path and reads it without a directory check | `src/library.js` `readUserFile` to `path.join` to `fs.readFileSync` | The returned file text was not observed | Call `readUserFile` on an isolated copy and compare the text with `data/private/payroll.txt` and `data/user-files/hello.txt` |

## Hardening and positive patterns

`findUserById` passes the id in a parameter array. `readPublicDoc` admits only `readme.txt` and `notes.txt`. `describeLookup` returns a string and calls no other sink. The sample has no `.gitignore` and also has no env file or key file.

## Coverage

Covered 6. Candidate 2. Blocked 0. Deferred 0. Out of scope 0. The final critic accepted no further units. Companion files were not selected. Access control, business logic, feature abuse, and chained trust were excluded because the sample has no auth check, multi-step workflow, export feature, or second component.
