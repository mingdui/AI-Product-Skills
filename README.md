# AI-Product-Skills

面向产品经理的 AI 工作流：12 个 skill 覆盖从「拿到需求」到「验收交付」的整条路径。

[English](README.en.md) · [安装说明](docs/installation.md) · [链路详解](docs/chain.md) · [全部 skill](docs/skills.md)

---

## 场景

### 一、要把需求写成 PRD

需求来源方给了你一份 Word，或者在会上说了一段话——你需要把它变成开发看得懂的 PRD。

```
product-prd-extract   Word（.docx）PRD → 结构化 prd.md   ┐
requirement-clarify   一句话口头需求 → clarify.md         ├ 入口三选一
context-to-prd        已经聊清楚了 → 直接成文             ┘
        ↓
   prd-write          复用产品基线，写新的或改已有的 prd.md
        ↓
  grill-with-prd      扮演挑剔的工程师逐条压测，结论立刻写回原文
```

**首版产品、旧项目第一次接进来，或 C 端 / Admin 的页面体验开始不一致时**，先跑一次
`product-experience-foundation`，把产品级规则沉淀下来。跑过一次之后，`prd-write` 和各原型 skill
都会自动读它，功能 PRD 不必每次重讲一遍全局规则。

### 二、要在交给开发之前先把页面做出来

需求写完了，但光靠 PRD 说不清页面长什么样。这里有两套做法，**区别只在设计从哪来**。

**做法 A：有参考网站**——拿一个竞品站或参考站当设计依据。

```
URL / 截图 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper ──→ prototype.html
              区分「看到的」和「推断的」   设计规格        以规格为唯一视觉事实源      可点击、可评审
```

**做法 B：只有想法**——先用设计工具出稿，拿到设计稿后接上同一条流程。

```
设计工具 ──→ 设计稿 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper
                                                                    ↓
                                                              prototype.html
```

常用工具，[完整清单、截图和示例提示词见这里](docs/design-tools.md)：

- **产出可交互原型**——
  [prototype-html](https://github.com/vagerent/prototype-html) ·
  [Open Design](https://open-design.ai/zh/) ·
  [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) ·
  [Figma AI Make](https://www.figma.com/) ·
  [Axhub Make](https://axhub.im/make/)
- **只产出 UI 图片**——
  [Google Stitch](https://stitch.withgoogle.com/) · OpenAI Image 2

两套做法的**产出格式完全一样**，评审会上拿出来的东西自然也一样。想让原型直接长在**你自己的前端项目**里
（复用真实组件和设计变量，与正式入口隔离），把最后一步换成 `pm-frontend-prototype`。

## 效果

每个 skill 的产物都落在**同一个目录**下，下一个环节直接读上一个环节的产物——你不用手工搬运任何东西。

| 你会拿到 | 放在哪 |
|---|---|
| 结构化 PRD（8 个维度 + 待确认事项） | `docs/prd/<feature-name>/prd.md` |
| 可点击、可评审的高保真原型 | `docs/prd/<feature-name>/prototype.html` |
| 研发交接包（页面路由、状态异常、依赖、验收口径） | `docs/prd/<feature-name>/delivery.md` |
| 提测后 / 上线前的验收清单 | `docs/prd/<feature-name>/acceptance.md` |

需求确认之后：

```
prototype-to-product   判断交付路径，按项目既有架构实现生产代码，或产出正式的工程交接工件
        ↓
acceptance-checklist   生成提测后 / 上线前能逐条走查的验收清单，每条指回 PRD 的需求编号
```

## 安装

三种方式，任选一种。详见 [docs/installation.md](docs/installation.md)。

**Claude Code 插件市场**

```bash
/plugin marketplace add mingdui/AI-Product-Skills
/plugin install ai-product-skills
```

**npx skills**

```bash
npx skills add mingdui/AI-Product-Skills
```

**手动拷贝**——把 `skills/` 下的目录拷进你项目或 agent 的 skills 目录即可，不用装任何环境。
唯一需要额外条件的是 `product-prd-extract`（解析 `.docx` 要 Node ≥ 20），但第一次用它时 agent
会自己检查环境、自己装依赖，你什么都不用做。

## 使用

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

12 个 skill 各自能做什么、什么时候不该用，见 [docs/skills.md](docs/skills.md)。

---

## 不适用什么

- **不是设计工具**——不替代 Figma、Axure。产出的是**评审用的 HTML**，不是设计源文件。
- **不做自动化测试**——`acceptance-checklist` 产出的是**产品验收清单**（用户可感知的结果），
  不是测试用例（实现分支覆盖）。
- **`prototype-to-product` 会写生产代码**，但只在改动局部、低风险、现有组件与路由能覆盖时。
  涉及 API 契约、数据模型、权限或跨模块流程，它会转交给你项目采用的 OpenSpec、Superpowers
  或等价流程，**不绕过治理流程直接改业务代码**。
- **不会替你拍板**——所有 skill 都要求把不确定的东西标成 `[UNKNOWN]` 并写明归属人，而不是编一个答案。

## License

MIT，见 [LICENSE](LICENSE)。

`skills/prototype-html/` 为第三方作品（Apache-2.0，原样收录），归属与授权说明见
[THIRD-PARTY.md](THIRD-PARTY.md)。
