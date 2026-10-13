---
name: product-prd-extract
description: 把 Word（.docx）PRD 或粘贴的 PRD 文本转成结构化 Markdown，落到 docs/prd/<feature-name>/prd.md，直接接进本仓库的链路。当用户提到「解析 PRD」「提取需求文档」「PRD 转结构化」「PRD 转 Markdown」「Word 转需求」「导入 PRD」，或直接丢来一个 .docx 要求分析时使用。适用于需求来源方只给了一份 Word 的情况；不需要解析 Word、要直接写 PRD 时用 prd-write 或 context-to-prd。
---

# Word PRD 结构化

需求来源方给的常常是一份 Word——格式自由、信息分散、隐含假设多。本 Skill 把它转成结构化 Markdown 落到 `docs/prd/<feature-name>/prd.md`，让 `grill-with-prd`、各原型 skill、`acceptance-checklist` 能直接读。

**只做转换与结构化，不发明需求。** 原文没写的，一律标 `[UNKNOWN]`。

## 使用边界

- **适用**：手上是 `.docx` 文件，或一大段粘贴过来的 PRD 文本。
- **不适用**：
  - 需求还停在口头、边界没问清 → 用 `requirement-clarify`
  - 需求已经清楚，要直接写 PRD → 用 `prd-write` 或 `context-to-prd`
  - 会议纪要、聊天记录 → 那不是 PRD，用 `context-to-prd` 更合适

## 依赖与自动准备

`.docx` 本质是 ZIP 压缩的 XML，Read 工具读不了，所以本 skill 自带一个 Node 解析脚本。
**这是本仓库 11 个 skill 里唯一有运行环境要求的**，其余全是纯 Markdown。

脚本需要 Node.js ≥ 20 和三个开源解析库（`mammoth`、`jszip`、`xml2js`）。

### 开工前先自检并准备——不要先问用户，先自己查

按顺序执行，**前一步成功就跳到下一步**。

**第 1 步：查 Node 是否可用**

```bash
node --version
```

有输出且 ≥ v20 → 进第 2 步。报 `command not found` 或版本过低 → 跳到第 3 步。

**第 2 步：查依赖是否已装**

```bash
ls "<本 skill 目录>/scripts/node_modules" >/dev/null 2>&1 && echo 已装 || echo 未装
```

未装就**直接装，不必先征求同意**——但装之前用一句话说清你在装什么：

> 解析 Word 需要先装 3 个开源解析库（mammoth / jszip / xml2js），几 MB，装一次以后不用再装。

```bash
npm --prefix "<本 skill 目录>/scripts" install
```

装失败（无网络、npm 报错）**不要卡住**，直接走第 4 步，并说明失败原因。

**第 3 步：Node 不可用 → 给具体安装指引 + 退路**

不要只说「请先安装 Node」。给可照做的命令：

| 平台 | 做法 |
|---|---|
| macOS | `brew install node`，或到 <https://nodejs.org> 下 LTS 安装包 |
| Windows | 到 <https://nodejs.org> 下 LTS 安装包，**安装时务必勾选 Add to PATH** |
| Linux | 用发行版包管理器，或用 nvm |

**同时必须给出退路**，别让用户卡在这一步：

> 不想装 Node 也行——把 Word 里的内容直接复制粘贴给我，后面结构化流程完全一样。
> 只是文档里内嵌的图片需要你自己截图保存。

**第 4 步：走粘贴文本路线**

跳过脚本，从「流程」的第 2 步开始正常做。**交付说明里必须写明：未走脚本，未做保真度校验、未自动提取内嵌图片。**

## feature-name 命名规则

`<feature-name>` 决定目录名，**强制纯英文 kebab-case**：

| 规则 | ✅ | ❌ |
|---|---|---|
| 仅小写英文 + 数字 + 横杠 | `order-management` | `Order_Management`、`order management` |
| 不含中文（必须译成语义英文） | `member-points` | `会员积分`、`hui-yuan` |
| 不含修饰词（去版本号/日期/「PRD」「需求文档」「方案」） | `payment-checkout` | `payment-prd`、`payment-v2` |
| 2~5 个词，总长 ≤ 40 字符 | `user-center` | `comprehensive-payment-checkout-system-with-refund` |

推导顺序：**用户显式指定**（最高优先）→ 从文件名提取主语并翻译 → 从文档标题推导。
存在多种合理译法时（如「会员中心」可能是 `user-center` 或 `member-center`），列出 2~3 个候选让用户选，**不要自己定**。

写入前自检：全小写 / 只含 `[a-z0-9-]` / 不以 `-` 开头结尾且无 `--` / 长度 ≤ 40 / 不含 `prd`、`v1`、年份等修饰词。

## 流程

### 1. 拿到文本

- **有 .docx**：**先按「依赖与自动准备」跑完那 4 步自检**（查 Node → 装依赖 → 装不了就引导 + 给退路），
  再跑脚本：

  ```bash
  node "<本 skill 目录>/scripts/extract-docx.mjs" "<docx 路径>" --output-dir ".claude/context/{源文件名}-extracted" --quiet
  ```

  加 `--quiet`——否则全文 Markdown 会灌进上下文。跑完用 Read 读 `content.md`。
  脚本会把文本（保留 h1–h6 层级）、表格（转 Markdown 表格）、内嵌图片（存进 `images/`）一并提取出来。
