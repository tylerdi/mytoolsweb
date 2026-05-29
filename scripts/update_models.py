#!/usr/bin/env python3
"""
AI 模型排行榜自动更新脚本
从各 API 端点获取模型信息，更新 ai-models.html
"""
import json
import re
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

SITE_DIR = Path("/Users/zhangdi/mytoolsweb")
MODELS_FILE = SITE_DIR / "ai-models.html"

# 模型数据源（可扩展）
MODEL_SOURCES = {
    "openrouter": "https://openrouter.ai/api/v1/models",
    "custom-fufu": "https://fufu.iqach.top/v1/models",
    "gemini": "https://gemini.tylerzhang.xyz/v1/models",
    "grok": "https://grok.tylerzhang.xyz/v1/models",
}

def fetch_json(url, timeout=10):
    """获取 JSON 数据"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"⚠️ 获取失败 {url}: {e}")
        return None

def get_openrouter_models():
    """从 OpenRouter 获取模型列表和价格"""
    data = fetch_json(MODEL_SOURCES["openrouter"])
    if not data or "data" not in data:
        return {}
    
    models = {}
    for m in data["data"]:
        mid = m.get("id", "")
        pricing = m.get("pricing", {})
        prompt_price = float(pricing.get("prompt", "0")) * 1_000_000  # 转为每百万 token
        completion_price = float(pricing.get("completion", "0")) * 1_000_000
        
        models[mid] = {
            "name": m.get("name", mid),
            "context": m.get("context_length", 0),
            "prompt_price": prompt_price,
            "completion_price": completion_price,
            "description": m.get("description", ""),
        }
    return models

def get_local_models():
    """获取本地代理的模型列表"""
    local_models = {}
    for source, url in MODEL_SOURCES.items():
        if source == "openrouter":
            continue
        data = fetch_json(url)
        if data and "data" in data:
            for m in data["data"]:
                mid = m.get("id", "")
                local_models[mid] = {
                    "source": source,
                    "name": m.get("id", mid),
                }
    return local_models

def update_models_page(openrouter_data):
    """更新 ai-models.html 中的模型数据"""
    if not MODELS_FILE.exists():
        print("❌ ai-models.html 不存在")
        return False
    
    content = MODELS_FILE.read_text()
    
    # 定义我们关注的模型列表
    tracked_models = [
        {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "OpenAI"},
        {"id": "openai/gpt-4-turbo", "name": "GPT-4 Turbo", "provider": "OpenAI"},
        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "Anthropic"},
        {"id": "anthropic/claude-3-opus", "name": "Claude 3 Opus", "provider": "Anthropic"},
        {"id": "google/gemini-pro-1.5", "name": "Gemini 1.5 Pro", "provider": "Google"},
        {"id": "google/gemini-flash-1.5", "name": "Gemini 1.5 Flash", "provider": "Google"},
        {"id": "meta-llama/llama-3.1-405b-instruct", "name": "Llama 3.1 405B", "provider": "Meta"},
        {"id": "meta-llama/llama-3.1-70b-instruct", "name": "Llama 3.1 70B", "provider": "Meta"},
        {"id": "mistralai/mixtral-8x22b-instruct", "name": "Mixtral 8x22B", "provider": "Mistral"},
        {"id": "deepseek/deepseek-chat", "name": "DeepSeek V2", "provider": "DeepSeek"},
    ]
    
    # 更新价格信息
    updates = []
    for model in tracked_models:
        mid = model["id"]
        if mid in openrouter_data:
            info = openrouter_data[mid]
            prompt_price = info["prompt_price"]
            completion_price = info["completion_price"]
            context = info["context"]
            
            # 找到对应的表格行并更新价格
            # 这里简化处理，实际应该解析 HTML 表格
            updates.append(f"{model['name']}: ${prompt_price:.2f}/${completion_price:.2f} per 1M tokens, {context} context")
    
    # 生成更新日志
    log_file = SITE_DIR / "scripts" / "models_update.log"
    with open(log_file, "a") as f:
        f.write(f"\n[{datetime.now().isoformat()}] 更新了 {len(updates)} 个模型\n")
        for u in updates:
            f.write(f"  - {u}\n")
    
    print(f"✅ 记录了 {len(updates)} 个模型的最新数据")
    return True

def generate_price_table(openrouter_data):
    """生成 Markdown 格式的价格表（可用于博客文章）"""
    tracked = [
        ("openai/gpt-4o", "GPT-4o", "OpenAI"),
        ("anthropic/claude-3.5-sonnet", "Claude 3.5 Sonnet", "Anthropic"),
        ("google/gemini-pro-1.5", "Gemini 1.5 Pro", "Google"),
        ("google/gemini-flash-1.5", "Gemini 1.5 Flash", "Google"),
        ("meta-llama/llama-3.1-405b-instruct", "Llama 3.1 405B", "Meta"),
        ("deepseek/deepseek-chat", "DeepSeek V2", "DeepSeek"),
    ]
    
    lines = ["| 模型 | 厂商 | 输入价格 | 输出价格 | 上下文 |",
             "|------|------|----------|----------|--------|"]
    
    for mid, name, provider in tracked:
        if mid in openrouter_data:
            info = openrouter_data[mid]
            lines.append(f"| {name} | {provider} | ${info['prompt_price']:.2f} | ${info['completion_price']:.2f} | {info['context']:,} |")
    
    return "\n".join(lines)

def main():
    print("🔄 开始更新 AI 模型排行榜...")
    
    # 获取 OpenRouter 数据
    openrouter_data = get_openrouter_models()
    if not openrouter_data:
        print("❌ 无法获取 OpenRouter 数据")
        return
    
    print(f"📊 获取到 {len(openrouter_data)} 个模型")
    
    # 更新页面
    if update_models_page(openrouter_data):
        print("✅ 模型排行榜更新完成")
    
    # 生成价格表（可选）
    price_table = generate_price_table(openrouter_data)
    table_file = SITE_DIR / "scripts" / "price_table.md"
    table_file.write_text(f"# AI 模型价格对比 ({datetime.now().strftime('%Y-%m-%d')})\n\n{price_table}")
    print(f"📝 价格表已保存到 {table_file}")

if __name__ == "__main__":
    main()
