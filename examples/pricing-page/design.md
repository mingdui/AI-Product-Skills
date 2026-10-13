# 设计规格：Stripe 定价页（作为本产品定价页的参考依据）

## 证据

| 来源 | 视口或图片尺寸 | 状态 | 可信度 |
| --- | --- | --- | --- |
| `https://stripe.com/pricing`（HTML 源码，2026-10-13 抓取） | 不适用——走的是源码路线，没有渲染，也就没有视口 | 初始态（服务端渲染返回的 HTML 与内联样式） | 中：令牌值来自页面声明的 CSS，但「哪个令牌用在哪个元素上」多为推断 |

- 证据标签：`[OBSERVED: URL]`、`[OBSERVED: SCREENSHOT]`、`[INFERRED]`、`[UNKNOWN]`
- 提取日期：2026-10-13

> **本次提取是降级运行**，转录边界如下，请连同结论一起看：
> - 有：服务端返回的 HTML 结构、页面声明的 CSS 自定义属性与内联样式规则。
> - 没有：渲染后的计算样式、断点行为、截图、字体文件、交互态的实际表现。
> - 因此**凡是「带单位的精确值 + 归属到具体元素」的组合，一律标 `[INFERRED]`**；
>   只有页面里字面写出来的令牌值才是 `[OBSERVED: URL]`。
>
> 另：本次抓取返回的是**英文 + 港币计价**版本（价格显示 `3.4% + HK$2.35`），
> 说明该站按访问地区本地化内容。本产品本期只做人民币单币种。

---

## 目标

一页讲清「有哪些档、各多少钱、分别含什么、下一步点哪里」。
页面本身不做交易，只负责把价格讲透明并把用户送到下一步。

产品意图部分为 `[INFERRED]`——页面内容能支持这个判断，但官方没有明说。

---

## 产品基线映射

- 基线来源：**无**。本产品尚无 `docs/product/` 目录。
- 可直接复用：无
- 有意偏离：不适用（无基线可偏离）
- 外部证据冲突：**本节最需要说明的一点**——Stripe 的视觉系统（品牌色、字体、圆角体系）
  是**它的**产品资产，不是本产品的规范。本次只沿用它的**信息层级与页面架构**，
  不沿用品牌层。见「重建规则」。
- 待晋升候选：无

---

## 品牌与内容层级

- 产品或品牌：Stripe（支付服务商）
- 受众与界面：`[INFERRED]` 面向开发者与中小企业的决策者；英文界面
- 核心信息：`[OBSERVED: URL]` 页面主标题为 "Pricing built for businesses of all sizes"
- 内容顺序：`[OBSERVED: URL]` 顶栏导航 → 主标题 → 档位卡片（Standard / Custom）→
  "Features available out of the box:" 权益清单 → 按能力分组的可折叠定价区块 →
  "Explore pricing for the full Stripe platform" 完整平台价格
- 语气与调性：`[INFERRED]` 克制、以信息密度取胜；不用夸张促销词，价格与权益平铺直叙

---

## 风格基础

### 排版

| 角色 | 字体家族 | 字号 | 字重 | 行高 | 证据 |
| --- | --- | --- | --- | --- | --- |
| 正文 / 界面 | `Camphor`（自定义字体），回退 `sohne-var` | `var(--fontSize)` | `[UNKNOWN]` | `var(--lineHeight)`，另有 `1.4` / `1.5` | `[OBSERVED: URL]` 字体族与变量名；具体数值 `[UNKNOWN]` |
| 标题 | 同上 | 变量 `--titleFontSize` | `[UNKNOWN]` | 变量 `--titleLineHeight` | `[OBSERVED: URL]` 变量名；数值 `[UNKNOWN]` |
| 代码 / 金额等宽 | `SourceCodePro` | `[UNKNOWN]` | `[UNKNOWN]` | `[UNKNOWN]` | `[OBSERVED: URL]` 字体族名 |
| 小字 | 同上 | `14px` / `15px` / `0.9rem` | `[UNKNOWN]` | `[UNKNOWN]` | `[OBSERVED: URL]` 页面中出现这三档固定值 |

