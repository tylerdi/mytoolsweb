#!/usr/bin/env python3
"""
更新所有 HTML 页面：
1. 添加 style.css 引用
2. 添加 nav.js 引用
3. 移除旧的内联导航栏 HTML
4. 确保有 <main> 标签包裹内容
5. 统一 footer
"""
import re, os, glob

SITE_DIR = '/Users/zhangdi/mytoolsweb'

# Pages that should NOT get the shared nav (they have custom layouts)
SKIP_NAV = {'404.html', 'blog/index.html'}

# CSS link to inject
CSS_LINK = '    <link rel="stylesheet" href="/style.css">'
# JS scripts to inject (before </body>)
NAV_SCRIPT = '    <script src="/nav.js"></script>'
TYPING_SCRIPT = '''    <script>
    function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
    </script>'''

# Standard footer
FOOTER_OLD_PATTERNS = [
    r'<footer[^>]*>.*?</footer>',
]
FOOTER_NEW = '    <footer class="footer">Powered by <a href="https://openclaw.ai">OpenClaw</a> · 🐟 小鱼儿自主维护 · © 2026 Tyler</footer>'

def update_page(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    basename = os.path.relpath(filepath, SITE_DIR)
    
    # Skip 404
    if basename in SKIP_NAV:
        return False
    
    # 1. Add style.css link if not present
    if '/style.css' not in content:
        # Try to add after <title> closing tag or after last <meta>
        if '<link rel="stylesheet"' in content:
            # Add after existing stylesheet links
            content = re.sub(
                r'(<link[^>]*stylesheet[^>]*>)',
                r'\1\n' + CSS_LINK,
                content,
                count=1
            )
        elif '</title>' in content:
            content = content.replace('</title>', '</title>\n' + CSS_LINK, 1)
        elif '<head>' in content:
            content = content.replace('<head>', '<head>\n' + CSS_LINK, 1)
    
    # 2. Remove old inline nav HTML (various patterns)
    # Pattern: <nav class="nav">...</nav> through mobile-menu div
    # We'll remove everything from first <nav to closing </nav> + mobile menu
    nav_patterns = [
        # Full nav block including mobile menu (most common)
        r'<nav\s+class="nav"[^>]*>.*?</nav>\s*<div\s+class="mobile-overlay"[^>]*>.*?</div>\s*<div\s+class="mobile-menu"[^>]*>.*?</div>',
        # Nav without mobile menu
        r'<nav\s+class="nav"[^>]*>.*?</nav>',
        # Header-based nav (about.html style)
        r'<header\s+class="header"[^>]*>.*?</header>',
        # Simple back-link nav (ai-image style)
        r'<nav[^>]*>\s*<a[^>]*>←[^<]*</a>\s*</nav>',
    ]
    
    for pattern in nav_patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, '', content, count=1, flags=re.DOTALL)
            break
    
    # 3. Add nav.js script
    if '/nav.js' not in content:
        if '</body>' in content:
            content = content.replace('</body>', NAV_SCRIPT + '\n</body>', 1)
        elif '</html>' in content:
            content = content.replace('</html>', NAV_SCRIPT + '\n</html>', 1)
    
    # 4. Remove old inline toggleMenu function if present (nav.js handles it)
    # Keep it simple - just remove if it exists as a standalone function
    content = re.sub(
        r'<script>\s*function\s+toggleMenu\(\)\s*\{[^}]*\}\s*</script>',
        '',
        content
    )
    
    # 5. Update footer if present
    if '<footer' in content:
        content = re.sub(
            r'<footer[^>]*>.*?</footer>',
            FOOTER_NEW,
            content,
            count=1,
            flags=re.DOTALL
        )
    
    # 6. Clean up multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all HTML files
html_files = glob.glob(os.path.join(SITE_DIR, '*.html'))
html_files += glob.glob(os.path.join(SITE_DIR, 'blog', '*.html'))
html_files += glob.glob(os.path.join(SITE_DIR, 'tools', '*.html'))

updated = 0
for f in sorted(html_files):
    rel = os.path.relpath(f, SITE_DIR)
    if update_page(f):
        print(f'✅ Updated: {rel}')
        updated += 1
    else:
        print(f'⏭️  Skipped: {rel}')

print(f'\nDone! Updated {updated} files.')
