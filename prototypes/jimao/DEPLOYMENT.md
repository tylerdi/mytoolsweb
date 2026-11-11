# 几猫：港区突围

正式域名： https://jimao.tylerzhang.xyz
Cloudflare Pages 项目： jimao-tyler
源码分支： codex/jimao-launch

## 构建与发布

仓库根目录 `npm ci`，`npm run build:jimao`。仅发布本目录 dist 的内容。

独立站包含中英文首页、游戏、指南、地图、关于、隐私、反馈、更新记录和 ads.txt。不复制旧站的 functions、环境变量或个人文件。原型快照 source.html 是构建输入，不对外发布。

Cloudflare Pages 使用 Direct Upload，与 Git 没有自动部署连接。控制台上传 dist 内容的 ZIP（根目录应直接有 index.html）；或者从本目录执行 `npx wrangler pages deploy dist --project-name jimao-tyler`，需有效 CLI 登录。不能从仓库根目录发布，以免携带旧站 Functions。

_worker.js 是仅处理 /api/* 的独立 Pages Worker，其他请求直接由静态资源服务。D1 绑定变量 DB 指向新建的 jimao-metrics 数据库，UUID ece52659-8473-4585-ab93-d3f47d7b6d57。仅存 day/event/difficulty/n 四列，初次请求自动建表，原子累加。

公开汇总入口 `/api/stats` 仅返回最近 7 个 UTC 日期的事件次数，不是独立人数，包含测试和重复游玩。DNT、GPC 和隐私页的本机关闭选项生效。没有账号、访客 ID、IP 存储或广告展示脚本。

## 维护

`core.mjs` 定义难度与成绩文案；`runtime.mjs` 接入教学、难度、分享、成绩与汇总事件；`en.json` 翻译原型游戏菜单、提示和场景标牌；`content.mjs` 定义双语网站正文；`build.mjs` 根据严格锚点接入原型，锚点变化时构建会失败。

若拿到新的原型，应先核对来源和功能差异，再更新 source.html、锚点和测试，不要直接覆盖线上文件。不要把“3A 大作”等未经支持的宣传恢复到正式网站。

## 验证

`npm test` 验证本站及现有产品回归；`node --test tests/jimao.test.mjs` 验证递进难度、分享文案、SQLite 真实计数、输入限制和双语构建隔离。

浏览器检查包括英文三步教学（移动、开火、换弹）、正式任务、暂停、画质、语言入口、手机布局、分享和隐私选项。完整地图通关与多设备性能仍应持续收集真实玩家反馈。

AdSense 发布商为 pub-6426056111301969。ads.txt 是授权文件，不代表网站已获批；本站暂未加载广告展示脚本。

## 2026-11-11 上线记录

Cloudflare 已接收 35 个文件并成功发布，完成第二次部署以应用 DB 绑定。自定义域名状态为 Active / SSL enabled，新增 CNAME jimao → jimao-tyler.pages.dev。原有两个网站与 API 域名未改动。

正式域名的中英文首页与 ads.txt 已通过浏览器读取，/api/stats 已返回 D1 中的 load/start 汇总事件；这些数据包含上线检查，不能当作真实独立访客。发布包 SHA-256 为 3be4c2f29bdf010b4e367820f1d2d9e8e6089dbf0bc7073215b8e98b96d447d2。

当前本机 Node 22.22.3；计数测试用 node:sqlite（Node 22+）运行真实 SQLite 语句。较旧的本地 Workers 二进制测试时使用 --compatibility-date 2026-05-01，Cloudflare 正式项目使用控制台兼容日期 2026-11-11。

上线检查中发现系统分享反馈不稳定，改为先展示可复制文案的站内分享框，系统分享为可选按钮。最终覆盖部署使用上述更新后的发布包。
