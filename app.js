"use strict";
const modeArab = document.getElementById('modeArab');

modeArab.addEventListener('click', () => {
    modeArab.innerHTML = modeArab.textContent.trim() === 'مُحَافَظَةٌ'
        ? '<span lang="ar">أَسْئِلَةٌ</span>'
        : '<span lang="ar">مُحَافَظَةٌ</span>';
});

const ambilElemen = pengenal => document.getElementById(pengenal);

const ALAMAT_DATA = "./ألف.json";
const TAMPILKAN_TOMBOL_HAPUS_TEMBOLOK = true;
const bagianKuis = {
    awal: { mulai:1, akhir:334 },
    tsani: { mulai:335, akhir:668 },
    tsalits: { mulai:669, akhir:1003 },
    semua: { mulai:1, akhir:1003 }
};
let dataBait = [], dataBaitAktif = [], daftarSoal = [];
let indeksSoal = 0, jumlahBenar = 0, jumlahDijawab = 0;
let sudahDijawab = false, bagianTerpilih = "semua";
let harakatDitampilkan = true;
let waktuMulaiKuis = 0, intervalPewaktu = null;
const statusPemuatan = ambilElemen("statusPemuatan"), beranda = ambilElemen("beranda"), kuis = ambilElemen("kuis"), hasil = ambilElemen("hasil");

const tombolAturUlangTembolok = ambilElemen("tombolAturUlangTembolok");
tombolAturUlangTembolok.hidden = !TAMPILKAN_TOMBOL_HAPUS_TEMBOLOK;
tombolAturUlangTembolok.addEventListener("click", async () => {
    if (!confirm("Hapus cache Alfiyah Quiz dan muat ulang aplikasi?")) return;

    tombolAturUlangTembolok.disabled = true;
    try {
        const daftarKunci = await caches.keys();
        await Promise.all(
            daftarKunci.filter(kunci => kunci.startsWith("alfiyah-quiz-")).map(kunci => caches.delete(kunci))
        );

        const pendaftaran = await navigator.serviceWorker?.getRegistration("./");
        if (pendaftaran) await pendaftaran.unregister();

        location.reload();
    } catch (kesalahan) {
        tombolAturUlangTembolok.disabled = false;
        alert("Cache gagal dihapus: " + kesalahan.message);
    }
});
document.querySelectorAll("[data-bagian]").forEach(tombol => {
    tombol.addEventListener("click", () => mulaiKuis(tombol.dataset.bagian));
});
ambilElemen("tombolHarakat").addEventListener("click", () => {
    harakatDitampilkan = !harakatDitampilkan;
    perbaruiTampilanHarakat();
});

async function muatDataDaring() {
    statusPemuatan.textContent = "Memuat data Alfiyyah...";
    try {
        const tanggapan = await fetch(ALAMAT_DATA);
        if (!tanggapan.ok) throw new Error(`HTTP ${tanggapan.status}`);
        siapkanData(await tanggapan.json());
        statusPemuatan.textContent = "";
    } catch (kesalahan) {
        statusPemuatan.textContent = "Gagal memuat data: " + kesalahan.message;
    }
}

function kunciRima(teks) {
    // Abaikan harakat, tatweel, dan tanda baca; samakan variasi alif/ta marbuta
    // sebelum mengambil dua huruf Arab terakhir sebagai kunci rima.
    const kataKata = hapusHarakat(String(teks ?? "").normalize("NFC"))
        .replace(/\u0640/g, "")
        .replace(/[،؛,.!?؟\\]+$/g, "")
        .trim()
        .split(/\s+/);

    const kata = (kataKata.pop() || "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ا")
        .replace(/ة/g, "ه");

    return [...kata].filter(karakter => /[\u0621-\u064A]/.test(karakter)).slice(-2).join("");
}

function hapusHarakat(teks) {
    return String(teks ?? "").replace(/[\u064B-\u065F\u0670]/g, "");
}

function teksUntukTampilan(teks) {
    return harakatDitampilkan
        ? teks
        : hapusHarakat(teks);
}

function perbaruiTampilanHarakat() {
    const tombolHarakat = ambilElemen("tombolHarakat");
    tombolHarakat.setAttribute("aria-pressed", String(harakatDitampilkan));
    tombolHarakat.textContent = harakatDitampilkan ? "حَرَكَات" : "حركات";

    ["setengahKanan", "setengahKiri"].forEach(pengenal => {
        const setengah = ambilElemen(pengenal);
        setengah.textContent = teksUntukTampilan(setengah.dataset.teksAsli);
    });

    [...ambilElemen("daftarPilihan").children].forEach(tombol => {
        tombol.textContent = teksUntukTampilan(tombol.dataset.teksAsli);
    });
}

