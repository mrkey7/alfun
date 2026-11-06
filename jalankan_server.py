import errno
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


ALAMAT_IP = "127.0.0.1"
NOMOR_PORT = 8000
FOLDER_PROYEK = Path(__file__).resolve().parent

penangan = partial(SimpleHTTPRequestHandler, directory=str(FOLDER_PROYEK))

try:
    peladen = ThreadingHTTPServer((ALAMAT_IP, NOMOR_PORT), penangan)
except OSError as kesalahan:
    if kesalahan.errno not in (errno.EADDRINUSE, errno.EACCES):
        rincian = kesalahan.strerror or str(kesalahan)
        print(f"Server gagal dijalankan: {rincian}", file=sys.stderr)
        raise SystemExit(1) from None

    try:
        peladen = ThreadingHTTPServer((ALAMAT_IP, 0), penangan)
    except OSError as kesalahan_cadangan:
        rincian = kesalahan_cadangan.strerror or str(kesalahan_cadangan)
        print(f"Port {NOMOR_PORT} sedang dipakai dan server gagal mencari port lain: {rincian}", file=sys.stderr)
        raise SystemExit(1) from None

    print(f"Port {NOMOR_PORT} tidak tersedia; menggunakan port {peladen.server_address[1]}.")

with peladen:
    alamat = f"http://localhost:{peladen.server_address[1]}"
    print(f"Alfiyah Quiz berjalan di {alamat}")
    print("Tekan Ctrl+C untuk menghentikan server.")
    Timer(0.5, webbrowser.open, args=(alamat,)).start()
    try:
        peladen.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dihentikan.")
