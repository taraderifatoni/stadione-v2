# Reels ilustrasi dan narasi

Jalur ini merender ilustrasi statis dengan gerakan kamera sederhana, subtitle dan satu rekaman narasi. Ia tidak membuat gambar atau suara otomatis. Siapkan gambar dan audio berizin terlebih dahulu di URL HTTPS publik. Video sumber dan carousel tetap memakai jalur lama.

Pada draf sosial format REEL, gunakan source packet versi 3 dengan sumber, klaim, 5W1H, review narasi dan slides sesuai gate Sports Desk. Tambahkan `media.illustration_reel`:

```json
{
  "audio_url": "https://example.com/narasi.mp3",
  "audio_credit": "Narator Stadione",
  "audio_rights": "CLEARED",
  "audio_evidence": "Rekaman orisinal redaksi",
  "scenes": [
    {"image_url":"https://example.com/scene1.jpg","image_credit":"Ilustrasi Stadione","rights_evidence":"Aset orisinal","start":0,"end":3,"narration":"Kalimat adegan pertama.","claim_ids":["claim-1"]},
    {"image_url":"https://example.com/scene2.jpg","image_credit":"Ilustrasi Stadione","rights_evidence":"Aset orisinal","start":3,"end":6,"narration":"Kalimat adegan kedua.","claim_ids":["claim-1"]},
    {"image_url":"https://example.com/scene3.jpg","image_credit":"Ilustrasi Stadione","rights_evidence":"Aset orisinal","start":6,"end":9,"narration":"Kalimat adegan ketiga.","claim_ids":["claim-1"]}
  ]
}
```

Rentang 3–12 adegan, total 8–90 detik, tiap adegan maksimal 20 detik. Waktu berurutan dari nol; selaraskan subtitle dengan rekaman sebelum render. Teks adegan maksimal 180 karakter dan semua claim ID harus ada pada ledger. Semua file harus diakses oleh server; audio harus setidaknya sepanjang video. Simpan draf, klik Buat preview engine, periksa video dan audio, lalu lakukan approval melalui CMS sebelum penjadwalan/publikasi. Preview ilustrasi tidak dijadwalkan otomatis. Hak dan klaim tetap harus diperiksa manusia; nilai CLEARED adalah pernyataan editor, bukan bukti lisensi otomatis.

Batas versi awal: belum ada pembuat gambar, text-to-speech, upload aset khusus, timeline grafis, dan sinkronisasi otomatis. Audio adalah file pra-rekaman; ilustrasi bukan rekaman faktual. Sertakan keterangan ilustrasi di caption bila konten bisa disalahartikan sebagai dokumentasi nyata.

## Narasi AI dan musik latar

Editor dapat memilih suara dan menekan **Buat narasi AI** setelah packet ilustrasi diisi. Server memanggil OpenAI `gpt-4o-mini-tts` per adegan, menggabungkan audio, memperbarui start/end secara berurutan, dan menyimpan WAV di bucket CMS. Dengarkan, periksa pengucapan, simpan draf, kemudian buat preview. Mengubah teks membatalkan kecocokan narasi: buat ulang sebelum render. Narasi AI diberi keterangan pada caption. Generasi memakai API berbayar dan hanya dipicu oleh tombol admin; tidak berjalan otomatis pada konten terjadwal.

Konfigurasi server: `OPENAI_API_KEY` harus tersedia untuk service Stadione secara aman, tanpa disimpan di Git. Tidak ada kunci yang dibundel. Bila belum tersedia, tombol menampilkan status belum tersambung. Pembacaannya dilakukan server dan nilai tidak dikirim ke browser. Rekaman manual tetap didukung melalui `audio_url` dan metadata hak pada packet.

Musik opsional menggunakan URL HTTPS publik, kredit, bukti izin dan status `CLEARED`. Pada CMS, isi kolom musik, konfirmasikan hak pakai dan pilih volume 0–30 persen (awal 12 persen). Server mencampur musik ke rekaman, mengulang musik pendek sesuai durasi narasi dan membatasi puncak audio. Ini musik berlisensi yang disediakan redaksi, bukan pencarian katalog lagu viral Instagram. Pastikan izin mencakup distribusi Instagram dan wilayah yang relevan. Hak tidak diverifikasi secara otomatis. Dengarkan hasil preview sebelum menyetujui publikasi.

Batas: gambar masih disiapkan di luar engine; sumber, klaim, adegan dan ilustrasi masih memakai packet JSON. Belum ada generator ilustrasi, unggahan aset khusus atau editor timeline grafis. Panggilan OpenAI hanya diuji menggunakan penyedia tiruan sampai kredensial dan kuota valid tersedia.

## Musik CC0 bawaan

Tombol **Pakai musik gratis CC0 · Game Travel 1 (Piano)** memilih instrumental HoliznaCC0 dari Free Music Archive, dengan volume awal 12%. Sumber: https://freemusicarchive.org/music/holiznacc0/background-music/game-travel-1-piano/ ; lisensi CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/ . SHA-256 file: `ce270b4b4b9e490893bbd36abba505698ed78fe1d7b0805b3aea09b953815de2`. Lisensi memberikan hak pakai tanpa biaya, tetapi tidak menjamin platform tak akan membuat klaim otomatis. File disimpan di bucket publik CMS; bukan katalog lagu Instagram.

Bucket `stadione-cms` perlu mengizinkan `audio/mpeg` dan `audio/wav` untuk musik dan hasil narasi AI. Migrasi `20261027000001_stadione_cms_audio_types.sql` mempertahankan format dan batas ukuran yang sudah ada.
