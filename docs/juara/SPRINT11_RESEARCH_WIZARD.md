# Verifikasi Sprint 11 — Riset tim & perbaikan wizard (24 November 2026)

Konteks: Owner menunjukkan dua hal: (1) langkah 4 total 90% (15+45+30) dengan
tombol Lanjut yang tidak membantu; (2) riset dangkal dan tidak memakai kombinasi
kerja tim. PM mengakui keduanya, menjalankan `deep-research` dengan **3 agen
paralel**, lalu `report-writer` untuk menyusun laporan gabungan.

## Hasil riset tim

- `research_notes/Benchmark taktik JUARA Football Manager/fm_presets.md` —
  dokumentasi SI FM24: Mentalitas sebagai baseline 6+ slider; 10 preset resmi;
  3 formasi saran per preset; False Nine = role; Tempo ≠ Passing Directness;
  glosarium Indonesia; sumber diberi tag Dokumentasi/Komunitas/Ensiklopedia.
- `.../gap_audit.md` — audit PRD §6 vs kode: **P0 kebocoran test vector
  SCR 59,8%** dirender sebagai Status SCR; `Generated` bertipe longgar; dokumen
  PRD/RULEBOOK masih 4 DNA sementara kode 10; Live Summary & input PRD belum ada.
- `.../allocation_formation_ux.md` — UX alokasi 100%: sisa otomatis eksplisit,
  CTA muted + pesan jelas, `aria-invalid`/`aria-describedby` + live region,
  tanpa coercion diam-diam; segmented Auto|Manual dengan preview.
- Laporan gabungan: `reports/Benchmark taktik JUARA Football Manager.md`
  (16 aksi P0/P1/P2 + keterbatasan sumber).

## Perubahan kode (P0 + sebagian P1)

| Perbaikan | Bukti |
|---|---|
| SCR test vector 59,8% dihapus; engine kini mengembalikan `scrStatus: MENUNGGU_ENGINE` + `scrThresholdPct` dari input | `playbook.ts`, test `wizard.test.ts` diperbarui |
| Kontrak UI diperketat: `Generated` eksplisit, fallback enum mentah dihapus, equity diformat `Rp ...` | `OwnerWizard.tsx` |
| Langkah 4: 3 preset arsitektur, indikator sisa live, tombol eksplisit "Isi sisa ke produk akademi", CTA muted + pesan "Total masih 90%, sisa 10%", fokus ke field, `aria-invalid`/`aria-describedby` | `OwnerWizard.tsx`, `juara.css` |
| Taktik: 10 preset FM dengan 3 formasi saran, `fmPreset`, model 4 fase (4 DNA memakai angka PRD; 6 diberi label rasionalisasi kualitatif), formasi in/out of possession | `tactics.ts` |
| Label "Arah umpan" menggantikan "Gaya umpan", mentalitas dinyatakan sebagai baseline | `OwnerWizard.tsx` |
| Kuota Grade A/B/C yang sudah dihitung kini dirender | `OwnerWizard.tsx` |
| ENUM DB dan dokumen diselaraskan ke 10 DNA (R21) | M-11, `PRD-JUARA.md`, `RULEBOOK.md`, `PM_RULINGS.md` |

## Verifikasi teknis

| Pemeriksaan | Hasil |
|---|---|
| `node --test tests/juara/*.test.ts` | **46 pass / 0 fail** |
| `npm run build` | exit 0 |
| ESLint sumber juara | exit 0 |
| M-11 | ENUM `juara_tactical_dna` = 10 nilai |

## Keterbatasan jujur

- **Verifikasi visual/E2E belum bisa diulang**: `agent-browser` tidak lagi tersedia
  di PATH setelah restart harness. Sesuai P0-3 laporan riset, keluhan Owner
  **belum boleh dinyatakan selesai** sampai Owner melihat langsung.
- P1/P2 tersisa (Live Summary lengkap, baseline Langkah 1, target per tahun,
  pendanaan komersial, 5-zona workspace, depth chart, sintesis Mobbin) dicatat
  sebagai backlog, bukan diklaim selesai.
- Angka PPDA/garis/HSR hanya dipakai untuk 4 DNA kanonik yang punya sumber PRD;
  enam DNA baru sengaja tidak diberi angka.
