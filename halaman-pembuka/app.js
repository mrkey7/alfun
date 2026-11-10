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

function tungguWorkerAktif(worker) {
    if (!worker) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const periksa = () => {
            if (worker.state === "activated") {
                worker.removeEventListener("statechange", periksa);
                resolve();
            } else if (worker.state === "redundant") {
                worker.removeEventListener("statechange", periksa);
                reject(new Error("Pembaruan Service Worker gagal diaktifkan."));
            }
        };

        worker.addEventListener("statechange", periksa);
        periksa();
    });
}

async function perbaruiServiceWorker(registrasi) {
    let workerBaru = null;
    const saatPembaruanDitemukan = () => {
        workerBaru = registrasi.installing;
    };

    registrasi.addEventListener("updatefound", saatPembaruanDitemukan);
    try {
        await registrasi.update();
    } catch (kesalahan) {
        throw new Error("Tidak ada koneksi ke server. Sumber lama tetap digunakan.");
    } finally {
        registrasi.removeEventListener("updatefound", saatPembaruanDitemukan);
    }

    workerBaru = registrasi.installing || registrasi.waiting || workerBaru;
    if (workerBaru) await tungguWorkerAktif(workerBaru);

    const workerAktif = registrasi.active;
    if (!workerAktif || workerAktif.state !== "activated") {
        throw new Error("Service Worker belum aktif.");
    }
    return workerAktif;
}

function segarkanMelaluiWorker(worker, token) {
    return new Promise((resolve, reject) => {
        const kanal = new MessageChannel();
        const batasWaktu = setTimeout(() => {
            kanal.port1.close();
            reject(new Error("Waktu pengambilan sumber habis."));
        }, 120000);

        kanal.port1.onmessage = peristiwa => {
            const pesan = peristiwa.data || {};

            if (pesan.type === "progress") {
                tampilkanStatusResetR(
                    "R 3/4 · Mengambil sumber " + pesan.selesai + "/" + pesan.jumlah +
                    " · " + pesan.jalur.split("/").pop()
                );
            } else if (pesan.type === "done") {
                clearTimeout(batasWaktu);
                kanal.port1.close();
                resolve(pesan.jumlah);
            } else if (pesan.type === "error") {
                clearTimeout(batasWaktu);
                kanal.port1.close();
                reject(new Error(pesan.pesan));
            }
        };

        kanal.port1.onmessageerror = () => {
            clearTimeout(batasWaktu);
            kanal.port1.close();
            reject(new Error("Jawaban dari Service Worker tidak dapat dibaca."));
        };

        try {
            worker.postMessage(
                { type:"ALFUN_REFRESH_SOURCES", token },
                [kanal.port2]
            );
        } catch (kesalahan) {
            clearTimeout(batasWaktu);
            kanal.port1.close();
            reject(kesalahan);
        }
    });
}

tombolAturUlangTembolok.addEventListener("click", async () => {
    if (!confirm("Ambil ulang sumber aplikasi dan perbarui cache dari server/folder yang sedang dibuka?")) return;

    tombolAturUlangTembolok.disabled = true;
    const teksTombolAwal = tombolAturUlangTembolok.textContent;
    tombolAturUlangTembolok.textContent = "…";

    try {
        if (!("serviceWorker" in navigator)) {
            throw new Error("Browser ini tidak mendukung Service Worker.");
        }
        if (navigator.onLine === false) {
            throw new Error("Tidak ada koneksi internet. Sumber lama tetap digunakan.");
        }

        const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        tampilkanStatusResetR("R 1/4 · Memeriksa Service Worker...");

        let registrasi = await navigator.serviceWorker.getRegistration();
        if (!registrasi) {
            registrasi = await navigator.serviceWorker.register("./service-worker.js", {
                updateViaCache:"none"
            });
        }

        tampilkanStatusResetR("R 2/4 · Memastikan kode Service Worker terbaru aktif...");
        const workerAktif = await perbaruiServiceWorker(registrasi);

        tampilkanStatusResetR("R 3/4 · Mengambil ulang seluruh sumber aplikasi...");
        const jumlahSumber = await segarkanMelaluiWorker(workerAktif, token);

        tampilkanStatusResetR(
            "R 4/4 · " + jumlahSumber + " sumber berhasil diperbarui. Memuat ulang aplikasi..."
        );

        const alamatBaru = new URL("./", location.href);
        alamatBaru.searchParams.set("_fresh", token);
        alamatBaru.searchParams.set("_reset", token);
        location.replace(alamatBaru.href);
    } catch (kesalahan) {
        tombolAturUlangTembolok.disabled = false;
        tombolAturUlangTembolok.textContent = teksTombolAwal;
        const pesan = kesalahan?.message || String(kesalahan);
        tampilkanStatusResetR("R TIDAK DIPERBARUI · " + pesan);
    }
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then(registrasi => {
        if (!registrasi) {
            return navigator.serviceWorker.register("./service-worker.js", {
                updateViaCache:"all"
            });
        }
    }).catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}

muatData();