function siapkanData(dataMasuk) {
    if (!dataMasuk || !Array.isArray(dataMasuk.rows)) throw new Error("Format JSON tidak sesuai.");
    const baris = dataMasuk.rows.filter(baris => String(baris["أول"] ?? "").trim() && String(baris["ثَان"] ?? "").trim());
    dataBait = baris.filter(baris => {
        const rima = kunciRima(baris["أول"]);
        return rima && rima === kunciRima(baris["ثَان"]);
    });
    Object.entries(bagianKuis).forEach(([kunci, bagian]) => {
        const terpilih = dataBait.filter(baris => {
            const nomor = Number(baris["نمر"]);
            return nomor >= bagian.mulai && nomor <= bagian.akhir;
        });
        const jumlah = ambilDataLayakKuis(terpilih).length;
        const tombol = document.querySelector(`[data-bagian="${kunci}"]`);
        tombol.disabled = jumlah < 4;
    });
}

function ambilDataLayakKuis(baris) {
    const kelompokPertama = new Map(), kelompokKedua = new Map();
    baris.forEach(baris => {
        const kunci = kunciRima(baris["أول"]);
        if (!kelompokPertama.has(kunci)) kelompokPertama.set(kunci, new Set());
        if (!kelompokKedua.has(kunci)) kelompokKedua.set(kunci, new Set());
        kelompokPertama.get(kunci).add(String(baris["أول"]).trim());
        kelompokKedua.get(kunci).add(String(baris["ثَان"]).trim());
    });
    // Setidaknya empat teks berbeda diperlukan agar setiap bait punya tiga pengecoh.
    return baris.filter(baris => {
        const kunci = kunciRima(baris["أول"]);
        return kelompokPertama.get(kunci).size >= 4 || kelompokKedua.get(kunci).size >= 4;
    });
}

function acak(daftar) {
    const salinan = [...daftar];

    for (let indeks = salinan.length - 1; indeks > 0; indeks--) {
        const indeksAcak = Math.floor(Math.random() * (indeks + 1));
        [salinan[indeks], salinan[indeksAcak]] = [salinan[indeksAcak], salinan[indeks]];
    }

    return salinan;
}

function mulaiKuis(kunciBagian = "semua") {
    bagianTerpilih = kunciBagian;
    const bagian = bagianKuis[kunciBagian];
    const baris = dataBait.filter(baris => {
        const nomor = Number(baris["نمر"]);
        return nomor >= bagian.mulai && nomor <= bagian.akhir;
    });
    dataBaitAktif = ambilDataLayakKuis(baris);
    daftarSoal = acak(dataBaitAktif);
    indeksSoal = 0;
    jumlahBenar = 0;
    jumlahDijawab = 0;
    sudahDijawab = false;
    clearInterval(intervalPewaktu);
    waktuMulaiKuis = Date.now();
    perbaruiWaktu();
    intervalPewaktu = setInterval(perbaruiWaktu, 1000);
    beranda.style.display = "none";
    kuis.style.display = "flex";
    hasil.style.display = "none";
    ambilElemen("tombolSelesai").disabled = false;
    tampilkanSoal();
}

