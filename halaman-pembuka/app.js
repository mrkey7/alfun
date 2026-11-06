"use strict";

const tombolAturUlangTembolok = document.getElementById("tombolAturUlangTembolok");

tombolAturUlangTembolok.addEventListener("click", async () => {
    if (!confirm("Hapus cache Alfiyah dan muat ulang aplikasi?")) return;

    tombolAturUlangTembolok.disabled = true;
    try {
        const daftarKunci = await caches.keys();
        await Promise.all(
            daftarKunci
                .filter(kunci => kunci.startsWith("alfiyah-quiz-"))
                .map(kunci => caches.delete(kunci))
        );

        const pendaftaran = await navigator.serviceWorker?.getRegistration("./");
        if (pendaftaran) await pendaftaran.unregister();
        location.reload();
    } catch (kesalahan) {
        tombolAturUlangTembolok.disabled = false;
        alert("Cache gagal dihapus: " + kesalahan.message);
    }
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .catch(kesalahan => console.error("Service Worker gagal didaftarkan:", kesalahan));
}