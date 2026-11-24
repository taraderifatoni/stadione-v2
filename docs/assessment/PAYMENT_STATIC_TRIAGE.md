# Payment Static Security Triage — Stadione

Bukan audit runtime. Tidak ada transaksi, deploy, push, restart, build, query DB, atau kredensial yang dicetak/dipakai. Status **CONFIRMED** di bawah berarti path kode konkret terkonfirmasi secara statis — **bukan** klaim eksploitasi live. Kontrol infra (WAF/nginx/proxy/DOKU dashboard) dan constraint DB aktual tidak diverifikasi dalam mandat ini → **UNKNOWN**.

Path sebenarnya di repo (nama dari Owner bersifat perkiraan): `src/app/api/payment/{callback,create,refund}/route.ts`, `src/lib/doku/{client,refund}.ts`, `src/app/profile/payments/page.tsx` (placeholder statis, tanpa pemanggilan API). Tidak ada route webhook/callback lain selain `api/payment/callback` (inventarisasi 28 route handler di `src/app/api`).

---

Laporan Ringkasan Eksekutif / Konteks: triage statis read-only atas 4 kekhawatiran Owner, 24 Nov 2026, local HEAD `063c1c8` vs deployed HEAD `6425ae5`.
- Keempat kekhawatiran **CONFIRMED** di level source; masing-masing memiliki path konkret menuju perubahan state yang tidak terautorisasi atau kepercayaan webhook tanpa validasi.
- Klasifikasi **REAL BLOCKER**: ya untuk (1), (3), (4); (2) memperparah (1) dan juga blocker karena update POS tanpa scope invoice.
- Common enabler: `src/middleware.ts:4` memasukkan `"/api/"` dalam `SKIP` dan `:14` mengembalikan `NextResponse.next()` — tidak ada auth guard untuk ketiga route payment. Ketiga route memakai `createAdminClient()` (RLS bypass): `callback:12`, `create:7`, `refund:6`.
- Tidak ada verifikasi session/HMAC di dalam route manapun. `checkDokuStatus()` (`src/lib/doku/client.ts:152`) juga tidak dipanggil dari callback, sehingga tidak ada konfirmasi status sisi provider.
- Perbandingan revisi: HEAD lokal dan deployed **berbeda** (`063c1c8` vs `6425ae5`), tetapi sha256 `git show HEAD:<file>` untuk kelima file payment identik di kedua host (lihat seksi Revisi). Temuan berlaku untuk source yang di-deploy.

---

Laporan Kekhawatiran 1 — validateDokuNotification tidak dipanggil / Konteks: verifikasi kepercayaan webhook `POST /api/payment/callback`.
- **Status: CONFIRMED. REAL BLOCKER: YA** (unvalidated webhook trust → unauthenticated state mutation).
- Bukti: import tanpa pemakaian di `src/app/api/payment/callback/route.ts:3`; fungsi didefinisikan di `src/lib/doku/client.ts:229-252` tetapi grep seluruh repo hanya menemukan 2 kemunculan: definisi + import tersebut. Tidak ada pemanggilan `validateDokuNotification(...)`.
- Handler `callback/route.ts:5-10` langsung `request.text()` → `JSON.parse`; `:16-24` mengambil `invoice_number`, `status`, `channel`, dll dari body; satu-satunya validasi adalah `:24` (invoiceNumber harus ada). Tidak ada pengecekan header `client-id`, `request-id`, `request-timestamp`, `signature`, digest, atau window waktu. `:93` selalu membalas `{success:true}`.
- Data flow: POST sembarangan → `invoiceNumber` dari body → lookup `payment_records` via `doku_invoice_id` (`:29-30`, admin client) → update status/paid_at/doku_callback_raw (`:44-50`) → `bookings.status='confirmed'` (`:53-59`) → insert notifikasi (`:82-91`). Semua dengan service-role/admin client, tanpa RLS.
- Siapa yang bisa memicu: siapa pun yang dapat mencapai endpoint `/api/payment/callback` — tidak ada auth di route maupun middleware (`src/middleware.ts:4,14`). Tidak diperlukan kredensial DOKU maupun akun aplikasi; cukup mengetahui/menebak invoice number (format invoice dibuat di `create/route.ts:22`).
- Impact class: integritas data pembayaran & booking, eskalasi state (paid/confirmed) tanpa pembayaran, notifikasi palsu, potensi lintas-venue bila invoice diketahui. Karena tidak ada tanda tangan maupun replay protection, satu request dapat mengubah state berulang kali.
- Catatan: `validateDokuNotification` sendiri memakai path default `"/payments/notifications"` (`:237`) yang hardcoded — patroli perbaikan perlu memastikan path/target dan header DOKU aktual sesuai konfigurasi merchant.

---

