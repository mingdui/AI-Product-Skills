# 浏览器路线：拿「计算样式」，不是「源码里声明了什么」

## 为什么需要它

源码里写着 `--refreshedNavHeight:64px`，不代表导航就是 64px；
写着 `font-family: sohne-var`，不代表页面上没有别的 fallback。

实测过一次同一页的两条路线（`https://stripe.com/pricing`）：

| 源码里字面写着 | 浏览器实测 |
| --- | --- |
| 导航高 `64px` | **76px** |
| 导航背景 `#fff` | **`#f6f9fc`** |
| 阴影 `0 20px 60px rgba(50,50,93,.18)` | `rgba(50,50,93,.25) 0 2px 5px -1px, rgba(0,0,0,.3) 0 1px 3px -1px` |
| 品牌色 `#635bff` | 按钮背景 `rgb(99,91,255)` ✅ |
| 正文色（看不到） | `#425466`（用了 1716 次） |
| 标题字重（看不到） | **500**（700 全页只用了 9 次） |

**规律：颜色类基本对，尺寸 / 形态 / 字重类基本错。** 颜色令牌通常一跳到位；
尺寸要走层叠、媒体查询、组件覆盖——**变量声明只是「定义了什么」，不是「用成了什么」**。

结论：**两条路线是叠加关系，不是二选一。**
源码给「定义了哪些令牌、叫什么名字」，浏览器给「哪些真的在用、用成什么样」。

---

## 怎么选路线

按能用的**最强的**引擎依次尝试，别一上来就退源码：

```
① 用户项目里已经有 playwright？
   → 用它。代码最少，而且不让人白装一个浏览器
② 机器上有 Chrome / Edge / Chromium？
   → 用随本 Skill 发的 scripts/browser-extract.mjs（零依赖，Node ≥ 22）
③ 都没有？
   → 退源码路线，并且**必须**在 design.md 开头写「转录边界」，
     在交付说明里讲清缺了什么、怎么补
```

## 怎么跑

```bash
# 项目根用于解析用户的 playwright（有就用，没有就自动退 CDP）
node <this-skill>/scripts/browser-extract.mjs <url> <产物目录> --project <项目根>

# 确定不想用 playwright 时
node <this-skill>/scripts/browser-extract.mjs <url> <产物目录> --no-playwright
```

脚本只在终端回一段摘要——**完整结果写在 JSON 里，别把 JSON 整个读进上下文**。

## 三个产物怎么读

| 文件 | 看什么 |
| --- | --- |
| `computed-<宽>.json` | `tokens.*` 是**按出现频次排序**的计算样式；`headings` / `buttons` 是真实规格 |
| `breakpoints.json` | 375 / 768 / 1024 / 1440 四档的导航高、带框区块数、页高、是否横向溢出 |
| `shot-<宽>.png` | 视觉证据。**只有它能回答「谁更抢眼」** |

写进 `design.md` 时，这些值的证据等级是 `[OBSERVED: URL]`——**计算样式就是已观察的事实**，
可以直接当复刻约束用（这一点和源码路线不同，源码路线拿到的是 `[INFERRED]`）。

## 坑

### 1. 频次高 ≠ 重要

`0px` 圆角出现 3495 次是最多的，但那是「没设圆角」，不是设计决策。
**频次用来排除噪音，不用来定主次。** 定主次靠 `headings` / `buttons` 里的结构化字段，
以及截图。

### 2. Chrome ≥ 136 必须给临时 profile

从 136 版起，Chrome 禁止在**默认 profile** 上开 `--remote-debugging-port`。
脚本已经用 `mkdtempSync` 建临时目录了——**这不是可选项**，换成默认 profile 会直接起不来。

顺带一个好处：临时 profile 是干净的，看不到用户的 cookie、书签、登录态。

### 3. Node < 22 跑不了 CDP 路线

CDP 路线要内置 `WebSocket`（Node 22 才稳定）。脚本会检查并给出明确报错，
不会静默失败。这条不通就走 Playwright，再不通就退源码。

### 4. 别用 `--window-size` 截窄屏

Chrome 无头模式在 Windows 上有 **500px 最小窗口宽度**。`--window-size=375` 不会报错，
但页面按 500px 排版、图裁到 375px——**看着像页面溢出了，其实是截图假象**。

本脚本用 CDP 的 `Emulation.setDeviceMetricsOverride` 设视口，不走窗口尺寸，所以没这个问题。
但如果有人手动用 `chrome --screenshot --window-size=375` 排查，记得这条。

### 5. 计算样式会丢掉令牌的名字

它只给 `rgb(99,91,255)`，给不了 `--buttonColor`。而「这个颜色是干嘛用的」恰恰是令牌最有价值的部分。
**所以源码路线的产出不能丢**——两条都要。

同样，源码里定义了但本页没用到的令牌（例如 `--accentColor`），计算样式里根本不会出现。

## 采集字段清单

脚本已经在采这些，改脚本时别删：

| 字段 | 为什么 |
| --- | --- |
| `fontFamily` / `fontSize` / `fontWeight` / `lineHeight` / `letterSpacing` | 排版体系。**字重和字距是源码路线完全拿不到的两项** |
| `color` / `backgroundColor` | 文字与表面层级 |
| `borderRadius` / `boxShadow` | 形状与层级 |
| `padding` / `gap` | 间距节奏 |
| `headings[]` | 每个标题的实际字号/字重/行高/颜色——**这才是标题层级，源码里的 `var(--titleFontSize)` 不是** |
| `buttons[]` | 高度、圆角、padding、前景背景——按钮形态全在这里 |
| `sections[]` | 分区顺序、背景、宽高 |
| `nav` | 导航实际高度与背景色 |
| `breakpoints` | 四档视口实测 |
