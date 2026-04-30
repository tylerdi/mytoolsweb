#!/usr/bin/env python3
"""
Blog post generator for Tyler's blog.
Usage: python3 generate_post.py "Title" "Summary" "Tag" "Content in markdown-like format"

This script:
1. Creates an HTML blog post in blog/posts/
2. Updates blog/index.html with the new post in the manifest
3. Does NOT auto-commit (that's handled by the cron job)
"""

import sys
import os
from datetime import datetime

def generate_post(title, summary, tag, content):
    today = datetime.now().strftime("%Y-%m-%d")
    date_display = datetime.now().strftime("%Y 年 %m 月 %d 日")
    
    # Create safe filename
    safe_title = title.replace(" ", "-").replace("/", "-").replace("\\", "-")
    safe_title = "".join(c for c in safe_title if c.isalnum() or c in "-_")
    filename = f"{today}-{safe_title}.html"
    
    blog_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(blog_dir)
    posts_dir = os.path.join(blog_dir, "posts")
    os.makedirs(posts_dir, exist_ok=True)
    
    # Convert content to HTML paragraphs
    content_html = ""
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("## "):
            content_html += f'<h2>{line[3:]}</h2>\n'
        elif line.startswith("### "):
            content_html += f'<h3>{line[4:]}</h3>\n'
        elif line.startswith("- "):
            content_html += f'<li>{line[2:]}</li>\n'
        elif line.startswith("> "):
            content_html += f'<blockquote>{line[2:]}</blockquote>\n'
        else:
            content_html += f'<p>{line}</p>\n'
    
    # Generate post HTML
    post_html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} · Tyler's Blog</title>
    <link rel="icon" type="image/png" href="../../resource/easyclaw.png">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        :root {{
            --bg: #0a0a0a; --surface: #141414; --border: #2a2a2a;
            --text: #e8e8e8; --text-secondary: #888; --accent: #646cff;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg); color: var(--text); line-height: 1.8; min-height: 100vh;
        }}
        .header {{
            border-bottom: 1px solid var(--border); padding: 1.5rem 0;
            position: sticky; top: 0; background: rgba(10,10,10,0.85);
            backdrop-filter: blur(12px); z-index: 100;
        }}
        .header-inner {{
            max-width: 720px; margin: 0 auto; padding: 0 2rem;
            display: flex; justify-content: space-between; align-items: center;
        }}
        .logo {{ font-size: 1.25rem; font-weight: 700; color: var(--text); text-decoration: none; }}
        .logo span {{ color: var(--accent); }}
        .nav a {{ color: var(--text-secondary); text-decoration: none; margin-left: 2rem; font-size: 0.9rem; }}
        .nav a:hover {{ color: var(--text); }}
        .container {{ max-width: 720px; margin: 0 auto; padding: 3rem 2rem; }}
        .back {{ color: var(--accent); text-decoration: none; font-size: 0.9rem; margin-bottom: 2rem; display: inline-block; }}
        .back:hover {{ text-decoration: underline; }}
        .post-date {{ font-size: 0.85rem; color: var(--accent); font-weight: 600; margin-bottom: 0.75rem; }}
        .post-title {{ font-size: 2rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.03em; line-height: 1.3; }}
        .post-tag {{
            display: inline-block; font-size: 0.75rem; color: var(--accent);
            background: rgba(100,108,255,0.1); padding: 0.2rem 0.6rem;
            border-radius: 4px; margin-bottom: 2rem; font-weight: 500;
        }}
        .post-content {{ font-size: 1.05rem; }}
        .post-content p {{ margin-bottom: 1.25rem; }}
        .post-content h2 {{ font-size: 1.4rem; font-weight: 700; margin: 2rem 0 1rem; letter-spacing: -0.02em; }}
        .post-content h3 {{ font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }}
        .post-content li {{ margin-left: 1.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); }}
        .post-content blockquote {{
            border-left: 3px solid var(--accent); padding: 0.75rem 1.25rem;
            margin: 1.5rem 0; background: var(--surface); border-radius: 0 8px 8px 0;
            color: var(--text-secondary); font-style: italic;
        }}
        .footer {{
            border-top: 1px solid var(--border); padding: 2rem 0;
            text-align: center; color: var(--text-secondary); font-size: 0.85rem;
            max-width: 720px; margin: 3rem auto 0;
        }}
        .footer a {{ color: var(--accent); text-decoration: none; }}
        @media (max-width: 640px) {{
            .container {{ padding: 2rem 1.25rem; }}
            .post-title {{ font-size: 1.5rem; }}
        }}
        .fish-tts {{ margin-bottom: 1.5rem; }}
        .fish-listen-btn {{
            background: rgba(100,108,255,0.1); border: 1px solid rgba(100,108,255,0.3);
            color: var(--accent); padding: 0.5rem 1.2rem; border-radius: 8px;
            cursor: pointer; font-size: 0.9rem; font-weight: 500;
            transition: all 0.2s;
        }}
        .fish-listen-btn:hover {{ background: rgba(100,108,255,0.2); transform: translateY(-1px); }}
        .fish-listen-btn:disabled {{ opacity: 0.5; cursor: not-allowed; }}
    </style>
</head>
<body>
    <header class="header">
        <div class="header-inner">
            <a href="/" class="logo">Tyler<span>.</span></a>
            <nav class="nav">
                <a href="/">首页</a>
                <a href="/blog/">博客</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <a href="/blog/" class="back">← 返回博客列表</a>
        <div class="post-date">{date_display}</div>
        <h1 class="post-title">{title}</h1>
        <span class="post-tag">{tag}</span>
        <div class="fish-tts" id="listen-section"></div>
        <div class="post-content">
{content_html}
        </div>
    </main>

    <footer class="footer">
        <p>Powered by <a href="https://www.tylerzhang.xyz">Tyler</a> & <a href="https://openclaw.ai">OpenClaw</a></p>
    </footer>
    <script src="/fish-ai.js"></script>
</body>
</html>'''

    # Write post file
    post_path = os.path.join(posts_dir, filename)
    with open(post_path, 'w', encoding='utf-8') as f:
        f.write(post_html)
    print(f"✅ Post created: {post_path}")

    # Update blog/index.html manifest
    index_path = os.path.join(blog_dir, "index.html")
    with open(index_path, 'r', encoding='utf-8') as f:
        index_content = f.read()

    new_entry = f'''            {{ date: "{date_display}", title: "{title}", summary: "{summary}", tag: "{tag}", file: "{filename}" }},'''

    # Insert after the placeholder comment
    index_content = index_content.replace(
        '// POSTS_PLACEHOLDER',
        '// POSTS_PLACEHOLDER\n' + new_entry
    )

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"✅ Index updated: {index_path}")

    return filename

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python3 generate_post.py \"Title\" \"Summary\" \"Tag\" \"Content\"")
        sys.exit(1)
    
    title = sys.argv[1]
    summary = sys.argv[2]
    tag = sys.argv[3]
    content = sys.argv[4]
    
    generate_post(title, summary, tag, content)
