const NAMA_TEMBOLOK = "alfiyah-quiz-v18";
const DASAR_APLIKASI = new URL("./", self.location.href);
const HALAMAN_APLIKASI = new URL("index.html", DASAR_APLIKASI).href;
const DAFTAR_GAYA = [
    "gaya/dasar.css",
    "gaya/potret-sempit.css",
    "gaya/potret-lebar.css",
    "gaya/landskap-pendek.css",
    "gaya/landskap-tinggi.css"
].map(jalur => new URL(jalur, DASAR_APLIKASI).href);
const SKRIP_APLIKASI = new URL("app.js", DASAR_APLIKASI).href;
const BERKAS_DATA = new URL("ألف.json", DASAR_APLIKASI).href;
const JALUR_CAKUPAN = DASAR_APLIKASI.pathname;

self.addEventListener("install", peristiwa => {
    peristiwa.waitUntil((async () => {
        const tembolok = await caches.open(NAMA_TEMBOLOK);
        await tembolok.addAll([HALAMAN_APLIKASI, ...DAFTAR_GAYA, SKRIP_APLIKASI, BERKAS_DATA]);
        await simpanAwalFontGoogle(tembolok);
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", peristiwa => {
    peristiwa.waitUntil((async () => {
        const daftarKunci = await caches.keys();

        await Promise.all(
            daftarKunci
                .filter(kunci => kunci.startsWith("alfiyah-quiz-") && kunci !== NAMA_TEMBOLOK)
                .map(kunci => caches.delete(kunci))
        );

        await self.clients.claim();
    })());
});

self.addEventListener("fetch", peristiwa => {
    const permintaan = peristiwa.request;

    if (permintaan.method !== "GET") return;

    const alamat = new URL(permintaan.url);

    if (alamat.origin !== self.location.origin) {
        if (alamat.hostname === "fonts.googleapis.com" || alamat.hostname === "fonts.gstatic.com") {
            peristiwa.respondWith(jaringanDahulu(permintaan));
        }
        return;
    }

    if (!alamat.pathname.startsWith(JALUR_CAKUPAN)) return;

    // Utamakan jaringan untuk aplikasi dan data; cache menjadi cadangan saat offline.
    if (alamat.pathname === new URL(BERKAS_DATA).pathname) {
        peristiwa.respondWith(jaringanDahulu(permintaan, BERKAS_DATA));
        return;
    }

    if (DAFTAR_GAYA.some(gaya => alamat.pathname === new URL(gaya).pathname) || alamat.pathname === new URL(SKRIP_APLIKASI).pathname) {
        peristiwa.respondWith(jaringanDahulu(permintaan));
        return;
    }
    if (permintaan.mode === "navigate") {
        peristiwa.respondWith(jaringanDahulu(permintaan, HALAMAN_APLIKASI));
        return;
    }

    peristiwa.respondWith(tembolokDahulu(permintaan));
});

async function jaringanDahulu(permintaan, kunciTembolok = permintaan) {
    const tembolok = await caches.open(NAMA_TEMBOLOK);

    try {
        const tanggapan = await fetch(permintaan, { cache: "no-cache" });

        if (tanggapan && (tanggapan.ok || tanggapan.type === "opaque")) {
            try {
                await tembolok.put(kunciTembolok, tanggapan.clone());
            } catch (kesalahan) {
                console.warn("Cache tidak dapat diperbarui:", kesalahan);
            }
        }

        return tanggapan;
    } catch (kesalahan) {
        const tersimpan = await tembolok.match(kunciTembolok);
        return tersimpan || Response.error();
    }
}

async function tembolokDahulu(permintaan) {
    const tersimpan = await caches.match(permintaan);
    if (tersimpan) return tersimpan;

    const tanggapan = await fetch(permintaan);

    if (tanggapan && tanggapan.ok) {
        const tembolok = await caches.open(NAMA_TEMBOLOK);
        await tembolok.put(permintaan, tanggapan.clone());
    }

    return tanggapan;
}

async function simpanAwalFontGoogle(tembolok) {
    const alamatCss = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap";

    try {
        const tanggapan = await fetch(alamatCss);
        if (!tanggapan.ok) return;

        await tembolok.put(alamatCss, tanggapan.clone());

        const teksCss = await tanggapan.text();
        const alamatHuruf = teksCss.split("url(")
            .slice(1)
            .map(potongan => potongan.split(")")[0])
            .filter(alamat => alamat.startsWith("https://fonts.gstatic.com/"));

        await Promise.all(alamatHuruf.map(async alamat => {
            try {
                const huruf = await fetch(alamat);
                if (huruf.ok) await tembolok.put(alamat, huruf.clone());
            } catch (kesalahan) {
                console.warn("Font tidak dapat disimpan:", kesalahan);
            }
        }));
    } catch (kesalahan) {
        console.warn("Font Noto Naskh tidak dapat disimpan untuk offline:", kesalahan);
    }
}
