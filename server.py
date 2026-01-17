#!/usr/bin/env python3
"""
Simple HTTP server for the Retro Games Collection.
Serves all games including The Bunker which requires HTTP for ES6 modules.

Usage:
    python3 server.py [port]

Default port: 8080
"""

import http.server
import socketserver
import sys
import socket

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with suppressed logging for cleaner output."""

    def log_message(self, format, *args):
        # Only log errors, not every request
        pass

    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

def get_local_ip():
    """Get the local IP address for LAN access."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        local_ip = get_local_ip()

        print()
        print("=" * 50)
        print("   RETRO GAMES SERVER")
        print("=" * 50)
        print()
        print(f"   Local:   http://localhost:{PORT}")
        print(f"   Network: http://{local_ip}:{PORT}")
        print()
        print("   Games available:")
        print("   - Space Taxi")
        print("   - Space Taxi VS")
        print("   - The Bunker")
        print()
        print("   Press Ctrl+C to stop the server")
        print("=" * 50)
        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n   Server stopped.")
