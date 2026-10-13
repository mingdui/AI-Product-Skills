# 一次完整的真实运行

- 运行日期：2026-10-13
- 演示题材：给一个 SaaS 产品做**定价页**，参考 Stripe
- 产物：[`examples/pricing-page/`](../examples/pricing-page/)
- 想直接看结果：用浏览器打开 [`examples/pricing-page/prototype.html`](../examples/pricing-page/prototype.html)

> 产物里的价格与权益是**占位数据**。

---

## 一、跑了哪五个步骤

| # | 命令 | 产物 |
| --- | --- | --- |
| 1 | `/requirement-clarify pricing-page` | `clarify.md` |
| 2 | `/prd-write pricing-page` | `prd.md` |
| 3 | `/grill-with-prd pricing-page` | 写回 `prd.md` |
| 4 | `/web-design-extractor https://stripe.com/pricing` | `design.md` |
| 5 | `/design-spec-prototyper pricing-page` | `prototype.html` |

五个步骤、四个产物，全部落在同一个目录 `docs/prd/pricing-page/`，没有一次手工拷贝。

---

## 二、每一步的输入与产物

### 1. `/requirement-clarify pricing-page`

**输入**（一句话）：

> 竞品都有定价页，我们没有。用户问价格只能找销售，转化太低。做个定价页，参考 Stripe 那种，这个月底上线。

**产物**：`clarify.md` —— 目标角色 / 触发场景 / 范围 / 明确不做 / 已知约束。

- 「明确不做」排除了：在线支付、优惠券、年付切换、多币种、后台配置界面
- 留下 3 条 `[UNKNOWN]`，各带归属人：套餐价格与权益（运营）、企业档口径（需求方）、降级入口（需求方）

### 2. `/prd-write pricing-page`

**输入**：`clarify.md`；`docs/product/`（不存在 → 记「无产品基线」）

**产物**：`prd.md`，`full` 完整模式，0–10 节。

### 3. `/grill-with-prd pricing-page`

**输入**：`prd.md`　**产物**：写回 `prd.md`（不产生新文件）

逐条质疑后改掉 5 处：

| 质疑 | 改动 |
| --- | --- |
| §8 说「无后端接口」，§7 却要求「已登录用户看到自己当前的档位」 | 删掉该条，整段移入范围外 |
| §3 说用户从搜索引擎、社交分享进来，范围里没有 SEO 与分享预览 | 新增 R5：收录 + Open Graph 预览 + 禁 JS 仍可读 |
| §6 要测「定价页 → 注册」转化率，§7 没有任何埋点要求 | 新增 R6：曝光 / CTA / 分组展开 / FAQ 展开 |
| §9 说企业档口径未定，§7 已写「每档含价格」 | R1 验收补一条：三档口径必须统一 |
| 验收标准只有正常流程 | 补通用验收：键盘可达 + 焦点可见 + 纯静态无加载/错误态 |

### 4. `/web-design-extractor https://stripe.com/pricing`

**输入**：参考站 URL　**产物**：`design.md`

本次没有浏览器控制能力，只能读服务端返回的 HTML 和其中声明的 CSS，按降级路径处理：
`design.md` 开头写明「转录边界」，令牌值记 `[OBSERVED: URL]`，令牌归属记 `[INFERRED]`，
断点与交互态记 `[UNKNOWN]`。

提取到的令牌（部分）：`#635bff`、`#0a2540`、圆角 `4 / 6 / 8 / 16.5 / 99px`、
阴影 `0 20px 60px rgba(50,50,93,.18)`、导航容器高 64px 最大宽 1264px。

沿用的是信息层级，以及「按能力分组、可折叠」这条交互；品牌色与字体在 `design.md` 里写明不沿用。

### 5. `/design-spec-prototyper pricing-page`

**输入**：`design.md` + `prd.md`　**产物**：`prototype.html`（单文件，26 KB，零外部依赖）

| PRD | 在原型里 |
| --- | --- |
| R1 浏览套餐与价格 | 三档卡片，主推档加标签与描边，三卡按钮对齐同一基线 |
| R2 全功能对比 | 4 个按能力分组的折叠区块，取值写「有 / 无 / 数值」而不是留空 |
| R3 行动按钮 | 三档 CTA 各异；未登录点专业档先跳登录 |
| R4 常见问题 | 4 条 `<details>`，原生可键盘操作、展开态对读屏可见 |
| R5 收录与分享预览 | title / description / Open Graph / Twitter Card；禁 JS 时正文全在 |
| R6 关键动作埋点 | `track()` 桩函数，包在 `try/catch` 里，失败不阻塞跳转 |

字体来源：`system`——参考站的字体不可沿用，本页是中文内容且要求离线可读。

---

## 三、产物

```text
examples/pricing-page/
├── clarify.md       2.8 KB
├── prd.md           9.5 KB
├── design.md       13.6 KB
└── prototype.html  26 KB
```

---

## 四、验证

| 检查 | 结果 |
| --- | --- |
| 静态 | 乱码 0 处；12 个 id 无重复；4 个 `aria-controls` 全部命中；标签全部闭合 |
| 标题层级 | 整页只有 1 个 `<h1>` |
| 渲染 | Chrome headless 截图，1440 / 1024 / 375 三个视口 |
| 交互 | 4 个分组折叠成功、FAQ 可展开、埋点队列记到 5 条 |
| 几何 | 三张卡片 `top` 相等；`scrollWidth == clientWidth`，无横向溢出 |

**没验到的**：

- 真人键盘 / 读屏实测——只验了 DOM 属性与程序化 click，没按 Tab 走一遍
- 只测了 Chrome，没测 Safari / Firefox
- 企业档「按需报价」与另两档价格在视觉权重上偏接近
- 窄屏下对比表默认只露出第一列，要横滑才能看到后两档
