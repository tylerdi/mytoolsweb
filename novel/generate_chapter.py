#!/usr/bin/env python3
"""
武侠小说章节生成器
每天生成一章原创武侠小说，更新 chapters.json 和章节 HTML
"""

import json
import os
import subprocess
import sys
from datetime import datetime

NOVEL_DIR = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(NOVEL_DIR, "chapters")
CHAPTERS_JSON = os.path.join(NOVEL_DIR, "chapters.json")
PROJECT_DIR = os.path.dirname(NOVEL_DIR)

# 小说设定
NOVEL_TITLE = "沧海剑歌"
NOVEL_SETTING = """
【小说设定】
书名：沧海剑歌
风格：古龙的意境 + 金庸的格局
世界观：天下分九州，武林分正邪两道。传说集齐四把「沧海遗音」古剑，可开启沧海秘境，得长生不老之术。
主线：少年叶孤舟，父母被害，身世成谜，偶得一把沧海遗音，踏上寻剑复仇之路。

【主要角色】
- 叶孤舟：主角，18岁，性格冷峻但内心善良，剑法天赋极高
- 苏晚晴：女主，医仙传人，温柔聪慧，与叶孤舟渐生情愫
- 楚狂歌：亦正亦邪的酒剑仙，叶孤舟的忘年之交
- 柳如烟：神秘女子，身份成谜，时敌时友
- 天机老人：武林第一智者，掌握沧海秘境的秘密
- 血衣侯：反派首领，血衣教教主，野心勃勃

【前情提要】
第一章：叶孤舟在海边渔村长大，养父临终前告知其身世，交给他一把残剑。
第二章：叶孤舟离开渔村，途中遭遇血衣教追杀，被楚狂歌所救。
第三章：在醉仙楼，叶孤舟初遇苏晚晴，得知沧海遗音的传说。
"""


def get_chapter_count():
    """获取当前章节数"""
    if os.path.exists(CHAPTERS_JSON):
        with open(CHAPTERS_JSON, "r", encoding="utf-8") as f:
            return len(json.load(f))
    return 0


def generate_chapter(chapter_num):
    """用 AI 生成一章小说"""
    prev_summary = ""
    if chapter_num > 1 and os.path.exists(CHAPTERS_JSON):
        with open(CHAPTERS_JSON, "r", encoding="utf-8") as f:
            chapters = json.load(f)
        if chapters:
            last = chapters[-1]
            prev_summary = f"\n\n【上一章回顾】\n第{last['id']}章 {last['title']}：{last.get('summary', '（无摘要）')}"

    prompt = f"""你是一位武侠小说大师，擅长古龙式意境和金庸式叙事。
请为小说《{NOVEL_TITLE}》撰写第{chapter_num}章。

{NOVEL_SETTING}
{prev_summary}

【要求】
1. 章节标题要有诗意，符合武侠风格
2. 正文 1500-2500 字
3. 文风：古龙的短句意境 + 金庸的武功描写
4. 每段开头空两格（用全角空格）
5. 可以有诗词/剑诀穿插
6. 情节要有推进，结尾要有悬念
7. 用中文

【输出格式】
先输出章节标题（不含"第X章"前缀），然后空一行，再输出正文。
不要输出任何解释或元数据，只输出标题和正文。"""

    try:
        # 调用 MIMO API
        import urllib.request

        payload = json.dumps({
            "model": "mimo-v2-flash",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 3000,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://fufu.iqach.top/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": "Bearer sk-123456",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
            },
        )

        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            return content.strip()
    except Exception as e:
        print(f"❌ AI 生成失败: {e}", file=sys.stderr)
        return None


def save_chapter(chapter_num, content):
    """保存章节"""
    os.makedirs(CHAPTERS_DIR, exist_ok=True)

    # 解析标题和正文
    lines = content.strip().split("\n")
    title = lines[0].strip()
    # 去掉可能的 # 前缀
    title = title.lstrip("#").strip()

    body_lines = []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        # 转换为 HTML 段落
        if line.startswith("「") or line.startswith("『"):
            body_lines.append(f'<p>{line}</p>')
        elif any(line.startswith(c) for c in ["*", "-", "—"]):
            body_lines.append(f'<p class="poem">{line.lstrip("*-— ")}</p>')
        else:
            body_lines.append(f'<p>{line}</p>')

    body_html = "\n".join(body_lines)
    word_count = len(body_html.replace("<", "").replace(">", "").replace("/", ""))

    # 保存 HTML 文件
    filename = f"chapter-{chapter_num:03d}.html"
    filepath = os.path.join(CHAPTERS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(body_html)

    # 更新 chapters.json
    chapters = []
    if os.path.exists(CHAPTERS_JSON):
        with open(CHAPTERS_JSON, "r", encoding="utf-8") as f:
            chapters = json.load(f)

    # 生成摘要（取前50字）
    plain_text = body_html.replace("<p>", "").replace("</p>", "").replace('<p class="poem">', "")
    summary = plain_text[:80].replace("\n", " ") + "..."

    chapter_data = {
        "id": chapter_num,
        "title": f"第{_num_to_chinese(chapter_num)}章 {title}",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "words": word_count,
        "file": filename,
        "summary": summary,
    }

    # 检查是否已存在
    existing = [i for i, c in enumerate(chapters) if c["id"] == chapter_num]
    if existing:
        chapters[existing[0]] = chapter_data
    else:
        chapters.append(chapter_data)

    with open(CHAPTERS_JSON, "w", encoding="utf-8") as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)

    print(f"✅ 第{chapter_num}章「{title}」已保存 ({word_count} 字)")
    return chapter_data


def _num_to_chinese(num):
    """数字转中文"""
    chinese = "一二三四五六七八九十百千"
    if num <= 10:
        return chinese[num - 1]
    elif num < 20:
        return f"十{chinese[num - 11]}"
    elif num < 100:
        tens = num // 10
        ones = num % 10
        return f"{chinese[tens - 1]}十{chinese[ones - 1] if ones else ''}"
    else:
        return str(num)


def main():
    chapter_num = get_chapter_count() + 1
    print(f"📖 正在生成《{NOVEL_TITLE}》第{_num_to_chinese(chapter_num)}章...")

    content = generate_chapter(chapter_num)
    if not content:
        sys.exit(1)

    chapter_data = save_chapter(chapter_num, content)
    print(f"📚 文件: {chapter_data['file']}")
    print(f"📅 日期: {chapter_data['date']}")
    print(f"📝 字数: {chapter_data['words']}")


if __name__ == "__main__":
    main()
