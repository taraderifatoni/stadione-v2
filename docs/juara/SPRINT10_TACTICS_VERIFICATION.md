# Verifikasi Sprint 10 — Wizard Taktik ala Football Manager (24 November 2026)

Konteks: Owner menguji dan meminta tiga hal: (1) tidak ada kode/internal yang
bocor di wizard, (2) lebih banyak varian gaya bermain & template formasi,
(3) formasi manual harus punya opsi auto, dengan benchmarking Football Manager.

## Keputusan PM

1. **Tidak ada data mentah di UI.** Blok `<details>` berisi JSON hasil engine
   dihapus total. Semua nilai yang tampil memakai label manusia (nama gaya main,
   mentalitas, tempo, pressing, garis, lebar, umpan). Kode internal hanya ada di
   nilai form/API, bukan di teks yang dibaca pengguna.
2. **10 gaya bermain** (`TACTICAL_DNA_OPTIONS`): Gegenpress, Tiki-Taka, Vertical
   Counter, Seimbang, Total Football, Low Block/Catenaccio, Wing Play, Diamond
   Midfield, False Nine, Direct/Physical. Memilih gaya mengisi otomatis enam
   parameter FM (mentalitas, tempo, pressing, garis, lebar, umpan).
3. **10 template formasi** + input formasi khusus. Mode **Auto** memilih formasi
   dari preset DNA/target (target stabil meredam formasi agresif ke 4-2-3-1);
   mode **Manual** memakai template atau ketikan pengguna.
4. Profil taktik dienkripsi AES-256-GCM ke kolom baru `juara_playbooks.tactical_profile_enc`
   (M-10), tetap delapan tabel. AAD terikat `clubId|table|column|rowId|keyId`.

## Bukti teknis

| Pemeriksaan | Hasil |
|---|---|
| `node --test tests/juara/*.test.ts` | **46 pass / 0 fail** (6 test baru: taktik + enkripsi profil) |
| `npm run build` | exit 0 |
| ESLint sumber juara | exit 0 (termasuk perbaikan 3 `any` lama di `pdf.ts`) |
| M-10 | `tactical_profile_enc` ada di `juara_playbooks` (1 kolom) |

## Perubahan utama

- `src/lib/juara/tactics.ts` — katalog DNA/formasi, resolver auto/manual, label.
- `src/lib/juara/validation.ts` — 10 DNA + 6 parameter FM + validasi mode manual.
- `src/lib/juara/playbook.ts` — hasil engine menyertakan `tacticalProfile`.
- `src/lib/juara/playbook-save.ts` — enkripsi profil + formasi hasil resolver.
- `src/components/juara/OwnerWizard.tsx` — langkah 3 jadi pilihan kartu DNA,
  segmented Auto/Manual, 10 template, parameter FM; JSON mentah dihapus.
- `src/app/juara/juara.css` — gaya kartu opsi, segmented control, grid parameter.

## Yang belum bisa diverifikasi

- Browser otomatis (`agent-browser`) tidak lagi tersedia di PATH setelah restart
  harness, jadi screenshot langkah 3 belum diambil ulang. Verifikasi dilakukan
  lewat test unit, build, dan struktur UI/kode. Owner diminta melihat langsung.
- Data lama (playbook demo sebelum M-10) tidak punya profil taktik; tidak
  dimigrasikan karena tidak ada data input aslinya.
