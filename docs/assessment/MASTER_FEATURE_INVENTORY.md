# Master Feature Inventory — assessment baseline

86 kelompok fitur logis dengan subfitur, bukan 86 produk/tim terpisah.
File mesin: [MASTER_FEATURE_INVENTORY.csv](MASTER_FEATURE_INVENTORY.csv).
Detail sumber dan debt: [Platform](PLATFORM_FEATURE_FINDINGS.md) dan [JUARA](JUARA_TEAM_FINDINGS.md).
Struktur dan mapping final proposal: [FEATURE_TEAM_RECOMMENDATION.md](FEATURE_TEAM_RECOMMENDATION.md).
Jika mapping pada catatan analis berbeda, rekomendasi utama yang berlaku sebagai usulan.

Status assessment_stage menggunakan Development/Testing/Production/Backlog.
Untuk platform non-JUARA, Development berarti source ditemukan tetapi acceptance
belum terverifikasi, BUKAN bukti belum live. verification dan stage_detail wajib
dibaca bersamaan. Production baseline JUARA bersifat reported, kandidat penggantinya
bisa Testing. PM wajib menambahkan deployed_SHA/URL/smoke_date/last_incident untuk
mengunci inventory live. Unknown production bukan Backlog.

Owner activation seluruhnya Proposed; PM tetap accountable koordinasi saat ini.
CSV pod menunjuk satu owner sesi pada rekomendasi. OP02 adalah reporting aggregate
milikF, tetapi bug angka sumber tetap owner domain masing-masing. OP03 mencakup
announcements; delivery notification dipisahkan keF, fee/discount engine keD.
VE01 katalog publikA; tenant registry/access enforcementF. Batas ini tidak berarti
shared responsibility tanpa accountable owner.

Tanggung jawab end-to-end semua baris mengikuti kontrak pada rekomendasi; status
Production tidak mengakhiri ownership. No deployment/restructuring performed.
