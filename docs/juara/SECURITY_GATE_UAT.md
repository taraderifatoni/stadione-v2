# UAT Gate Keamanan — P1/D2 (24 November 2026)

Konteks: mandat eksekusi Owner Representative. Bukti runtime untuk anti eskalasi role
dan gate per aksi. Bukan klaim deployed/accepted.

## Kode

- `src/lib/juara/capabilities.ts` — matriks capability per peran (Owner Rep §11).
  Finance hanya `finance.clearance`, bukan `playbook.activate`; Head Coach tidak
  `salary.read`/`pnl.read`; Secretary hanya baca.
- `src/lib/juara/server/authz.ts` — `requireCapability()` → session → membership →
  capability; club_id selalu dari membership, bukan request.
- `redactForRole()` — field gaji/kontrak/equity dan P&L dibuang dari DTO untuk peran
  yang tidak berhak.
- Route v1: `playbooks` GET/POST, `generate`, `export`, `members/invite` memakai gate.
  Metadata PDF (downloader/role/waktu) berasal dari server, bukan payload klien.

## Migrasi M-12 (non-destruktif)

- Policy `juara_club_members_tenant FOR ALL` diganti `juara_club_members_read FOR SELECT`.
- Fungsi `juara_set_member_role(uuid,text)` SECURITY DEFINER, hanya OWNER klub yang sama.
- Tidak ada baris dihapus/diubah. Rollback ada di komentar file M-12.

## Bukti runtime (PostgREST/RPC langsung, akun uji dibuat & dihapus)

| Uji | Hasil |
|---|---|
| Non-owner `PATCH /rest/v1/juara_club_members?user_id=...&role=OWNER` dengan `return=representation` | **HTTP 200, body `[]`** — tidak ada baris terubah; role di DB tetap `HEAD_COACH` |
| Non-owner RPC `juara_set_member_role(self,'OWNER')` | **HTTP 400, `P0001`** — "Hanya Owner klub yang boleh mengubah role" |
| Owner RPC `juara_set_member_role(user,'SPORTING_DIRECTOR')` lalu revert | **204 / 204** |
| `anon` melihat `juara_club_members` | terverifikasi sebelumnya di `RLS_RUNTIME_EVIDENCE.md` |

Catatan: uji pertama dengan `Prefer: return=minimal` menghasilkan 204; itu adalah
**no-op** (0 baris), dibuktikan ulang dengan `return=representation` → `[]` dan role tidak berubah. Tidak ada eskalasi.

## Verifikasi lokal

- `node --test tests/juara/*.test.ts` → **57 pass / 0 fail** (capabilities, authz, redaction, invite).
- `npm run build` exit 0; ESLint sumber juara exit 0.
- M-12 ter-apply; policy `juara_club_members_read` satu-satunya policy pada tabel.

## Status

Implemented ✓ · Tested ✓ · **Deployed: belum** · Accepted: belum.
Deploy menunggu browser regression (D3) dan rollback rehearsal.
