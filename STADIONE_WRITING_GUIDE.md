# Stadione — penulisan artikel sebelum carousel

Standar naskah STADIONE_ARTICLE_FIRST_V1, terpisah dari pengunci visual STADIONE_NEWSPAPER_COLLAGE_V1. Artikel Goal adalah acuan penulisan, bukan teks yang disalin atau sumber fakta untuk topik lain.

## Sebelum menulis

Baca jurnal editorial/goal-readings.json dan pilih referensi yang sesuai jenis tulisan. Baca artikel referensinya secara utuh bila belum dipahami. NEWS mengutamakan pokok kabar, kutipan dan konteks spesifik. FEATURE membutuhkan tesis yang ditopang aksi, data, perbandingan dan kutipan. Jangan mengubah berita pendek menjadi feature hanya dengan menambahkan nasihat umum.

Preview memuat writer_brief dengan aturan penulisan dan pelajaran dari tiga referensi terbaru untuk genre terkait. Brief berasal dari jurnal runtime, bukan prompt generik yang tersimpan permanen saat build. Minimal satu benchmark artikel harus sesuai genrenya.

Tuliskan angle dalam satu kalimat. Kumpulkan bukti untuk fakta yang dibutuhkan, bukan hanya dua penerbit yang mengulang pernyataan sama. Bila bahan tidak cukup, tambah riset relevan atau buat cerita lebih ringkas. Pertahankan jadwal normal; permintaan tambahan memakai identitas additional yang berbeda.

## Input kanonis

Packet carousel tetap versi 3 tetapi wajib memiliki article versi 1. Modul news-writing.ts mendefinisikan tipe lengkap. Isi genre NEWS atau FEATURE, title, dek, caption, paragraphs, benchmark_ids dan review. Setiap paragraf mempunyai id unik, heading substantif, text, claim_ids serta kind FACT, QUOTE atau ANALYSIS. QUOTE mencatat quote.text dan quote.source_id yang cocok persis dengan sumber. ANALYSIS bertumpu pada minimal dua klaim spesifik, bukan karangan taktik. Lead NEWS adalah fakta utama.

Tulis artikel utuh dulu. Jangan memulai dari hook/fakta/kronologi/konteks/penutup kosong atau kuota lima slide. Review naskah sebagai satu cerita, terpisah dari review visual. Hapus paragraf yang bisa dibuang tanpa kehilangan informasi, judul tentang proses redaksi, label Analisis Stadione dan penjelasan defensif yang berulang. Kalimat bertitik dua atau titik koma tidak otomatis salah; hindari ritme mekanis dan label buatan.

Reviewer memeriksa angle, perkembangan informasi, atribusi kutipan dan bukti penalaran. Isi review.reviewer_id, reviewed_at dan article_digest dari articleDigest(article) setelah penyuntingan. Digest mengikat versi, bukan jaminan mesin memahami mutu prosa. Audit deterministik juga menolak label/scaffold tertentu, pengulangan persis/mirip, kutipan yang berbeda dari sumber dan penalaran yang tidak mempunyai cukup rujukan. Pemeriksaan ini tidak menggantikan pembacaan substantif oleh editor/model yang menjalankan produksi.

articleSlides(article) menghasilkan seluruh halaman secara lossless. Satu cover dan 1–9 halaman teks; batas minimum lima dihapus. Naskah tidak ditambahi penutup otomatis. Paragraf panjang dibagi pada batas kata, tanpa menghapus kata; heading dipertahankan. Renderer tetap mengukur wrapping/font/margin dan akan menolak overflow, bukan mengecilkan teks sampai tak terbaca. Bila gagal, sunting struktur/paragraf, hitung digest, lalu render ulang. Audit publikasi mengikat halaman, artikel, cover dan byte JPEG.

Siapkan artwork cover setelah pagination final. Isi media.editorial_cover.page_count sama dengan jumlah slide dan periksa angka yang terlihat pada gambar. Pergantian panjang artikel membutuhkan review cover/count baru; engine tidak menimpa angka di artwork yang sudah disetujui.

articleHtml(article) menghasilkan body website dari paragraf yang sama. Dek hanya excerpt, tidak disalin lagi sebagai paragraf pembuka. Caption ditulis sebagai bagian artikel, bukan gabungan claim ledger atau judul penutup. generateEnginePreview membuat/memperbarui parent ARTICLE yang belum terbit, memasangkan hero foto bersih, dan menjadwalkannya pada waktu SOCIAL yang sama. Artikel terbit setelah Instagram berhasil. Jangan menimpa artikel/posting yang sudah terbit saat memperbaiki draf.

Untuk Reels yang mempunyai article, siapkan media.article_image.url dan credit dari foto/frame sumber asli tanpa overlay. Jangan memakai URL video sebagai gambar hero website. Jalur Reels tetap memakai montage footage nyata dan audit video yang sudah ada.

## Bacaan setiap hari

Automation Baca Goal untuk Stadione berjalan setiap hari sekitar 07.00 WIB, mulai 7 Oktober. Minimal satu URL baru dibaca utuh. Catat id, url, read_at, kind, lessons 3–5 poin dan application. Pelajaran adalah tulisan sendiri, bukan salinan artikel, statistik atau klaim topik baru yang belum diverifikasi. Pertahankan riwayat dan jangan mendaur ulang timestamp bacaan lama.

Validasi node scripts/qa-writing-references.cjs editorial/goal-readings.json. Update Plan Master, commit dan push, kemudian salin jurnal persis ke /opt/stadione-editorial/goal-readings.json melalui TD Connector. Engine membaca file runtime setiap preview/publikasi, tanpa rebuild. STADIONE_EDITORIAL_REFERENCES_FILE dapat memilih lokasi lain bila dikonfigurasi resmi. ID benchmark naskah harus ada di jurnal; bacaan harian terbaru maksimal 36 jam. Jika jurnal hilang/rusak/kedaluwarsa, produksi baru ditahan dengan alasan jelas. Jangan mengubah slot lain atau menyegarkan timestamp secara palsu untuk meloloskan gate.

## Batas operasional

VPS belum memiliki konfigurasi provider LLM untuk menulis naskah sendiri. Engine menerima naskah source-led dari editor/agent yang menjalankan produksi, lalu melakukan pagination, sinkronisasi artikel dan gate bersama. Rutinitas bacaan dijalankan automation Codex yang dapat membaca web, bukan scraper yang mengaku belajar dari snippet. Tidak mengklaim penilaian semantik sempurna atau pelatihan ulang model.

Posting historis tidak dimutasi oleh rollout ini. Packet lama tanpa article tidak dapat dipakai untuk publikasi carousel baru. Siapkan artikel baru dan render ulang lewat standar yang sama, tanpa mengganti jadwal rutin.