**字体可用性**：`Camphor` 与 `SourceCodePro` 均无法确认授权，**不得下载或假定**。
本产品改用系统字体栈（见「重建规则 · 不可假设」）。

### 颜色、效果与形状

| 令牌或角色 | 值 | 用途 | 证据 |
| --- | --- | --- | --- |
| 品牌强调色 | `#635bff` | 变量 `--buttonColor`，主按钮背景 | `[OBSERVED: URL]` |
| 强调色（次要） | `#96f` | 变量 `--accentColor` | `[OBSERVED: URL]` |
| 深色文本 | `#0a2540` | 变量 `--navColor` / `--linkColor`；另一处声明为 `#061b31` | `[OBSERVED: URL]` |
| 按钮悬停 | `#031323` | 变量 `--buttonHoverColor` | `[OBSERVED: URL]` |
| 导航容器背景 | `#fff` | 变量 `--navContainerBgColor` | `[OBSERVED: URL]` |
| 菜单 / 浅底 | `#eff3f9` | 变量 `--menuBgColor` | `[OBSERVED: URL]` |
| 画布（浅灰） | `#f6f9fc` / `#f6f9fb` | 整页底色与浅色分区 | `[OBSERVED: URL]` |
| 浅紫底 | `#e8e9ff` | 强调区块背景 | `[OBSERVED: URL]` |
| 浅灰（表格） | `rgb(230, 235, 241)` | 对比表分隔或表头 | `[OBSERVED: URL]` |
| 圆角（小） | `4px` / `6px` | 输入框、小卡片 | `[OBSERVED: URL]` |
| 圆角（中） | `8px` | 变量 `--refreshedNavBorderRadius`，导航容器 | `[OBSERVED: URL]` |
| 圆角（大） | `16.5px` | 大卡片 | `[OBSERVED: URL]` |
| 圆角（胶囊） | `99px` | 胶囊按钮 / 标签 | `[OBSERVED: URL]` |
| 阴影（浮起） | `0 20px 60px rgba(50,50,93,.18)` | 主卡片 | `[OBSERVED: URL]` |
| 阴影（次级） | `0 0 60px rgba(50,50,93,.18)` | 浅色区块 | `[OBSERVED: URL]` |
| 阴影（层级） | `rgba(0,0,0,.05) 0 12px 15px, rgba(0,0,0,.05) 0 0 0 1px, rgba(0,0,0,.08) 0 5px 9px` | 弹层/下拉 | `[OBSERVED: URL]` |
| 边框 | `[UNKNOWN]` | 未提取到稳定的边框令牌 | —— |

> **这份规格的视觉层已被批准照搬。** 原稿写的是「只借层级关系、色值一律换成自己的」，
> 后来用户明确要求按参考站做一版忠实的，所以 `prototype.html` **直接使用了下表中的色值、
> 圆角与阴影**。这是一次**已批准的偏离**，不是默认行为——默认行为仍是替换成自己的品牌层。
>
> 唯一没照搬的是**字体**（见「不可假设」）。

### 间距与动效

- 间距节奏：`[OBSERVED: URL]` 页面声明了 `--column-gap:8px`、`--column-gap-inner:25px`，
  可推断为 8 的倍数节奏；`[INFERRED]` 区块间垂直间距在 64–96 px 量级（未取到证据）
- 容器与网格：`[OBSERVED: URL]` `--refreshedNavMaxWidth:1264px`（导航容器最大宽度），
  `--refreshedNavHeight:64px`（导航高度）。正文容器最大宽度 `[UNKNOWN]`
- 动效：`[OBSERVED: URL]` `--siteMenuTransition:250ms`（菜单过渡）。
  其余动效时长与缓动 `[UNKNOWN]`

---

## 布局架构

按可见顺序描述。断点行为全部为 `[UNKNOWN]`——本次没有截图或渲染证据。

