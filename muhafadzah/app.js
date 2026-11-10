"use strict";

const HAPUS_HARAKAT = window.AlfiyahTeks.hapusHarakat;
const BAGIAN = {
    awal: { mulai:1, akhir:331 },
    tsani: { mulai:332, akhir:675 },
    tsalits: { mulai:676, akhir:1003 },
    semua: { mulai:1, akhir:1003 }
};

const kunciBagian = new URLSearchParams(location.search).get("bagian") || "semua";
const bagian = BAGIAN[kunciBagian] || BAGIAN.semua;
let dataBait = [];
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
        tampilkanDaftar();
    } catch (kesalahan) {
        ambil("statusPemuatan").textContent = "Gagal memuat: " + kesalahan.message;
    }
}

function tampilkanDaftar() {
    const posisiScroll = daftarBait.scrollTop;
    daftarBait.replaceChildren();

    let topikSebelumnya = null;

    dataBait.forEach(bait => {
        const topik = String(bait["موضوع"] ?? "").trim();
        if (topik && topik !== topikSebelumnya) {
            const judul = document.createElement("div");
            judul.className = "judul-bab";
            judul.lang = "ar";
            judul.dir = "rtl";
            judul.textContent = topik;
            daftarBait.appendChild(judul);
        }
        topikSebelumnya = topik;

        const baris = document.createElement("article");
        baris.className = "bait";

        const nomor = document.createElement("div");
        nomor.className = "nomor-bait";
        nomor.lang = "ar";
        nomor.textContent = "(" + String(bait["ن"] ?? bait["نمر"] ?? "") + ")";

        const awal = document.createElement("div");
        awal.className = "teks-setengah";
        awal.lang = "ar";
        awal.dir = "rtl";
        awal.textContent = teksTampilan(String(bait["أول"] ?? ""));

        const akhir = document.createElement("div");
        akhir.className = "teks-setengah";
        akhir.lang = "ar";
        akhir.dir = "rtl";
        akhir.textContent = teksTampilan(String(bait["ثَان"] ?? ""));

        baris.append(awal, nomor, akhir);
        daftarBait.appendChild(baris);
    });

    daftarBait.scrollTop = posisiScroll;
}

ambil("tombolHarakat").addEventListener("click", () => {
    harakatDitampilkan = !harakatDitampilkan;
    const tombol = ambil("tombolHarakat");
    tombol.setAttribute("aria-pressed", String(harakatDitampilkan));
    tombol.textContent = harakatDitampilkan ? "حَرَكَات" : "حركات";
    tampilkanDaftar();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}
muatData();
