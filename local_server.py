"""
本地开发服务器 — API 本地处理 + 静态文件
用法：cd ~/mytoolsweb && python3 local_server.py
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json
import random

# ===== API 实现 =====

def api_kuwo_hot(params):
    """酷我热歌榜（搜索接口）"""
    rn = int(params.get('rn', '30'))
    keywords = ['热歌', '流行', '华语经典', '抖音热歌', '粤语经典', '民谣', '电子', '说唱']
    kw = random.choice(keywords)
    url = f'http://search.kuwo.cn/r.s?all={urllib.request.quote(kw)}&ft=music&itemset=web_2013&client=kt&pn=0&rn={rn}&rformat=json&encoding=utf8'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://www.kuwo.cn/',
    })
    resp = urllib.request.urlopen(req, timeout=15)
    raw = resp.read().decode('utf-8')
    data = json.loads(raw.replace("'", '"'))
    songs = []
    for item in data.get('abslist', []):
        rid = (item.get('MUSICRID') or '').replace('MUSIC_', '')
        art = item.get('web_artistpic_short') or item.get('web_albumpic_short') or ''
        songs.append({
            'id': rid,
            'name': (item.get('SONGNAME') or item.get('NAME') or '').replace('&nbsp;', ' '),
            'artist': (item.get('ARTIST') or '').replace('&nbsp;', ' '),
            'album': (item.get('ALBUM') or '').replace('&nbsp;', ' '),
            'duration': int(item.get('DURATION', '0')),
            'rid': rid,
            'artwork': f'https://img2.kuwo.cn/star/artistpic/{art}' if art else '',
            'source': 'kuwo',
        })
    return {'success': True, 'total': int(data.get('TOTAL', '0')), 'songs': songs, 'keyword': kw}


def api_music_search(params):
    """酷我搜索"""
    q = params.get('q', '')
    rn = int(params.get('rn', '10'))
    pn = int(params.get('pn', '1'))
    if not q:
        return {'error': 'Missing q'}
    offset = (pn - 1) * rn
    url = f'http://search.kuwo.cn/r.s?all={urllib.request.quote(q)}&ft=music&itemset=web_2013&client=kt&pn={offset}&rn={rn}&rformat=json&encoding=utf8'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://www.kuwo.cn/',
    })
    resp = urllib.request.urlopen(req, timeout=15)
    raw = resp.read().decode('utf-8')
    data = json.loads(raw.replace("'", '"'))
    songs = []
    for item in data.get('abslist', []):
        rid = (item.get('MUSICRID') or '').replace('MUSIC_', '')
        songs.append({
            'id': rid,
            'name': (item.get('SONGNAME') or item.get('NAME') or '').replace('&nbsp;', ' '),
            'artist': (item.get('ARTIST') or '').replace('&nbsp;', ' '),
            'album': (item.get('ALBUM') or '').replace('&nbsp;', ' '),
            'duration': int(item.get('DURATION', '0')),
            'rid': rid,
            'source': 'kuwo',
        })
    return {'success': True, 'total': int(data.get('TOTAL', '0')), 'songs': songs}


def api_kuwo_proxy(params, handler=None):
    """酷我音频代理"""
    rid = params.get('rid', '')
    if not rid:
        return {'error': 'Missing rid'}, 400
    # 拿播放链接
    url = f'http://antiserver.kuwo.cn/anti.s?type=convert_url3&rid={rid}&format=mp3&response=url'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    if not data.get('url'):
        return {'error': 'No play URL'}, 404
    # 代理音频流
    audio_url = data['url']
    range_header = handler.headers.get('Range') if handler else None
    fetch_headers = {'User-Agent': 'Mozilla/5.0'}
    if range_header:
        fetch_headers['Range'] = range_header
    audio_req = urllib.request.Request(audio_url, headers=fetch_headers)
    audio_resp = urllib.request.urlopen(audio_req, timeout=30)
    handler.send_response(audio_resp.status)
    handler.send_header('Content-Type', 'audio/mpeg')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Accept-Ranges', 'bytes')
    cl = audio_resp.getheader('Content-Length')
    if cl:
        handler.send_header('Content-Length', cl)
    cr = audio_resp.getheader('Content-Range')
    if cr:
        handler.send_header('Content-Range', cr)
    handler.end_headers()
    # 流式转发，避免手机超时
    while True:
        chunk = audio_resp.read(8192)
        if not chunk:
            break
        handler.wfile.write(chunk)
        handler.wfile.flush()
    return None  # 已经直接响应了


def api_music_play(params):
    """获取播放链接"""
    rid = params.get('rid', '')
    if not rid:
        return {'error': 'Missing rid'}
    url = f'http://antiserver.kuwo.cn/anti.s?type=convert_url3&rid={rid}&format=mp3&response=url'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    if data.get('url'):
        return {'success': True, 'url': data['url'], 'rid': rid}
    return {'error': 'No play URL found'}


def api_music_lyrics(params):
    """歌词"""
    rid = params.get('rid', '')
    if not rid:
        return {'error': 'Missing rid'}
    try:
        url = f'http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId={rid}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        if data.get('status') == 200 and data.get('data'):
            lrc = data['data'].get('lrclist', [])
            lyrics = [{'t': int(float(item.get('time', '0'))) * 1000, 'l': item.get('lineLyric', '')} for item in lrc if item.get('lineLyric')]
            return {'success': True, 'lyrics': lyrics}
        return {'success': True, 'lyrics': []}
    except Exception as e:
        return {'success': True, 'lyrics': []}


def api_audius_proxy(params, handler=None):
    """Audius 音频代理（流式转发）"""
    url = params.get('url', '')
    if not url:
        return {'error': 'Missing url'}, 400
    try:
        range_header = handler.headers.get('Range') if handler else None
        fetch_headers = {'User-Agent': 'Mozilla/5.0'}
        if range_header:
            fetch_headers['Range'] = range_header
        req = urllib.request.Request(url, headers=fetch_headers)
        resp = urllib.request.urlopen(req, timeout=30)
        handler.send_response(resp.status)
        handler.send_header('Content-Type', resp.getheader('Content-Type', 'audio/mpeg'))
        handler.send_header('Access-Control-Allow-Origin', '*')
        handler.send_header('Accept-Ranges', 'bytes')
        cl = resp.getheader('Content-Length')
        if cl:
            handler.send_header('Content-Length', cl)
        cr = resp.getheader('Content-Range')
        if cr:
            handler.send_header('Content-Range', cr)
        handler.end_headers()
        # 流式转发，避免超时
        while True:
            chunk = resp.read(8192)
            if not chunk:
                break
            handler.wfile.write(chunk)
            handler.wfile.flush()
        return None
    except Exception as e:
        return {'error': str(e)}, 500


def api_audius_search(params):
    """Audius 搜索"""
    q = params.get('q', '')
    rn = int(params.get('rn', '15'))
    if not q:
        return {'error': 'Missing q'}
    url = f'https://api.audius.co/v1/tracks/search?query={urllib.request.quote(q)}&limit={rn}&app_name=fishplayer'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    songs = []
    for t in data.get('data', []):
        songs.append({
            'id': t.get('id', ''),
            'name': t.get('title', ''),
            'artist': t.get('user', {}).get('name', ''),
            'album': '',
            'duration': int(t.get('duration', 0)),
            'rid': t.get('id', ''),
            'artwork': t.get('artwork', {}).get('480x480', '') or t.get('artwork', {}).get('150x150', ''),
            'streamUrl': f'https://api.audius.co/v1/tracks/{t.get("id", "")}/stream?app_name=fishplayer',
            'source': 'audius',
        })
    return {'success': True, 'songs': songs}


# ===== 路由表 =====
API_ROUTES = {
    '/api/kuwo-hot': api_kuwo_hot,
    '/api/music-search': api_music_search,
    '/api/music-play': api_music_play,
    '/api/music-lyrics': api_music_lyrics,
    '/api/audius-search': api_audius_search,
}


class LocalHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def _parse_params(self):
        path = self.path
        params = {}
        if '?' in path:
            qs = path.split('?', 1)[1]
            for pair in qs.split('&'):
                if '=' in pair:
                    k, v = pair.split('=', 1)
                    params[k] = urllib.request.unquote(v)
        return path.split('?')[0], params

    def do_GET(self):
        path, params = self._parse_params()

        if path == '/api/kuwo-proxy':
            result = api_kuwo_proxy(params, self)
            if result is None:
                return  # 已经直接响应了
            data, status = result if isinstance(result, tuple) else (result, 200)
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        if path == '/api/audius-proxy':
            result = api_audius_proxy(params, self)
            if result is None:
                return
            data, status = result if isinstance(result, tuple) else (result, 200)
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        handler = API_ROUTES.get(path)
        if handler:
            try:
                result = handler(params)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
            return

        super().do_GET()

    def do_POST(self):
        path, params = self._parse_params()
        handler = API_ROUTES.get(path)
        if handler:
            try:
                result = handler(params)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return
        self.send_response(405)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.end_headers()


if __name__ == '__main__':
    port = 8888
    server = ThreadingHTTPServer(('0.0.0.0', port), LocalHandler)
    print(f'🐟 本地开发服务器启动 http://0.0.0.0:{port}')
    print(f'   局域网: http://192.168.100.4:{port}')
    print(f'   API: 本地处理（不依赖远端）')
    server.serve_forever()
