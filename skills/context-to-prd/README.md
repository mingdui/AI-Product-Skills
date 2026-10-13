# context-to-prd

基于当前对话上下文和代码库现状生成 PRD，不采访用户。

## 用途

当你和 AI 已经聊清楚了需求细节（或者 AI 已经探索过代码库），想直接把这些信息固化成一份结构化 PRD 文档时使用。

**适合的场景：**
- 在一轮讨论之后，希望把共识落成文档
- AI 已探索过代码库，希望直接出 PRD 而不再重复提问
- `requirement-clarify` 已经采访过一轮，`clarify.md` 就绪

**不适合的场景：**
- 需求还很模糊、需要逐步澄清 → 先用 `requirement-clarify`
- 需要带上已有产品基线写增量 PRD → 用 `prd-write`（它会读取 `docs/product/` 下的基线）
- 已有 Word（`.docx`）格式的 PRD → 用 `product-prd-extract` 转成结构化 markdown，再接进链路

## 调用方式

```bash
/context-to-prd
```

加 feature-name 参数可跳过命名确认：

```bash
/context-to-prd user-auth
/context-to-prd payment-flow
```

## 输出

生成 `docs/prd/{feature-name}/prd.md`，包含：

| 章节 | 内容 |
|------|------|
| 问题陈述 | 用户视角的当前痛点 |
| 解决方案 | 用户视角的解决方案 |
| 用户故事 | 编号的详细用户故事列表 |
| 实现决策 | 模块设计、API 契约、架构决策等 |
| 测试决策 | 需要测试的模块和测试标准 |
| 范围外 | 明确不包含的内容 |
| 补充说明 | 其他备注 |

> 需要完整的产品基线复用、四类增量内容（复用 / 局部 / 候选 / 偏离）时，
> 用 `prd-write` 的完整模板，它比本 Skill 的输出结构更全。

## 与其他 Skill 的关系

主线是一条：

```
三个入口，按你手上有什么选：

  product-prd-extract    Word（.docx）PRD → 结构化 markdown
  requirement-clarify    一句话口头需求 → clarify.md
  （已经聊清楚了）        跳过，直接进下一步

        ↓
context-to-prd          （对话上下文 + 代码库 → PRD）← 你在这里
        ↓
   prd-write            （复用产品基线，写 / 改 PRD）
        ↓
  grill-with-prd        （对抗式压测 PRD，结论写回原文）
        ↓
design-spec-prototyper  （design.md → 独立高保真 prototype.html）
        ↓
 prototype-to-product   （原型 → 生产代码 / 工程交接，判断交付路径）
        ↓
acceptance-checklist    （PRD + 交付包 → 验收清单）
```

两条支线，按需插入：

- `product-experience-foundation`——沉淀产品级体验基线，供 `prd-write` 和各原型 Skill 读取
- `web-design-extractor`——URL / 截图 → 有证据支撑的 `design.md`，喂给 `design-spec-prototyper`

把原型做进真实前端项目时，把 `design-spec-prototyper` 换成 `pm-frontend-prototype`。
