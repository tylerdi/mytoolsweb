# 三分钟谜题社

两款中文短游戏，各六道原创题。单题有独立地址，答案与进度存储在当前浏览器。

在仓库根目录运行：

```sh
python3 -m http.server 4187 --bind 127.0.0.1 --directory puzzle-club/public
```

访问 http://127.0.0.1:4187/ 。静态发布目录是 `puzzle-club/public`，首屏和题面可以直接从 HTML 读取。生成后的网页和图片已经纳入版本管理，运行预览无需安装 Node 依赖。

题面在 `src/puzzles.mjs`。编辑后执行 `node puzzle-club/scripts/build.mjs`。六组原创数字静物图由 `scripts/illustrate.py` 绘制，安装 Pillow 后可以复现。每题先后展示原图的两块同中心裁切，答案页展示完整插画。
