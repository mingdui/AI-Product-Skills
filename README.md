# AI-Product-Skills

面向产品经理的 AI 工作流：把「一句话需求」到「可验收的交付」串成一条链。

[English](README.en.md) · [安装说明](docs/installation.md) · [链路详解](docs/chain.md) · [第三方声明](THIRD-PARTY.md)

---

## 这是什么

12 个 skill，覆盖从「拿到需求」到「交付验收」的整条路径。

每个 skill 只做一件事，产物统一落在 `docs/prd/<feature-name>/` 下，下一个环节直接读取同一目录——不用手工搬运，也不用在几个工具之间复制粘贴。

装完之后，在对话里说一句「帮我梳理这个需求」，agent 会自己挑对应的 skill。

## 两条链路

### 一、完整 PRD 生成

从「需求还没成形」到「一份经得起追问的 PRD」：

```
product-prd-extract   Word（.docx）PRD → 结构化 prd.md   ┐
requirement-clarify   一句话口头需求 → clarify.md         ├ 入口三选一
context-to-prd        已经聊清楚了 → 直接成文             ┘
        ↓
   prd-write          复用产品基线，写 / 改 prd.md
        ↓
  grill-with-prd      扮演挑剔的工程师逐条压测，结论立刻写回原文
```

`product-experience-foundation` 按需插入：首版产品、旧项目首次接入，或你发现「同一个弹窗在三个功能里
长得不一样」时，先把 C 端 / Admin 的产品级规则沉淀下来。跑过一次之后 `prd-write` 会自动读它，
功能 PRD 就不用每次重讲一遍全局规则。

### 二、高保真原型生成

有两条路子，**区别只在「设计从哪来」**，后半段是同一条。

#### 2.1 带参考网站

拿一个竞品站或参考站当设计依据：

```
URL / 截图 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper ──→ prototype.html
              区分「看到的」和「推断的」   设计规格      以规格为唯一视觉事实源      可点击、可评审
```

想让它直接长在**你自己的前端项目**里（复用真实组件和设计变量，与正式入口隔离），把最后一步换成
`pm-frontend-prototype`。

#### 2.2 AI 设计

先用 AI 设计工具出稿——Figma Make、Google Stitch、Open Design、OpenAI Image2，或配套的
`ui-ux-pro-max`——**拿到设计稿后同样从 `web-design-extractor` 进**：

```
AI 设计工具 ──→ 设计稿 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper
                                                                        ↓
                                                                  prototype.html
```

两条路子的**产出格式完全一样**，所以评审会上拿出来的东西也是一样的。区别只是「视觉事实」的来源：
一条来自真实站点，一条来自 AI 生成的设计稿。

> 想要「界面 + 说明」左右分栏、带连线高亮的单文件原型（适合原型即文档的评审场合），
> 用第三方收录的 `prototype-html`。

### 原型确认之后

```
prototype-to-product   判断交付路径（直接实现 / OpenSpec / Superpowers / 项目流程），
                       按项目既有架构实现生产代码，或产出正式的工程交接工件
        ↓
acceptance-checklist   生成提测后 / 上线前能逐条走查的验收清单，每条指回 PRD 的需求编号
```

## 全部 12 个 skill

| Skill | 干什么 |
|---|---|
| `product-prd-extract` | 把 Word（`.docx`）PRD 转成结构化 markdown，缺失信息标 `[UNKNOWN]`。**本仓库唯一需要 Node ≥ 20 的 skill**——首次使用时 agent 会自己查环境、自己装依赖，装不上给你安装指引和退路 |
| `requirement-clarify` | 写 PRD **之前**的采访：一次问一个问题，把「明确不做」这类边界问出来 |
| `context-to-prd` | 上下文和代码库已经够清楚时，直接固化成 PRD，不再反问 |
| `prd-write` | 写 / 改 PRD，复用已确认的体验规则，只记新增、偏离、候选和待决问题 |
| `grill-with-prd` | PRD **成文之后**让 AI 扮演挑剔的工程师，逐条压测，结论立刻写回文件 |
| `design-spec-prototyper` | 把 `design.md` 变成可点击、可评审的独立 `prototype.html` |
| `prototype-to-product` | 判断交付路径（direct / OpenSpec / Superpowers / 项目流程），按项目既有架构实现生产代码，或生成正式的工程交接工件 |
| `acceptance-checklist` | 生成提测后 / 上线前能逐条走查的验收清单，每条都指回 PRD 的需求编号 |
| `product-experience-foundation` | 建立 C 端 / Admin 各自的产品体验基线，避免每个功能各定义一套 |
| `web-design-extractor` | 从 URL 或截图提取 `design.md`，区分「看到的」和「推断的」 |
| `pm-frontend-prototype` | 在已有前端项目里做隔离的可点击原型，复用真实组件和设计变量 |
| `prototype-html` | 单文件 HTML，左侧界面 + 右侧说明带连线高亮（第三方，见 [THIRD-PARTY](THIRD-PARTY.md)） |

