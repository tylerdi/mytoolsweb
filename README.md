# Tyler 工作台

面向中文 AI 应用开发者的浏览器工具和排错案例。站点使用静态 HTML/CSS/JavaScript，部署在 Cloudflare Pages；少数在线演示和访问统计使用 Pages Functions。

## 核心页面

| 路径 | 用途 |
| --- | --- |
| `/`、`/json-output` | 在浏览器中检查模型输出的 JSON 语法 |
| `/ai-cost` | 用有来源的标准文本费率估算模型 API 费用，也可手动改价 |
| `/agent-lab`、`/agent-map` | 演示工具调用失败路径，查看 Agent 结构 |
| `/api-diagnostics` | 按状态码、Retry-After 和副作用判断 API 错误的排查顺序 |
| `/tools` | JSON、Base64、正则、时间戳等基础开发工具 |
| `/blog/` | 人工审阅的可复现排错案例 |
| `/about`、`/privacy`、`/contact` | 站点身份、数据处理和反馈渠道 |

## 本地预览与验证

```bash
HOST=127.0.0.1 PORT=8788 python3 local_server.py
node --test tests/*.test.mjs
```

打开 `http://127.0.0.1:8788/`。本地服务器支持 Cloudflare Pages 的无扩展名静态网址。它不是完整的 Pages Functions 环境；需要验证在线 API 时，应使用 Cloudflare 预览部署或线上测试环境。

## 内容发布规则

- 公开索引页面应解决一个具体任务，有可复现输入、实际结果、失败边界和相关工具；不要为了数量批量发布泛 AI 文章。
- `sitemap.xml` 只列希望收录的规范网址，地址与页面 `canonical` 一致。Cloudflare Pages 会把 `.html` 路径跳转到无扩展名路径。
- `_headers` 将旧的自动日报、重复介绍页及偏离当前主题的实验页标为 `noindex`。这些页面仍可直接访问，但不作为当前搜索入口。
- 旧日报不再加载 AdSense 脚本。`scripts/ai_daily_news.py` 的新输出进入 `_archive/daily-news/`，不会自动进入博客目录。
- 只有经过人工检查、具有实际内容价值的页面加载 AdSense 脚本。改动代码不会自动触发 AdSense 复审。

## 价格和数据

`model-cost.mjs` 中的公开费率于 **2026-10-17** 对照供应商官方价格页核验。模型价格会变：每次更新预设时，先核对官方来源，更新 `PRICE_REVIEWED`、页面核对日期和相关示例，再运行测试。计算器只覆盖标准文本输入和输出，不包含缓存、批量、工具、税费等项目。

`fish-tracker.js` 记录核心页面访问和少量操作事件。操作事件只包含名称，不包含粘贴的 JSON、提示词或计算结果；`functions/api/stats.js` 将其以 `page_views.type = 'event'` 存储，不计入普通 PV 汇总。

## 上线

仓库 `main` 分支推送后由 Cloudflare Pages 自动部署。上线后检查首页、`/sitemap.xml`、`/ads.txt`、规范网址、旧页 `X-Robots-Tag` 和关键工具流程。Search Console 的收录与 AdSense 的审核状态由 Google 异步更新，不能用部署成功替代实际审核结果。
