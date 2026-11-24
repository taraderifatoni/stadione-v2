# Verifikasi Sprint 9 — UI & Alur Pakai JUARA (24 November 2026)

Konteks: Owner mengeluh tampilan 1/10 dan aplikasi "tidak berfungsi". PM mengambil
keputusan: prioritas tunggal = JUARA bisa dipakai manusia, bukan sekadar build hijau.

## Keputusan PM

1. Halaman auth dipisah dari shell dashboard (sebelumnya login disisipkan di dalam
   skeleton sidebar/topbar/footer yang menyesatkan).
2. Pendaftaran klub dibuka (beta) via `POST /api/juara/v1/auth/register` —
   `service_role` hanya di server, user dibuat `email_confirm: true`, lalu
   `juara_create_owner_club()` membuat klub + membership OWNER (M-09).
3. Wizard diperbaiki: field target prestasi & formasi yang sebelumnya hilang
   kini tersedia; hasil engine dirender sebagai KPI + tabel, bukan JSON mentah.
4. Auth guard diperlonggar hanya untuk `/juara/login`, `/juara/signup`,
   `/juara/auth/*`.
5. Demo account sementara dibuat agar Owner bisa langsung mencoba.

## Bukti teknis

| Pemeriksaan | Hasil |
|---|---|
| `node --test tests/juara/*.test.ts` | **40 pass / 0 fail** |
| `npm run build` | exit 0, rute `/juara`, `/juara/login`, `/juara/signup`, `/juara/vision`, `/juara/playbooks`, 7 API terdaftar |
| ESLint sumber juara (`src/app/juara`, `src/components/juara`, `src/lib/juara`, `src/app/api/juara`) | exit 0 |
| `POST /api/juara/v1/auth/register` (demo) | **HTTP 201**, `clubId` dikembalikan |
| Deploy VPS | merge `29ec189`, build exit 0, `stadione.service active` |

## Bukti end-to-end (agent-browser, HTTPS produksi)

1. Buka `https://juara.stadione.pro/juara/login` → screenshot `docs/juara/screenshots/login.png`:
   halaman auth two-column, brand JUARA, form rapi, tidak ada skeleton dashboard.
2. Isi email/password demo → klik Masuk → URL `https://juara.stadione.pro/juara`,
   sidebar navigasi muncul, judul "Selamat datang, Klub Demo JUARA".
   Screenshot `docs/juara/screenshots/dashboard.png`.
3. Klik Owner Vision → 5 langkah → Generate Playbook → tabel matriks usia tampil
   (17-21: 25%/7 slot, 22-24: 25%/7, 25-29: 40%/11, 30-33: 10%/2).
4. Klik Simpan Playbook → muncul notifikasi "tersimpan".
5. Klik Playbook → tabel arsip menampilkan baris `CHAMPION 1Y / CHAMPION / 1 tahun /
   DRAFT / 24/11/2026`. Screenshot `docs/juara/screenshots/playbooks.png`.
6. `/juara/signup` tidak kena auth guard; form registrasi render lengkap.

## Akun demo (sementara)

- Email: `demo@juara.stadione.pro`
- Password: `JuaraDemo2026!`
- Klub: Klub Demo JUARA (Liga 2), peran OWNER.

Kredensial awalnya ditampilkan di halaman login, tetapi **CTO menemukan risiko
keamanan** (akun dengan sandi publik di endpoint publik). Sesuai keputusan PM,
kredensial sudah **disembunyikan dari halaman login produksi** dan hanya tersimpan
di dokumen internal ini + disampaikan langsung ke Owner. Akun demo tetap aktif
sampai Owner selesai mencoba; **hapus sebelum peluncuran umum**.

## Masih terbuka

- Pengetesan visual di 320px/768px/1024px/1440px baru lewat CSS media query;
  belum di-screenshot satu per satu.
- PDF download belum diklik di browser (route sudah diuji 21+ test PDF).
- SSO, pen-test, kredensial notifikasi, data klub riil tetap menunggu input eksternal.
