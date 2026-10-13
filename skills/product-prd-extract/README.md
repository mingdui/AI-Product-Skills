# Word PRD 结构化

把需求来源方给的 Word（`.docx`）PRD 转成结构化 Markdown，落到 `docs/prd/<feature-name>/prd.md`，直接接进本仓库的链路。

需求来源方给你的往往是一份 Word——格式自由、信息分散、隐含假设多。这个 skill 负责把它变成下游能精确消费的输入，**并且把原文没写清的地方显式标出来，而不是替原作者补全**。

## 何时使用

- 需求来源方只给了一份 `.docx` 文档。
- 手上有一大段粘贴过来的 PRD 文本，想整理成结构化文档。
- 想接进链路，但上游产物是 Word。

## 不适用

- 需求还停在口头、边界没问清 → 用 `requirement-clarify`。
- 需求已经清楚，要直接写 PRD → 用 `prd-write` 或 `context-to-prd`。
- 输入是会议纪要或聊天记录 → 那不是 PRD，用 `context-to-prd` 更合适。

## 依赖（本仓库唯一一个，但不用你操心）

`.docx` 本质是 ZIP 压缩的 XML，普通读取工具读不了，所以本 skill 自带一个 Node 解析脚本。
**这是本仓库 11 个 skill 里唯一有运行环境要求的**，其余全是纯 Markdown。

**你不用记任何命令。** 第一次丢 `.docx` 进来时，agent 会自己走完这套准备：

1. 查本机有没有 Node（要 ≥ 20）。
2. 没有依赖就自己装上（`mammoth` / `jszip` / `xml2js`，几 MB，装一次以后不用再装）——
   装之前会先用一句话告诉你它在装什么。
3. 如果 Node 装不上，会给你**对应平台的安装命令**，同时告诉你**退路**：
   把 Word 内容复制粘贴过来，后面的流程完全一样，只是文档里内嵌的图片要你自己截图保存。

想手动装也行：

```bash
npm --prefix "<本 skill 目录>/scripts" install
```

## 输入

- `.docx` 文件路径（推荐），或粘贴的 PRD 文本。

## 产物

```text
.claude/context/{源文件名}-extracted/     # 中间产物，保留供追溯
├── content.md
├── fidelity-report.txt
└── images/

docs/prd/<feature-name>/                  # 最终交付，下游直接消费
├── prd.md                                # 8 个维度 + 待确认事项
└── images/                               # 自包含副本，正文引用 ./images/xxx
```

## 提取的 8 个维度

业务背景 · 用户角色 · 功能模块 · 字段定义 · 业务流程 · 角色权限矩阵 · 校验规则 · 非功能与验收标准。

每个维度都遵守同一条原则：**原文明确写的直接提取，能推出来的标 `[INFERRED]`，没写的标 `[UNKNOWN]` 并写明该由谁确认，前后矛盾的把两处都记下来。**

## 保真度校验

走脚本时会生成 `fidelity-report.txt`，对图片、表格、文本的提取率打分。**分数低于 70 或有硬门槛告警就停下来请人介入**，不允许「凑合着用」。粘贴文本的路径会明确注明「未做保真度校验」。

## 不做什么

- **不发明需求**。原文没写的标 `[UNKNOWN]`，不替原作者补。
- 不做工程侧交叉验证（不去扫数据库 DDL 或实体类）。
- 不把中间产物 `.claude/context/` 当成交付物——最终 PRD 必须自包含。
- 不省略保真度校验后仍声称「提取完整」。

## 下一步

交给 [`grill-with-prd`](../grill-with-prd/) 做对抗式压测，把缺的边界和验收标准问出来——Word 里的需求通常最经不起逐条追问。

详细规则见 [SKILL.md](SKILL.md)；解析脚本的技术设计见 [references/parser-design.md](references/parser-design.md)。
