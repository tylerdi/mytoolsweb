# 首页布局规范

## 通用规则

### 容器宽度
- 所有 section 统一 `max-width: 1100px`，使用 `.section` class
- 统一 `padding: 80px 24px`（桌面），`50px 16px`（手机），`40px 12px`（小手机）
- **禁止**使用内联 `max-width` 样式，全部走 `.section` class

### 卡片网格
- 桌面（>1024px）：统一 **3 列** — `.card-grid` / `.card-grid-3` / `.card-grid-4` 都是 `grid-template-columns: repeat(3, 1fr)`
- 平板（769-1024px）：**2 列**
- 手机（<768px）：**1 列**
- 2 列卡片用 `.card-grid-2`，桌面 2 列，手机 1 列

### 组件（签到、心情、画图等）
- **禁止**在组件 JS 中设置 `max-width`（如 480px、560px 等）
- 组件宽度 = section 宽度 = 1100px，高度自适应
- 组件内部元素用百分比或 `width: 100%`

### 分隔线
- 使用 `<div class="divider-wrap"><span class="divider-icon">🌊</span></div>`
- 海洋主题 emoji 轮换：🌊🐚🐠🪸🐬
- 居中渐变线 + 浮动 emoji

### Footer
- `text-align: center` + `display: block`
- 内联样式强制居中

## 新增模块检查清单
1. 卡片用 `.feature-card` class，3 列布局
2. 组件不设 `max-width`，撑满 section
3. 手机端 1 列，不溢出
4. section 之间用海洋分隔线
5. 用 `.reveal` class 实现滚动渐入动画
