# Tyler 表格修复台

面向遇到 CSV 导入问题的中文用户。首页是浏览器本地工作台：检查编码、列数、空行、前导零、长数字、日期样式和公式样式值；用户可以选择去首尾空格、移除空行、按列精确去重，并预览、下载 CSV 与审计记录。所有“已修复”结论都要能由样例文件和测试复现。

## 公开页面

| 路径 | 用途 |
| --- | --- |
| `/` | CSV 体检、处理与下载 |
| `/blog/` | 案例目录与可下载样例 |
| `/blog/csv-encoding` | UTF-8、BOM、GB18030 与 Excel 导入 |
| `/blog/csv-leading-zeros` | 前导零、长数字与不可逆损失 |
| `/blog/csv-duplicates` | 完全重复、同键冲突和空键 |
| `/blog/csv-quotes` | CSV 引号、字段内换行与列数错误 |
| `/about`、`/privacy`、`/contact` | 维护者、数据处理和反馈 |

测试样例位于 `samples/`，与文章和自动测试使用相同数据。旧 AI API 工具和泛主题文章的源文件保留在仓库中，公开网址由 Pages Functions 返回 `410 Gone`。旧数据库记录不会因本次部署自动删除。

## 本地开发

```bash
npm ci
npm run build:csv
npm test
HOST=127.0.0.1 PORT=8788 python3 local_server.py
```

打开 `http://127.0.0.1:8788/`。`csv-lab.mjs` 是浏览器 UI 源码，`csv-core.mjs` 是可测试的处理规则；修改后执行 `npm run build:csv`，提交生成的 `assets/csv-lab.js`。本地 Python 服务器支持无扩展名静态路由，但不模拟 Cloudflare Pages Functions；旧网址的 410 行为需在 Wrangler 或部署预览环境验证。

## 数据边界

- CSV 文件在当前浏览器内读取，首页不加载广告和访问统计脚本；页面资源请求仍会到达托管服务。
- 自动识别编码不保证正确。UTF-8 失败才尝试 GB18030，用户必须核对预览。
- 前导零、长数字和日期样式仅提示；CSV 输出保留文本，但 Excel 直接打开仍可能转换。请用“数据 → 从文本/CSV”导入并选择文本列。
- 只自动删除同键且整行完全一致的记录；同键但内容不同会保留并标记。空键不去重。解析错误或列数不齐时阻断导出。
- 导出时给公式样式值加单引号前缀以降低公式执行风险；不同表格软件的行为仍需人工核对。

## 发布

`main` 推送后由 Cloudflare Pages 自动部署。上线后检查首页、四篇案例、样例文件、`sitemap.xml`、`ads.txt`、旧页 410 和关键处理流程。AdSense 审核结果由 Google 决定；改版和工具测试不能替代审核。
