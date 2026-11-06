"use strict";

const HAPUS_HARAKAT = window.AlfiyahTeks.hapusHarakat;
const JUMLAH_BAIT_PER_HALAMAN = 10;
const BAGIAN = {
    awal: { mulai:1, akhir:334, label:"الجزء الأول" },
    tsani: { mulai:335, akhir:668, label:"الجزء الثاني" },
    tsalits: { mulai:669, akhir:1003, label:"الجزء الثالث" },
    semua: { mulai:1, akhir:1003, label:"ألفية كاملة" }
};

const kunciBagian = new URLSearchParams(location.search).get("bagian") || "semua";
const bagian = BAGIAN[kunciBagian] || BAGIAN.semua;
let dataBait = [];
let daftarJudul = [];
let halamanAktif = 0;
let harakatDitampilkan = true;

const ambil = id => document.getElementById(id);
const daftarBait = ambil("daftarBait");
const daftarJudulElemen = ambil("daftarJudul");

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

        ambil("labelBagian").textContent = bagian.label;
        ambil("jumlahBait").textContent = dataBait.length + " bait";
        ambil("statusPemuatan").textContent = "";
        siapkanDaftarJudul();
        tampilkanHalaman(0);
    } catch (kesalahan) {
        ambil("statusPemuatan").textContent = "Gagal memuat data: " + kesalahan.message;
    }
}

function siapkanDaftarJudul() {
    daftarJudul = [];
    dataBait.forEach((bait, indeks) => {
        const nama = String(bait["موضوع"] ?? "").trim() || "—";
        let terakhir = daftarJudul[daftarJudul.length - 1];

        if (!terakhir || terakhir.nama !== nama) {
            terakhir = {
                nama,
                indeksAwal: indeks,
                indeksAkhir: indeks,
                nomorAwal: Number(bait["نمر"]),
                nomorAkhir: Number(bait["نمر"])
            };
            daftarJudul.push(terakhir);
        } else {
            terakhir.indeksAkhir = indeks;
            terakhir.nomorAkhir = Number(bait["نمر"]);
        }
    });

    ambil("jumlahJudul").textContent = daftarJudul.length + " judul";
    daftarJudulElemen.replaceChildren();
    daftarJudul.forEach((judul, indeks) => {
        const tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "pilihan-judul";
        tombol.dataset.indeks = String(indeks);

        const nama = document.createElement("span");
        nama.className = "nama-judul";
        nama.lang = "ar";
        nama.textContent = judul.nama;

        const rentang = document.createElement("span");
        rentang.className = "rentang-judul";
        rentang.textContent = judul.nomorAwal + "–" + judul.nomorAkhir;

        tombol.append(nama, rentang);
        tombol.addEventListener("click", () => {
            tampilkanHalaman(Math.floor(judul.indeksAwal / JUMLAH_BAIT_PER_HALAMAN));
            tutupMenuJudul();
            window.scrollTo({ top:0, behavior:"smooth" });
        });
        daftarJudulElemen.appendChild(tombol);
    });
}

