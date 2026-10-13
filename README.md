# AI-Product-Skills

面向产品经理的 AI 工作流：11 个 skill，把需求写成完整 PRD，再做成高保真可交互原型。

[English](README.en.md) · [安装说明](docs/installation.md) · [链路详解](docs/chain.md) · [出稿工具](docs/design-tools.md) · [**一次真实运行记录**](docs/walkthrough.md)

---

## 使用场景

### 一、把需求写成完整 PRD

需求来源方给了你一份 Word，或者在会上说了一段话——你需要把它变成开发看得懂的 PRD。

```
入口三选一：

product-prd-extract   Word（.docx）PRD → 结构化 prd.md
requirement-clarify   一句话口头需求 → clarify.md
context-to-prd        把你跟 AI 聊好的上下文，直接生成 PRD

        ↓
   prd-write          复用产品基线，写新的或改已有的 prd.md
                      （context-to-prd 与它结构相同，二选一，别连着跑）
        ↓
  grill-with-prd      扮演挑剔的工程师逐条压测，结论立刻写回原文
```

<details>
<summary><strong>已经有存量产品？</strong>先跑一次 <code>product-experience-foundation</code>，把已有规则沉淀成产品级基线</summary>

只要你已经有一个在跑的产品，都建议先跑一次——把已有的导航、术语、页面模式沉淀成产品级基线，
C 端 / Admin 各自一份。

跑过一次之后就不用再管了：`prd-write` 让功能 PRD 不必每次重讲一遍全局规则，各原型 skill
也会照着它复用组件和模式。

**什么时候该跑**：首版产品要立规矩、旧项目第一次接进来，或者你发现「同一个弹窗在三个功能里长得不一样」。

</details>

### 二、生成高保真原型

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
| **可交互的 HTML**<br>[prototype-html](https://github.com/vagerent/prototype-html) · [Open Design](https://open-design.ai/zh/) · [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Figma AI Make](https://www.figma.com/) · [Axhub Make](https://axhub.im/make/) | **直接用**——它已经是可以点击的原型 |
| **只有 UI 图片**<br>[Google Stitch](https://stitch.withgoogle.com/) · [OpenAI Image 2](https://developers.openai.com/api/docs/models/gpt-image-2) | **走管线**：图片 → `web-design-extractor` → `design.md` → `design-spec-prototyper` |

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
| **你自己的前端项目里** | `pm-frontend-prototype` | **有前端项目时优先使用**——已有 React / Vue / HTML 项目，直接复用真实组件和设计变量，产出与正式入口隔离的原型路由 |

## 生成产物

每个 skill 的产物都落在**同一个目录**下，下一个环节直接读上一个环节的产物——你不用手工搬运任何东西。

| 什么时候 | 你会拿到 | 放在哪 |
|---|---|---|
| 需求理清了 | 结构化 PRD（8 个维度 + 待确认事项） | `docs/prd/<feature-name>/prd.md` |
| 页面做出来了 | 可点击、可评审的高保真原型 | `docs/prd/<feature-name>/prototype.html` |
| 研发提测、要上线前走查 | 验收清单，每条指回 PRD 的需求编号 | `docs/prd/<feature-name>/acceptance.md` |

## 全部 11 个 skill

| Skill | 什么时候用它 |
|---|---|
| `product-prd-extract` | 需求来源方给的是 Word（`.docx`）。转成结构化 markdown，缺失信息标 `[UNKNOWN]`。**唯一需要 Node ≥ 20 的 skill** |
| `requirement-clarify` | 只有一句口头需求，边界没问清。一次问一个问题，专门追问「明确不做」 |
| `context-to-prd` | 跟 AI 聊需求已经聊透了，只差成文。直接固化成 PRD，不再反问。**与 `prd-write` 结构相同，二选一** |
| `prd-write` | 写新 PRD 或改已有的。复用 `docs/product/` 下的体验基线，只记本次新增、偏离、候选和待决问题 |
| `grill-with-prd` | PRD 成文之后，扮演挑剔的工程师逐条压测，每个问题答完**立刻**写回文件 |
| `design-spec-prototyper` | 有 `design.md`（最好再配一张设计稿图片），要出独立可点击的 `prototype.html` |
| `acceptance-checklist` | 研发提测了、要上线前逐条走查。每条都指回 PRD 的需求编号 |
| `product-experience-foundation` | 首版产品、旧项目第一次接进来，或页面体验开始不一致。沉淀产品级规则，跑一次后续自动复用 |
| `web-design-extractor` | 有竞品站链接或截图，要提取成 `design.md`。区分 `[OBSERVED]` / `[INFERRED]` / `[UNKNOWN]` |
| `pm-frontend-prototype` | 你已有前端项目，想让原型直接长在项目里、复用真实组件和设计变量。替换 `design-spec-prototyper` |
| `prototype-html` | 想要「界面 + 说明」左右分栏、带连线高亮的单文件原型 |

每个 skill 的边界和细节见各自的 `skills/<name>/README.md`；链路怎么衔接见 [docs/chain.md](docs/chain.md)。

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
/acceptance-checklist                   → docs/prd/user-bulk-import/acceptance.md
```

`<feature-name>` 一律用**小写英文短横线**（`user-bulk-import`）——它会变成目录名，不要用中文。

---

## 不适用什么

- **不是设计工具**——不替代 Figma、Axure。产出的是**评审用的 HTML**，不是设计源文件。
- **不做自动化测试**——`acceptance-checklist` 产出的是**产品验收清单**（用户可感知的结果），
  不是测试用例（实现分支覆盖）。

## License

MIT，见 [LICENSE](LICENSE)。

`skills/prototype-html/` 为第三方作品（Apache-2.0，原样收录），归属与授权说明见
[THIRD-PARTY.md](THIRD-PARTY.md)。
