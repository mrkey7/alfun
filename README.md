# Alfiyah Quiz

Aplikasi web statis berbahasa Indonesia untuk berlatih melengkapi bait Alfiyah
Ibnu Malik. Antarmuka menggunakan HTML, CSS, dan JavaScript biasa; tidak ada
langkah build atau dependensi paket.

## Menjalankan aplikasi

Di Windows, klik dua kali `mulai_kuis.bat`. Skrip menjalankan server lokal dan
membuka aplikasi di browser. Skrip memakai port 8000 jika tersedia; jika tidak,
skrip otomatis memilih port lain. Tekan `Ctrl+C` pada jendela server untuk
menghentikannya. Python harus sudah terpasang dan tersedia sebagai perintah
`python`.

Untuk menjalankan langsung dari terminal, gunakan `python jalankan_server.py`.
Service worker bekerja pada `localhost` atau konteks HTTPS, bukan pada halaman
yang dibuka langsung dengan protokol `file:`. Saat dipasang di subdirektori,
pertahankan seluruh berkas dalam direktori yang sama agar jalur relatif dan
cakupan service worker tetap sesuai.

## Data dan aturan kuis

`ألف.json` adalah sumber data aplikasi. Bentuknya berupa objek dengan properti
`rows` yang berisi 1.003 bait. Kuis memakai properti berikut; `نمر` digunakan
untuk memilih bagian, sedangkan `ن` menjadi nomor tampilan utama jika tersedia:

| Properti | Kegunaan |
| --- | --- |
| `نمر` | Nomor bait untuk memilih bagian dan menampilkan nomor cadangan. |
| `ن` | Nomor tampilan bait jika tersedia. |
| `أول` | Setengah bait pertama. |
| `ثَان` | Setengah bait kedua. |

Kuis hanya memakai baris dengan kedua setengah bait terisi dan kunci rima
keduanya cocok. Kunci rima mengabaikan harakat, tatweel, dan tanda baca akhir,
menyamakan beberapa variasi huruf Arab, lalu mengambil dua huruf Arab terakhir
dari kata terakhir. Sebuah kelompok dapat dimainkan jika menyediakan sedikitnya
empat teks jawaban berbeda untuk salah satu setengah bait; ini memberi satu
jawaban benar dan tiga pengecoh.

Pilih salah satu dari tiga bagian (nomor 1–334, 335–668, atau 669–1003), atau
seluruh bait. Setiap bait yang dapat dimainkan muncul sekali dalam urutan acak.
Untuk setiap soal, salah satu setengah bait disembunyikan dan empat pilihan dari
kelompok rima terkait ditampilkan. Sesi mencatat jumlah benar, jumlah soal yang
dijawab, akurasi, dan durasi. Tombol **Selesai** dapat mengakhiri sesi sebelum
semua soal dijawab; jawaban yang belum diberikan tidak dihitung.

Di layar kuis, tombol **Harakat** mengubah tampilan harakat pada bait dan semua
pilihan jawaban. Teks tombol Arab juga berganti antara bentuk berharakat dan
tanpa harakat. Teks data dan pemeriksaan jawaban tetap menggunakan teks asli.

## Berkas

- `index.html` — halaman dan elemen antarmuka.
- `app.js` — pemuatan data serta alur kuis; nama variabel buatan proyek menggunakan bahasa Indonesia.
- `service-worker.js` — cache aplikasi untuk penggunaan offline.
- `ألف.json` — data bait.
- Beranda menampilkan menu belajar dalam kisi `daftar-menu`; menu saat ini adalah **Kuis Alfiyah**. Menu baru dapat ditambahkan sebagai kartu saudara di dalam kisi tersebut.
- Folder `gaya/` — gaya dasar dan aturan tampilan yang dipisah menurut arah serta ukuran layar:
  - `dasar.css` — warna, panel, tombol, dan aturan bersama.
  - `potret-sempit.css` — layar potret sampai lebar 700 piksel; ukuran teks pilihan jawaban dapat diubah di sini.
  - `potret-lebar.css` — layar potret dengan lebar mulai 701 piksel.
  - `landskap-pendek.css` — layar lanskap dengan tinggi sampai 600 piksel.
  - `landskap-tinggi.css` — layar lanskap di atas 600 piksel dan lebar mulai 701 piksel.
- `jalankan_server.py` — server lokal yang membuka aplikasi di browser.
- `mulai_kuis.bat` — peluncur satu klik untuk Windows.

Untuk memperbesar teks Arab pilihan jawaban pada layar potret sempit, cari
komentar penanda di `gaya/potret-sempit.css`, lalu ubah nilai `font-size` di
bawahnya. JavaScript tidak mengekspos fungsi sebagai modul atau API publik.
Service worker menyimpan halaman, seluruh berkas gaya, skrip, dan data;
permintaan aset aplikasi mengutamakan jaringan dengan cache sebagai cadangan
offline. Font Google disimpan secara best-effort. Tombol **R** di bagian bawah
halaman menghapus cache aplikasi dan membatalkan registrasi service worker pada
origin tersebut.
