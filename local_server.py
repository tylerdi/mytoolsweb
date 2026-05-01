"""
本地开发服务器 — 带 API 代理 + 多线程
用法：cd ~/mytoolsweb && python3 local_server.py
功能：静态文件本地提供，/api/* 代理到线上
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.request

TARGET = 'https://www.tylerzhang.xyz'

class ProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def _proxy(self, method='GET'):
        target = TARGET + self.path
        body = b''
        if method == 'POST':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length) if length else b''
        try:
            req = urllib.request.Request(target, data=body if method == 'POST' else None, headers={
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': self.headers.get('Content-Type', 'application/json'),
            }, method=method)
            resp = urllib.request.urlopen(req, timeout=15)
            data = resp.read()
            self.send_response(resp.status)
            for k, v in resp.getheaders():
                if k.lower() not in ('transfer-encoding', 'connection'):
                    self.send_header(k, v)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_GET(self):
        if self.path.startswith('/api/'):
            self._proxy('GET')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self._proxy('POST')
        else:
            self.send_response(405)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    port = 8888
    server = ThreadingHTTPServer(('0.0.0.0', port), ProxyHandler)
    print(f'🐟 本地开发服务器启动 http://0.0.0.0:{port}')
    print(f'   局域网: http://192.168.100.4:{port}')
    print(f'   API 代理: {TARGET}')
    server.serve_forever()
