#!/usr/bin/env python3
"""AI 每日资讯 - 精简版"""
import json, os, re, sys, urllib.request
import xml.etree.ElementTree as ET
from html import unescape
from datetime import datetime, timezone, timedelta

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT_DIR, "blog", "posts")
CST = timezone(timedelta(hours=8))
TODAY = datetime.now(CST)
DATE_STR = TODAY.strftime("%Y-%m-%d")
DATE_CN = TODAY.strftime("%Y年%m月%d日")

def fetch(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace")
    except:
        return None

def get_hn(limit=8):
    print("📰 HN...")
    data = fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
    if not data: return []
    items = []
    ai_kw = ["ai","gpt","llm","openai","anthropic","claude","gemini","deepseek","ml","neural","transformer","diffusion","chatbot","agent"]
    for sid in json.loads(data)[:20]:
        d = fetch(f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", 8)
        if not d: continue
        i = json.loads(d)
        if not i or not i.get("title"): continue
        items.append({"title": i["title"], "url": i.get("url", f"https://news.ycombinator.com/item?id={sid}"), "score": i.get("score", 0), "source": "HN"})
        if len(items) >= limit: break
    ai = [i for i in items if any(kw in i["title"].lower() for kw in ai_kw)]
    other = [i for i in items if i not in ai]
    return ai, other

def get_tc(limit=6):
    print("📰 TC...")
    xml = fetch("https://techcrunch.com/category/artificial-intelligence/feed/")
    if not xml: return []
    items = []
    try:
        for item in ET.fromstring(xml).findall(".//item")[:limit]:
            t = item.findtext("title","")
            l = item.findtext("link","")
            d = re.sub(r"<[^>]+>","",unescape(item.findtext("description","")))[:150]
            if t: items.append({"title": t, "url": l, "description": d, "source": "TechCrunch"})
    except: pass
    return items

def get_ph(limit=6):
    print("📰 PH...")
    xml = fetch("https://www.producthunt.com/feed")
    if not xml: return []
    items = []
    try:
        for item in ET.fromstring(xml).findall(".//item")[:limit]:
            t = item.findtext("title","")
            l = item.findtext("link","")
            if t: items.append({"title": t, "url": l, "source": "Product Hunt"})
    except: pass
    return items

def build_html(sections):
    cards = ""
    for name, items in sections:
        if not items: continue
        cards += f'<h2 class="sec">{name}</h2>\n'
        for it in items:
            score = f'<span class="score">🔺 {it["score"]}</span>' if it.get("score") else ""
            desc = f'<p class="desc">{it.get("description","")}</p>' if it.get("description") else ""
            cards += f'<a href="{it["url"]}" class="card" target="_blank" rel="noopener"><div class="src">{it["source"]}</div><h3>{it["title"]}</h3>{desc}{score}</a>\n'
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6426056111301969" crossorigin="anonymous"></script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AI 每日资讯 {DATE_CN} | 小鱼儿的数字花园</title>
<meta name="description" content="AI 每日资讯 {DATE_CN}：Hacker News、TechCrunch、Product Hunt 最新 AI 动态。">
<meta name="keywords" content="AI资讯,AI新闻,AI日报,Hacker News,Product Hunt,{DATE_STR}">
<link rel="canonical" href="https://tylerzhang.xyz/blog/posts/ai-daily-{DATE_STR}.html">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐟</text></svg>">
<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'LXGW WenKai',-apple-system,sans-serif;background:#0a0a0a;color:#e8e8e8;line-height:1.8}}
.c{{max-width:800px;margin:0 auto;padding:72px 20px 40px}}
.nav{{position:fixed;top:0;width:100%;z-index:100;background:rgba(10,10,10,.85);backdrop-filter:blur(20px);border-bottom:1px solid #1e1e1e}}
.nav-i{{max-width:800px;margin:0 auto;padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between}}
.nav-i a{{color:#888;text-decoration:none;font-size:.82rem}}
.back{{color:#888;text-decoration:none;font-size:.82rem;display:inline-block;margin-bottom:20px}}
.back:hover{{color:#646cff}}
h1{{font-size:1.4rem;font-weight:900;margin-bottom:4px}}
.date{{color:#888;font-size:.78rem;margin-bottom:24px}}
.sec{{font-size:1rem;font-weight:700;margin:24px 0 10px;padding-left:10px;border-left:3px solid #646cff;color:#646cff}}
.card{{display:block;background:#111;border:1px solid #1e1e1e;border-radius:10px;padding:14px 18px;margin-bottom:8px;text-decoration:none;color:inherit;transition:all .2s}}
.card:hover{{border-color:#646cff;transform:translateY(-2px)}}
.src{{font-size:.62rem;color:#646cff;font-weight:700;text-transform:uppercase;margin-bottom:3px}}
.card h3{{font-size:.85rem;font-weight:700;color:#e8e8e8}}
.desc{{font-size:.72rem;color:#888;line-height:1.4;margin-top:3px}}
.score{{font-size:.68rem;color:#d4a853}}
.ft{{text-align:center;padding:20px;color:#555;font-size:.68rem;border-top:1px solid #1e1e1e;margin-top:32px}}
.ft a{{color:#888;text-decoration:none}}
@media(max-width:768px){{.c{{padding:62px 16px 24px}}h1{{font-size:1.2rem}}}}
</style>
</head>
<body>
<nav class="nav"><div class="nav-i"><a href="/">🐟 小鱼儿</a><a href="/blog/">← 博客</a></div></nav>
<div class="c">
<a href="/blog/" class="back">← 返回博客</a>
<h1>📡 AI 每日资讯</h1>
<div class="date">{DATE_CN} · 自动采集 by 🐟 小鱼儿</div>
{cards}
</div>
<footer class="ft">由 🐟 小鱼儿自动采集 · <a href="https://openclaw.ai">OpenClaw</a> · © 2026 Tyler</footer>
</body></html>'''

def main():
    print(f"🐟 AI 每日资讯 - {DATE_CN}")
    ai_hn, other_hn = get_hn(8)
    tc = get_tc(6)
    ph = get_ph(6)
    sections = []
    if ai_hn: sections.append(("🤖 AI 热点", ai_hn))
    if other_hn: sections.append(("🔥 HN 热门", other_hn))
    if tc: sections.append(("📰 TechCrunch", tc))
    if ph: sections.append(("🚀 Product Hunt", ph))
    if not sections:
        print("❌ 无数据"); sys.exit(1)
    total = sum(len(i) for _, i in sections)
    print(f"✅ 共 {total} 条")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, f"ai-daily-{DATE_STR}.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(build_html(sections))
    print(f"📄 {path}")
    print(f"🔗 https://tylerzhang.xyz/blog/posts/ai-daily-{DATE_STR}.html")

if __name__ == "__main__":
    main()
