"use strict";

const modeArab = document.getElementById("modeArab");
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
        location.href = "./" + modeTerpilih + "/index.html?bagian=" + tombol.dataset.bagian;
    });
});

async function muatData() {
    const status = document.getElementById("statusPemuatan");

    try {
        const tanggapan = await fetch("./ألف.json");
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
tombolAturUlangTembolok.addEventListener("click", async () => {
    if (!confirm("Hapus cache Alfiyah Quiz dan muat ulang aplikasi?")) return;

    tombolAturUlangTembolok.disabled = true;
    try {
        const dasarAplikasi = new URL("./", location.href);

        const daftarPendaftaran = await navigator.serviceWorker?.getRegistrations() ?? [];
        await Promise.all(
            daftarPendaftaran
                .filter(pendaftaran => pendaftaran.scope.startsWith(dasarAplikasi.href))
                .map(pendaftaran => pendaftaran.unregister())
        );

        const daftarKunci = await caches.keys();
        await Promise.all(
            daftarKunci
                .filter(kunci => kunci.startsWith("alfiyah-quiz-"))
                .map(kunci => caches.delete(kunci))
        );

        localStorage.removeItem("alfun-mode");
        sessionStorage.clear();

        const alamatBaru = new URL(location.href);
        alamatBaru.searchParams.set("_reset", Date.now().toString());
        location.replace(alamatBaru.href);
    } catch (kesalahan) {
        tombolAturUlangTembolok.disabled = false;
        alert("Reset aplikasi gagal: " + kesalahan.message);
    }
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}

muatData();
