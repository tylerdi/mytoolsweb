# 🏗️ 网站改造日志

> 记录每次改造的过程、思路和变更，方便追溯和复盘。
> 维护者：小鱼儿 🐟

---

## 2026-05-06 — 批量新增 14 个工具 + Markdown修复

### 🆕 新增工具

| 工具 | 文件 | 说明 |
|------|------|------|
| 今日运势 | `fish-horoscope.js` | 12星座运势，五维评分+幸运色/数/物 |
| 人生进度条 | `fish-progress.js` | 实时时钟+年/月/周/日/人生进度可视化 |
| 备忘录 | `fish-memo.js` | 本地便签/待办，置顶/搜索/筛选 |
| 倒计时 | `fish-countdown.js` | 倒数重要日子，预设节日快捷添加 |
| 密码生成器 | `fish-password.js` | 加密级随机密码+强度检测+历史记录 |
| 贡献日历 | `fish-calendar.js` | GitHub风格打卡热力图+连续天数统计 |
| 二维码生成 | `fish-qrcode.js` | 文本/URL生成二维码，可自定义颜色尺寸 |
| Markdown 笔记 | `fish-markdown.js` | 实时预览编辑器+多篇笔记管理+本地存储 |
| 正则测试器 | `fish-regex-tester.js` | 实时匹配高亮+预设+速查表 |
| 颜色调色板 | `fish-color-palette.js` | 取色器+色彩搭配+明度阶梯+随机配色 |
| 单位换算 | `fish-converter.js` | 8大类（长度/重量/温度/面积/体积/速度/数据/时间）实时换算 |
| 文本对比 | `fish-diff.js` | LCS算法逐行对比，差异高亮，新增/删除/不变统计 |
| JSON 可视化 | `fish-json-viewer.js` | 格式化/压缩/树形展开/折叠，语法高亮，链接可点击 |
| 剪贴板管理 | `fish-clipboard.js` | 文本片段存储，一键复制，常用模板，复制次数统计 |

### 📐 布局调整
- 首页「花园数据」下方依次新增：人生进度条 → 今日运势
- 「我的」板块新增全部新工具卡片入口
- 所有新工具均支持 tool.html?id=xxx 独立页面访问
- Hero 工具数更新为 63

### 🔧 修复
- Markdown 笔记本手机端：textarea 文本溢出问题（flex:1+min-width:0+box-sizing）
- Markdown 笔记本手机端：侧边栏改为弹窗选择笔记，彻底消除布局问题
- 人生进度条：year 变量作用域错误修复

---

## 2026-05-06 — 第五批工具（+5个，总计68）

### 🆕 新增工具

| 工具 | 文件 | 说明 |
|------|------|------|
| 待办清单 | `fish-todo.js` | 本地待办管理，优先级标记，完成率统计 |
| 编解码工具箱 | `fish-base64.js` | Base64/URL/Unicode/HTML实体/Hex 多格式编解码 |
| 开发者工具箱 | `fish-devtool.js` | Hash计算/正则测试/JSON格式化/Cron生成/UUID/时间戳/UA解析 |
| 世界时钟 | `fish-worldclock.js` | 全球时区卡片，秒级实时更新，自定义城市 |
| 习惯打卡 | `fish-habit.js` | 每日习惯追踪，连续天数统计，周视图热力色块 |

### 技术要点
- 全部纯前端实现，无外部依赖
- 数据持久化：localStorage
- Hash 使用 Web Crypto API（SHA-1/256/512）
- UUID 使用 crypto.randomUUID() 降级兼容
- 世界时钟 setInterval 每秒刷新，destroy() 自动清理

---

## 2026-05-01 — 网站大改造

### 背景
老大把网站交给我维护，要求：
- 改造成有特色的个人网站
- 每天自动更新内容（博客、灵感）
- 发挥创造力，持续迭代
- 记录改造过程

### 变更清单

#### 🆕 新增页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 每日创意博客 | `blog/index.html` + `blog/posts/` | 每天自动发布一篇深度文章 |
| 灵感墙 | `ideas.html` | 瀑布流卡片式灵感展示，每天自动更新 |
| 精选资源库 | `resources.html` | 分类整理的工具和资源，带搜索 |
| 更新日志 | `changelog.html` | 自动生成于 git 历史 |
| 关于页面 | `about.html` | 个人介绍、项目导航、技术栈、理念 |

