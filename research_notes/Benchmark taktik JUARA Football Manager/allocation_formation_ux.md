# UX Patterns: Alokasi 100% & Auto/Manual Formasi (Wizard JUARA)

Konteks: wizard web (desktop + mobile), Bahasa Indonesia, pengguna eksekutif klub. Fokus pada langkah "Filosofi Arsitektur Skuad" (Owner melihat total 90%, tombol Lanjut tidak membantu) dan langkah pemilihan formasi. Catatan ini khusus pola UX; tidak menyentuh kode.

Catatan metodologis: sebagian besar literatur yang ditemukan adalah expert opinion / UX community (NN/g, Nielsen, W3C APG, UX Stack Exchange), bukan eksperimen A/B terkontrol untuk konteks identik. Satu-satunya data empiris yang dikutip Nielsen adalah testing internal tim Bondkowski (muted disabled button lebih baik), yang ia sebut sebagai bukti observasional tapi anecdotal; ia juga menyatakan secara eksplisit bahwa tidak ada bukti empiris kredibel di internet untuk masalah disabled button ([Nielsen, 2025](https://jakobnielsenphd.substack.com/p/inactive-buttons)). Sumber lokal: `/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv` (daftar guideline kantong UX, bukan studi primitif).

---

## KQ1. Pola alokasi persentase yang harus tepat 100% (triad slider, auto-balance, sisa otomatis, inline validation, disabled CTA) — apa kelebihan/kekurangannya?

### Takeaway
Jangan pernah membiarkan pengguna melakukan aritmetika sendiri: UI harus menjamin constraint terpenuhi atau setidaknya menyajikan "sisa yang belum dialokasikan" secara terus-menerus nyata. Untuk tepat 3 komponen, pola terbaik adalah **input angka dengan sisa otomatis di field terakhir + batas maksimum dinamis + pesan saat melebihi**, dengan slider sebagai alternatif opsional. Hindari "coercion diam-diam" pada semua field karena menghancurkan nilai yang ingin dipertahankan pengguna.

### Cited Findings
- "Maths is hard and letting users do hard things is a crime... There is a constraint (it has to sum up) so you better provide an interface that ensures the constraint is met." — [Izhaki, UX Stack Exchange (2017)](https://ux.stackexchange.com/questions/106356/whats-the-best-way-to-let-users-adjust-values-that-must-sum-to-a-certain-number/106358)
- Contoh konkret kebingungan aritmetika: "12.344 + 80.001 + 5.6 + 3.229? Not fun." — [Izhaki, UX SE](https://ux.stackexchange.com/questions/106356/whats-the-best-way-to-let-users-adjust-values-that-must-sum-to-a-certain-number/106358)
- Multi-slider (breakpoint, bukan range) dianggap paling sesuai untuk 1D; "user edits the breakpoints, not the ranges". Sliders = quick but coarse; textboxes = slow but fine; untuk presisi disarankan menyediakan keduanya. — [Izhaki, UX SE](https://ux.stackexchange.com/questions/106356/whats-the-best-way-to-let-users-adjust-values-that-must-sum-to-a-certain-number/106358)
- Untuk tepat 3 angka berjumlah 1 (kasus yang persis analog dengan triad JUARA): jawaban teratas menyarankan **auto-fill field terakhir yang kosong**, **tampilkan "max available" saat mengedit**, dan **tampilkan pesan saat nilai melebihi max**; slider hanya dipakai bila kemudahan lebih penting dari presisi, dan handle slider tidak boleh bertumpang tindih. Jawaban ini dipuji khusus karena bekerja untuk nilai nol / mendekati nol. — [jazZRo, UX SE (2021)](https://ux.stackexchange.com/questions/138876/widget-to-enter-3-numbers-that-must-add-up-to-1/138879)
- Pola "unallocated": "Can you keep a count of 'unallocated' points? The sum of points of each item plus the number of unallocated points must always equal 100." — [UX SE, budgeting interface](https://ux.stackexchange.com/questions/3736/how-to-build-a-budgeting-interface-sum-of-items-must-equal-100/74964)
- Form yang tidak bisa disubmit sampai total 100% dengan total dinamis berlabel "must be 100%" adalah praktik umum, tetapi penanya sendiri mencatat slider + text field sulit ditemukan (affordance) dan ia memilih versi dengan peringatan "over 100%" daripada versi relatif karena "they effectively destroy data that the user might have wanted to preserve". — [UX SE (2011)](https://ux.stackexchange.com/questions/7297/please-recommend-a-widget-to-alter-ratios-totalling-100)
- Coercion/x-ray adjustment memiliki kekurangan: "if you adjust values in the slider so that they add up to 100, it means that previous inputs the user provides will also change, therefore it makes the interaction and the rules around how the values should be adjusted more complicated than it needs to be." — [Michael Lai, UX SE (2017)](https://ux.stackexchange.com/questions/106356/whats-the-best-way-to-let-users-adjust-values-that-must-sum-to-a-certain-number/106357)
- Alternatif Michael Lai: mulai dari 0 atau mulai dari 100 dengan jelas, lalu beri pesan di titik Redistribusi bila melewati batas, dan tampilkan "total amount remaining" yang terus diperbarui. — [Michael Lai, UX SE](https://ux.stackexchange.com/questions/106356/whats-the-best-way-to-let-users-adjust-values-that-must-sum-to-a-certain-number/106357)
- Barber/stacked single slider ("breakpoint") bukan solusi jika pengguna butuh kontrol presisi tiap komponen; dua handle bisa bertabrakan pada nilai 0. — [UX SE (2021)](https://ux.stackexchange.com/questions/138876/widget-to-enter-3-numbers-that-must-add-up-to-1)
- shadcn Slider mendukung `max={100} step={1}` dan array dua nilai untuk range; pola "synced with input field" memakai two-way binding `onValueChange`/`onChange` dengan validasi rentang 0–100 — artinya slider + angka bisa hidup berdampingan di stack shadcn/Radix yang dipakai proyek. — [shadcn Slider](https://ui.shadcn.com/docs/components/base/slider); [shadcn.io synced slider](https://shadcn.io/examples/slider-synced-with-input-field)
- Rekomendasi lokal: validasi inline on blur lebih baik daripada submit-only; error ditempatkan tepat di bawah input dan dihubungkan dengan `aria-describedby`; hindari Gambar hanya merah (harus ikon/teks); gunakan `inputmode='numeric'` untuk input angka di mobile. — [lokal ux-guidelines.csv #54, #55, #56, #37, #63](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)
- Jangan biarkan perubahan teks validasi menggeser layout: sediakan ruang stabil untuk pesan error ("Reserve appropriate space or keep async states in a stable content-driven container"). — [lokal ux-guidelines.csv #19](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)

### Inferences
- Untuk JUARA, rekomendasi konkret P0: tiga number input dengan label jelas, field ketiga auto-terisi = `100 − (A+B)` (atau field yang sedang diedit jika field ketiga yang diubah), ditemani progress/segment bar "Total 90% • Kurang 10%" yang selalu terlihat. Ini langsung memperbaiki kasus Owner melihat 90% tanpa tahu harus ke mana.
- Batasi `max` tiap input secara dinamis = sisa yang masih tersedia + nilai field sendiri. Mencegah total >100 tanpa perlu menghancurkan input lain. Tampilkan pesan "Maksimal 40% (sisa 10% + nilai saat ini 30%)" bila pengguna mengetik melebihi.
- Simpan slider sebagai "mode cepat" opsional, bukan satu-satunya input. Eksekutif klub butuh presisi dan angka eksplisit; slider memberi kesan kasar. Jika slider dipakai, gunakan 2 breakpoint yang tidak bisa overlap, atau 3 slider independen dengan sisa otomatis — bukan single stacked slider yang menimpa handle pada nilai 0.
- Coercion otomatis (menggeser A/B saat C diubah) sebaiknya **tidak** dijadikan default tanpa kontrol: ia merusak data yang sengaja dipertahankan. Jika tetap dipakai, beri toggle "Seimbangkan otomatis" yang eksplisit dan bisa dimatikan.
- "Total 90%" bukan kondisi final yang netral: ini harus dibingkai sebagai **status belum selesai**, bukan error merah menakutkan. Sisa 10% = informasi, bukan hukuman.

### Gaps
- Tidak ditemukan eksperimen A/B terkontrol yang membandingkan triad slider vs input angka + sisa otomatis pada pengguna eksekutif/non-teknis; rekomendasi di atas adalah sintesis expert opinion, bukan hasil uji statistik.
- Tidak ada sumber yang menetapkan apakah field ke-3 harus auto-fill secara langsung saat dua field pertama diisi, atau baru saat blur; perlu diuji ringan dengan 3–5 Owner klub.
- Tidak ada panduan spesifik soal pembulatan (desimal vs bulat) untuk total 100%; JUARA perlu memutuskan apakah 33/33/34 atau 33.3/33.3/33.4 yang diterima.

---

## KQ2. Menampilkan state error dengan jelas (label tombol dinamis, pesan sisa, fokus ke field, disabled CTA)

### Takeaway
Tombol Lanjut yang hanya mati tanpa penjelasan adalah "communication dead end". Pola terbaik: **CTA tetap terlihat aktif/clicked dan memberi umpan balik yang menunjuk ke field bermasalah**, dengan pesan sisa di dekat input dan (bila dipakai) disabled state yang disertai alasan eksplisit. Error harus inline, dekat field, serta diumumkan ke pembaca layar.

### Cited Findings
- 10 guideline NN/g: (1) inline validation segera setelah field selesai diisi; (3) pesan error di dekat field; (4) warna + latar semitransparan; (5) ikon/animasi halus untuk membantu pembuta warna; (6) modal/error dialog sparingly karena mengganggu dan menaikkan cognitive load; (7) jangan validasi sebelum input selesai; (8) validation summary jangan jadi satu-satunya indikasi; (9) jangan pakai tooltip untuk error; (10) bila error berulang ≥3 kali, itu masalah desain, bukan pengguna. — [NN/g, Rachel Krause](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- Pesan error harus "explicit, human-readable, polite, precise, and give constructive advice"; menjaga pesan tetap dekat field mengurangi working-memory load. — [NN/g](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- Nielsen (2025): "Inactive GUI Controls" — 3 opsi (tampil normal + error saat diklik; disabled terlihat; disembunyikan). Kesimpulannya: tampilkan dalam **muted version of primary color**, BUKAN abu-abu datar, dan **sertakan penjelasan mengapa tidak tersedia serta cara mengaktifkannya**. 76% sumber merekomendasikan disabled yang terlihat + penjelasan; 24% active-appearance + error; 0% menyarankan menyembunyikan secara umum. — [Jakob Nielsen, Nov 2025](https://jakobnielsenphd.substack.com/p/inactive-buttons)
- Nielsen juga mengakui: "if a form's 'Continue' button is dimmed out, users who believed they were done suddenly have to figure out what's missing... guesswork can be time-consuming and frustrating." — [Jakob Nielsen](https://jakobnielsenphd.substack.com/p/inactive-buttons)
- Smashing Magazine: "Preventing the user from submitting an invalid form is the most common reason to disable a button. However, the user probably won't understand why the button is disabled and won't know how to fix the errors... Whenever possible, avoid disabled buttons. Let people click buttons at any time and show them the error message with instructions." — [Sandrina Pereira, Smashing Magazine (2023)](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Untuk form pendek: fokus otomatis ke field invalid saat submit membantu keyboard users; berkat `aria-describedby`, pembaca layar langsung membaca error tanpa perlu `aria-live`. Untuk form panjang: error summary ringkas + `aria-live="assertive"` (sr-only) dan salinan visual dengan `aria-hidden="true"` agar tidak dibaca dua kali. — [Smashing Magazine](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Smashing memberi catatan hati-hati: auto-focus invalid input bisa membingungkan; "In doubt, I prefer to keep things simple and not add auto-focus" — jadi fokus otomatis bukan keharusan mutlak, tapi sah dan membantu untuk form pendek seperti wizard 1 layar. — [Smashing Magazine](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Rekomendasi lokal: "Error Recovery — Provide clear next steps"; "Focusable Error Summary — place at top of form; move focus to its heading or container after failed submit; link each item to its invalid field; retain inline errors". — [lokal ux-guidelines.csv #80, #109](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)
- WCAG 2.2: focus harus tetap terlihat (Focus Not Obscured), target ≥24 CSS px, dan drag harus punya alternatif single-pointer — relevan kalau solusi memakai slider. — [lokal ux-guidelines.csv #100, #103, #104](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)

### Inferences
- P0 untuk bug yang dilaporkan Owner: ubah perilaku tombol Lanjut. Jangan biarkan tombol "tidak membantu". Dua opsi yang bisa langsung dipakai PM:
  1. **CTA tetap aktif**; saat diklik dengan total 90%, tampilkan pesan di dekat ringkasan: "Total masih 90%. Kurangi 10% lagi dari salah satu porsi, lalu lanjutkan." + fokus/scroll ke field pertama yang bisa diubah + `aria-live`.
  2. **CTA muted (warna primer diredupkan, bukan abu), tidak benar-benar disabled**, dengan teks pembantu permanen di bawahnya: "Lanjut aktif setelah total tepat 100%." Klik tetap memicu pesan penjelas. Ini mengikuti bukti terbaik Nielsen sekaligus menghindari dead-end.
- Hindari mengganti seluruh label tombol menjadi teks error panjang. Gunakan **label aksi yang stabil** ("Lanjut") + **pesan status terpisah** di dekat tombol/field. Alasan: prinsip WAI untuk toggle button — "it is critical the label on a toggle does not change when its state changes"; bila label berubah, atribut state jangan dipakai ([WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)). Untuk CTA, label dinamis boleh sepanjang tetap menyebut aksinya, mis. "Lanjut • kurang 10%", bukan "Error".
- Pesan sisa sebaiknya positif dan berorientasi pada aksi: "Sisa 10% belum dialokasikan" + progress bar 90% + teks "Total harus 100%". Jangan hanya angka 90% tanpa satuan dan target.
- Jangan pakai tooltip/hover saja untuk pesan ini (NN/g guideline 9) karena Owner di mobile tidak punya hover.
- Jangan langsung memunculkan error merah saat pengguna baru mengetik angka pertama (NN/g guideline 7) — validasi setelah blur atau saat pengguna menekan Lanjut.

### Gaps
- Tidak ada data empiris yang membandingkan "CTA muted + hint" vs "CTA aktif + error on click" secara head-to-head; Nielsen sendiri menyatakan tidak ada bukti kredibel yang menentukan (ia memilih muted berdasarkan testing tim, bukan literatur).
- Tidak ada panduan soal seberapa lama status "kurang 10%" harus bertahan atau apakah boleh auto-dismiss; perlu keputusan produk.
- Tidak diketahui apakah wizard JUARA saat ini sudah punya error summary di level langkah; bila belum, menambah summary + fokus bisa jadi perubahan yang lebih besar dari sekadar mengubah tombol.

---

## KQ3. Pola Auto vs Manual pada pemilihan formasi (segmented control, preview hasil, template + custom input)

### Takeaway
Gunakan **segmented control (2 opsi: Auto / Manual) dengan default Auto**, disertai preview formasi yang langsung berubah, dan perlakukan "Manual" sebagai opt-in ke mode lanjutan. Auto = template yang dikurasi; Manual = input bebas dengan batasan yang sama seperti alokasi 100%. Hindari radio button tersembunyi atau dropdown untuk keputusan biner yang sering dibalik.

### Cited Findings
- WAI-ARIA Radio Group Pattern: radiogroup berisi radio; `aria-checked` true/false; keyboard: Tab masuk/keluar grup, Space memilih, panah kanan/bawah berpindah + memilih, panah kiri/atas kembali; grup harus punya label lewat `aria-labelledby`/`aria-label`; deskripsi tambahan lewat `aria-describedby`. Juga diperkenankan menginisialisasi semua radio dalam keadaan unchecked untuk memaksa pengguna memilih sebelum lanjut. — [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- WAI-ARIA Button Pattern: toggle button memakai `aria-pressed` true/false; **label tidak boleh berubah saat state berubah** bila memakai `aria-pressed`; bila label ikut berubah (mis. Mute→Unmute), atribut `aria-pressed` tidak diperlukan. Space dan Enter keduanya mengaktifkan button; setelah aktivasi, fokus biasanya tetap di tombol bila konteks tidak berubah, atau berpindah ke awal langkah bila terjadi context change (mis. "move to next step in a wizard"). — [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- shadcn/Radix menyediakan `ToggleGroup type="single"` ("A set of two-state buttons that can be toggled on or off") dengan item `ToggleGroupItem`, style `variant="outline"`, `spacing`, `orientation`, dan `disabled` — ini adalah segmented control yang siap dipakai, bukan radio button native. — [shadcn Toggle Group](https://ui.shadcn.com/docs/components/toggle-group)
- Untuk switch biner on/off, shadcn juga menyediakan komponen `Switch` — tapi untuk dua mode yang sama-sama bermakna (Auto vs Manual), toggle group lebih tepat daripada switch yang menyiratkan "aktif/nonaktif". — [shadcn Switch](https://ui.shadcn.com/docs/components/base/switch)
- Nielsen: "training wheels" / progressive modes (basic vs advanced) improve initial learnability — mendukung desain Auto sebagai default dan Manual sebagai mode lanjutan yang di-opt-in. — [Jakob Nielsen, Nov 2025](https://jakobnielsenphd.substack.com/p/inactive-buttons) (mengutip Carroll & Carrithers)
- Rekomendasi lokal: "Active State — current page/section should be visually indicated"; "Focus States — visible focus ring on every interactive control"; "Confirmation/Success Feedback — show success message or visual change". — [lokal ux-guidelines.csv #3, #28, #34, #83](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)
- NN/g guideline 2: indikator keberhasilan berguna untuk complex fields dan membantu pengguna memutuskan apakah input sudah cukup — analog dengan preview formasi yang memberi tahu "Auto menghasilkan 4-3-3 dengan 11 pemain". — [NN/g](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- Heuristik Nielsen #1 "visibility of system status" dipakai Nielsen untuk membenarkan disabled/muted states; prinsip yang sama menjustifikasi preview langsung saat mode Auto/Manual diganti. — [Jakob Nielsen](https://jakobnielsenphd.substack.com/p/inactive-buttons)

### Inferences
- P1 (atau P0 untuk langkah formasi): segmented control dua opsi **"Auto" | "Manual"** dengan `role="radiogroup"`/`aria-pressed` yang benar, default **Auto**. Jangan pakai dropdown dan jangan pakai switch on/off.
- Auto harus langsung menampilkan **preview konkret** (diagram lapangan + nama formasi + ringkasan "cocok untuk filosofi Anda: ..."), sehingga eksekutif melihat hasil tanpa menekan tombol hitung. Manual menampilkan editor yang sama dengan mekanisme alokasi KQ1 (total 100%).
- Pola "template + custom input" = Auto menyediakan template yang dikurasi (mis. 4-3-3 / 4-2-3-1 / 3-5-2), Manual membuka input bebas + tombol "Mulai dari template" untuk mengisi awal. Ini mengurangi blank-canvas anxiety sekaligus memberi kontrol penuh.
- Saat berpindah Auto→Manual, lakukan **copy nilai dari preview ke editor Manual** (bukan reset), supaya tidak kehilangan data — selaras dengan keinginan pengguna untuk tidak "menghancurkan data yang ingin dipertahankan" ([UX SE](https://ux.stackexchange.com/questions/7297/please-recommend-a-widget-to-alter-ratios-totalling-100)).
- Beri label state yang Stabil: tombol "Auto" dan "Manual" tidak boleh berganti teks saat dipilih; cukup indikator pressed/checked. Ini aturan eksplisit WAI untuk toggle.
- Keyboard: panah kiri/kanan berpindah opsi bila memakai radiogroup; Tab masuk/keluar grup. Bila memakai `ToggleGroup`, pastikan roving tabindex/arrow-key behavior tidak hilang saat di-click dengan mouse.

### Gaps
- Tidak ditemukan studi yang secara spesifik mengevaluasi segmented control Auto/Manual untuk wizard konfigurasi olahraga; rekomendasi diturunkan dari pola generik APG + progressive disclosure.
- Tidak ada sumber yang menentukan apakah preview Auto boleh muncul sebagai modal atau harus inline. Rekomendasi inline didasarkan pada NN/g guideline 6 (modals sparingly), bukan uji langsung.
- Tidak diketahui daftar formasi/batasan taktik JUARA yang sebenarnya; PM perlu memastikan constraint 100% juga berlaku di mode Manual formasi (bisa jadi constraint-nya beda, mis. total pemain = 11).

---

## KQ4. Prinsip aksesibilitas yang relevan (label, aria-pressed, error summary, keyboard)

### Takeaway
Untuk wizard ini, minimum yang harus dipenuhi: label terlihat pada tiap input + `aria-describedby` ke petunjuk/error, `aria-invalid` saat salah, state yang diumumkan via live region/error summary yang bisa difokus, serta navigasi keyboard penuh dengan fokus terlihat. Gunakan `aria-pressed` hanya untuk toggle yang labelnya tidak berubah; gunakan `radiogroup` bila pilihannya saling eksklusif.

### Cited Findings
- WAI-ARIA Checkbox Pattern: checkbox dual-state vs tri-state (mixed); Space mengganti state; `aria-checked` true/false/mixed; grup diberi `role="group"` + `aria-labelledby`; deskripsi lewat `aria-describedby`. — [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
- WAI-ARIA Radio Group: `radiogroup` + `radio`, `aria-checked`, label grup via `aria-labelledby`/`aria-label`, keyboard Tab + Space + arrow keys. — [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- WAI-ARIA Button: `aria-pressed` untuk toggle; label tidak berubah saat state berubah; `aria-disabled="true"` bila aksi tidak tersedia; Enter/Space mengaktifkan; fokus setelah aktivasi mengikuti jenis aksi (wizard → pindah ke awal langkah berikutnya). — [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- Smashing Magazine: `aria-describedby` menghubungkan deskripsi/error ke input dan dibaca setelah label; `aria-invalid="true"` membuat SR mengumumkan field invalid; `aria-errormessage` belum didukung mayoritas SR, jadi pakai `aria-describedby`; `aria-live="assertive"` dipakai untuk error dinamis; asterisk sebaiknya `aria-hidden="true"` + atribut `required`/`aria-required`. — [Sandrina Pereira, Smashing Magazine](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Smashing: optimalisasi untuk form pendek = fokus ke field invalid saat submit; untuk form panjang = error summary sr-only dengan `aria-live="assertive"` + salinan visual `aria-hidden="true"`. — [Smashing Magazine](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Automasi hanya menangkap ~20–25% isu aksesibilitas; diperlukan kombinasi automated + unit + manual + user testing, termasuk mencoba screen reader sendiri. — [Smashing Magazine](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- WCAG 3.3 Input Assistance: 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 3.3.3 Error Suggestion, 3.3.4 Error Prevention, 3.3.5 Help, 3.3.6 Error Prevention (All). — [Smashing Magazine (ringkasan WCAG)](https://smashingmagazine.com/2023/02/guide-accessible-form-validation/)
- Rekomendasi lokal (ringkas, siap dipakai PM/eng): #43 & #54 label input; #44 error diumumkan via `aria-live`/`role=alert`; #55 inline error + `aria-describedby`; #56 validasi on blur; #37 jangan warna saja; #41 keyboard navigation + focus; #28 focus ring; #22 target sentuh 44pt iOS/48dp Android, web 24 CSS px + exception; #109 focusable error summary dengan link ke field invalid; #100–104 WCAG 2.2 AA. — [lokal ux-guidelines.csv](/home/taradfs/.opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv)
- Chakra/Ark discussion mengingatkan: **jangan memakai `fieldset>+legend` dan `radiogroup>+aria-labelledby` sekaligus** untuk grup yang sama — pilih salah satu sesuai APG. — [chakra-ui/ark discussion #3736](https://github.com/chakra-ui/ark/discussions/3736)

### Inferences
- Checklist minimum untuk Perbaikan JUARA:
  1. `<label for>` terlihat untuk "Porsi 1/2/3" (bukan placeholder saja).
  2. Teks batas/"sisa" dihubungkan dengan `aria-describedby`; saat total ≠100, tambahkan `aria-invalid="true"` pada field yang relevan dan pesan "Total 90%. Sisa 10%." di dalam live region.
  3. Error summary di atas langkah dengan `tabindex="-1"`, `role="alert"`/`aria-labelledby`, dan anchor link ke tiap field; fokus dipindah ke summary setelah Lanjut ditekan dalam kondisi invalid (form wizard pendek → boleh juga langsung fokus ke field pertama).
  4. Segmented control Auto/Manual: radiogroup + arrow keys **atau** toggle group dengan roving tabindex; beri `aria-pressed` hanya jika tombol toggle dan label statis.
  5. Status "Auto aktif / Manual aktif" jangan hanya berupa warna — sertakan teks/ikon.
  6. Uji keyboard: Tab urutan sesuai visual, Space/Enter bekerja, arrow keys pada grup, fokus tidak tertutup sticky header/footer.
- Bila slider dipakai, sediakan alternatif non-drag: number input tetap ada, dan tombol +/- untuk penyesuaian halus (WCAG 2.2 Dragging Movements).

### Gaps
- Tidak ada informasi apakah stack JUARA memakai shadcn/Radix, Chakra, atau komponen internal; rekomendasi ARIA bersifat generik dan perlu diterjemahkan ke komponen yang dipakai.
- Tidak diketahui dukungan screen reader target (NVDA/VoiceOver) yang dipakai pengguna klub; Smashing mencatat perbedaan perilaku antar SR.
- Tidak ada bukti bahwa pengguna JUARA saat ini menggunakan pembaca layar; checklist ini bersifat pencegahan dan kepatuhan, bukan temuan hasil riset pengguna.
