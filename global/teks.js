"use strict";

window.AlfiyahTeks = Object.freeze({
    hapusHarakat(teks) {
        return String(teks ?? "").replace(/[\u064B-\u065F\u0670]/g, "");
    }
});