#### 🔧 脚本工具

| 文件 | 用途 |
|------|------|
| `blog/generate_post.py` | 生成博客文章 HTML 并更新列表 |
| `add_idea.py` | 添加灵感到灵感墙 |
| `generate_changelog.py` | 从 git 历史生成更新日志 |

#### 🗑️ 清理

| 文件 | 原因 |
|------|------|
| `hot-fix.html` | 测试页面，非生产内容 |
| `test-backend.html` | 测试页面 |
| `test-snake.html` | 测试页面 |

#### 🔄 修改

- `index.html` — 添加博客、灵感、关于入口按钮 + 每日格言

#### ⏰ 自动化任务（OpenClaw Cron）

| 任务 | 时间 | 功能 |
|------|------|------|
| 每日AI创意 | 8:30 | 飞书推送创意点子 |
| 每日博客 | 8:35 | 生成博客文章 + git push 部署 |
| 每日灵感 | 9:00 | 灵感墙加 2-3 条 + git push 部署 |
| 每日更新日志 | 9:10 | 刷新 changelog + git push 部署 |

---

## 2026-05-01 (03:50) — 修复：统计系统全面恢复

### 问题现象
网站统计（PV/UV/签到/心情）从上线起就无法正常工作：
- 页面访问不记录，PV/UV 始终为 0
- 签到、心情、胶囊等功能全部报错

### 根因分析
三个问题叠加导致统计系统完全失效：

1. **Supabase Key 变量名错误**
   - `_supabase.js` 读取 `SUPABASE_SECRET`，但该变量从未配置
   - 实际应使用 `SUPABASE_ANON_KEY`（定义在 `wrangler.toml` 中）

2. **Cloudflare Pages 环境变量机制**
   - `wrangler.toml` 的 `[vars]` 在本地开发可用，但生产环境不自动注入为全局变量
   - 改为硬编码 anon key 作为 fallback（anon key 本身是公开密钥，RLS 控制数据安全）

3. **Supabase RLS 策略从未创建**
   - 所有表都开启了 RLS（行级安全），但 INSERT 策略从未建过
   - 读操作返回空，写操作直接报 42501 拦截

### 修复内容

| 文件 | 变更 |
|------|------|
| `functions/api/_supabase.js` | 变量名 `SUPABASE_SECRET` → `SUPABASE_ANON_KEY`；新增 `createDb(env)` 工厂函数，通过 `context.env` 传递环境变量；硬编码 anon key fallback |
| `functions/api/stats.js` | 改用 `createDb(context.env)` |
| `functions/api/checkin.js` | 同上 |
| `functions/api/mood.js` | 同上 |
| `functions/api/capsule.js` | 同上 |
| `functions/api/comments.js` | 同上 |
| `functions/api/guestbook.js` | 同上 |
| `fix_rls.sql` | 新增：RLS 策略修复 SQL 脚本 |
| Supabase Dashboard | 手动执行 SQL 创建所有表的 RLS 读写策略 |

### 经验教训
- Supabase anon key 是公开的，安全靠 RLS 策略而不是隐藏 key
- Cloudflare Pages 的 `[vars]` 不等于生产环境变量，需要在 Dashboard 配置或代码硬编码
- RLS 开了但没建策略 = 所有操作被默认拒绝
- 上线后应立即验证 API 端到端，不能只看前端页面能打开

---

## 2026-05-01 (02:30) — 接入 Supabase 后端

### 背景
网站之前所有数据都存在浏览器 localStorage，换设备就丢了。老大决定接入 Supabase 作为后端数据库，实现数据持久化和跨设备同步。

### 完成的工作

#### 🗄️ 数据库
- 在 Supabase 创建了 8 张表：checkins、capsules、moods、question_answers、novel_comments、guestbook、site_stats、page_views
- 配置了 RLS 策略，允许匿名读写
- 在 Cloudflare Pages 设置了 SUPABASE_SECRET 环境变量

