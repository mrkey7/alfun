"use strict";

const HAPUS_HARAKAT = window.AlfiyahTeks.hapusHarakat;
const JUMLAH_BAIT_PER_HALAMAN = 10;
const BAGIAN = {
    awal: { mulai:1, akhir:334 },
    tsani: { mulai:335, akhir:668 },
    tsalits: { mulai:669, akhir:1003 },
    semua: { mulai:1, akhir:1003 }
};

const kunciBagian = new URLSearchParams(location.search).get("bagian") || "semua";
const bagian = BAGIAN[kunciBagian] || BAGIAN.semua;
let dataBait = [];
let halamanAktif = 0;
let harakatDitampilkan = true;

const ambil = id => document.getElementById(id);
const daftarBait = ambil("daftarBait");

function teksTampilan(teks) {
    return harakatDitampilkan ? teks : HAPUS_HARAKAT(teks);
}

async function muatData() {
    try {
        const tanggapan = await fetch("../ألف.json");
        if (!tanggapan.ok) throw new Error("HTTP " + tanggapan.status);
        const data = await tanggapan.json();
        if (!data || !Array.isArray(data.rows)) throw new Error("Format data Alfiyyah tidak sesuai.");

        dataBait = data.rows
            .filter(baris => String(baris["أول"] ?? "").trim() && String(baris["ثَان"] ?? "").trim())
            .filter(baris => {
                const nomor = Number(baris["نمر"]);
                return nomor >= bagian.mulai && nomor <= bagian.akhir;
            })
            .sort((a, b) => Number(a["نمر"]) - Number(b["نمر"]));

        if (!dataBait.length) throw new Error("Tidak ada bait pada bagian ini.");
        ambil("statusPemuatan").textContent = "";
        tampilkanHalaman(0);
    } catch (kesalahan) {
        ambil("statusPemuatan").textContent = "Gagal memuat: " + kesalahan.message;
    }
}

function tampilkanHalaman(indeksHalaman) {
    const jumlahHalaman = Math.ceil(dataBait.length / JUMLAH_BAIT_PER_HALAMAN);
    halamanAktif = Math.max(0, Math.min(indeksHalaman, jumlahHalaman - 1));

    const mulai = halamanAktif * JUMLAH_BAIT_PER_HALAMAN;
    const baitHalaman = dataBait.slice(mulai, mulai + JUMLAH_BAIT_PER_HALAMAN);
    daftarBait.replaceChildren();

    baitHalaman.forEach(bait => {
        const baris = document.createElement("article");
        baris.className = "bait";

        const nomor = document.createElement("div");
        nomor.className = "nomor-bait";
        nomor.lang = "ar";
        nomor.textContent = String(bait["ن"] ?? bait["نمر"] ?? "");

        const teks = document.createElement("div");
        teks.className = "teks-bait";
        teks.lang = "ar";
        teks.dir = "rtl";
        teks.dataset.awal = String(bait["أول"] ?? "");
        teks.dataset.akhir = String(bait["ثَان"] ?? "");
        teks.textContent = teksTampilan(teks.dataset.awal + " " + teks.dataset.akhir);

        baris.append(nomor, teks);
        daftarBait.appendChild(baris);
    });

    ambil("nomorHalaman").textContent = String(halamanAktif + 1);
    ambil("tombolSebelumnya").disabled = halamanAktif === 0;
    ambil("tombolBerikutnya").disabled = halamanAktif >= jumlahHalaman - 1;
}

ambil("tombolSebelumnya").addEventListener("click", () => {
    tampilkanHalaman(halamanAktif - 1);
    window.scrollTo({ top:0, behavior:"smooth" });
});
ambil("tombolBerikutnya").addEventListener("click", () => {
    tampilkanHalaman(halamanAktif + 1);
    window.scrollTo({ top:0, behavior:"smooth" });
});
ambil("tombolHarakat").addEventListener("click", () => {
    harakatDitampilkan = !harakatDitampilkan;
    const tombol = ambil("tombolHarakat");
    tombol.setAttribute("aria-pressed", String(harakatDitampilkan));
    tombol.textContent = harakatDitampilkan ? "حَرَكَات" : "حركات";
    tampilkanHalaman(halamanAktif);
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}
muatData();
