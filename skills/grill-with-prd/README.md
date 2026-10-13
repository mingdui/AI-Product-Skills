# grill-with-prd

对 PRD 文档进行逐项压测审查，发现需求漏洞，并将确认的决策同步写回 PRD 文件。

## 用途

PRD 写完之后、开始实现之前，用这个 skill 让 AI 扮演"挑剔的工程师"，逐条质问需求的完整性、一致性和可实现性。每个问题等你回答后再继续，不会一次性把所有问题抛给你。

**适合的场景：**
- PRD 已初步完成，想在动手写代码前做一次深度审查
- 担心需求有遗漏或前后矛盾，想提前暴露问题
- 用 `context-to-prd` 或 `prd-write` 生成 PRD 后，做进一步打磨
- PRD 是从 Word 转过来的（`product-prd-extract`）——里面的隐含假设最需要压一轮

**不适合的场景：**
- 需求还没写、还停在口头阶段 → 用 `requirement-clarify`（成文**之前**的建设式采访）
- 只想快速生成 PRD，不想逐条被问 → 用 `context-to-prd`

> **和 `requirement-clarify` 的区别**：本 Skill 是 PRD **成文之后**的对抗式压测，逐条质疑已有文档；
> `requirement-clarify` 是**成文之前**的建设式采访，把缺的信息补齐。两者不能互相替代。

## 调用方式

```bash
/grill-with-prd
```

加 feature-name 参数可跳过询问直接开始：

```bash
/grill-with-prd user-auth
/grill-with-prd payment-flow
```

## AI 会做什么

| 审查行为 | 示例提问 |
|---------|---------|
| 挑战模糊需求 | "你说'用户可以管理订单'——管理包含哪些操作？" |
| 追问边界条件 | "支付失败时，订单状态如何变化？用户能重试吗？" |
| 发现需求冲突 | "用户故事第 3 条说可以删除草稿，但实现决策说所有操作都要审计日志——删除也要记录吗？" |
| 对照代码库验证 | "你说会话有效期 7 天，但代码里 token 过期是 24 小时——以哪个为准？" |
| 确认验收标准 | "这条用户故事没有验收标准——成功的定义是什么？" |

每当一个问题得到明确答案，AI 会**立刻把结论同步更新到 PRD 文件**，并告知你改了哪里。

## 与其他 Skill 的关系

```
三个入口，按你手上有什么选：

  product-prd-extract    Word（.docx）PRD → 结构化 markdown
  requirement-clarify    一句话口头需求 → clarify.md
  （已经聊清楚了）        跳过，直接进下一步

        ↓
context-to-prd          （对话上下文 + 代码库 → PRD）
        ↓
   prd-write            （复用产品基线，写 / 改 PRD）
        ↓
  grill-with-prd        （对抗式压测 PRD，结论写回原文）← 你在这里
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

压测完、原型也确认之后，验收清单会直接引用本步回写进 PRD 的验收标准。
