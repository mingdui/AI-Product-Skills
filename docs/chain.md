# 链路详解

11 个 skill 不是并列清单，是一条链。**衔接靠文件路径，不靠你手工搬运**：每个环节的产物都落在
`docs/prd/<feature-name>/` 下，下一个环节直接读取同一目录。

> 下面每个环节都用 skill 名字做索引，不用编号——编号会随着增删 skill 失效，名字不会。

---

## 全链路

```
入口（三选一，按你手上有什么选）

  product-prd-extract    Word（.docx）PRD → 结构化 prd.md
  requirement-clarify    一句话口头需求 → clarify.md
  context-to-prd         把你跟 AI 聊好的上下文，直接生成 PRD
          │
          ▼
     成文 prd.md
     ├─ 从 requirement-clarify 进来 → 用 prd-write 成文（要复用产品基线时也必须走它）
     └─ 从 context-to-prd 进来     → 它自己就是成文那一步
     ★ prd-write 与 context-to-prd 产出的是同一个 prd.md，二选一，不要连着跑
          │
          ▼
   grill-with-prd ────→ design-spec-prototyper
     prd.md（写回）         prototype.html
                                                   │
                    ┌──────────────────────────────┴──────────┐
                    ▼                                         ▼
        pm-frontend-prototype                        prototype-html
          项目内隔离原型路由                           单文件说明书式原型
                    │                                         │
                    └──────────────┬──────────────────────────┘
                                   ▼
                        交给研发实现
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
| 跟 AI 聊需求已经聊透了，只差成文 | `context-to-prd`（与 `prd-write` **二选一**，别连着跑） |
| 需求清楚，还要复用已有的产品规则 | `prd-write` |
| 已经有一份 PRD，想挑毛病 | `grill-with-prd` |
| 只有 PRD，要出评审原型 | `design-spec-prototyper` |
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
| **产物** | `docs/prd/<feature-name>/prd.md`，**与 `prd-write` 完全同构**（都以 `prd-write/template.md` 的 0–10 节为骨架） |
| **特点** | **不采访用户**——直接综合已掌握的信息成文 |
| **独有产出** | 梳理模块划分与测试范围，写进第 10 节「交接说明」，**不写进第 7 节** |

它与 `prd-write` 写的是**同一个文件**，不要连着跑。分工是：

- 手上只有一段聊透的上下文、不需要对齐已有规范 → `context-to-prd`
- 要复用 `docs/product/` 下的产品体验基线，或要写增量 PRD（复用 / 局部 / 候选 / 偏离四类）→ `prd-write`

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

### acceptance-checklist —— 验收清单

| | |
|---|---|
| **输入** | `prd.md`（必需）+ `prototype.html`（有则读） |
| **产物** | `docs/prd/<feature-name>/acceptance.md` |
| **四个维度** | 核心流程（P0）、边界与异常（P0/P1）、UI 还原度（P1/P2）、数据埋点（P2） |
| **关键规则** | 每条都要有**依据出处**，指回 PRD 的需求编号。没通过时能立刻分清是需求没写清还是实现没做到 |

---

## 支线与替换项

### product-experience-foundation —— 产品体验基线

产出一套版本化的产品规则，放在 `docs/product/<project-name>/`：C 端与 Admin **各自维护**，
只有品牌、领域术语和跨端业务状态进共享层。

**什么时候跑**——遇到任一情况就该用它：

- 首版产品，还没定过任何全局规则；
- 旧项目第一次接进来，现有页面各写各的；
- C 端或 Admin 的导航、术语、页面模式开始不一致；
- 某个模式已反复出现，要从「这个功能这么做」升级成「产品级规则」；
- 你发现「同一个弹窗在三个功能里长得不一样」。

跑过一次之后就不用再管了——`prd-write` 和各原型 skill 都会自动读它。

**权威顺序**（冲突时按这个判）：仓库架构与安全规则 → 已确认的产品体验基线 → 本次已确认的 PRD
→ 当前页面的可见既有模式 → 外部网站与截图。

### web-design-extractor —— 设计规格提取

从 URL 或截图提取 `design.md`，全文用证据标签区分来源：

- `[OBSERVED: URL]` / `[OBSERVED: SCREENSHOT]` —— 直接可见的事实
- `[INFERRED]` —— 合理的重建推断
- `[UNKNOWN]` —— 输入资料无法确立的

**两条路线，叠加不二选一**：机器上有浏览器（项目里的 playwright，或系统的 Chrome / Edge）就走
浏览器路线拿**计算样式**——它是 `[OBSERVED]`，可以直接当复刻约束；没有浏览器时退源码路线，
拿到的值只能算 `[INFERRED]`，且必须在 `design.md` 开头标注「转录边界」。
差别不小：实测同一页，「导航高 `64px`」实为 **76px**，标题字重 **500**（源码里根本看不到）。

**注意**：截图只能推断，不能声称拿到了源码或隐藏 CSS。有产品基线时，外部参考不得静默覆盖你的品牌与导航。

### 两个原型替换项

- **`pm-frontend-prototype`** —— 在**你自己的前端项目**里做隔离的可点击原型路由，复用真实组件和设计变量。
  默认不碰正式业务入口。适合「要给老板演示真实语境」的场景。
- **`prototype-html`** —— 单文件 HTML，左侧界面 + 右侧琥珀色说明区，SVG 连线高亮。
  适合「原型即文档」的评审场合。**第三方作品**，见 [THIRD-PARTY.md](../THIRD-PARTY.md)。

---

## 产物总表

按**阶段**分组，最后另有一项跨功能的产品级基线。
**每组单独看，别横着对账**——任何一次运行都只产出其中一部分，差额不是缺失。

### 需求侧

都在 `docs/prd/<feature-name>/` 下。

| 文件 | 产出者 | 消费者 |
|---|---|---|
| `clarify.md` | `requirement-clarify` | `prd-write`、`context-to-prd` |
| `prd.md` | `product-prd-extract` / `context-to-prd` / `prd-write` | `grill-with-prd`、各原型 skill、`acceptance-checklist` |
| `images/` | `product-prd-extract` | 人（评审） |

> `images/` 只有 Word 路线才有；`clarify.md` 只有走过采访才有。都没走也正常。

### 原型侧

都在 `docs/prd/<feature-name>/` 下。

| 文件 | 产出者 | 消费者 |
|---|---|---|
| `design.md` | `web-design-extractor` 或人工 | `design-spec-prototyper`、`pm-frontend-prototype` |
| `prototype.html` | `design-spec-prototyper`、`prototype-html` | `acceptance-checklist`、人（交给研发） |
| `demo.md` | `pm-frontend-prototype`（可选） | 人（交给研发） |

> **原型有两个互斥的落点，一次只走一条：**
>
> - 要**独立单文件 HTML** → `design-spec-prototyper`，产 `prototype.html`
> - 要**长在你自己的前端项目里** → `pm-frontend-prototype`，原型落在项目源码中，
>   另记一份 `demo.md` 当交接标记（可选）
>
> **走了前一条就不会有 `demo.md`——这不是漏了，是这条路本来就不产它。**
> `design.md` 也可以没有：纯规格驱动或直接用工具产出的 HTML 时，它不一定是必经产物。

### 验收侧

| 文件 | 产出者 | 消费者 |
|---|---|---|
| `docs/prd/<feature-name>/acceptance.md` | `acceptance-checklist` | 人（走查） |

> 要等研发提测之后才写。需求刚理完时它不存在，是对的。

### 产品级（跨功能，不在功能目录下）

| 位置 | 产出者 | 消费者 |
|---|---|---|
| `docs/product/<project-name>/` | `product-experience-foundation` | `prd-write`、各原型 skill |

> 跑一次之后长期复用，不属于任何单个功能——跑过就不必再管。

约定：**目录已存在则复用，同名文件不覆盖**。缺 `prd.md` 时，`acceptance-checklist` 会提示你先补
PRD，而不是凭原型反推需求并当成事实。
