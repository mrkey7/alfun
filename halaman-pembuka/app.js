"use strict";

const modeArab = document.getElementById("modeArab");
const tokenSumberFresh = new URLSearchParams(location.search).get("_fresh");
const tombolBagian = [...document.querySelectorAll("[data-bagian]")];
let modeTerpilih = localStorage.getItem("alfun-mode") === "asilah" ? "asilah" : "muhafadzah";
modeArab.innerHTML = modeTerpilih === "muhafadzah"
    ? '<span lang="ar">مُحَافَظَةٌ</span>'
    : '<span lang="ar">أَسْئِلَةٌ</span>';

modeArab.addEventListener("click", () => {
    modeTerpilih = modeTerpilih === "muhafadzah" ? "asilah" : "muhafadzah";
    localStorage.setItem("alfun-mode", modeTerpilih);
    modeArab.innerHTML = modeTerpilih === "muhafadzah"
        ? '<span lang="ar">مُحَافَظَةٌ</span>'
        : '<span lang="ar">أَسْئِلَةٌ</span>';
});

tombolBagian.forEach(tombol => {
    tombol.addEventListener("click", () => {
        const alamatTujuan = new URL("./" + modeTerpilih + "/index.html", location.href);
        alamatTujuan.searchParams.set("bagian", tombol.dataset.bagian);
        if (tokenSumberFresh) alamatTujuan.searchParams.set("_fresh", tokenSumberFresh);
        location.href = alamatTujuan.href;
    });
});

async function muatData() {
    const status = document.getElementById("statusPemuatan");

    try {
        const alamatData = new URL("./ألف.json", location.href);
        if (tokenSumberFresh) alamatData.searchParams.set("_fresh", tokenSumberFresh);
        const tanggapan = await fetch(alamatData.href, {
            cache: tokenSumberFresh ? "no-store" : "default"
        });
        if (!tanggapan.ok) throw new Error("HTTP " + tanggapan.status);

        const data = await tanggapan.json();
        if (!data || !Array.isArray(data.rows)) throw new Error("Format data tidak sesuai.");

        tombolBagian.forEach(tombol => tombol.disabled = false);
        status.textContent = "";
    } catch (kesalahan) {
        status.textContent = "Gagal memuat data: " + kesalahan.message;
    }
}

const tombolAturUlangTembolok = document.getElementById("tombolAturUlangTembolok");
const statusResetR = document.createElement("output");
statusResetR.id = "statusResetR";
statusResetR.setAttribute("aria-live", "polite");
statusResetR.style.cssText =
    "position:fixed;left:12px;bottom:12px;z-index:9999;max-width:min(90vw,620px);padding:8px 11px;border:1px solid #c9bea9;border-radius:7px;background:#fffdf8;color:#24365b;box-shadow:0 4px 16px rgb(0 0 0 / 12%);font:12px/1.4 system-ui,sans-serif;display:none;";
document.body.appendChild(statusResetR);

function tampilkanStatusResetR(teks) {
    statusResetR.textContent = teks;
    statusResetR.style.display = "block";
}

tombolAturUlangTembolok.addEventListener("click", async () => {
    if (!confirm("Ambil ulang seluruh sumber aplikasi dari folder/server lokal, abaikan cache lama?")) return;

    tombolAturUlangTembolok.disabled = true;
    const teksTombolAwal = tombolAturUlangTembolok.textContent;
    tombolAturUlangTembolok.textContent = "…";

    try {
        const dasarAplikasi = new URL("./", location.href);
        const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const alamatServiceWorker = new URL("service-worker.js", dasarAplikasi);
        alamatServiceWorker.searchParams.set("_fresh", token);

        tampilkanStatusResetR("R 1/4 · Mengambil daftar sumber terbaru...");
        const responsServiceWorker = await fetch(alamatServiceWorker.href, { cache:"no-store" });
        if (!responsServiceWorker.ok) {
            throw new Error("service-worker.js · HTTP " + responsServiceWorker.status);
        }
        const teksServiceWorker = await responsServiceWorker.text();

        const cocokAset = teksServiceWorker.match(
            /const\s+DAFTAR_ASET\s*=\s*(\[[\s\S]*?\])\s*\.map\s*\(/
        );
        if (!cocokAset) throw new Error("Daftar aset tidak ditemukan di service-worker.js.");

        const daftarAset = JSON.parse(cocokAset[1]);
        const cocokData = teksServiceWorker.match(
            /const\s+BERKAS_DATA\s*=\s*new URL\("([^"]+)"/
        );
        const jalurData = cocokData ? cocokData[1] : "ألف.json";
        const daftarJalur = [...new Set([
            "index.html",
            "service-worker.js",
            jalurData,
            ...daftarAset
        ])];

        tampilkanStatusResetR("R 2/4 · Melepas Service Worker dan menghapus cache aplikasi...");
        const daftarPendaftaran = await navigator.serviceWorker?.getRegistrations() ?? [];
        await Promise.all(
            daftarPendaftaran
                .filter(pendaftaran => new URL(pendaftaran.scope).pathname.startsWith(dasarAplikasi.pathname))
                .map(pendaftaran => pendaftaran.unregister())
        );

        const daftarKunciCache = await caches.keys();
        await Promise.all(
            daftarKunciCache
                .filter(kunci => kunci.startsWith("alfiyah-quiz-"))
                .map(kunci => caches.delete(kunci))
        );

        tampilkanStatusResetR("R 3/4 · Memverifikasi " + daftarJalur.length + " sumber dengan URL baru...");
        let jumlahSelesai = 0;
        for (const jalur of daftarJalur) {
            const alamat = new URL(jalur, dasarAplikasi);
            alamat.searchParams.set("_fresh", token);
            const respons = await fetch(alamat.href, { cache:"no-store" });

            if (!respons.ok && respons.type !== "opaque") {
                throw new Error(alamat.pathname + " · HTTP " + respons.status);
            }

            await respons.arrayBuffer();
            jumlahSelesai++;
            tampilkanStatusResetR(
                "R 3/4 · Terverifikasi " + jumlahSelesai + "/" + daftarJalur.length +
                " · " + (jalur.split("/").pop() || "index")
            );
        }

        tampilkanStatusResetR("R 4/4 · Semua sumber berhasil diambil. Membuka ulang aplikasi...");
        const alamatBaru = new URL("index.html", dasarAplikasi);
        alamatBaru.searchParams.set("_fresh", token);
        alamatBaru.searchParams.set("_reset", token);
        location.replace(alamatBaru.href);
    } catch (kesalahan) {
        tombolAturUlangTembolok.disabled = false;
        tombolAturUlangTembolok.textContent = teksTombolAwal;
        tampilkanStatusResetR("R GAGAL · " + kesalahan.message);
    }
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache:"none" })
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}

muatData();
