<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Mandatory Stadione workflow

These rules apply to every Stadione code, configuration, database, editorial automation, and deployment change.

1. Verify the change and commit it. Do not leave completed work only in a working tree or on the production server.
2. Update `STADIONE_PLAN_MASTER.md` for every change in the same commit whenever practical. Record what changed, why, affected files/services/database objects, deployment state, verification evidence, rollback commit, and remaining work.
3. Preserve the Plan Master history. Append or amend the current entry; do not erase prior entries.
4. Use TD Connector for VPS inspection, deployment, service management, database migrations, and production verification.
5. Before deployment, confirm the implementation and Plan Master update are committed. After deployment, add live verification evidence; use a follow-up commit when necessary.
6. Never store secrets, tokens, passwords, private keys, or raw environment values in Git or the Plan Master.
