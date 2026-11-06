# Alfiyyah

Aplikasi web statis untuk belajar dan menghafal Alfiyyah Ibnu Malik. Antarmuka menggunakan HTML, CSS, dan JavaScript biasa tanpa langkah build atau dependensi paket.

## Menjalankan aplikasi

Di Windows, klik dua kali `mulai_kuis.bat`. Skrip menjalankan server lokal dan membuka aplikasi di browser. Skrip memakai port 8000 jika tersedia; jika tidak, skrip otomatis memilih port lain. Tekan `Ctrl+C` pada jendela server untuk menghentikannya. Python harus sudah terpasang dan tersedia sebagai perintah `python`.

Untuk menjalankan langsung dari terminal, gunakan `python jalankan_server.py`. Service worker bekerja pada `localhost` atau konteks HTTPS, bukan pada halaman yang dibuka langsung dengan protokol `file:`.

## Menu belajar

Beranda mempertahankan satu tombol mode di atas empat pilihan bagian. Tombol mode berganti antara Muhafadzah dan Asilah; empat tombol bagian tetap sama dan membuka mode yang sedang dipilih:

- **Muhafadzah** — menampilkan bait dalam urutan asli, 10 bait per halaman. Tombol **Judul (⋮)** membuka daftar shortcut judul.
- **Asilah** — kuis melengkapi bait dengan empat pilihan berdasarkan rima.

Bagian data yang tersedia:

| Bagian | Nomor bait |
| --- | ---: |
| Pertama | 1–334 |
| Kedua | 335–668 |
| Ketiga | 669–1003 |
| Lengkap | 1–1003 |

## Harakat dan data

`ألف.json` merupakan sumber data dengan 1.003 bait. Properti utama pada setiap baris adalah:

| Properti | Kegunaan |
| --- | --- |
| `نمر` | Nomor urut bait. |
| `ن` | Nomor tampilan Arab. |
| `أول` | Setengah bait pertama. |
| `ثَان` | Setengah bait kedua. |
| `موضوع` | Judul/topik bait. |

Tombol **Harakat** tersedia pada Muhafadzah dan Asilah. Keduanya menggunakan fungsi yang sama di `global/teks.js`; perubahan hanya memengaruhi tampilan, bukan teks sumber data atau pemeriksaan jawaban.

## Struktur berkas

- `index.html` — beranda dan pemilih blok/bagian.
- `halaman-pembuka/` — gaya dan skrip beranda.
- `global/teks.js` — fungsi bersama untuk menghapus harakat dari tampilan.
- `muhafadzah/` — halaman, skrip, dan gaya khusus Muhafadzah.
- `asilah/` — halaman dan skrip khusus kuis.
- `asilah/gaya/` — gaya responsif khusus Asilah, dipisah menurut ukuran dan orientasi layar.
- `gaya/` — gaya versi lama yang tetap disimpan untuk halaman cadangan.
- `ألف.json` — sumber data bait.
- `service-worker.js` — cache untuk penggunaan offline.
- `jalankan_server.py` dan `mulai_kuis.bat` — server lokal dan peluncur Windows.
- `index-backup.html` dan `app.js` — salinan versi lama untuk referensi.

Tombol **R** di beranda menghapus cache aplikasi dan membatalkan registrasi service worker pada origin tersebut.
