# Stadione — prioritas audiens

Berlaku untuk produksi baru dari checkout operator sejak12Oktober2026. Pilihan Caldeira/MLS karena footage tersedia adalah kesalahan topik untuk audiens Stadione.

## Fokus sepak bola

Indonesia: Persija, Persib, Persebaya, PSS Sleman dan Timnas Indonesia.

Luar negeri: Arsenal, Manchester United, Chelsea, Manchester City, Liverpool, Juventus, Inter Milan, AS Roma, Real Madrid, Barcelona, PSG, Bayern Muenchen dan Ajax Amsterdam.

Pemain Timnas Indonesia di luar negeri menjadi prioritas, termasuk di klub di luar daftar. Pilih kontribusi konkret seperti menit bermain, penyelamatan, gol, assist atau duel. Contoh angle pemilik adalah penampilan Maarten Paes saat Ajax bertanding; bukan klaim pertandingan tertentu sudah terjadi. Verifikasi afiliasi klub, status pemain dan kontribusi melalui sumber primer serta penerbit independen.

Klub lain dibahas sebagai lawan/konteks klub prioritas atau tempat bermain pemain Timnas. Cerita sepak bola yang tidak terkait fokus ditahan oleh adapter produksi baru. Jangan memilih MLS/NFL/NBA/WNBA/MLB/NHL karena video mudah diunduh. Lokasi di Amerika bukan larangan: pramusim Arsenal atau pertandingan Timnas di sana tetap relevan. Pemain Timnas yang bermain di liga tersebut tetap memerlukan bukti afiliasi dan kontribusi.

## Pemilihan dan pemeriksaan

editorial/audience-priorities.json berisi klub/alias dan nama pemain sebagai petunjuk discovery, bukan roster atau bukti klub saat ini. scripts/editorial-audience.cjs memberi prioritas DIASPORA100, TIMNAS95, DOMESTIC_CLUB90, EUROPEAN_CLUB80, COMMUNITY60 dan OTHER_SPORT50. Ini prioritas editorial, bukan skor viral atau performa. Tetap ikuti pilar slot; berita Persib tidak masuk slot Eropa.

Ambil pool SerpAPI rilis melalui CLI read-only: node scripts/cms-audience-pool.cjs --pillar 'Sepak Bola Indonesia' --output /opt/stadione-editorial/production/audience-pool-baru.json

CLI memakai getDailySportsPool rilis melalui cms-load, cache/kuota yang berlaku dan menolak overwrite jurnal. Query Reels default YouTube serta SerpAPI fallback CLI memakai klub prioritas; hasil cache lama juga diperiksa ulang. Metadata harus dilanjutkan pembacaan penuh dan verifikasi, bukan bukti fakta atau hak pakai footage.

Adapter cms-produce-slot.cjs menilai judul/dek/lead sebelum preview/upload aset/perubahanCMS. Nama klub pada footer, caption atau navigasi sumber tidak meloloskan cerita yang tidak relevan. Gate memeriksa kesesuaian pilar. Matching teks membantu kategorisasi; editor tetap memeriksa subjek sebenarnya, bukan menganggap matchingnama sebagai penilaian semantik sempurna.

Pilar olahraga Indonesia nonbola dan Tarkam tetap mengikuti matriks. Jam08/13/20WIB, additional dan sejarah tidak berubah. SCHEDULED/PUBLISHED/ARCHIVED/tombstone/attempt dilindungi skip sebelum gate baru. Publisher/renderer app tidak diubah.

Validasi: node scripts/qa-editorial-audience.cjs; node scripts/qa-production-preview.cjs; node scripts/qa-youtube-discovery.cjs; node scripts/qa-reel-research.cjs. Policy dipakai langsung oleh workflow operator committed. Endpoint suggestCMS lama dan publisher aplikasi tidak diklaim memiliki filter baru.
