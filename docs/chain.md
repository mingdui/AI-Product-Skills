# 链路详解

12 个 skill 不是并列清单，是一条链。**衔接靠文件路径，不靠你手工搬运**：每个环节的产物都落在
`docs/prd/<feature-name>/` 下，下一个环节直接读取同一目录。

> 下面每个环节都用 skill 名字做索引，不用编号——编号会随着增删 skill 失效，名字不会。

---

## 全链路

```
入口（三选一，按你手上有什么选）

  product-prd-extract    Word（.docx）PRD → 结构化 prd.md
  requirement-clarify    一句话口头需求 → clarify.md
  context-to-prd         已经聊清楚了 → 直接成文
          │
          ▼
   prd-write ────→ grill-with-prd ────→ design-spec-prototyper
     prd.md            prd.md（写回）         prototype.html
                                                   │
                    ┌──────────────────────────────┴──────────┐
                    ▼                                         ▼
        pm-frontend-prototype                        prototype-html
          项目内隔离原型路由                           单文件说明书式原型
                    │                                         │
                    └──────────────┬──────────────────────────┘
                                   ▼
                      prototype-to-product
                        生产代码 / 工程交接 + delivery.md
                                   │
                                   ▼
                      acceptance-checklist
                        acceptance.md
```

支线（按需插入，被 `prd-write` 和各原型 skill 读取）：

```
product-experience-foundation   沉淀产品级体验基线 → docs/product/<project-name>/
web-design-extractor            URL / 截图 → design.md，喂给 design-spec-prototyper
```

## 我该从哪一步进

| 你手上有什么 | 从哪进 |
|---|---|
| 需求来源方给了一份 Word | `product-prd-extract`（首次使用会自动装好依赖；装不上就改为粘贴文本） |
| 只有一句口头需求 | `requirement-clarify` |
| 已经聊清楚了，代码库也摸过 | `context-to-prd` |
| 需求清楚，还要复用已有的产品规则 | `prd-write` |
| 已经有一份 PRD，想挑毛病 | `grill-with-prd` |
| 只有 PRD，要出评审原型 | `design-spec-prototyper` |
| 原型已确认，要交给研发 | `prototype-to-product` |
| 研发提测了，要走查 | `acceptance-checklist` |

---

## 入口

### product-prd-extract —— Word PRD 结构化

| | |
|---|---|
| **输入** | `.docx` 文件路径，或粘贴的 PRD 文本 |
| **产物** | `docs/prd/<feature-name>/prd.md`（8 个维度 + 待确认事项）+ 自包含的 `images/` |
| **依赖** | **本仓库唯一需要运行环境的 skill**：解析 `.docx` 需 Node ≥ 20。**首次使用时 agent 会自己查环境、自己装依赖**；装不上会给平台安装指引 + 退路（粘贴文本） |
| **关键机制** | 保真度校验——对图片/表格/文本提取率打分，**低于 70 分或有硬门槛告警就停下来请人介入**，不允许「凑合着用」 |
| **底线** | 只做转换，不发明需求。原文没写的一律标 `[UNKNOWN]` |

中间产物落 `.claude/context/`，最终 PRD 必须**自包含**（图片复制进来、引用改成 `./images/xxx`），
不能指向中间目录。

### requirement-clarify —— 需求澄清

| | |
|---|---|
| **输入** | 需求来源方的原话 / 聊天记录；代码库与已有 PRD |
| **产物** | `docs/prd/<feature-name>/clarify.md` |
| **关键机制** | 一次只问一个问题；每个问题给出推测的默认答案让用户确认；**必须追问「明确不做」** |
| **为什么重要** | 需求不完整时 AI 不会停下来问，它会自己补全。缺口必须在这里问出来 |

### context-to-prd —— 上下文成文

| | |
|---|---|
| **输入** | 当前对话上下文 + 代码库现状 |
| **产物** | `docs/prd/<feature-name>/prd.md` |
| **特点** | **不采访用户**——直接综合已掌握的信息成文 |

---

## 主链

### prd-write —— 写 / 维护 PRD

| | |
|---|---|
| **输入** | 上游入口的产物；`docs/product/` 下的体验基线 |
| **产物** | `docs/prd/<feature-name>/prd.md`（以 `template.md` 为骨架） |
| **两种模式** | **完整模式**（首版 / 重大模块）、**增量模式**（默认，只写本次变化） |
| **关键规则** | 增量 PRD 必须写清四类：复用基线、功能局部、候选晋升、有意偏离。不重复抄写全局规则，用链接代替 |

### grill-with-prd —— 压测

| | |
|---|---|
| **输入** | 已成文的 `prd.md` |
| **产物** | **写回 `prd.md`**（不产生新文件） |
| **关键机制** | 对抗式：扮演挑剔的工程师逐条质疑。一次一个问题，答完**立刻**写回文件 |

与 `requirement-clarify` 的分工：后者在成文**之前**建设式补齐，本步在成文**之后**对抗式挑错，不重复。

### design-spec-prototyper —— 独立原型

