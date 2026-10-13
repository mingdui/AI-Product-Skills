# context-to-prd

把已经聊透的需求上下文直接落成 PRD，**不采访**。

## 用途

你和 AI 已经聊清楚了需求（或者 AI 已经探索过代码库），只差把它固化成一份结构化 PRD。

**适合的场景：**

- 一轮讨论之后，想把共识落成文档
- AI 已探索过代码库，直接出 PRD 而不再重复提问
- `requirement-clarify` 已经采访过一轮，`clarify.md` 就绪

**不适合的场景：**

- 需求还很模糊、需要逐步澄清 → 先用 `requirement-clarify`
- 要复用已有产品体验基线、或写增量 PRD → 用 `prd-write`
- 已有 Word（`.docx`）格式的 PRD → 用 `product-prd-extract`
- 已有 PRD，想挑毛病 → 用 `grill-with-prd`

## 调用方式

```bash
/context-to-prd
```

加 feature-name 参数可跳过命名确认：

```bash
/context-to-prd user-auth
/context-to-prd payment-flow
```

feature-name 一律用**小写英文短横线**——它会变成目录名。

## 输出

`docs/prd/<feature-name>/prd.md`，**与 `prd-write` 的结构完全一致**——都以
[`prd-write/template.md`](../prd-write/template.md) 的 0–10 节为骨架：

| 节 | 内容 |
|---|---|
| 0 | 文档信息（模式、状态、关联产物） |
| 1 | 执行摘要 |
| 2 | 体验关系（复用基线 / 功能局部 / 候选晋升 / 有意偏离） |
| 3 | 问题与用户 |
| 4 | 战略背景 |
| 5 | 范围与方案（含用户流程、范围外） |
| 6 | 成功指标 |
| 7 | 需求与验收（按用户可验证的行为组织） |
| 8 | 依赖、约束与风险 |
| 9 | 待决问题 |
| 10 | 交接说明 |

模块划分与测试范围这类**实现决策写在第 10 节**，不写进第 7 节——第 7 节只写用户能验证的行为。

## 和 prd-write 有什么区别

产出同构、文件名相同。差别只在过程：

| | 本 Skill | `prd-write` |
|---|---|---|
| 是否采访 | 不采访 | 不采访 |
| 是否强制读产品体验基线 | 不强制。有就读进来写进第 2 节，没有就写「无基线」 | **必须查**。增量模式要靠它写清「复用 / 局部 / 候选 / 偏离」 |
| 典型场景 | 聊透了，一次成文 | 迭代中的功能，要跟已有规范对齐 |

**两个写的是同一个 `prd.md`，不要连着跑。** 写完一个就够了，另一个是用来替补的。

## 与其他 Skill 的关系

```text
三条入口，按你手上有什么选一条：

  product-prd-extract    Word（.docx）PRD → 结构化 prd.md
  requirement-clarify    一句话口头需求 → clarify.md，再交给 prd-write 成文
  context-to-prd         已经聊透了 → 直接成文（不采访）

  ★ 成文这一步：context-to-prd 与 prd-write 二选一，不要连着跑

        ↓
  grill-with-prd         对抗式压测，结论立刻写回 prd.md
        ↓
design-spec-prototyper   design.md → 独立高保真 prototype.html
        ↓
       交给研发实现
        ↓
acceptance-checklist     PRD + 原型 → 验收清单
```

两条支线，按需插入：

- `product-experience-foundation`——沉淀产品级体验基线，供 `prd-write` 和各原型 Skill 读取
- `web-design-extractor`——URL / 截图 → 有证据支撑的 `design.md`，喂给 `design-spec-prototyper`

把原型做进真实前端项目时，把 `design-spec-prototyper` 换成 `pm-frontend-prototype`。