function tampilkanSoal() {
    const bait = daftarSoal[indeksSoal];
    const pertama = String(bait["أول"]).trim();
    const kedua = String(bait["ثَان"]).trim();
    const rimaPertama = kunciRima(kedua);
    const rimaKedua = kunciRima(pertama);
    const jawabanPertama = [...new Set(
        dataBaitAktif
            .filter(baris => kunciRima(baris["أول"]) === rimaPertama)
            .map(baris => String(baris["أول"] ?? "").trim())
            .filter(Boolean)
    )];
    const jawabanKedua = [...new Set(
        dataBaitAktif
            .filter(baris => kunciRima(baris["ثَان"]) === rimaKedua)
            .map(baris => String(baris["ثَان"] ?? "").trim())
            .filter(Boolean)
    )];
    // Gunakan separuh bait yang rimanya cocok sebagai sumber empat pilihan jawaban.
    const bisaTanyaPertama = jawabanPertama.length >= 4;
    const bisaTanyaKedua = jawabanKedua.length >= 4;
    const tanyaPertama = bisaTanyaPertama && (!bisaTanyaKedua || Math.random() < 0.5);
    const jawabanBenar = tanyaPertama ? pertama : kedua;
    const semuaJawaban = tanyaPertama ? jawabanPertama : jawabanKedua;

    const pengecoh = acak(
        semuaJawaban.filter(jawaban => jawaban !== jawabanBenar)
    ).slice(0, 3);

    if (pengecoh.length < 3) {
        throw new Error("Data tidak memiliki cukup pilihan jawaban berbeda.");
    }

    const pilihan = acak([jawabanBenar, ...pengecoh]);

    sudahDijawab = false;

    ambilElemen("nomorSoal").textContent = `${indeksSoal + 1} dari ${daftarSoal.length}`;
    ambilElemen("sisaKuis").textContent = daftarSoal.length - indeksSoal;

    ambilElemen("skor").textContent = jumlahBenar;
    ambilElemen("batangKemajuan").style.width =
        `${(indeksSoal / daftarSoal.length) * 100}%`;

    const setengahKanan = ambilElemen("setengahKanan");
    const setengahKiri = ambilElemen("setengahKiri");
    setengahKanan.dataset.teksAsli = tanyaPertama ? "" : pertama;
    setengahKiri.dataset.teksAsli = tanyaPertama ? kedua : "";
    setengahKanan.textContent = teksUntukTampilan(setengahKanan.dataset.teksAsli);
    setengahKiri.textContent = teksUntukTampilan(setengahKiri.dataset.teksAsli);
    ambilElemen("setengahKanan").classList.toggle("kosong", tanyaPertama);
    ambilElemen("setengahKiri").classList.toggle("kosong", !tanyaPertama);
    ambilElemen("nomorBait").textContent = String(bait["ن"] ?? bait["نمر"] ?? "");
    ambilElemen("wadahBait").dataset.nomor = String(bait["ن"] ?? bait["نمر"] ?? "");

    const daftarPilihan = ambilElemen("daftarPilihan");
    daftarPilihan.replaceChildren();

    pilihan.forEach(jawaban => {
        const tombol = document.createElement("button");

        tombol.type = "button";
        tombol.className = "pilihan-jawaban";
        tombol.lang = "ar";
        tombol.dataset.teksAsli = jawaban;
        tombol.dataset.jawaban = jawaban;
        tombol.textContent = teksUntukTampilan(jawaban);

        tombol.addEventListener("click", () =>
            pilihJawaban(tombol, jawaban, jawabanBenar)
        );

        daftarPilihan.appendChild(tombol);
    });

    ambilElemen("umpanBalik").className = "umpan-balik";
    ambilElemen("umpanBalik").textContent = "";
    ambilElemen("tombolBerikutnya").disabled = true;
    ambilElemen("tombolSelesai").disabled = false;
}

function pilihJawaban(tombolTerpilih, jawaban, jawabanBenar) {
    if (sudahDijawab) return;
    sudahDijawab = true;

    const daftarTombol = [...ambilElemen("daftarPilihan").children];

    daftarTombol.forEach(tombol => {
        tombol.disabled = true;

        if (tombol.dataset.jawaban === jawabanBenar) {
            tombol.classList.add("benar");
        }
    });

    jumlahDijawab++;
    if (jawaban === jawabanBenar) {
        jumlahBenar++;
        ambilElemen("umpanBalik").className = "umpan-balik baik";
        ambilElemen("umpanBalik").textContent = "Benar. Pasangan bait tepat.";
    } else {
        tombolTerpilih.classList.add("salah");
        ambilElemen("umpanBalik").className = "umpan-balik buruk";
        ambilElemen("umpanBalik").textContent =
            "Belum tepat. Jawaban benar ditandai warna hijau.";
    }

    ambilElemen("skor").textContent = jumlahBenar;
    ambilElemen("tombolBerikutnya").textContent = "Soal Berikutnya";
    ambilElemen("tombolBerikutnya").disabled = false;

    ambilElemen("batangKemajuan").style.width =
        `${((indeksSoal + 1) / daftarSoal.length) * 100}%`;
}

ambilElemen("tombolBerikutnya").addEventListener("click", () => {
    if (!sudahDijawab) return;

    indeksSoal++;

    if (indeksSoal < daftarSoal.length) {
        tampilkanSoal();
    } else {
        tampilkanHasil();
    }
});
ambilElemen("tombolSelesai").addEventListener("click", tampilkanHasil);

function perbaruiWaktu() {
    const detik = Math.floor((Date.now() - waktuMulaiKuis) / 1000);
    const menit = String(Math.floor(detik / 60)).padStart(2, "0");
    const sisaDetik = String(detik % 60).padStart(2, "0");
    ambilElemen("waktu").textContent = `${menit}:${sisaDetik}`;
}

function tampilkanHasil() {
    clearInterval(intervalPewaktu);
    intervalPewaktu = null;
    kuis.style.display = "none";
    hasil.style.display = "block";
    const persentase = jumlahDijawab ? Math.round(jumlahBenar / jumlahDijawab * 100) : 0;
    ambilElemen("skorAkhir").textContent = `${jumlahBenar}/${jumlahDijawab}`;
    ambilElemen("rincianAkhir").textContent = jumlahDijawab
        ? `${jumlahDijawab} dari ${daftarSoal.length} soal dikerjakan · Akurasi ${persentase}%.`
        : "Belum ada soal yang dijawab.";
}

ambilElemen("tombolUlangi").addEventListener("click", () => mulaiKuis(bagianTerpilih));

ambilElemen("tombolBeranda").addEventListener("click", () => {
    hasil.style.display = "none";
    beranda.style.display = "block";
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}

muatDataDaring();