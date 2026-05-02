<div align="center">

# 🐟 小鱼儿的数字花园

**一个由 AI 驱动的个人网站，每天都有新内容**

[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://tylerzhang.xyz)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

<br/>

一个集博客、小说连载、AI 工具箱、互动游戏于一体的个人网站。

所有组件均为原生 JavaScript 实现，零框架依赖，Cloudflare Pages 全球 CDN 部署。

**🔗 [tylerzhang.xyz](https://tylerzhang.xyz)**

</div>

---

## ✨ 特色功能

### 📝 内容
- **博客系统** — AI 主题文章，支持 TTS 朗读
- **武侠小说连载** — 目录导航、阅读进度保存、语音朗读
- **灵感墙** — 随时记录闪现的想法
- **资源库** — 精选工具与资源合集

### 🤖 AI 工具箱
- **AI 聊天助手** — 内嵌智能对话
- **AI 画图** — 文字生成图片
- **文字转语音** — 多语言 TTS
- **语音转文字** — 音频转录
- **AI 翻译** — 多语言互译

### 🎵 娱乐
- **音乐播放器** — 在线听歌
- **视频播放器** — 短视频推荐
- **每日诗词** — 每天一首古诗
- **冷知识 / 笑话** — 随机趣味内容

### 🎮 互动
- **每日打卡** — 连续签到记录
- **心情日记** — 记录每日心情
- **时光胶囊** — 写给未来的自己
- **解梦** — 周公解梦查询
- **访客地图** — 全球访客可视化
- **留言板** — 公共留言互动
- **打字测速** — 中文打字练习
- **小游戏** — 更多趣味等你发现

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────┐
│              前端（纯原生 JS）                │
│  index.html + 20+ 独立 fish-*.js 组件       │
│  零框架 · 零构建 · 即改即生效                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Cloudflare Pages + Functions         │
│  静态托管 + 25 个 Serverless API 端点         │
│  全球 CDN · 自动部署 · 免费额度充足           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Supabase (PostgreSQL)           │
│  用户数据 · 打卡 · 心情 · 胶囊 · 留言等      │
└─────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JavaScript |
| 后端 | Cloudflare Functions (Workers) |
| 数据库 | Supabase (PostgreSQL) |
| 部署 | Cloudflare Pages（push to main 自动部署） |
| 域名 | tylerzhang.xyz |

### 项目结构

```
├── index.html              # 首页（单页应用）
├── about.html              # 关于页面
├── blog/                   # 博客系统
├── novel/                  # 小说连载
├── games.html              # 小游戏
├── tools.html              # 工具箱
├── ideas.html              # 灵感墙
├── resources.html          # 资源库
├── changelog.html          # 更新日志
├── fish-*.js               # 独立功能组件（20+）
├── functions/api/          # Serverless API 端点
└── supabase/               # 数据库迁移脚本
```

---

## 🚀 快速开始

### 前置条件
- [Node.js](https://nodejs.org/) >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（Cloudflare 官方工具）
- Supabase 账号

### 本地开发

```bash
# 克隆项目
git clone https://github.com/tylerdi/mytoolsweb.git
cd mytoolsweb

# 安装 Wrangler（如果没有）
npm install -g wrangler

# 本地启动（含 Functions）
wrangler pages dev . --port 8788
```

打开 `http://localhost:8788` 即可预览。

### 部署

```bash
# 推送到 main 分支自动触发 Cloudflare Pages 部署
git add -A
git commit -m "your changes"
git push
```

### 环境变量

在 Cloudflare Pages 后台配置以下变量：

| 变量名 | 说明 |
|--------|------|
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 |

---

## 📦 组件说明

每个 `fish-*.js` 都是独立的功能组件，可单独使用：

| 组件 | 功能 |
|------|------|
| `fish-ai.js` | TTS 朗读 + AI 聊天助手 |
| `fish-music-player.js` | 音乐播放器 |
| `fish-video-player.js` | 视频播放器 |
| `fish-image-gen.js` | AI 画图 |
| `fish-tts-tool.js` | 文字转语音工具 |
| `fish-translate.js` | AI 翻译 |
| `fish-speech-to-text.js` | 语音转文字 |
| `fish-checkin.js` | 每日打卡 |
| `fish-mood.js` | 心情日记 |
| `fish-capsule.js` | 时光胶囊 |
| `fish-guestbook.js` | 留言板 |
| `fish-visitor-map.js` | 访客地图 |
| `fish-daily-poem.js` | 每日诗词 |
| `fish-funfact.js` | 冷知识 |
| `fish-joke.js` | 笑话 |
| `fish-dream.js` | 解梦 |
| `fish-typing-test.js` | 打字测速 |
| `fish-stats.js` | 网站统计 |
| `fish-float-mascot.js` | 浮动吉祥物 |
| `fish-music.js` | 背景音乐控制 |

---

## 🤝 参考项目

本项目受以下网站启发：

- [三万 AI](https://sanwan.ai/) — 傅盛的 AI 独立建站运营
- [碳基圈](https://ai6666.com/) — AI 与人类互动社区

---

## 📄 License

MIT

---

<div align="center">

**用 ❤️ 和 🐟 打造**

*如果觉得有趣，点个 ⭐ 吧！*

</div>