| # | 区域 | 目的与可见构成 | 证据 |
| --- | --- | --- | --- |
| 1 | 顶栏导航 | 固定高度 64 px、最大宽度 1264 px、白底、圆角 8 px；主导航项为 Products / Solutions / Developers / Resources / Pricing，右侧 Sign in + Contact sales | `[OBSERVED: URL]` |
| 2 | 主标题区 | 一句主张："Pricing built for businesses of all sizes" | `[OBSERVED: URL]` |
| 3 | 档位卡片区 | 至少两档：**Standard**（含价格 `3.4% + HK$2.35`）与 **Custom**；卡内构成 = 档名 → 价格 → 「Contact sales」类行动按钮 | `[OBSERVED: URL]` |
| 4 | 权益清单 | 标题 "Features available out of the box:"，下挂 8 条能力（Global access / Built-in fraud prevention / Tools to optimise your checkout / Payments optimisations to boost revenue / Embedded payments for platforms & marketplaces / Fast, predictable payouts to your bank accounts / Phone, chat, and email support / Security, reliability and compliance） | `[OBSERVED: URL]` |
| 5 | 分组定价区 | "Standard pricing for all products" 起，按能力分组、**每组可折叠**（页面共 11 处 `aria-expanded`）；组例如 Global payments / Payments / Revenue / Money management；组下条目如 Credit and debit cards、Bank-based and other payment methods、Digital wallets、Disputes | `[OBSERVED: URL]` |
| 6 | 完整平台价格 | "Explore pricing for the full Stripe platform" 区块 | `[OBSERVED: URL]` |
| 7 | 页脚 / 咨询入口 | 反复出现 "Contact sales" | `[OBSERVED: URL]` 存在；结构细节 `[UNKNOWN]` |

**对本产品的映射**（`[INFERRED]`，需产品确认）：

| Stripe 区域 | 本产品对应 |
| --- | --- |
| 顶栏导航 | 本期不做完整站导航，只保留 logo + 「定价」 |
| 档位卡片区 | 3 档：免费 / 专业 / 企业 |
| 权益清单 | 每档卡片内的权益列表 |
| 分组定价区 | 全功能对比表（对应 PRD R2），按能力分组 |
| 完整平台价格 | 不做（本期只有 3 档） |
| 咨询入口 | 企业档的「联系销售」 |

---

## 组件目录

### 档位卡片

- 目的与位置：主区并列排列，用户判断选哪档的主要依据
- 结构：`[OBSERVED: URL]` 档名 → 价格 → 行动按钮；变量 `--cardBackground`、`--cardBorderRadius` 存在
- 变体：`[OBSERVED: URL]` 至少两种——**Standard**（有价格）与 **Custom**（无价格，走销售）
- 令牌：卡片背景取 `--cardBackground`；圆角取 `--cardBorderRadius`（数值 `[UNKNOWN]`，页面另有 16.5px 大圆角）
- 状态：`[UNKNOWN]` 悬停 / 选中 / 当前套餐态均未观察到
- 响应式行为：`[UNKNOWN]`
- 实现规则：同一行内各卡必须等高、行动按钮对齐同一基线；价格字号明显大于档名（`[INFERRED]`）

### 行动按钮

- 目的与位置：卡片内与顶栏各一处
- 结构：`[OBSERVED: URL]` 主按钮背景 `var(--buttonColor)` = `#635bff`，悬停 `var(--buttonHoverColor)`
- 变体：`[OBSERVED: URL]` 至少三种文案——`Start now` / `Get started`（主转化）、`Contact sales`（企业）、`Sign in`（次级）
- 令牌：背景 `--buttonColor`；悬停 `--buttonHoverColor`；另有胶囊圆角 `99px` 出现在页面中
- 状态：`[UNKNOWN]` 焦点态只见到变量 `--focusBoxShadow` 存在，未见其值
- 实现规则：主按钮在每张卡内位置固定；不要把「联系销售」做成与主转化同权重的样式（`[INFERRED]`）

### 分组折叠区块

- 目的与位置：对比表主体，按能力分组
- 结构：`[OBSERVED: URL]` 组标题 + 可展开内容；用 `aria-expanded` 表达展开态（11 处）
- 变体：`[UNKNOWN]`
- 令牌：`[UNKNOWN]`
- 状态：`[OBSERVED: URL]` 展开/收起存在（靠 `aria-expanded` 判定）；键盘行为 `[UNKNOWN]`
- 实现规则：**这一条是本页最值得抄的交互**——长对比表用分组折叠控制首屏高度。
  本产品实现时须用 `<button>` + `aria-expanded`，不要用 `div` + CSS class

