# 全部 11 个 skill

一句话版见下表；每个 skill 的边界和细节见各自的 `skills/<name>/README.md`。
链路怎么衔接见 [chain.md](chain.md)。

## 入口：需求从哪来

| Skill | 什么时候用它 |
|---|---|
| `product-prd-extract` | 需求来源方给的是 Word（`.docx`）。转成结构化 markdown，缺失信息标 `[UNKNOWN]`。**唯一需要 Node ≥ 20 的 skill**，首次使用时 agent 会自己装好依赖 |
| `requirement-clarify` | 只有一句口头需求，边界没问清。一次问一个问题，专门追问「明确不做」 |
| `context-to-prd` | 跟 AI 聊需求已经聊透了。把那段上下文直接固化成 PRD，不再反问 |

## 主链

| Skill | 干什么 |
|---|---|
| `prd-write` | 写新 PRD 或改已有的。复用 `docs/product/` 下的体验基线，只记本次新增、偏离、候选和待决问题。完整模式（首版）与增量模式（默认） |
| `grill-with-prd` | PRD 成文之后，扮演挑剔的工程师逐条压测，每个问题答完**立刻**写回文件 |
| `design-spec-prototyper` | `design.md` → 独立可点击的 `prototype.html`。视觉事实以设计规格为准，不临时发挥 |
| `acceptance-checklist` | 提测后 / 上线前能逐条走查的验收清单。每条都指回 PRD 的需求编号 |

## 支线：按需插入

| Skill | 什么时候插进来 |
|---|---|
| `product-experience-foundation` | 首版产品、旧项目首次接入，或 C 端 / Admin 的页面体验开始不一致。沉淀产品级规则，跑一次后续自动复用 |
| `web-design-extractor` | 有竞品站链接或截图，要提取成 `design.md`。区分 `[OBSERVED]` / `[INFERRED]` / `[UNKNOWN]` |

## 替换项

| Skill | 替换什么 |
|---|---|
| `pm-frontend-prototype` | 替换 `design-spec-prototyper`——不在独立 HTML 里做原型，而是在**你自己的前端项目**里加隔离的可点击原型路由，复用真实组件和设计变量 |
| `prototype-html` | 另一套原型形态：单文件 HTML，左侧界面 + 右侧说明，SVG 连线高亮。适合「原型即文档」的评审场合。**第三方作品**（Apache-2.0），见 [THIRD-PARTY.md](../THIRD-PARTY.md) |

---

## 共同的约定

**产物路径**：功能级产物一律落在 `docs/prd/<feature-name>/`，产品级基线落在
`docs/product/<project-name>/`。`<feature-name>` 用**小写英文短横线**。

**不覆盖**：目录已存在则复用，同名文件不覆盖。`web-design-extractor` 遇到已有 `design.md`
会改写成 `design-extracted.md`。

**证据标注**：`[OBSERVED]` 是直接可见的事实，`[INFERRED]` 是合理推断，`[UNKNOWN]` 是资料无法确立、
**必须写明归属人**。任何 skill 都不允许把 `[UNKNOWN]` 编成事实。
