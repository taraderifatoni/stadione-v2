# Repository type-check debt baseline

Recorded: 26 November 2026. Source: `docs/execution/rehearsals/w07/dto-tsc.log` in accepted W07 worktree `bcc306/w07-dto-pm@3e1466e`.

Command: `./node_modules/.bin/tsc --noEmit --incremental false`

Result: exit 2, **30 errors across seven existing test files**. None are in W07 or the W07 repro script.

| File | Errors |
|---|---:|
| `tests/juara/draft-dto.test.ts` | 13 |
| `tests/juara/draft-recovery.test.ts` | 7 |
| `tests/juara/draft-write.test.ts` | 1 |
| `tests/juara/pdf.test.ts` | 1 |
| `tests/juara/playbook-save.test.ts` | 4 |
| `tests/juara/provider-guard.test.ts` | 2 |
| `tests/juara/tactics.test.ts` | 2 |
| **Total** | **30** |

Status: existing test-typing debt, not caused by the accepted W07 source diff. Do not claim repository-wide type-check is green. Do not silence these errors with blanket `@ts-ignore`, `as any`, or lowered compiler settings. Track remediation separately with file-specific tests and evidence.
