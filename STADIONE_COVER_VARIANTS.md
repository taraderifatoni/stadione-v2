# Stadione — enam komposisi cover

Tanggal 12 Oktober 2026. Standar visual tetap STADIONE_NEWSPAPER_COLLAGE_V1; variasi komposisi STADIONE_COVER_VARIANTS_V1.

Gaya koran modern, karakter font yang sudah disukai, cream #eee9dd, charcoal, merah #84102d, foto atlet autentik dan kombinasi foto/teks dipertahankan. Komposisi yang berubah adalah ukuran masthead, dominasi foto atau judul, arah kolom, titik penempatan subjek dan banyaknya tekstur. Jangan sekadar mengubah warna pada susunan yang sama.

## Enam varian

| ID | Susunan | Pemakaian |
| --- | --- | --- |
| KLASIK | Masthead besar, foto tengah, sobekan diagonal, judul cream di bawah | Berita utama, momen besar |
| KOLOM | Cream, judul di kolom kiri, atlet kanan, garis vertikal | Feature, profil, komunitas |
| FOTO_DOMINAN | Foto besar, masthead kecil, judul kiri bawah, tekstur ringan | Aksi, emosi dan selebrasi |
| JUDUL_UTAMA | Judul besar di atas, atlet di paruh bawah, cream dominan | Kabar penting dan keputusan |
| PORTRAIT_MERAH | Portrait autentik hitam putih, bidang merah, judul di kanan | Tokoh dan kontribusi individu |
| HASIL_LAGA | Skor terverifikasi besar, dua label tim, foto dan judul lebih kecil | Hanya hasil FINAL |

Contoh perbandingan menggunakan foto dan berita Loncar–Persija yang sama agar perubahan tata letak terlihat jelas. Papan dan crop merupakan referensi desain, bukan enam posting baru atau artwork produksi 1080px. Dek contoh dipersingkat untuk perbandingan; pada produksi gunakan dek artikel kanonis persis. Sumber contoh ILEAGUE.ID dan 1/5 berasal dari artikel yang sudah diperiksa. Gambar sumber Dok. Persija melalui Suara.com; tidak membuat atlet baru.

## Memilih komposisi sebelum image generation

Jalankan helper read-only dari checkout committed setelah artikel dan pagination final:

```sh
node scripts/cms-cover-brief.cjs --input input.json --history cms-before.json
```

History harus snapshot CMS terbaru. Helper membaca row SOCIAL PUBLISHED/SCHEDULED sebelum waktu target, mengabaikan arsip/tombstone/target sendiri. Cover lama tanpa variant_id dihitung KLASIK. Hindari komposisi dua posting sebelumnya, kemudian pilih yang paling jarang dipakai pada enam cover terakhir. Jika frekuensi seri, dahulukan komposisi yang paling lama tidak dipakai; urutan katalog memecah seri yang tersisa agar pilihan dapat diulang. Paling banyak satu komposisi sama dalam tiga cover berturut-turut selama kandidat cukup; hasil belum dipublikasikan tidak dihitung sebagai sukses Meta.

Pilih berdasarkan berita dan kekuatan foto juga. Editor boleh memakai --variant ID sebagai override yang dicatat, bukan mengganti font/palette. HASIL_LAGA tidak masuk kandidat tanpa data skor terverifikasi. Berita preview, rumor, pertandingan belum selesai atau topik tanpa skor tetap memakai lima varian lainnya.

```sh
node scripts/cms-cover-brief.cjs --input input.json --history cms-before.json --variant HASIL_LAGA --result verified-result.json
```

Result memuat left_label, right_label, score, claim_id, order_reviewed_by, order_reviewed_at dan order_review_digest. Digest SHA256 mengikat JSON.stringify([claim_id,left_label,right_label,score tanpa spasi,claim.text]); perubahan urutan/angka memerlukan review baru. Klaim wajib verified, mempunyai dua evidence, memuat kedua label dan skor, event_status FINAL. Editor harus memeriksa URUTAN tim/skor terhadap sumber primer. Helper memeriksa ikatan data dan review yang tercatat; pencocokan string bukan verifikasi semantik pertandingan.

Output memberi prompt dan metadata_to_add. Tambahkan variant_id dan variant_standard di packet.media.editorial_cover **hanya pada produksi cover baru**, sebelum review/hash/preview. Jangan mengubah packet yang SCHEDULED/PUBLISHED untuk menyisipkan label baru. Jalur renderer lama tetap menerima cover lama tanpa metadata varian.

## Membuat cover final

- Acuan image generation: foto atlet asli dan crop varian terpilih dari assets/editorial/cover-variants-20261012/. Acuan KLASIK tidak boleh menjadi susunan wajib untuk semua pilihan.
- Pertahankan wajah, tubuh, rambut, jersey, identitas dan pose; olah latar editorial. Foto interview tidak diklaim aksi pertandingan.
- Ukuran final 1080×1350. Margin horizontal72px, font dek minimal32px, label sumber minimal24px, spasi normal dan headline dibungkus aman. Atlet tidak menutup huruf judul, sumber atau skor.
- Source label singkat hanya cover; nomor1/N mengikuti articleSlides final. Tanpa EDISI DIGITAL/footer promosi. Elemen skor hanya HASIL_LAGA dan hanya setelah verifikasi.
- Halaman isi tetap artikel utuh teks-only cream, modern sans dan wrapping terukur, jarak garis merah36px atas/bawah. Varian cover tidak mengubah pagination, renderer isi atau foto bersih website.
- Inspeksi cover resolusi penuh, periksa teks/font/wajah/urutan skor dan page_count; catat review dan SHA. Tetap memakai cms-produce-slot.cjs preview → inspeksi JPEG → schedule serta shared audit/publisher.
- Helper tidak menghasilkan gambar sendiri, mengubah CMS atau menerbitkan konten. Jadwal08/13/20WIB, posting tambahan, historis dan credential tidak diubah oleh katalog.

## Berkas

Katalog editorial/cover-variants.json, helper scripts/cms-cover-brief.cjs, papan dan enam crop referensi assets/editorial/cover-variants-20261012/. Tidak memerlukan deploy aplikasi/restart. Automation/editor yang membaca Writing Guide menggunakan helper sebelum menyiapkan cover baru; tidak mengklaim server menulis/menghasilkan artwork dengan LLM sendiri.
