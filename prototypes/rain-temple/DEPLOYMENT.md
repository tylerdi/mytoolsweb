# 听雨山寺独立发布

- 正式地址：`https://temple.tylerzhang.xyz/`
- Cloudflare Pages 项目：`rain-temple-tyler`
- 源代码分支：`codex/rain-temple-launch`
- 每日航线继续由 `main` → `mytoolsweb` 项目发布，首页不迁移。

## 构建

从仓库根目录运行 `npm ci`、`npm run build:temple:site`。输出仅为 `prototypes/rain-temple/dist/`，包含四语体验入口与四语关于/隐私/反馈页、静态资源和搜索配置。不会复制旧站的 functions、工具页面或环境变量。

本目录也有独立 package.json / lock，单独运行 `npm ci`、`npm run build` 可得到同一发布包。

## 发布方式

初次通过 Cloudflare 已登录控制台的 Pages Direct Upload 发布。该项目与 Git 没有自动部署连接，推送源码分支本身不会更新山寺。后续可以在控制台创建新部署上传 dist 文件夹/ZIP，或者在本目录（不能在仓库根目录）运行：

```bash
npx wrangler pages deploy dist --project-name rain-temple-tyler
```

命令行需要有效的 Cloudflare 登录。本目录的 wrangler.toml 限定发布目录和项目，且没有 Functions 或服务绑定。

首次上传前，用 ZIP 打包 dist 目录的内容，ZIP 根目录必须直接是 index.html，不能再套一层 dist 文件夹。

## 域名与验证

在新 Pages 项目里添加自定义域名 `temple.tylerzhang.xyz`，由 Cloudflare 创建对应 CNAME。保留现有根域名、www 和其他 API/Tunnel 记录。部署后验证 HTTPS、四语入口、六个互动、关于/隐私/反馈、robots.txt、sitemap.xml、ads.txt，以及原每日航线仍正常。

普通子域名由 AdSense 按根域名管理；这不是一个独立注册域名，也不是另开 AdSense 账号的理由。页面只放所有权标记和 ads.txt，当前没有广告展示脚本。

## 已完成的上线验证（2026-11-11）

Cloudflare 已接收并发布 28 个静态文件，自定义域名显示 Active / SSL enabled。DNS 新增 `CNAME temple → rain-temple-tyler.pages.dev`（Proxied），记录总数由 21 变为 22；根域名与 www 继续指向 mytoolsweb.pages.dev。

已在用户 Chrome 与独立浏览器中打开正式子域名，验证中文/韩文路径、3D 初始化、念珠按钮与计数、正式 canonical、index/follow、独立隐私入口。公开 ads.txt 和 robots.txt 已通过浏览器读取；每日航线原网址仍显示原游戏与教学。主域名 main 分支仍为 91b63a7，山寺源码提交为 0a9fb82。

独立源码分支已推送。本次使用控制台 Direct Upload 部署；后续命令行发布需先恢复有效的 Cloudflare 登录。刚新增域名时，个别网络可能需要等待本地 DNS 缓存更新。

首发 ZIP SHA-256：`1610a3eea41c348570d7db92176ede65cd110e3f0cf7e48d409d652ea7ddef65`。
