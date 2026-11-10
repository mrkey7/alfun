const NAMA_TEMBOLOK = "alfiyah-quiz-v30";
const DASAR_APLIKASI = new URL("./", self.location.href);
const HALAMAN_APLIKASI = new URL("index.html", DASAR_APLIKASI).href;
const BERKAS_DATA = new URL("ألف.json", DASAR_APLIKASI).href;
const DAFTAR_ASET = [
    "index.html",
    "gaya/dasar.css",
    "gaya/potret-sempit.css",
    "gaya/potret-lebar.css",
    "gaya/landskap-pendek.css",
    "gaya/landskap-tinggi.css",
    "halaman-pembuka/beranda.css",
    "halaman-pembuka/app.js",
    "global/teks.js",
    "asilah/index.html",
    "asilah/app.js",
    "muhafadzah/index.html",
    "muhafadzah/app.js",
    "muhafadzah/gaya.css",
    "muhafadzah/kendali.js",
    "muhafadzah/kendali.css",
    "asilah/gaya/dasar.css",
    "asilah/gaya/potret-sempit.css",
    "asilah/gaya/potret-lebar.css",
    "asilah/gaya/landskap-pendek.css",
    "asilah/gaya/landskap-tinggi.css",
    "asilah/gaya/penyesuaian.css"
].map(jalur => new URL(jalur, DASAR_APLIKASI).href);
const JALUR_CAKUPAN = DASAR_APLIKASI.pathname;

self.addEventListener("install", peristiwa => {
    peristiwa.waitUntil((async () => {
        const tembolok = await caches.open(NAMA_TEMBOLOK);
        await tembolok.addAll([HALAMAN_APLIKASI, ...DAFTAR_ASET, BERKAS_DATA]);
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

    const jalurTanpaParameter = new URL(alamat.pathname, self.location.origin).href;
    if (alamat.pathname === new URL(BERKAS_DATA).pathname) {
        peristiwa.respondWith(jaringanDahulu(permintaan, BERKAS_DATA));
        return;
    }
    if (DAFTAR_ASET.some(aset => alamat.pathname === new URL(aset).pathname)) {
        peristiwa.respondWith(jaringanDahulu(permintaan, jalurTanpaParameter));
        return;
    }
    if (permintaan.mode === "navigate") {
        const cadangan = alamat.pathname.endsWith("/")
            ? new URL("index.html", alamat).href
            : jalurTanpaParameter;
        peristiwa.respondWith(jaringanDahulu(permintaan, cadangan));
        return;
    }
    peristiwa.respondWith(tembolokDahulu(permintaan));
});

async function jaringanDahulu(permintaan, kunciTembolok = permintaan) {
    const tembolok = await caches.open(NAMA_TEMBOLOK);
    try {
        const tanggapan = await fetch(permintaan, { cache:"no-cache" });
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