## 安装

三种方式，任选一种。详见 [docs/installation.md](docs/installation.md)。

**方式一：Claude Code 插件市场**

```bash
/plugin marketplace add mingdui/AI-Product-Skills
/plugin install ai-product-skills
```

**方式二：npx skills**

```bash
npx skills add mingdui/AI-Product-Skills
```

**方式三：手动拷贝**

把 `skills/` 下的目录拷进你项目或 agent 的 skills 目录即可。**12 个里有 11 个是自包含的 Markdown**——无依赖、无脚本、无常驻进程。

唯一的例外是 `product-prd-extract`：解析 `.docx` 需要一个 Node 脚本（Node ≥ 20）。**这件事不用你操心**——第一次用它时，agent 会自己检查环境、自己装依赖；装不上会给你对应平台的安装命令，并同时给出退路（把 Word 内容粘贴过来，流程完全一样）。

## 配套推荐：ui-ux-pro-max

`design-spec-prototyper` 在**设计规格不完整**时可以借助设计系统检索补齐。想用这个能力的话，建议一起装：

```bash
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max
```

它是独立项目（MIT 授权），自带 79 种 UI 风格、192 套配色推理规则、74 组字体搭配、22 个技术栈的落地指南。项目地址：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)。

**不装也完全不影响使用。** 本仓库的核心链路不依赖任何外部工具：没装时 `design-spec-prototyper` 会依据你的产品体验基线判断，并要求在交付说明里标注哪些决定缺少依据。

## 怎么用

装好后用斜杠命令直接调，**从哪一步进都行**：

```
/requirement-clarify user-bulk-import   → docs/prd/user-bulk-import/clarify.md
/prd-write                              → docs/prd/user-bulk-import/prd.md
/grill-with-prd                         → 逐条压测，结论写回 prd.md
/design-spec-prototyper                 → docs/prd/user-bulk-import/prototype.html
/prototype-to-product                   → docs/prd/user-bulk-import/delivery.md
/acceptance-checklist                   → docs/prd/user-bulk-import/acceptance.md
```

`<feature-name>` 一律用**小写英文短横线**（`user-bulk-import`）——它会变成目录名，不要用中文。

每一步都直接读上一步留在同一目录里的产物，你不用手工搬运任何东西。

## 不适用什么

- **不是设计工具**。它不替代 Figma、Axure；`prototype-html` 和 `design-spec-prototyper` 产出的是**评审用的 HTML**，不是设计源文件。
- **`prototype-to-product` 会写生产代码**——但只在它判定为 `direct`（改动局部、低风险、现有组件与路由能覆盖）时，且必须适配你仓库既有的框架、路由和组件，而不是照搬原型的 CDN 和临时 mock。涉及 API 契约、数据模型、权限或跨模块流程时，它会转交给你项目采用的 OpenSpec、Superpowers 或等价工程流程，**不绕过治理流程直接改业务代码**。
- **`pm-frontend-prototype` 不碰正式业务入口**：它只在你的项目里新增隔离的原型路由。
- **不做自动化测试**。`acceptance-checklist` 产出的是**产品验收清单**（用户可感知的结果），不是测试用例（实现分支覆盖）。
- **不强制你装别的东西**。核心链路本身零依赖、无 MCP、无常驻进程。唯一的例外是 `product-prd-extract` 解析 `.docx` 需要 Node ≥ 20——首次使用时 agent 会自己把依赖装好，装不上也会给你指引和退路。`prototype-to-product` 只在**你项目实际存在** OpenSpec / Superpowers 这类工程流程时才会走那条路，不会凭名字猜命令。
- **不替你拍板**。所有 skill 都要求把不确定的东西标成 `[UNKNOWN]` 并写明归属人，而不是编一个答案。

## 仓库结构

```text
.
├── .claude-plugin/          # 插件清单，支持从插件市场安装
├── .github/workflows/       # CI：乱码与内部标识门禁
├── docs/                    # 安装说明、链路详解
├── skills/<name>/           # 12 个 skill，各自独立
└── THIRD-PARTY.md           # 第三方作品归属与授权
```

## 第三方作品

`skills/prototype-html/` 收录自 [vagerent/prototype-html](https://github.com/vagerent/prototype-html)（Apache-2.0，原样收录）；
`skills/acceptance-checklist/` 的维度划分思路参考了 [beautfulmt/PM-K12--skills](https://github.com/beautfulmt/PM-K12--skills)（该项目无开源许可证，**未复制任何文件**）。

完整归属与授权说明见 [THIRD-PARTY.md](THIRD-PARTY.md)。

## License

MIT，见 [LICENSE](LICENSE)。

例外：`skills/prototype-html/` 为第三方作品，以 Apache-2.0 授权，版权归原作者所有。
