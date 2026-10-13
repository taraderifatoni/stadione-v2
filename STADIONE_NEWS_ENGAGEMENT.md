# Berita, Reels dan poin pembaca Stadione

Halaman artikel menampilkan Reels Instagram yang sudah PUBLISHED dan memiliki parent_id artikel tersebut di tengah naskah. Tag embed manual yang sudah ada tidak digandakan. Jika iframe dibatasi Instagram/browser, tautan Tonton langsung di Instagram tetap tersedia. Ini jalur pembaca ke sosial, bukan jaminan semua kunjungan dihitung sebagai views Instagram.

Baca juga menampilkan tiga artikel PUBLISHED, mengutamakan klub/topik lalu kategori, dengan recency sebagai pembanding. Artikel sendiri/draf/arsip tidak direkomendasikan.

## Trivia setelah bacaan

Trivia terletak paling bawah setelah isi dan rekomendasi. Pembaca masuk ke akun Stadione, menyelesaikan penjumlahan singkat, lalu menjawab pilihan ganda. Satu soal benar memberi satu poin; jawaban pertama salah tetap nol dan tidak dapat diganti untuk menambah poin. Soal yang sama hanya dihitung satu kali per akun, juga jika verifikasi/sesi baru dibuat. Melanjutkan sesi baru mengambil soal yang belum dijawab.

Poin pembaca dipisahkan dari loyalty/reward membership venue. Poin tersimpan di stadione_reader_scores dan ledger stadione_trivia_answers, ditampilkan di Profil dan papan peringkat10pembaca. Peringkat memakai alias Pembaca +6karakterID, bukan email/nama asli.

Template trivia berasal dari kalimat/fakta artikel yang benar-benar tersimpan, 1–3soal. Templatenya disimpan sekali dengan digest sumber dan IDsoal stabil, bukan dibangkitkan ulang tiap kunjungan. Editor dapat memasukkan soal langsung dengan:
`node scripts/cms-article-trivia.cjs article-id /private/reviewed-questions.json`.
Jawaban benar dan penjelasan harus cocok dengan naskah yang terbit; quizexisting ditolak agar poin tidak dapat direset lewat penggantian soal. Halaman membaca atau membuat template trivia tanpa mengubah body artikel/paketapproved/posting sosial. Artikel baru mendapatkan template saat pertama dibuka.

## Penghitungan dan pemeriksaan anti-bot

Server memverifikasi akun melalui Supabase getUser, mengabaikan user_id/points dari browser dan memeriksa Origin. Kunci jawaban tidak masuk props halaman atau respons sebelum verifikasi. Sesudah menjawab, penjelasan/kunci hanya soal yang sudah dihitung dikirim ke pembaca.

Session terikat akun/artikel, kedaluwarsa15menit, CAPTCHA maksimal3percobaan, penerbitan session maksimal5per10menit per akun, honeypot, minimum1detik sebelum mulai/menjawab. Ini pemeriksaan anti-bot ringan yang bisa diselesaikan otomatis oleh bot canggih, bukan pengganti layanan CAPTCHA eksternal. Tidak memerlukan credential baru atau gambar yang membingungkan.

RPC scoring hanya service_role; anon/authenticated tidak dapat menulis score atau membaca kunci. Unique(user,article,question), session row lock dan advisory lock per akun/artikel mencegah race/replay memberi poin kedua. Tambahan skor atomic di transaksi yang sama dengan ledger. Account deletion menghapus data trivia akun tersebut. Arsip/tombstone artikel menghentikan percobaan baru; poin yang sudah sah tetap.

## Deployment dan rollback

Migrasi database/12-article-trivia.sql menambah empat tabel namespaced serta fungsi/grant/RLS, tidak mengubah content rows/jadwal/kredensial. Uji SQL dengan transaction rollback, QA API/player/article dan build sebelum switch rilis immutable melalui TD. Rollback aplikasi ke rilis7dd79b9 boleh dilakukan tanpa menghapus tabel/ledger/poin. Jangan memulihkan backup CMS untuk membatalkan fitur atau menghapus earned points. Musik katalog Reels dalam rilis yang sama bersifat optional agar posting existing tetap kompatibel.
