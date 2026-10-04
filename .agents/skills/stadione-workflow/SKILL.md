---
name: stadione-workflow
description: Mandatory workflow for every Stadione code, configuration, database, editorial automation, and deployment change.
---

# Stadione change workflow

Apply this skill whenever working on Stadione.

1. Inspect the relevant repository state and preserve unrelated changes.
2. Make and verify the requested change.
3. Update `STADIONE_PLAN_MASTER.md` in the same change. Record the date in Asia/Jakarta, summary, affected files/services/database objects, deployment state, verification evidence, rollback commit, and remaining work.
4. Commit every completed change. Keep implementation and its Plan Master update in the same commit whenever practical. Never leave a completed production change without a corresponding commit.
5. Report the commit hash so the change can be rolled back. Do not rewrite or delete prior Plan Master history.
6. Use TD Connector for VPS inspection, deployment, service management, database migration, and production verification.
7. Before deployment, confirm the commit and Plan Master entry exist. After deployment, verify the live service and add deployment evidence to the Plan Master; create a follow-up commit if the evidence was unavailable before deployment.
8. Do not include secrets, tokens, passwords, private keys, or raw environment values in commits or the Plan Master.