### 导航容器

- 结构：`[OBSERVED: URL]` 高 64 px、最大宽 1264 px、白底、圆角 8 px、内边距 6 px、底部圆角 8 px
- 状态：`[OBSERVED: URL]` 存在 `--refreshedMenuShadow` 与 `--hoverTransition`
- 实现规则：本期本产品不做完整站导航，此组件不实现

---

## 行为与无障碍观察

- 已观察到的交互：`[OBSERVED: URL]` 分组区块可折叠（`aria-expanded` × 11）；
  菜单有 250 ms 过渡；页面存在聊天入口按钮
- 键盘与焦点：`[OBSERVED: URL]` 页面声明了 `--focusBoxShadow` 变量，说明有焦点样式；
  实际可见性 `[UNKNOWN]`
- 对比度与可读性：`[INFERRED]` `#0a2540` 文字压在 `#fff` / `#f6f9fc` 上对比度充足；
  白字压在 `#635bff` 上属于常见搭配但**未实测**，实现时须自行验证
- 触控与响应式注意事项：`[UNKNOWN]`

### 一处需要记下的观察（不是结论）

`[OBSERVED: URL]` 这份 HTML 中 `<h1>` 出现得非常频繁——导航项（Payments / Revenue /
Money management…）、权益条目（Global access / Built-in fraud prevention…）
都用了 `<h1>`，而 `<h2>` 只有 4 个、`<h3>` 6 个。

这是一个**观察**。它是否影响该站的 SEO 与读屏体验，本次证据不足以判定，故不下结论。
本产品实现时应当按语义层级使用标题（一页一个 `<h1>`），并在 PRD R5 的验收里检查。

---

## 重建规则

> **前提**：本产品是**参考** Stripe 的信息架构，不是复刻 Stripe。以下「必须」只约束
> 结构与交互，不约束品牌层。

### 必须

- 沿用**信息层级**：主标题 → 档位卡片 → 权益 → 分组对比 → 常见问题 → 行动入口
- 沿用**档位卡片的构成**：档名 → 价格 → 权益 → 行动按钮，且各卡按钮对齐同一基线
- 沿用**分组折叠**这一交互：全功能对比表按能力分组，可折叠
- 企业档必须与另两档在**权重组**上区分开（Stripe 用 Custom 档承载）
- 所有可交互元素用语义元素（`<button>` / `<a>`），带可见焦点态

### 应当

- 用 CSS 自定义属性承载令牌，而不是在组件里散写数值
- 阴影只保留两级，圆角只保留三级（Stripe 的令牌层级值得借，具体值不要借）
- 对比表在窄屏可横向滚动，而不是压缩到不可读

### 不可假设

- **不可沿用 Stripe 的字体**。`Camphor` / `sohne-var` 是需授权的商业字体，
  拿不到授权文件就不可能正确渲染，本产品一律使用系统字体栈。
  （品牌色 `#635bff` 等**已经用户明确批准照搬**，见上；字体这一条没有商量的余地。）
- **不可沿用 Stripe 的 Logo 与文案**。`"Pricing built for businesses of all sizes"` 之类
  一律重写；页面不得让人误以为与 Stripe 有关联。
- 不可沿用 Stripe 的文案（"Pricing built for businesses of all sizes" 等一律重写）
- 不可假定任何断点行为——本次没有截图证据；实现时按保守响应式处理并在交付里标注
- 不可假定 `[UNKNOWN]` 的状态（悬停、选中、空态、错误态）
- 不可假定页面里的 `data-*` 属性结构——那是对方的实现细节，不属于设计规格

---

## 质量门槛

- [x] 每个精确令牌都有 URL 证据来源；无截图，因此**没有**任何「仅截图得到的近似值」
- [ ] 未实现的响应式行为已在交付说明中标为未知
- [ ] 品牌层已确认替换为本产品自己的颜色与字体
- [ ] 焦点、键盘、展开收起已实现或明确标为未知
- [ ] 本次**没有**截图比对能力，交付说明中已声明这一缺口
