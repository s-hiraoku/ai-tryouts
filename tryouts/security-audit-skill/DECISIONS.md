# Decisions

The done check is a recorded commit of the skill, a sample with an answer key, a run whose validators pass, and a Japanese README that separates observed results from things this run did not do.

Profile is `quick` because `SKILL.md` defines that profile for a small target. The sample is one library file.

The output directory is `audit/run-1`, outside `sample/` and inside this tryout. The skill's default is a directory under the home folder. The task asked for every file under `tryouts/security-audit-skill/`.

Target code was not executed during the audit. `unshare` could remount a directory read-only and isolate the network. A loop mount failed, cgroup directory creation was denied, and a process in that `unshare` could still see the rest of the host filesystem. `SKILL.md` says to skip target execution when any required control is missing.

Hunters and verifiers were separate sessions. Claude Opus was not available in this account, so both roles used `grok-4.7-xhigh`. That is weaker independence than two model families. The blog post says validation should use a different model from discovery.

The answer key was committed before the audit agents ran. Agents were told not to read it.

Saved hunter and verifier JSON is a parent transcription. Dispositions, fingerprints, and trace line numbers match the agent returns. Some check text was shortened in the saved files.
