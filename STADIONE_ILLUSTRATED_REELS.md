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