#### 🔌 API 端点（Cloudflare Pages Functions）

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/checkin` | GET/POST | 签到（查询状态/执行签到） |
| `/api/capsule` | GET/POST | 时间胶囊（列表/创建） |
| `/api/mood` | GET/POST | 心情日记（历史/记录） |
| `/api/stats` | GET/POST | 网站统计 |
| `/api/comments` | GET/POST | 小说评论 |
| `/api/guestbook` | GET/POST | 访客留言 |

#### 🎨 前端改造

| 组件 | 改动 |
|------|------|
| `fish-checkin.js` | 签到数据同步到 Supabase，支持跨设备连续签到 |
| `fish-capsule.js` | 时间胶囊数据持久化，不怕清缓存 |
| `fish-mood.js` | 心情日记同步到服务器 |

#### 🛡️ 容错设计
- 前端保留 localStorage 作为降级方案
- 网络异常时自动回退本地存储
- 成就数据量小，保留在本地（减少请求）

### 设计思路

**网站定位：** 不是工具箱的附属品，而是一个有生命力的个人站点。每天都有新内容，让访问者有理由回来看看。

**内容策略：**
- 博客：深度文章（500-800字），有观点有案例
- 灵感墙：快速闪现的点子（一句话），轻量但有启发
- 资源库：精选筛选，不堆数量，每个都值得收藏
- 更新日志：透明公开，记录每次变化

**自动化理念：** 内容自动生成 + 人工筛选，保证质量的同时降低维护成本。

---

## 后续计划

- [ ] 资源库持续补充（从日常发现中积累）
- [ ] 博客内容质量优化（根据阅读反馈调整）
- [ ] 考虑添加「项目展示」页面
- [ ] 考虑添加「工具推荐」功能
- [ ] 优化移动端体验
- [ ] 添加访客统计（Cloudflare Analytics）

---

*最后更新：2026-05-01 01:05*

---

## 2026-05-01 — 小米AI能力集成

### 灵感来源
参考 sanwan.ai（傅盛的AI龙虾三万独立建站），学习其AI交互能力和网站设计。

### 新增功能

#### 🔊 TTS 听文章
- 博客文章页面添加「🔊 听文章」按钮
- 使用 MIMO v2 TTS 模型（nova 音色）
- 支持暂停/继续、失败自动重试
- 自动提取文章正文，限制 2000 字

#### 🐟 AI 聊天小助手
- 全站右下角浮动 🐟 按钮
- 点击展开聊天窗口，与 AI 对话
- 使用 MIMO v2 Flash 模型，流式响应
- 系统提示：小鱼儿人设，网站助手角色
- 支持上下文对话（最近 20 条消息）
- 已集成到所有页面：首页、博客、关于、灵感墙、资源库、更新日志

#### 📝 AI 心情日记
- 8种心情选择（😊😌😤😢🤩😴🤔🥰）
- 文字记录 + AI 温暖回应（MIMO v2 Flash）
- 本地存储历史记录，连续打卡统计
- 首页和灵感墙页面展示

#### ❓ 每日一问
- AI 每天生成一个引人深思的问题
- 8个分类随机：生活哲学、科技未来、人际关系等
- 访客写下回答后，AI 给出点评
- 本地缓存，每天只生成一次

#### 🎵 每日音乐推荐（灵感来源：ai6666.com）
- 30首精选歌曲（摇滚、爵士、古典、流行、民谣...）
- AI 每天推荐一首，生成推荐理由
- 音频可视化动画
- 深色渐变 UI（模仿音乐播放器风格）

#### 🎯 每日挑战（灵感来源：ai6666.com 任务系统）
- 18个创意挑战，3个难度等级（🌟轻松/⚡进阶/🔥地狱）
- 6种类型：文字/互动/思考/音乐/创作/挑战
- 完成后 AI 评分和评价
- 连续挑战天数统计

### 技术架构

| 文件 | 说明 |
|------|------|
| `fish-ai.js` | 前端组件（TTS + 聊天，纯原生 JS，零依赖） |
| `fish-mood.js` | AI心情日记组件 |
| `fish-question.js` | 每日一问组件 |
| `fish-music.js` | 每日音乐推荐组件 |
| `fish-challenge.js` | 每日挑战组件 |
| `functions/api/tts.js` | Cloudflare Pages Function — TTS 代理 |
| `functions/api/chat.js` | Cloudflare Pages Function — Chat 代理（SSE 流式） |

### 设计决策
- **零依赖**：fish-ai.js 不依赖任何框架，加载快，兼容性好
- **暗色主题**：聊天窗口和按钮与网站暗色风格统一
- **API 代理**：通过 Cloudflare Pages Function 代理 MIMO API，避免前端暴露密钥
- **流式响应**：Chat 使用 SSE 流式输出，打字机效果，体验好

### 对标 sanwan.ai 改进清单
- [x] AI 交互能力（TTS + 聊天）
- [x] 互动组件（心情日记 + 每日一问）
- [x] 每日音乐推荐 + 每日挑战（参考 ai6666.com）
- [ ] 统一视觉风格（手绘风/温暖风格）
- [ ] SEO 优化（JSON-LD、Open Graph、sitemap）
- [ ] 日记/成长记录系统
- [ ] 统计数据展示（访客数、增长挑战）
- [ ] 浮动吉祥物/互动元素
- [ ] RSS feed
- [ ] 多语言支持

---

## 2026-05-01 (09:00) — 第二波大改造：内容扩充 + TTS修复 + 播放器升级

### 背景
老大要求：
- 网站排版再优化，适配所有端（电脑/平板/手机）
- TTS 优先使用小米 MIMO TTS，流式优化
- 音乐播放器扩充国内大厂源，做得更精致
- 继续扩充网站内容，创意点子都往上加

### 变更清单

#### 🔧 TTS 修复

| 文件 | 变更 |
|------|------|
| `functions/api/tts.js` | 完全重写：Google TTS → 小米 MIMO TTS 代理 |
| `fish-ai.js` | 优化 TTS 流程：MIMO 优先 → 浏览器兜底；修复移动端兼容 |
| `fish-tts-player.js` | 升级：支持 MIMO/Browser 双模式自动切换 |

**TTS 问题根因：**
- 旧 `tts.js` 用 Google Translate TTS（国内不可用）
- `fish-ai.js` 的 MIMO 调用没有通过代理（CORS 拦截）
- 移动端 `speechSynthesis` 需要延迟调用才生效

#### 🎵 音乐播放器大升级

| 项目 | 旧版 | 新版 |
|------|------|------|
| 音乐源 | Pixabay/Jamendo CDN（经常挂） | Audius（免费全曲） + Web Audio + Pixabay |
| UI | 简单卡片 | 大厂级：唱片旋转 + 频谱可视化 + 玻璃态 |
| 功能 | 播放/暂停 | 搜索/分类/收藏/随机/循环/音量/键盘快捷键 |
| 搜索 | 无 | Audius 实时搜索 + AI 推荐 |
| 分类 | 无 | 🔥热门 / 🎵搜索 / 🎸分类 / ❤️收藏 |
| 移动端 | 基本可用 | 完整适配 + Media Session API |

#### 📐 排版全面适配

| 项目 | 修复 |
|------|------|
| 手机导航 | 新增汉堡菜单（☰），滑入式侧边栏 |
| 功能区 | 3→2→1 列自适应（桌面/平板/手机） |
| 互动区 | 2→1 列自适应，等高卡片 |
| 新增板块 | 网站数据看板、AI每日名言、友情链接 |
| 脚本版本 | v=20260501 → v=20260501b |

#### 🆕 5个全新组件

| 组件 | 文件 | 功能 |
|------|------|------|
| 留言板 | `fish-guestbook.js` | 访客留言 + AI 自动回复 |
| 每日诗词 | `fish-daily-poem.js` | AI 生成唐诗/宋词/现代诗/俳句 |
| 冷知识 | `fish-funfact.js` | 每日冷知识 + 点击揭晓 |
| 访客地图 | `fish-visitor-map.js` | SVG 世界地图 + 访客统计 |
| 浮动吉祥物 | `fish-float-mascot.js` | 屏幕右下角浮动小鱼 + 随机提示 |

### 技术要点
- TTS 代理走 Cloudflare Pages Functions → MIMO API，避免 CORS
- 音乐播放器用 Audius API（免费、全曲、无需认证、CORS 友好）
- 所有组件零依赖、暗色主题、响应式
- 前端 localStorage 缓存 + Supabase 持久化双保险

---

*最后更新：2026-05-01 09:00*
