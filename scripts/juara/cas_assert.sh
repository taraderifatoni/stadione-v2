#!/usr/bin/env bash
# Assertive check of sanitized rehearsal output. Usage: cas_assert.sh <logfile>
set -euo pipefail
LOG="$1"
check() { grep -q "$1" "$LOG" || { echo "ASSERT_FAIL missing: $1"; exit 1; }; }
check "STAGING_READY"
check "NEG_sd_before_migration RC=1"
check "OK_owner_backfill RC=0"
check "after_owner_rev=1 migrated=true"
check "OK_sd_existing_finance_preserved RC=0"
check "after_sd_rev=2 finance=bb"
check "NEG_fin_direct_rpc RC=1"
check "NEG_cross_tenant RC=0 :: 0"
check "CAS_PARALLEL_RC=0/1"
check "REVISION_CONFLICT"
check "STAGE_DROPPED"
echo "ASSERTIONS_PASS"
