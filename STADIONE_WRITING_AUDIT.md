# Audit penulisan Stadione — 6 Oktober 2026

Permintaan pemilik adalah menganalisis kualitas tulisan Menalo dengan dua artikel Goal sebagai pembanding. Ini laporan dan arah perbaikan, bukan bukti implementasi writer baru. Postingan, isi CMS, timer dan jadwal tidak diubah dalam audit ini.

## Bahan pembanding yang dibaca

- [Feature Gordon](https://www.goal.com/id/original/anthony-gordon-bukan-lamine-yamal-nya-inggris-tetapi-bintang-terbaru-barcelona-itu-pantas-menjadi-salah-satu-pemain-yang-tak-tersentuh-milik-thomas-tuchel/bltaee420c200d0f7de).
- [Berita Piala Presiden](https://www.goal.com/id/daftar/penjelasan-panitia-jeda-48-jam-final-piala-presiden/blt09878f72ebba869d).
- Dua screenshot pemilik, naskah scripts/run-evening-persib.cjs, pemeriksaan src/lib/cms/engine.ts dan pedoman src/lib/cms/editorial.ts.

Gordon adalah feature argumentatif. Penulis membuka dengan peristiwa dan respons narasumber, lalu menguji tesis lewat aksi, statistik, perbandingan dan kutipan. Subbagian memperluas argumen, bukan mengulang pembuka. Pendapatnya mempunyai bahan yang dapat diperiksa.

Piala Presiden memakai pola berita langsung. Pembuka mengangkat persoalan dan respons panitia. Bagian berikutnya membawa rincian berbeda, dari dasar persetujuan jadwal sampai kebijakan pemain dan turnamen. Kutipan dilekatkan pada narasumber serta situasi pelaporan. Ini contoh struktur penulisan, bukan verifikasi ulang seluruh fakta kedua artikel atau izin menyalin naskahnya.

## Kegagalan naskah Menalo

1. Angle terlalu kabur. Persib Datang dengan Rencana tidak menyampaikan pokok berita sejelas kesiapan Menalo, rekaman Port FC, atau target tiga poin.
2. Judul Kutipan Menalo, Bukan Janji Hasil membicarakan perlakuan redaksi terhadap kutipan. Pembaca membutuhkan isi pernyataan pemain.
3. Label Analisis Stadione muncul sebagai pemisah buatan. Paragraf sesudahnya sebagian besar nasihat umum tentang persiapan dan kemenangan, bukan analisis sepak bola yang dibuktikan lewat pola permainan, data atau kejadian tertentu.
4. Empat bagian isi mengulang kesiapan, respek dan target kemenangan. Bagian akhir hampir tidak menambah informasi. Naskah yang sama dapat ditempel pada klub lain hanya dengan mengganti nama.
5. Kalimat tentang hasil yang belum pasti, bukan bocoran pelatih, dan pertandingan belum berlangsung menyita ruang secara berulang. Pratinjau harus jelas waktunya, lalu menyampaikan cerita tanpa penjelasan defensif di setiap bagian.
6. Bahan berita pendek dipaksa menjadi lima halaman. Ruang diisi kalimat generik, alih-alih riset tambahan yang relevan atau pemilihan format lebih ringkas.
7. Saya menulis naskah tersebut dalam konstanta SLIDES dan menandainya narrative_reviewed=true. Kekurangan ini bukan kesalahan render gambar atau bukti bahwa platform menghasilkan naskah tersebut sendiri.

## Temuan engine

auditPacket memeriksa sumber, bukti klaim, aktualitas, angka, panjang teks, kelengkapan konteks dan pemetaan slide. Pengunci carousel memeriksa asal cover, gaya, checksum serta keterikatan aset dengan paket. Semua ini berguna, tetapi kelulusan teknis tidak menilai apakah setiap paragraf menambah informasi.

narrative_reviewed adalah boolean yang dapat diisi produsen paket. Engine belum mempunyai penilaian yang memadai terhadap angle, pengulangan makna, paragraf kosong, judul yang berbicara tentang proses redaksi, atau kecukupan bahan untuk panjang artikel. Ketentuan minimal lima bagian/aset di engine.ts turut mendorong pengisian ruang pada bahan pendek. Pedoman membedakan fakta dan analisis tidak mewajibkan label Analisis Stadione di depan paragraf. Label itu pilihan penulisan saya.

## Arah perbaikan

- Tentukan jenis tulisan lebih dulu, berita langsung atau feature/opini. Feature memerlukan tesis dan bukti yang lebih kaya.
- Tulis artikel utuh terlebih dahulu. Setiap paragraf harus menambah fakta, kutipan bermakna, konteks spesifik atau penalaran yang ditopang bukti.
- Judul menyampaikan substansi berita. Kutipan diperkenalkan lewat isi, pembicara dan konteksnya, tanpa judul tentang proses mengutip.
- Bawa penalaran melalui hubungan antarfakta. Bedakan inferensi dari fakta secara alami dan jangan mengarang detail taktik untuk menambah kedalaman.
- Jika bahan tipis, tambah sumber yang benar-benar membawa informasi baru atau pilih format lebih pendek. Jangan memperpanjang tulisan demi jumlah halaman.
- Pecah artikel yang sudah selesai menjadi carousel di batas paragraf. Jumlah halaman mengikuti isi serta keterbacaan.
- Review naskah harus terpisah dari review visual dan pemeriksaan fakta. Periksa paragraf yang bisa dihapus tanpa kehilangan informasi, pengulangan antarslide, serta apakah tulisan masih cocok jika nama klub diganti.
- Punctuation bukan bukti asal AI. Perbaikan harus menyentuh ritme, isi dan pilihan kalimat. Hindari label redaksi serta penggunaan titik dua/titik koma yang terasa mekanis, bukan melarang semua tanda baca secara membabi buta.

Contoh angle yang lebih langsung untuk bahan yang sudah terverifikasi adalah Persib Pelajari Port FC, Menalo Bidik Tiga Poin. Buka dengan target Menalo dan persiapan menghadapi lawan, lanjutkan kutipan kesiapan lalu konteks pertandingan. Detail tambahan hanya masuk setelah ada bukti.

Status akhir audit: dokumentasi saja. Penulisan ulang posting Menalo, penggantian aset Instagram dan perubahan gate/prompt/aturan jumlah halaman belum dilakukan.

## Tindak lanjut setelah permintaan memperbaiki engine

Permintaan berikutnya ditindaklanjuti dalam fe1c93b dan rilis tersebut sudah aktif. Artikel kanonis wajib sebelum carousel, pagination 2–10 halaman, audit label/pengulangan/kutipan/review digest, pasangan body website dan referensi Goal harian kini diterapkan. STADIONE_WRITING_GUIDE.md menjelaskan input dan batas operasionalnya. Dua bacaan contoh disimpan sebagai pelajaran sendiri dan automation menambah minimal satu bacaan baru tiap hari. Bagian status audit di atas mencatat keadaan sebelum implementasi ini; histori dipertahankan. Penilaian semantik tetap membutuhkan pembacaan substantif oleh agent/editor produksi, bukan hanya kelulusan regex/digest.
