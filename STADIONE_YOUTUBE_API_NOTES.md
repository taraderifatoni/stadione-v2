# Stadione — hasil pembacaan YouTube API samples

Dibaca melalui browsing pada12Oktober2026. Lingkup: contoh search Python/JavaScript dan dokumentasi resmi terkini; bukan klaim koneksi API berhasil.

## Kesimpulan untuk engine

YouTube Data API v3 dapat melengkapi pencarian Reels dengan ID video, nama/ID kanal, tanggal publikasi absolut, thumbnail, deskripsi, durasi, statistik dan status embed/lisensi yang tersedia. Discovery beralih dari tautan indeks ke resource resmi. Pemeriksaan konteks berita dan footage tetap diperlukan; metadata bukan bukti kejadian dalam rekaman.

Repository youtube/api-samples diarsipkan12Agustus2025. Contoh Python memakai sintaks Python2 dan placeholder developer key. Pelajari alur search.list, tetapi implementasi Node Stadione sebaiknya mengikuti reference API terkini, bukan menjalankan contoh lama tanpa penyesuaian.

Data API mengembalikan metadata dan player embed. Tidak ada endpoint unduh MP4 publik. fileDetails memuat sifat berkas yang diunggah dan hanya tersedia bagi pemilik, bukan URL download. captions.download memerlukan OAuth dan hak mengedit video; tidak memberi transkrip bebas untuk video sembarang kanal. Akses player LOGIN_REQUIRED pada pemeriksaan sebelumnya tidak dianggap selesai dengan memperoleh API key.

## Mendapatkan credential

1. Masuk Google Cloud memakai akun pengelola Stadione; gunakan project Stadione yang sesuai atau buat project baru khusus layanan ini.
2. Aktifkan YouTube Data API v3: https://console.cloud.google.com/apis/library/youtube.googleapis.com .
3. Buka Credentials: https://console.cloud.google.com/apis/credentials dan buat API key untuk pencarian/metadata publik. OAuth2 dipakai hanya bila perlu operasi akun/data yang memerlukan otorisasi, bukan syarat awal mencari video publik.
4. Batasi key untuk YouTube Data API dan aplikasi server yang benar. Simpan melalui jalur credential server yang aman sebagai YOUTUBE_API_KEY; jangan memasukkan nilai key ke chat, Git atau Plan Master.
5. Setelah pemasangan, uji search.list lalu videos.list terhadap ID hasilnya. Catat status/respons tersanitasi, nama project/quota yang relevan dan hash artefak tanpa mencetak credential. Jangan mengklaim tersambung sebelum respons aktual berhasil.

Pemeriksaan melalui TD pada environment produksi yang digunakan publisher menunjukkan YOUTUBE_API_KEY, GOOGLE_API_KEY, YOUTUBE_CLIENT_ID dan YOUTUBE_CLIENT_SECRET belum tersedia. Hanya boolean keberadaan diperiksa; nilai environment tidak ditampilkan dan credential tidak diubah. Google Cloud belum diakses sebagai pengguna sehingga API belum diaktifkan dan key belum dibuat oleh agent.

## Rancangan integrasi berikutnya

- search.list dengan part=snippet, type=video, query sesuai pilar, publishedAfter RFC3339, regionCode=ID dan relevanceLanguage=id. channelId dapat mempersempit ke kanal sumber yang sudah diverifikasi; hasil pencarian baru dapat terlambat masuk indeks.
- videos.list untuk kumpulan ID hasil pencarian, meminta snippet, contentDetails, statistics dan status. Gunakan field yang diperlukan saja; tanggal unggahan berbeda dari tanggal kejadian. Simpan timestamp pengambilan statistik dan hindari menyebut jumlah views sebagai jaminan viral.
- Pantau kanal sumber lewat uploads playlist melalui channels.list lalu playlistItems.list bila membutuhkan unggahan kanal terbaru; ini melengkapi pencarian keyword.
- Video creativeCommon dan embeddable dapat difilter untuk kandidat sesuai kebutuhan, tetapi label lisensi/kemampuan embed tidak sama dengan tersedianya file media. Ikuti dokumentasi dan provenance; jangan menandai unduhan/lisensi/audio lolos hanya dari API.
- Cache metadata terbatas, deduplikasi videoId, tangani quota/auth error secara jelas. Batas layanan dibaca dari Google Cloud project dan reference saat pemasangan; tidak hardcode kuota contoh lama.
- API digunakan untuk discovery/metadata dan embed artikel. Produksi montage memerlukan berkas asli dari kreator/sumber media yang memberi akses yang sesuai. Simpan jalur media, transkrip/timestamps dan bukti pemeriksaan sesuai playbook Reels.
- Integrasi akan memakai shared audit/publisher Stadione. Penelitian ini tidak mengubah jadwal, CMS, artikel/posting terbit, renderer, credential, aplikasi atau timer.

## Referensi yang dibaca

- https://github.com/youtube/api-samples
- https://raw.githubusercontent.com/youtube/api-samples/master/python/search.py
- https://raw.githubusercontent.com/youtube/api-samples/master/javascript/search.js
- https://developers.google.com/youtube/v3/getting-started
- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/docs/videos
- https://developers.google.com/youtube/v3/docs/captions/download
- https://developers.google.com/youtube/terms/developer-policies

Status: pembacaan dan rancangan selesai; pemasangan credential serta tes API nyata belum dilakukan. Dokumen ini tidak menyatakan Reels baru sudah dibuat atau terbit.
