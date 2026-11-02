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

## Mode ilustrasi pilihan editor

Manifest `visual_mode: "illustration"` memilih `storyboard` serta `illustration_box` per adegan. Komposisi judul, latar, ukuran frame, subtitle dan audio tetap sama; karakter/bola/properti animasi dinonaktifkan, ilustrasi editorial menjadi gambar fokus statis. Mode sprite lama tetap didukung. Proyek contoh: `/opt/stadione-editorial/hypit-kane-v4-20261027`.

## 2 November 2026 — jalur produksi ilustrasi rutin
- Dua penugasan ilustrasi: Senin 20.00 WIB (Satu Keputusan, Efek Besar) dan Rabu 20.00 WIB (Satu Momen, Satu Cerita), mulai 2 November, tetap dalam 12 slot. Aturan berlaku pada DRAFT/PENDING_REVIEW dengan plan_key rutin; format tidak boleh diturunkan ke carousel. Slot historis/SCHEDULED/PUBLISHED/archived/tombstone/additional tidak dimutasi.
- Jalankan `node --env-file=/opt/stadione/.env.production scripts/cms-illustrated-preflight.cjs` dari checkout committed. BLOCKED harus dilaporkan dengan tahap, bukan disembunyikan oleh fallback atau keberhasilan rutin.
- Siapkan input REEL dengan source packet terverifikasi dan `media.illustration_reel`. Gambar dibuat/direview oleh agent; generator gambar tanpa pengawasan belum dibangun. Pertahankan ilustrasi editorial dan layout Kane v4 sebagai acuan; renderer CMS generik belum identik dengan compiler Hypit.
- `node --env-file=/opt/stadione/.env.production scripts/cms-illustrated-narrate.cjs input.json narrated.json coral` memakai modul TTS yang sama dengan API CMS. Tidak mengubah draft atau menjadwalkan. Output tidak menimpa input dan memakai digest untuk reuse yang sama. Dengarkan hasil dan cek timing sebelum preview. Provider nyata harus terkonfigurasi; mock test bukan bukti kualitas suara/kuota.
- `cms-produce-slot.cjs preview narrated.json` sekarang merutekan illustration_reel ke renderIllustrationReel, bukan renderer footage. Setelah QA video/audio, mode `schedule` untuk ilustrasi menyimpan preview CMS dan menghasilkan READY_FOR_REVIEW. Ini bukan AUTO_SCHEDULED: review, approval serta penjadwalan pasangan ARTICLE masih harus diselesaikan melalui CMS. Jangan mengklaim terbit.
- Tidak menerapkan pengecualian audio Kane pada produksi lain. Belum ada API key narasi pada runtime saat pemeriksaan. End-to-end topik baru, fidelitas Hypit v4, review audio nyata dan publikasi masih belum terverifikasi.

### Komposisi CMS yang sudah dipindahkan
Renderer CMS sekarang mengikuti pembagian area Kane v4: cream, judul per adegan, ilustrasi utuh, subtitle terpisah, progress burgundy. Gunakan scenes[].title untuk judul adegan. Timing subtitle mengikuti batas narasi per adegan hasil TTS, belum per kata seperti compiler Hypit. Foto/gambar tetap perlu disiapkan dan diperiksa agent. QA fixture berhasil, provider suara nyata masih BLOCKED.