| | |
|---|---|
| **输入** | `design.md`（必需）、`prd.md`、产品体验基线 |
| **产物** | `docs/prd/<feature-name>/prototype.html` |
| **特点** | 独立单文件，不依赖后端，可直接发给别人点 |
| **字体** | 默认 `google`（在线独立原型）；离线用 `local` / `system` |
| **可选增强** | 规格不完整时可用 `ui-ux-pro-max` 检索设计系统（见 [installation](installation.md)） |

### prototype-to-product —— 原型交付与产品化

| | |
|---|---|
| **输入** | 同目录下已有的 `prd.md`、`design.md`、`prototype.html`、`demo.md`；仓库的 `AGENTS.md`、工程规范、脚本与现有组件架构 |
| **产物** | `direct` 路径：按项目既有架构实现的正式路由、组件、数据、权限、状态与测试。治理路径：项目要求的交接工件 + `docs/prd/<feature-name>/delivery.md` |
| **路由** | 默认 `delivery_mode: auto`——先读项目规则和已配置工具再决定。**涉及 API 契约、数据模型/迁移、权限、跨模块流程、多人并行或高风险发布时，不默认选 `direct`** |
| **可能的路径** | `direct` / `openspec` / `superpowers` / 项目自定义流程。工具选择不明确时会停下来问，不凭名字猜命令 |
| **不做什么** | 不把原型 HTML 当作生产架构；不复制 CDN 脚本、重置样式、临时 mock、重复组件或另一套框架；不虚构后端 API、认证、支付、分析或第三方集成 |

冲突时的权威顺序：仓库 `AGENTS.md` 与安全约定 → 现有应用架构与共享组件 → 已确认的产品体验基线
→ 已确认的产品需求 → 原型与设计规格（只用于视觉契约）。

### acceptance-checklist —— 验收清单

| | |
|---|---|
| **输入** | `prd.md`（必需）+ `delivery.md` / `prototype.html` |
| **产物** | `docs/prd/<feature-name>/acceptance.md` |
| **四个维度** | 核心流程（P0）、边界与异常（P0/P1）、UI 还原度（P1/P2）、数据埋点（P2） |
| **关键规则** | 每条都要有**依据出处**，指回 PRD 的需求编号。没通过时能立刻分清是需求没写清还是实现没做到 |

---

## 支线与替换项

### product-experience-foundation —— 产品体验基线

产出一套版本化的产品规则，放在 `docs/product/<project-name>/`：C 端与 Admin **各自维护**，
只有品牌、领域术语和跨端业务状态进共享层。

**什么时候跑**：首版需求、旧项目首次接入、或者你发现「同一个弹窗在三个功能里长得不一样」。
跑过一次之后，`prd-write` 和各原型 skill 都会自动读它。

**权威顺序**（冲突时按这个判）：仓库架构与安全规则 → 已确认的产品体验基线 → 本次已确认的 PRD
→ 当前页面的可见既有模式 → 外部网站与截图。

### web-design-extractor —— 设计规格提取

从 URL 或截图提取 `design.md`，全文用证据标签区分来源：

- `[OBSERVED: URL]` / `[OBSERVED: SCREENSHOT]` —— 直接可见的事实
- `[INFERRED]` —— 合理的重建推断
- `[UNKNOWN]` —— 输入资料无法确立的

**注意**：截图只能推断，不能声称拿到了源码或隐藏 CSS。有产品基线时，外部参考不得静默覆盖你的品牌与导航。

### 两个原型替换项

- **`pm-frontend-prototype`** —— 在**你自己的前端项目**里做隔离的可点击原型路由，复用真实组件和设计变量。
  默认不碰正式业务入口。适合「要给老板演示真实语境」的场景。
- **`prototype-html`** —— 单文件 HTML，左侧界面 + 右侧琥珀色说明区，SVG 连线高亮。
  适合「原型即文档」的评审场合。**第三方作品**，见 [THIRD-PARTY.md](../THIRD-PARTY.md)。

---

## 产物总表

| 文件 | 产出者 | 消费者 |
|---|---|---|
| `docs/prd/<f>/prd.md` | `product-prd-extract` / `context-to-prd` / `prd-write` | `grill-with-prd`、各原型 skill、`prototype-to-product`、`acceptance-checklist` |
| `docs/prd/<f>/clarify.md` | `requirement-clarify` | `prd-write`、`context-to-prd` |
| `docs/prd/<f>/design.md` | `web-design-extractor` 或人工 | `design-spec-prototyper` |
| `docs/prd/<f>/prototype.html` | `design-spec-prototyper`、`prototype-html` | `prototype-to-product`、`acceptance-checklist` |
| `docs/prd/<f>/demo.md` | `pm-frontend-prototype` | `prototype-to-product` |
| `docs/prd/<f>/delivery.md` | `prototype-to-product` | `acceptance-checklist` |
| `docs/prd/<f>/acceptance.md` | `acceptance-checklist` | 人（走查） |
| `docs/prd/<f>/images/` | `product-prd-extract` | 人（评审） |
| `docs/product/<p>/` | `product-experience-foundation` | `prd-write`、各原型 skill、`prototype-to-product` |

约定：**目录已存在则复用，同名文件不覆盖**。缺 `prd.md` 时，`prototype-to-product` 和
`acceptance-checklist` 会提示你先补 PRD，而不是凭原型反推需求并当成事实。
