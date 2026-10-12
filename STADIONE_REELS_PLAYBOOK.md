# Stadione — produksi Reels dari footage nyata

Reels merupakan format utama untuk distribusi video, bukan slideshow foto yang diberi musik. Matriks editorial sudah menyediakan minimal satu slot REEL setiap hari; jangan mengganti matriks atau menggeser posting yang siap/terbit. Target operasional adalah memenuhi slot Reels tersebut dengan footage nyata. Ketersediaan bahan dan kinerja tetap dibuktikan, bukan dijanjikan otomatis.

## Mulai dari video sebelum menulis

Untuk slot REEL, mulai riset sejak beberapa jam sebelum jadwal. Jalankan helper committed melalui TD dengan environment produksi yang sudah tersedia:

```sh
node scripts/cms-reel-research.cjs --plan-key 2026-10-12:mon-pm --output /opt/stadione-editorial/production/reel-research.json
```

Tambahkan `--topic` untuk pencarian khusus sesuai pilar. Gunakan nama output baru untuk tiap query berikutnya; helper menolak menimpa jurnal riset/attempt yang sudah ada, kemudian editor menggabungkan bukti yang ditinjau. Helper menggunakan SerpAPI dengan reservasi kuota bulanan yang sama, key harian dan cache24jam. Pool umum getDailySportsPool tetap dibaca dari rilis; pool video mingguan adalah discovery awal, bukan bukti tanggal video. Tidak menambah timer, memublikasikan atau mengubah CMS.

Periksa minimal dua pencarian terarah: satu sesuai pilar, satu tentang kandidat/peristiwa tertentu. Hindari loop pencarian yang menghabiskan kuota. Situs primer/portal dan browsing langsung dapat melengkapi pencarian. `SOURCE_PAGE` berarti tautan posting video yang sebenarnya; `INDEX_RESOLUTION_REQUIRED` berarti halaman indeks yang masih perlu ditelusuri, bukan bukti footage tidak ada.

Buka halaman sumber. Verifikasi tanggal/identitas/konteks dengan berita lengkap dan sumber primer; periksa duplikat CMS, durable attempt dan Instagram. Jangan menyamakan tanggal pencarian atau label relatif di cache dengan tanggal unggahan. Catat bukti penggunaan media/audio secara jujur; status official tidak otomatis memberi lisensi.

## Paket dan penyuntingan

Pilih momen dengan aksi/emosi atau informasi yang kuat pada awal video. Unduh media publik yang memang tersedia dan simpan hash/durasi. Jangan melewati login/paywall atau mengarang izin. Gunakan3–12 potongan dengan timestamps yang diperiksa, caption pendek berganti dan kredit sumber. Sasaran editorial20–45detik, hook singkat pada1–2detik awal; batas teknis engine8–90detik tetap berlaku. Tidak membuat video AI atau mengganti footage dengan foto bergerak.

Tuliskan artikel dan digest review dari fakta yang sama. Hero website berupa frame asli bersih tanpa overlay, bukan cover penuh teks. Cover/thumbnail Reels memakai frame wajah/aksi asli yang dapat diverifikasi. Shared renderer/publisher yang berlaku menentukan kemampuan unggah cover; jangan mengaku fitur thumbnail custom sudah ada jika belum diterapkan.

Gunakan packet v3 `video_sources`, `scenes` dan `media.article_image`, lalu adapter committed `cms-produce-slot.cjs preview` → inspeksi video/audio/transkrip/timestamps → `schedule`. Publisher yang sama mengirim Instagram dan artikel. Tonton hasil nyata, bukan hanya menerima render audit. Keberhasilan Meta dibuktikan oleh attempt/media_id dan akun yang benar.

## Fallback bukan langkah pertama

Untuk slot yang masih DRAFT/PENDING_REVIEW berformat REEL, adapter menolak perubahan menjadi CAROUSEL tanpa `input.reel_research`:

- `plan_key`, `checked_at` segar maksimal36jam, minimal dua `queries` terarah.
- `attempts` minimal tiga URL video asli berbeda dari minimal dua kreator. Setiap attempt mencatat `page_url`, `creator`, `checked_at`, `result`, `detail` dan `proof.kind/summary`.
- Alasan konkret NOT_ACCESSIBLE, NO_MEDIA, UNVERIFIED_CONTEXT, PERMISSION_UNCONFIRMED, AUDIO_UNCLEARED atau DUPLICATE_TOPIC. URL indeks Bing/profil TikTok bukan video asli.
- `review.reviewer_id/reviewed_at/digest` mengikat manifest melalui `fallbackDigest` pada scripts/reel-research-policy.cjs. Review dan pemeriksaan sumber tetap tugas editor; validator tidak dapat memastikan kebenaran semantik log.
- Jika ada kandidat USABLE, proses REEL. Jangan mengubah slot menjadi carousel.

Tidak memaksa video tak terverifikasi demi target frekuensi. Bila setelah riset bahan gagal, fallback terverifikasi tetap dapat menjaga clock yang sama dengan alasan tercatat; laporkan tahap kegagalan. Jadwal, artikel/posting terbit, arsip/tombstone dan additional tidak diganti oleh pemeriksaan baru. Adapter melewati SCHEDULED/PUBLISHED/ARCHIVED sebelum guard fallback.

## Evaluasi hasil

Hitung porsi Reels berdasarkan media_product_type Instagram, bukan label CMS saja. Bandingkan reach, views, shares, saves dan retensi yang tersedia dengan usia posting sebanding. Jangan menetapkan Reels selalu lebih tinggi hanya dari jumlah tayangan total atau mengisi metrik yang belum tersedia.

Perubahan ini berlaku pada workflow operator/automation yang memakai checkout committed. Renderer/publisher aplikasi aktif tidak diganti; server tetap memerlukan operator/agent untuk riset, naskah dan footage. Jalankan `node scripts/qa-reel-research.cjs` untuk validasi parser, cache, kuota dan guard.


### Provider pencarian YouTube

Helper cms-reel-research.cjs menggunakan YouTube Data API bila YOUTUBE_API_KEY tersedia pada environment produksi. Modul scripts/youtube-discovery.cjs memberi metadata resmi, tanggalunggah absolut, durasi/kanal/views/license/embed dan cacheprivat24jam. Saat key tidak ada gunakan SerpAPI; saat API mengembalikan auth/quotaerror laporkan kegagalan, jangan menganggap video tidak tersedia. Kandidat metadata bukan berkasmedia/transkrip/izin. Key hanya di environmentserver, tanpa Git/output. Validasi node scripts/qa-youtube-discovery.cjs.
