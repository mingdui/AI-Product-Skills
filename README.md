# AI-Product-Skills

面向产品经理的 AI 工作流：12 个 skill 覆盖从「拿到需求」到「验收交付」的整条路径。

[English](README.en.md) · [安装说明](docs/installation.md) · [链路详解](docs/chain.md) · [全部 skill](docs/skills.md)

---

## 场景

### 一、要把需求写成 PRD

需求来源方给了你一份 Word，或者在会上说了一段话——你需要把它变成开发看得懂的 PRD。

```
入口三选一：

product-prd-extract   Word（.docx）PRD → 结构化 prd.md
requirement-clarify   一句话口头需求 → clarify.md
context-to-prd        把你跟 AI 聊好的上下文，直接生成 PRD

        ↓
   prd-write          复用产品基线，写新的或改已有的 prd.md
        ↓
  grill-with-prd      扮演挑剔的工程师逐条压测，结论立刻写回原文
```

你已有存量产品、规范开始不统一时，见下面的[已有存量产品时](#已有存量产品时)。

### 二、要在交给开发之前先把页面做出来

需求写完了，但光靠 PRD 说不清页面长什么样。这里有两个**互相独立**的选择：**设计从哪来**、**原型放在哪**。

#### 设计从哪来

**路子一：有参考网站**——拿一个竞品站或参考站当设计依据。

```
URL / 截图 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper ──→ prototype.html
              区分「看到的」和「推断的」   设计规格      规格 + 图片一起参考        可点击、可评审
```

手头还没有参考站？[这里有几个风格参考网站](docs/design-references.md)——它们给的是**风格方向和
提示词**，挑一个风格就能开始。

**路子二：只有想法**——先用设计工具出稿，[完整清单、截图和示例提示词见这里](docs/design-tools.md)。
拿到东西之后分两种情况：

| 工具给了什么 | 怎么做 |
|---|---|
| **可交互的 HTML**<br>prototype-html / Open Design / ui-ux-pro-max / Figma Make / Axhub Make | **直接用。** 它本来就是能点的原型，不必再走一遍管线——拿规格重新生成一遍，只会比原稿更差 |
| **只有 UI 图片**<br>Google Stitch / OpenAI Image 2 | **走管线**：图片 → `web-design-extractor` → `design.md` → `design-spec-prototyper` |

```
图片 ──→ web-design-extractor ──→ design.md ──→ design-spec-prototyper ──→ prototype.html
                                   ↑
                        持续沉淀：下一次迭代不必重新猜设计规范
```

**`design.md` 的作用是沉淀，不是每次都要过一遍的中间产物。** 它把品牌令牌和组件规则固化下来，
让下一个迭代、下一个 AI 会话还记得你的设计规范是什么。所以**即使你直接用了工具产出的 HTML，
也值得补一份 `design.md`**——否则换个会话，之前定下的规范就丢了。

#### 原型放在哪

这跟设计从哪来是两件独立的事。两种落点：

| 落点 | 用什么 | 适合 |
|---|---|---|
| **独立 HTML 文件** | `design-spec-prototyper`（默认） | 发给别人点、不依赖后端、评审会上直接演示 |
| **你自己的前端项目里** | `pm-frontend-prototype` | 你已有 React / Vue / HTML 项目——**直接复用真实组件和设计变量**，产出与正式入口隔离的原型路由 |

**有前端项目时优先用后者**：原型和真实产品长得一样，评审时就不会出现「demo 挺好看，做出来怎么不是这样」。

#### 已有存量产品时

既然已经有前端项目、有历史页面，还建议**先跑一次 `product-experience-foundation`**——把已有的导航、
术语、页面模式沉淀成产品级基线，C 端 / Admin 各自一份。

它跟上一条是**配合关系**：先立规矩，原型才知道该复用哪些组件、遵循哪些模式。跑过一次之后就不用再管了——
`prd-write` 和各原型 skill 都会自动读它，功能 PRD 不必每次重讲一遍全局规则。

**什么时候该跑**：首版产品要立规矩、旧项目第一次接进来，或者你发现「同一个弹窗在三个功能里长得不一样」。

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

## License

MIT，见 [LICENSE](LICENSE)。

`skills/prototype-html/` 为第三方作品（Apache-2.0，原样收录），归属与授权说明见
[THIRD-PARTY.md](THIRD-PARTY.md)。
