# Stadione — slot normal malam 6 Oktober 2026

Pilar: Sepak Bola Indonesia, kutipan/update. Plan key `2026-10-06:mid-pm`, waktu normal 20:00 WIB. Format terbaik yang dipilih: carousel artikel, menggantikan preferensi format Reels untuk slot ini karena bahan terverifikasi merupakan pernyataan klub dan konteks pratinjau. Tidak memakai video AI atau mengulang hasil Timnas/Persija yang sudah diposting.

Riset SerpAPI `google_news` dengan reservasi kuota/cache engine: `sepak bola Indonesia when:1d`, lalu `Liga Indonesia Persib Persebaya -Thailand -Persija when:1d` dan `Persib when:1d`. Query awal didominasi final Timnas yang sudah diposting; query Persib menemukan laporan baru kesiapan Luka Menalo.

Sumber primer: https://persib.co.id/article-details/menalo-nyatakan-kesiapan-hadapi-port-fc

Sumber sekunder: https://banten.antaranews.com/berita/392129/luka-menalo-siap-berkontribusi-saat-persib-bandung-hadapi-port-fc

ANTARA memberitakan pernyataan dari laman klub; ini corroboration publikasi, bukan dua wawancara/observasi primer independen. Tidak mengklaim liputan langsung Stadione.

Fakta: Persib dijadwalkan menghadapi Port FC di Thailand pada 8 Oktober dalam pembukaan Shopee Cup 2026/27; Menalo menyebut kesiapan tim, analisis rekaman lawan, respek dan harapan tiga poin. Ini PREVIEW, tanpa skor/hasil/susunan pemain atau skema taktik yang belum terkonfirmasi. Penilaian tambahan ditandai Analisis Stadione. Kutipan Menalo yang dipakai singkat dan persis sumber.

Foto resmi klub: https://adt-persib-app-production.s3.ap-southeast-1.amazonaws.com/menalo_nando_1791267953877746617.jpg

Foto dikreditkan PERSIB / Fernando pada provenance internal dan hero artikel yang clean. Penilaian editorial tidak mengklaim lisensi pembelian atau izin khusus yang tidak diperoleh.

`persib-menalo-source.jpg`: SHA256 13f9a0b9f0705f0b835f4193cb8ac0c84fe7495e837706d32f7ce2b5c4845f5a.

`persib-menalo-cover.png`: SHA256 cf8f42245b0e98fb11798c5a144c5e76f11b92c885ae0957afb88caa25174d23; 1122x1402. Dibuat memakai image editing dengan foto klub dan cover Persija yang telah disetujui sebagai acuan gaya. Foto pemain, pose dan warna kit menjadi referensi; background diolah menjadi kolase koran/charcoal/merah. Bukan jaminan bahwa setiap piksel wajah/logo/jersey identik. Sumber singkat PERSIB.CO.ID, tanpa EDISI DIGITAL/footer promosi.

Naskah, claim ledger runtime, render dan publikasi memakai `scripts/run-evening-persib.cjs` dan shared engine yang dikunci. ID social/article stabil berdasarkan plan key; history Instagram/CMS diperiksa sebelum produksi. Artikel dibuat dari naskah carousel yang sama; timestamp publikasi disamakan. Bukti hasil dicatat di Plan Master setelah terbit.

Lima hasil JPEG final di `slides/` ikut diversionkan untuk review dan pemulihan artwork. Seluruhnya 1080x1350 dan telah diperiksa visual satu per satu pada 6 Oktober pukul 19:43 WIB. Body 36px, headline 60px, margin 72px; seluruh paragraf/headline berada di area aman. JPEG hasil render lokal identik byte dengan hasil render VPS. Visual QA terikat digest paket `19c9f6e954a875f7a5ea504c76935953dc078a14f8a0d525d9d291a3c9da0991`; perubahan paket memerlukan review ulang.

Terbit 6 Oktober pukul 20:01:27 WIB: https://www.instagram.com/p/DeJ16t0oAcS/ dan https://stadione.pro/news/persib-menalo-port-fc-shopee-cup-8-oktober-2026. Instagram mengonfirmasi album lima gambar pada stadione.id; jadwal konten normal lainnya identik. Bukti hasil/checksum/idempotensi/HTTP artikel dicatat di `published.json` dan Plan Master.