function tampilkanHalaman(indeksHalaman) {
    const jumlahHalaman = Math.ceil(dataBait.length / JUMLAH_BAIT_PER_HALAMAN);
    halamanAktif = Math.max(0, Math.min(indeksHalaman, jumlahHalaman - 1));

    const mulai = halamanAktif * JUMLAH_BAIT_PER_HALAMAN;
    const baitHalaman = dataBait.slice(mulai, mulai + JUMLAH_BAIT_PER_HALAMAN);
    daftarBait.replaceChildren();
    let judulSebelumnya = null;

    baitHalaman.forEach(bait => {
        const namaJudul = String(bait["موضوع"] ?? "").trim() || "—";
        if (namaJudul !== judulSebelumnya) {
            const judul = document.createElement("div");
            judul.className = "judul-topik";
            judul.lang = "ar";
            judul.textContent = namaJudul;
            daftarBait.appendChild(judul);
            judulSebelumnya = namaJudul;
        }

        const kartu = document.createElement("article");
        kartu.className = "bait";

        const nomor = document.createElement("div");
        nomor.className = "nomor-bait";
        nomor.lang = "ar";
        nomor.textContent = String(bait["ن"] ?? bait["نمر"] ?? "");

        const pasangan = document.createElement("div");
        pasangan.className = "teks-pasangan";

        const awal = document.createElement("div");
        awal.className = "teks-setengah";
        awal.lang = "ar";
        awal.dataset.teksAsli = String(bait["أول"] ?? "");
        awal.textContent = teksTampilan(awal.dataset.teksAsli);

        const akhir = document.createElement("div");
        akhir.className = "teks-setengah";
        akhir.lang = "ar";
        akhir.dataset.teksAsli = String(bait["ثَان"] ?? "");
        akhir.textContent = teksTampilan(akhir.dataset.teksAsli);

        pasangan.append(awal, akhir);
        kartu.append(nomor, pasangan);
        daftarBait.appendChild(kartu);
    });

    const nomorAwal = baitHalaman[0]["نمر"];
    const nomorAkhir = baitHalaman[baitHalaman.length - 1]["نمر"];
    ambil("rentangBait").textContent = "Bait " + nomorAwal + "–" + nomorAkhir + " dari " + dataBait.length;
    ambil("nomorHalaman").textContent = "Halaman " + (halamanAktif + 1) + " dari " + jumlahHalaman;
    ambil("tombolSebelumnya").disabled = halamanAktif === 0;
    ambil("tombolBerikutnya").disabled = halamanAktif >= jumlahHalaman - 1;
    perbaruiJudulAktif();
}

function perbaruiJudulAktif() {
    const awalHalaman = halamanAktif * JUMLAH_BAIT_PER_HALAMAN;
    const akhirHalaman = awalHalaman + JUMLAH_BAIT_PER_HALAMAN;
    [...daftarJudulElemen.children].forEach((tombol, indeks) => {
        const judul = daftarJudul[indeks];
        const beradaDiHalaman = judul.indeksAwal < akhirHalaman && judul.indeksAkhir >= awalHalaman;
        tombol.classList.toggle("aktif", beradaDiHalaman);
    });
}

function bukaMenuJudul() {
    ambil("lapisanMenu").hidden = false;
    ambil("tombolJudul").setAttribute("aria-expanded", "true");
    ambil("tombolTutupJudul").focus();
}
function tutupMenuJudul() {
    ambil("lapisanMenu").hidden = true;
    ambil("tombolJudul").setAttribute("aria-expanded", "false");
    ambil("tombolJudul").focus();
}

ambil("tombolSebelumnya").addEventListener("click", () => {
    tampilkanHalaman(halamanAktif - 1);
    window.scrollTo({ top:0, behavior:"smooth" });
});
ambil("tombolBerikutnya").addEventListener("click", () => {
    tampilkanHalaman(halamanAktif + 1);
    window.scrollTo({ top:0, behavior:"smooth" });
});
ambil("tombolJudul").addEventListener("click", bukaMenuJudul);
ambil("tombolTutupJudul").addEventListener("click", tutupMenuJudul);
ambil("tutupMenuLatar").addEventListener("click", tutupMenuJudul);
ambil("tombolHarakat").addEventListener("click", () => {
    harakatDitampilkan = !harakatDitampilkan;
    const tombol = ambil("tombolHarakat");
    tombol.setAttribute("aria-pressed", String(harakatDitampilkan));
    tombol.textContent = harakatDitampilkan ? "حَرَكَات" : "حركات";
    tampilkanHalaman(halamanAktif);
});
document.addEventListener("keydown", peristiwa => {
    if (peristiwa.key === "Escape" && !ambil("lapisanMenu").hidden) tutupMenuJudul();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}
muatData();
