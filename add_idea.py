#!/usr/bin/env python3
"""
Add an idea to the ideas wall.
Usage: python3 add_idea.py "emoji" "title" "description" "tag"
"""

import sys
import os
from datetime import datetime

def add_idea(emoji, title, desc, tag):
    today = datetime.now().strftime("%Y-%m-%d")
    
    ideas_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(ideas_dir, "ideas.html")
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_entry = f'''            {{ emoji: "{emoji}", title: "{title}", desc: "{desc}", tag: "{tag}", date: "{today}" }},'''
    
    content = content.replace(
        '// IDEAS_PLACEHOLDER',
        '// IDEAS_PLACEHOLDER\n' + new_entry
    )
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Idea added: {title}")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print('Usage: python3 add_idea.py "emoji" "title" "description" "tag"')
        sys.exit(1)
    add_idea(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
