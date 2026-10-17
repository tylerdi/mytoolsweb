# Tyler 工作台

面向中文 AI 应用开发者的浏览器工具和排错案例。站点使用静态 HTML/CSS/JavaScript，部署在 Cloudflare Pages；少数在线演示和访问统计使用 Pages Functions。

## 核心页面

| 路径 | 用途 |
| --- | --- |
| `/`、`/json-output` | 在浏览器中检查模型输出的 JSON 语法 |
| `/ai-cost` | 用有来源的标准文本费率估算模型 API 费用，也可手动改价 |
| `/agent-lab` | 演示工具调用的参数错误、超时和恢复路径 |
| `/api-diagnostics` | 按状态码、Retry-After 和副作用判断 API 错误的排查顺序 |
| `/tools` | 精简的 JSON、Base64、URL、正则、时间戳、SHA-256 和 UUID 工具 |
| `/schema-check`、`/sse-inspector` | 本地验证字段契约和 SSE 事件完整性 |
| `/http-headers`、`/usage-cost` | 分析 HTTP 响应证据和规范化 CSV 用量费用 |
| `/blog/` | 人工审阅的可复现排错案例 |
| `/about`、`/privacy`、`/contact` | 站点身份、数据处理和反馈渠道 |

## 本地预览与验证

```bash
npm ci
npm run build:labs
npm test
HOST=127.0.0.1 PORT=8788 python3 local_server.py
```

打开 `http://127.0.0.1:8788/`。本地服务器支持 Cloudflare Pages 的无扩展名静态网址。它不是完整的 Pages Functions 环境；需要验证在线 API 时，应使用 Cloudflare 预览部署或线上测试环境。
四个 API 调试页使用仓库内的 `assets/labs/` 打包脚本。修改对应的 `.mjs` 源码后，运行 `npm run build:labs` 并把生成的脚本一起提交；浏览器不会从外部 CDN 加载解析库。
打包脚本会同步生成 `assets/labs/THIRD_PARTY_NOTICES.txt`，保留所用开源解析库的许可声明。

## 内容发布规则

- 公开索引页面应解决一个具体任务，有可复现输入、实际结果、失败边界和相关工具；不要为了数量批量发布泛 AI 文章。
- `sitemap.xml` 只列希望收录的规范网址，地址与页面 `canonical` 一致。Cloudflare Pages 会把 `.html` 路径跳转到无扩展名路径。
- 偏离当前主题的娱乐、聚合新闻、日更图片等旧页面及专用 API 已下线；部分其他历史实验页仍由 `_headers` 标为 `noindex`，不作为当前搜索入口。下线页面对应的数据库记录不会因部署而删除。
- `_routes.json` 只让 `/api/*` 和已下线的旧 URL 进入 Pages Functions。旧页面明确返回 `410 Gone`，避免 Pages 的静态资源缓存短期内继续提供删除前的 HTML。
- 旧自动日报已从公开博客目录下线。`scripts/ai_daily_news.py` 的新输出进入 `_archive/daily-news/`，不会自动进入博客目录。
- 只有经过人工检查、具有实际内容价值的页面加载 AdSense 脚本。改动代码不会自动触发 AdSense 复审。

## 价格和数据

`model-cost.mjs` 中的公开费率于 **2026-10-17** 对照供应商官方价格页核验。模型价格会变：每次更新预设时，先核对官方来源，更新 `PRICE_REVIEWED`、页面核对日期和相关示例，再运行测试。计算器只覆盖标准文本输入和输出，不包含缓存、批量、工具、税费等项目。

`fish-tracker.js` 记录核心页面访问和少量操作事件。操作事件只包含名称，不包含粘贴的 JSON、提示词或计算结果；`functions/api/stats.js` 将其以 `page_views.type = 'event'` 存储，不计入普通 PV 汇总。

## 上线

仓库 `main` 分支推送后由 Cloudflare Pages 自动部署。上线后检查首页、`/sitemap.xml`、`/ads.txt`、规范网址、旧页 `X-Robots-Tag` 和关键工具流程。Search Console 的收录与 AdSense 的审核状态由 Google 异步更新，不能用部署成功替代实际审核结果。