- **用户选择粘贴文本**：直接用粘贴内容，并在交付说明里注明没走脚本、没做保真度校验、没提取内嵌图片。

### 2. 按维度结构化

按下面 8 个维度逐项提取。**表格是 PRD 里最精确的信息源，优先从表格提**；流程图描述转成「状态流转 + 操作序列」；界面截图旁边的文字描述，从中提字段。

| # | 维度 | 提什么 |
|---|---|---|
| 1 | 业务背景 | 项目定位（一段话）、业务目标（可量化）、本期范围与不做 |
| 2 | 用户角色 | 每个角色是谁、在什么场景用、最关心什么、3~5 个高频操作 |
| 3 | 功能模块 | 模块划分、子功能、优先级 P0/P1/P2、模块间依赖 |
| 4 | 字段定义 | 按实体一张表：字段名、类型、必填、校验规则、默认值、说明 |
| 5 | 业务流程 | 触发条件、状态流转、操作序列、异常分支 |
| 6 | 角色权限矩阵 | 功能 × 角色 的对照表 |
| 7 | 校验规则 | 前端校验、后端校验、业务校验，各自的提示文案 |
| 8 | 非功能与验收 | 性能/并发/数据量/安全要求；功能验收 + 通用验收清单 |

### 3. 保真度校验（走脚本时）

脚本跑完会自动生成 `fidelity-report.txt`，**必须读它再决定下一步**：

| 条件 | 动作 |
|---|---|
| 总分 ≥ 90 且无硬门槛告警 | ✅ 直接继续 |
| 70–89 或有 ⚠️ | ⚠️ 看告警项，针对性补，然后继续 |
| < 70 或有 ❌ | ❌ 停下来，请人工介入 |

硬门槛（任一触发即告警，不受总分掩盖）：图片文件提取率 < 90%、图片引用率 < 90%、表格提取率 < 90%。

常见告警的补法：**图片文件缺失** → 多半是嵌入式图表或 OLE 对象，在 Markdown 里标 `[图表未提取：请手动补充]`；**图片引用缺失** → 文件提出来了但正文没 `![]()`，检查转换；**文本丢失** → 多半来自文本框或 SmartArt，对照原文确认；**表格缺失** → 可能是嵌套表或非标准格式，手工核对原文。

没走脚本（粘贴文本）时跳过本步，但要在交付说明里写明「未做保真度校验」。

### 4. 标注歧义

写成「待确认事项」，按影响分三档：

- **高（阻塞开发）**：影响架构或数据设计的 —— 写明影响和建议方案
- **中（影响细节实现）**：写明影响范围和建议
- **低（可后续迭代）**：说明为什么可以延后

第 3 步发现的丢失内容，一律进「高」。

### 5. 落地到功能目录

1. 确定 `<feature-name>`，跑完自检清单。
2. 把图片从 `.claude/context/` 复制到 `docs/prd/<feature-name>/images/`，**并把所有图片引用统一改写成 `./images/xxx` 相对路径**——最终 PRD 必须自包含，不能指向中间目录。
3. 写入 `docs/prd/<feature-name>/prd.md`。
4. Read 回读一遍，确认没有残留的 `.claude/context/` 路径。

## 证据标注（与仓库统一）

沿用本仓库其它 skill 的三分法，**不要自创标记**：

| 原文情况 | 标成 |
|---|---|
| 明确写了 | 直接提取，保留关键原话 |
| 能合理推出 | `[INFERRED]`，并写明推测依据 |
| 没提 | `[UNKNOWN]`，并写明该由谁确认 |
| 前后矛盾 | 两处都记下来，列入待确认事项 |

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

## 交付前检查

- [ ] `<feature-name>` 过了 5 条自检规则
- [ ] 8 个维度都有内容（哪怕只是 `[UNKNOWN]` 占位）
- [ ] 所有 `[INFERRED]` 和 `[UNKNOWN]` 都出现在「待确认事项」里
- [ ] 保真度评分 ≥ 70（走脚本时），或已注明未做校验
- [ ] 图片已复制到功能目录，且正文全部用 `./images/xxx`
- [ ] 回读过 `prd.md`，无 `.claude/context/` 残留路径

## 不做什么

- **不发明需求**。原文没写的标 `[UNKNOWN]`，不替原作者补。
- 不做工程侧交叉验证（不去扫数据库 DDL 或实体类）。
- 不把中间产物 `.claude/context/` 当成交付物——最终 PRD 必须自包含。
- 不省略保真度校验后仍声称「提取完整」。

## 下一步

把 `prd.md` 交给 [`grill-with-prd`](../grill-with-prd/) 做对抗式压测，把缺的边界和验收标准问出来——Word 里的需求通常最经不起逐条追问。

需要补需求背景、竞品参考或视觉证据时，用 [`context-to-prd`](../context-to-prd/) 或 [`web-design-extractor`](../web-design-extractor/)。