Laporan Kekhawatiran 2 — Update POS pending tanpa filter invoice / Konteks: blok sinkronisasi `pos_transactions` di callback.
- **Status: CONFIRMED. REAL BLOCKER: YA (faktor perparah)** (unscoped bulk state mutation).
- Bukti: `src/app/api/payment/callback/route.ts:62-80`: jika status SUCCESS/FAILED/EXPIRED, query `.eq("payment_method","doku").eq("status","pending").filter("payment_details->doku_url","not.is",null)` (`:63-65`), lalu loop `for (const txn of posTxns)` (`:68`) menimpa `status` menjadi `completed`/`failed` dan seluruh objek `payment_details` (`:69-77`).
- Tidak ada predikat invoice/order: tidak ada `.eq(...doku_invoice_id, invoiceNumber)`, tidak ada `reference_id`, dan blok ini **berada di luar** `if (payment)` (`:45`) — jadi tetap jalan walaupun invoice tidak ditemukan di `payment_records`. `invoiceNumber` hanya muncul sebagai data yang ditulis, bukan sebagai filter (`:16`, `:26`).
- Data flow: satu callback (palsu maupun asli) → memilih **semua** transaksi POS DOKU pending di semua venue → menandai semua completed/failed sekaligus. Tidak ada pembatasan tenant/venue.
- Siapa yang bisa memicu: pemanggil webhook tanpa auth (lihat #1); juga callback DOKU sah secara tidak sengaja dapat mengubah transaksi lain yang sedang pending.
- Impact class: perubahan state massal lintas-order/lintas-venue, kehilangan jejak `payment_details` asli (ditimpa), inkonsistensi pembayaran. Severity naik tajam karena digabung #1: attacker tidak perlu tahu invoice untuk memicu update massal — cukup kirim `{"transaction":{"status":"SUCCESS"}}`.
- Nuansa yang tidak mengubah keputusan: constraint skema `payment_method IN ('cash','qris','transfer','debit','split')` di `database/04-pos.sql:43` dan `supabase/migrations/20260730000005_pos.sql:36` **tidak** memasukkan `'doku'`, namun UI POS menggunakan nilai `'doku'` (`src/app/pos/page.tsx:274,286,306`). Apakah constraint produksi telah dilonggarkan → **UNKNOWN** (tidak ada query DB). Bila constraint masih ketat, query `:63` bisa mengembalikan 0 baris; namun path kode tidak berscope tetap terkonfirmasi, dan #1 saja sudah cukup untuk blocker.

---

Laporan Kekhawatiran 3 — create-payment: admin client + amount dari request + status paid saat URL dibuat / Konteks: `POST /api/payment/create`.
- **Status: CONFIRMED. REAL BLOCKER: YA** (unauthorized state change / pencatatan paid tanpa pembayaran).
- Bukti: `src/app/api/payment/create/route.ts:6` mengambil `amount` langsung dari body JSON; `:7` `createAdminClient()`. `:13-19` lookup member/booking hanya untuk mengisi `userId`/`venueId` — **tidak pernah** membandingkan `amount` dengan `bookings.final_price` atau harga membership. `:24-31` meneruskan `amount` apa adanya ke `createDokuPayment()` (`src/lib/doku/client.ts:84-146`). `:33-39` insert `payment_records` dengan `status: "paid"` segera setelah URL checkout dibuat, tanpa menunggu callback dan tanpa memeriksa `result.payment_url` tidak kosong; `:41` mengembalikan URL.
- Tidak ada auth: `src/middleware.ts:4,14` melewati `/api/`; route tidak memverifikasi session maupun bahwa `user.id` cocok dengan `booking.user_id`/`member.user_id`.
- Data flow: POST `{bookingId|referenceId, amount, ...}` → (opsional) lookup referensi → checkout DOKU dengan amount attacker → insert record `status:"paid"` dengan user_id/venue_id korban → klien menganggap lunas (lihat `src/components/payment/DokuPaymentModal.tsx:69-75` yang polling `status === "paid"`; endpoint `/api/payment/status` tidak ada di repo — bug konsistensi tambahan).
- Siapa yang bisa memicu: siapa pun yang dapat mencapai endpoint. Untuk menulis `payment_records`, attacker perlu `bookingId`/`referenceId` yang valid (UUID harus diketahui); tetapi checkout DOKU dengan amount sewenang-wenang dapat dipicu tanpa itu. Pemanggil sah dari UI juga mengirim amount dari klien: `src/app/(public)/booking/page.tsx:121-124` dan `src/app/pos/page.tsx:288-291`; `DokuPaymentModal.tsx:40-44` bahkan tidak mengirim `amount` sama sekali.
- Impact class: pembuatan record "paid" palsu dengan amount arbitrer (pendapatan fiktif/underpayment), status paid sebelum uang masuk, potensi manipulasi booking via callback (#1), dan jejak audit yang menyesatkan. Tidak ada pergerakan dana pada tahap checkout ini — dampak finansial bergantung pada rantai callback/status.

---

Laporan Kekhawatiran 4 — Refund: otorisasi & penanganan kegagalan provider / Konteks: `POST /api/payment/refund`.
- **Status: CONFIRMED. REAL BLOCKER: YA** (unauthorized financial state change + kegagalan provider ditelan).
- Bukti otorisasi: `src/app/api/payment/refund/route.ts:5-9` menerima `transactionId` dari body; `:6` admin client; `:12` lookup transaksi; tidak ada pengecekan session/peran/venue. `src/middleware.ts:4,14` tidak melindungi `/api/`. Siapa pun dengan `transactionId` dapat memicu refund.
- Bukti provider-failure: `:29-56` mencoba `createDokuRefund()`; `:52-55` `catch` hanya `console.error` lalu **"Continue with local refund even if DOKU fails"**. Selanjutnya `:58-68` menandai `pos_transactions.status='refunded'`, `:70-73` membatalkan booking, `:75-83` insert `refunds` dengan `status:'approved'` dan `resolved_at` terisi meski `refundResult?.refund_id` null. `:85-90` mengakui kondisi tersebut lewat note `"Refund lokal — perlu diproses manual"` — artinya state "approved" tercatat tanpa uang kembali.
- Bukti pendukung lain: `:26` `needsDokuRefund` memasukkan `'doku'` (nilai yang tidak diizinkan constraint skema — lihat nuansa #2); `:32-50` menggunakan `originalInvoiceNumber = INV-${transactionId.slice(0,8)}`, sedangkan invoice checkout dibuat sebagai `INV-${refId.slice(0,8)}-${Date.now().toString(36).toUpperCase()}` di `create/route.ts:22` — ketidakcocokan yang membuat refund provider besar kemungkinan ditolak, lalu tetap disetujui secara lokal. `:78` `requested_by` diambil dari staff shift, bukan pemanggil → jejak audit tidak merepresentasikan actor.
- Data flow: POST transactionId → update transaksi refunded → cancel booking → insert refund "approved" → respons sukses, terlepas dari hasil DOKU.
- Siapa yang bisa memicu: siapa pun yang mengetahui/menebak `pos_transaction.id`; tidak perlu peran kasir/owner/manager walaupun RLS dirancang untuk itu (`database/04-pos.sql:50-53,83-86`) — RLS bypass oleh admin client.
- Impact class: refund & pembatalan booking tidak terautorisasi, uang belum kembali tetapi tercatat approved, risiko rekonsiliasi/akuntansi dan kerugian finansial nyata bila refund lokal dianggap final.

---

Laporan Revisi & Ruang Lingkup / Konteks: verifikasi source vs deployed tanpa perubahan apa pun.
- Lokal: `git log -1 --oneline` → `063c1c8 docs(juara): final release evidence and app rollback rehearsal`. Working tree lokal memiliki perubahan pada file juara/AGENTS.md, bukan pada file payment.
- Deployed (VPS, SSH read-only): `6425ae5 Merge origin/main (mobile nav fix)`; `git status --short | head -20` hanya menampilkan file untracked (`07-counters.sql`, `08-platform-admin.sql`, `app.log`, `privacy-policy/`, `scripts/reminder-timer.sh`, `src/app/pos/layout.tsx`), tidak ada file tracked termodifikasi pada potongan yang ditampilkan.
- HEAD keseluruhan **berbeda**. Namun sha256 `git show HEAD:<file>` identik di lokal dan deployed untuk: `callback/route.ts` (`457dc68e…`), `create/route.ts` (`bd18a346…`), `refund/route.ts` (`9295c908…`), `lib/doku/client.ts` (`ca0ce85d…`), `lib/doku/refund.ts` (`fbf97cf5…`). Jadi **source payment tidak berbeda**; temuan di atas berlaku untuk kode yang di-deploy sejauh yang dapat diverifikasi dari git.
- Tidak diciap: HTTP request ke aplikasi, transaksi pembayaran, restart/build/deploy, push, query/tulis DB, atau pencetakan env/secret. Tidak ada klaim eksploit live.
- **UNKNOWN**: apakah ada proteksi infra di luar source (reverse proxy/WAF/akses jaringan), konfigurasi merchant DOKU (callback path/secret), dan constraint DB produksi yang aktual. Ini dapat mengubah *eksploitabilitas*, bukan keberadaan path kode di atas.
- Rekomendasi penanganan (tidak dieksekusi di sini): validasi HMAC + timestamp/replay di callback sebelum mutasi apa pun; scope update POS ke invoice/reference yang sama; derivasi/validasi amount dari harga server-side dan status awal `pending` sampai callback terverifikasi; otorisasi peran/venue + fail-closed pada refund provider (jangan approved saat provider gagal) sebelum perbaikan di lingkungan produksi.
