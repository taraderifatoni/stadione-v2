# Migration Register — feature execution

Pemegang nomor: PM (P1 custodian saat aktif). Satu ID unik per migration; coding boleh paralel,
urutan migration/release diserialkan. Tidak ada migration yang di-apply produksi tanpa gate.

| ID | Pod / packet | File | Status |
|---|---|---|---|
| 20260730000012 | S3 / W01 | `supabase/migrations/20260730000012_payment_webhook_events.sql` | Reserved — W01 |
| 20261124000014 | JUARA / P1 | `database/juara/migrations/20261124000014_juara_action_policies.sql` | staging-only, produksi belum |
| 20261124000016 | JUARA / P1 | `database/juara/migrations/20261124000016_juara_draft_cas_reconcile.sql` | staging-only, produksi belum |

Aturan: expand-contract; rollback artifact kompatibel dengan schema baru; tidak ada rollback
dengan melemahkan RLS/CAS.
