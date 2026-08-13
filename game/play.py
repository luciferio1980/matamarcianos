#!/usr/bin/env python3
"""AETHER RAZE — launcher for PC. Serves the game and opens the browser."""
from __future__ import annotations

import argparse
import functools
import http.server
import os
import socket
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8765


def _free_port(preferred: int) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            s.bind(("127.0.0.1", 0))
            return int(s.getsockname()[1])


def main() -> int:
    parser = argparse.ArgumentParser(description="AETHER RAZE launcher")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    os.chdir(ROOT)
    port = _free_port(args.port)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    url = f"http://127.0.0.1:{port}/index.html"
    print("AETHER RAZE")
    print(f"  Servidor local: {url}")
    print("  Controles: WASD/flechas mover · ESPACIO disparar (mantener = cargar)")
    print("             SHIFT especial/bomba · CTRL foco · ESC pausa · F11 pantalla completa")
    print("  Ctrl+C para salir.")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    if not args.no_browser:
        webbrowser.open(url)
    try:
        thread.join()
    except KeyboardInterrupt:
        print("\nCerrando…")
        server.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
