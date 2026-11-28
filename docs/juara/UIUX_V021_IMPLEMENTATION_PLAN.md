# JUARA UI/UX v0.2.1 — Rencana Implementasi (Checkpoint 1)

Tanggal: 28 November 2026  
Branch/worktree: `feat/pm/juara-ui-v021` @ `/home/taradfs/.local/share/opencode/worktree/stadione-v2/pm-juara-ui-v021`  
Basis: HEAD main `7c49f49` (clean worktree, tanpa 248 dirty Owner Rep).  
Sumber desain: `docs/juara/design/chatgpt/deliverables/v0.2.1/` (prototype.html, components.html, tokens.css, brand-guideline.md, design-system.md). **Desain ChatGPT v0.2.1 dipakai apa adanya; tidak dicampur desain lama.**

## Bukti mockup vs src (sebelum)

| Aspek | Mockup v0.2.1 | src sebelum |
|---|---|---|
| Palet | Electric Volt: `--canvas:#101010`, `--accent:#E5FF38`, `--surface:#1B1B1E`, `--text:#F5F5F7` (`tokens.css`) | Navy/teal lama: `--ju-navy:#0d1b2a`, `--ju-accent:#0e6b5c`, background putih/panel `#f4f6f8` (`src/app/juara/juara.css`) |
| Font | Barlow + Barlow Condensed | Inter/system sans |
| Shell | `.shell` grid `--rail(72px) + workspace`; top ribbon 6 metrik; tabs; canvas master+inspector; bottom bar; mobile nav (`prototype.html`) | `.ju-shell` flex sidebar 244px; topbar putih; context-tabs 3 link; no ribbon/inspector/bottom (`WorkspaceShell.tsx`) |
| Struktur modul | 12 modul rail, 5 zona fungsional / 3 panel (per brief) | 3 route saja (Ruang Direksi, Vision, Playbooks) |
| Status | Ready for Engineering Handoff; Production readiness belum disahkan; 19 defect (6P0/11P1/2P2) | CP1 shell minimal read-only |

## File diubah (checkpoint 1)

1. `src/app/juara/juara.css` — ganti total token/palet ke v0.2.1 persis; tambah shell/component styles dari prototype; compat layer sementara untuk kelas `ju-*` yang masih dipakai halaman.
2. `src/app/juara/layout.tsx` — load Barlow/Barlow Condensed via `next/font/google`, bind ke `--font-body/--font-display`, canvas gelap v0.2.1.
3. `src/components/juara/WorkspaceShell.tsx` — shell v0.2.1: rail 72px, brand J, ribbon 6 indikator, tabs exec (Ruang Direksi|Playbook|Visi Owner), canvas master+inspector, mobile nav. Modul belum terimplementasi ditandai dan membuka inspector "Belum tersedia" (tidak mencampur desain lama).
4. `src/app/juara/(workspace)/page.tsx` — dashboard disesuaikan ke pola hero v0.2.1 (border-left accent, decision-first), data wiring API tetap.

## Rencana lanjutan (belum dikerjakan, checkpoint berikutnya)

1. **Migrasi halaman tersisa**: playbooks, vision/OwnerWizard, login/signup/auth ke kelas v0.2.1 murni; hapus compat `ju-*` setelah migrasi.
2. **9 workspace / 5 zona**: tambah route placeholder terstruktur per modul prototype (inbox, squad, tactics, academy, scouting, finances, commercial, vault, coord/members/travel sesuai peta), dengan empty state v0.2.1 dan guard capability.
3. **Inspector & bottom bar fungsional**: state inspector, bottom simulation bar, drawer mobile, aksesibilitas keyboard/Escape/focus trap.
4. **Backend alignment**: pastikan DTO/API/capability mendukung modul baru; tidak ubah desain untuk menyesuaikan backend, sesuaikan backend ke kontrak UI.
5. **Defect P0 dulu**: P0-04 redaksi konten/metadata, P0-06 snapshot approval invoice/payroll, lalu P0 lain sebelum data klub nyata/deploy.
6. **Visual acceptance**: screenshot app berjalan 1440/1024/768/390 + metadata commit/env/route; reviewer inspeksi. WCAG AA menyeluruh belum terverifikasi.

## Verifikasi checkpoint 1

- `npx tsc --noEmit --pretty false` (worktree, node_modules disymlink): **exit 0, tanpa output**.
- `git diff --stat`: 4 file, 267 insertions(+), 408 deletions(-).
- Tidak ada deploy/push/migrasi/restart. 248 dirty Owner Rep di main tidak disentuh.

## Risiko / catatan

- Compat `ju-*` masih ada agar halaman lama tidak rusak; ini teknis transisi, bukan campuran desain visual lama (token lama dihapus).
- Modul rail selain Direksi/Playbook/Visi masih placeholder by design; ini jujur terhadap status implementasi.
- `node_modules` di worktree adalah symlink ke main untuk verifikasi lokal; jangan commit symlink.
