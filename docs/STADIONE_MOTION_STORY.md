# Stadione Motion Story — prototipe Hypit

`scripts/hypit-motion-story.cjs` membaca `story.json` untuk menyusun source Hypit. Latar dan judul, karakter, properti, bola, subtitle, narasi dan musik adalah lapisan terpisah. Karakter, properti, dan bola diberi keyframe. Subtitle memakai penanda waktu per kata yang diperoleh bersama audio, maksimal empat kata dan memisahkan jeda antarkalimat.

Percobaan Kane berada di `/opt/stadione-editorial/hypit-kane-v3-20261027`. Folder berisi `story.json`, sprite PNG, narasi WAV, musik MP3 dan `hypit.runtime.json`. Jalankan dari checkout:

```sh
node scripts/hypit-motion-story.cjs /path/absolut/story-project
cd /path/absolut/story-project
npx --no-install hypit check motion.svrun
npx --no-install hypit plan motion.svrun --runtime hypit.runtime.json
npx --no-install hypit build motion.svrun --runtime hypit.runtime.json --follow
```

Manifest version 1 berisi `sprites`, `sprite_boxes`, `voice`, `music`, serta `scenes`. Setiap scene berisi `label`, `title`, `narration`, `frames` pada 30fps, `sprite`, `effect`, `sources`, dan `words` berupa `text`, `start`, `end` dalam detik relatif adegan. Efek: gate, road, goal, trophy, award, number. Compiler hanya memeriksa struktur dan rentang waktu, bukan kebenaran klaim atau hak aset. Keluaran `motion.svml`, `motion.svs`, `motion.svrun`, dan `motion-assets/` dapat diedit dan dirender ulang.

Contoh memakai ilustrasi AI, musik CC0 FMA HoliznaCC0 dan suara percobaan Microsoft Edge TTS. Hak komersial layanan suara belum diverifikasi. Karakter dan properti bergerak sebagai sprite, belum animasi sendi/lip-sync. Prototipe ini belum terhubung ke CMS: belum ada editor storyboard, generator riset/gambar/suara, job queue, approval, atau integrasi penerbit. Sebelum produksi dibutuhkan validasi hak dan isi, review keamanan dependensi, serta pengujian end-to-end.
