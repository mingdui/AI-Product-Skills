# 更新日志

本文件记录本仓库的所有重要变更。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **CI 门禁 4：提交信息乱码扫描**。门禁 1 只扫工作区，看不到 git 历史——提交信息里混进
  U+FFFD 时它不会响。而中文在这个环境里偶发被吞字，已经中过一次招（提交信息里的一个汉字
  变成了替换字符）。提交信息只能靠 `git commit --amend` + force push 修正，所以这道门禁
  是阻塞式的；同时覆盖 push（`before..sha`）、PR（`base..sha`）和新分支三种区间来源，
  拿不到区间时兜底只查 HEAD。
- **`web-design-extractor` 补降级路径**。原先 `SKILL.md` 假设「有浏览器控制能力」，
  没有为「只能读服务端返回的源码」这种情况规定做法——skill 会静默退化，而交付物
  看起来和正常运行没有区别。现在要求必须写「转录边界」、令牌归属一律标 `[INFERRED]`、
  断点与交互态标 `[UNKNOWN]`，并在交付说明里讲清补全证据的办法。
  `references/design-md-template.md` 增加了对应的「转录边界」小节。
- **`requirement-clarify` 与 `grill-with-prd` 补「自答模式」**。两者都是交互式的，
  演示和回归时没法无人值守跑完。现在可以自己走完一轮，但约束是明确的：
  涉及业务决策的仍须落成 `[UNKNOWN]` 并写明归属人，冲突与缺失照常报出来，
  交付时「自答」的部分要单独列一遍，不能伪装成用户确认。
- `design-spec-prototyper` 写明「只有规格没有图」时，构图证据由规格里的 DOM / 接口顺序承担，
  并区分 `[OBSERVED]` 与 `[INFERRED]` 两种来源。
- **`docs/walkthrough.md` + `examples/pricing-page/`** —— 一条链路的完整真实运行记录：
  从一句口头需求，到 `clarify.md` / `prd.md` / `design.md` / `prototype.html` 四个产物，
  含每一步的结论、验证方式与**没验到的部分**。
  读它比读链路图快：`examples/pricing-page/prototype.html` 用浏览器直接打开就能点。

### Changed

- **`examples/pricing-page/` 换成了真实运行那一版。** 原先放的是为跑通链路做的合成演示
  （3 档、占位价格、我自己搭的），现在换成另一轮**真实执行**的产物：四档方案、
  月付 / 年付切换、含税口径、FAQ、销售联系表单，`prototype.html` 42.5 KB。
  视觉令牌照搬参考站（`#635bff`、`#0a2540`、圆角 `16.5px`、导航底色 `#f6f9fc`、
  正文色 `#425466`）——**第一眼像不像，几乎完全由品牌色决定**；
  品牌字体不沿用（`sohne-var` 需授权，中文由 `Noto Sans SC` 承载，拉丁字形与参考站不同）。
  `design.md` 里还写了一条比令牌更有价值的结论：**这张页不能作为本项目的信息架构模板**
  （它是按产品逐个列费率的索引页，没有「并列价格卡」这种结构，主 CTA 也与本项目的
  纯销售导向相反），可迁移的只有视觉语言。
  `docs/walkthrough.md` 同步重写，里面的尺寸与检查项都是对这份产物实测出来的。
- **`web-design-extractor` 补浏览器路线，并改掉「二选一」的写法。**
  原先 `SKILL.md` 只写了一句「使用可用的浏览器控制能力」——等于没说，
  agent 看到这种表述大概率直接退回 curl。现在：
  - 新增 [`references/browser-route.md`](skills/web-design-extractor/references/browser-route.md)：
    路线选择、产物怎么读、五个坑（含 Chrome ≥ 136 起必须给临时 profile）
  - 新增 [`scripts/browser-extract.mjs`](skills/web-design-extractor/scripts/browser-extract.mjs)：
    **零依赖**，只用 Node 内置模块；按「项目里有 playwright → 机器上有 Chrome/Edge →
    都没有就退出码 3」依次探测；采计算样式（**按取值频次排序**）、四档视口实测、截图
  - 明确两条路线是**叠加**关系：源码给「定义了哪些令牌、叫什么名字」，
    浏览器给「哪些真的在用」

  起因是一次对照实测（`https://stripe.com/pricing`，两条路线跑同一页）：
  源码里字面写着的尺寸类结论，标成 `[OBSERVED]` 的三条错了两条——
  「导航高 64px」实为 **76px**、「导航背景 `#fff`」实为 **`#f6f9fc`**、阴影值也对不上。
  而源码里根本看不到的：标题字重实为 **500**（700 全页只用 9 次）、
  正文色 **`#425466`**（用 1716 次）、全局字距 **`0.2px`**、按钮实际高 **33px**。
  **规律是颜色类基本对、尺寸与字重类基本错**——变量声明只是「定义了什么」，不是「用成了什么」。
- **skill 不再替用户做合规判断。** 原先有 6 处写成了硬禁止：未经授权不得检查登录后内容、
  不得下载或猜测商业字体、不得猜测受保护的品牌 Logo、未获授权不得提交凭据或触发支付。
  这些管的是「会不会惹上第三方」，不是「产物对不对」——留着会让 skill 变成守门人，
  删掉又不损失任何质量约束。
  现在统一改成「**说清风险 → 按用户的要求做**」，并在各自的「不做什么」里写明
  「不替你做合规判断」。字体那条尤其别扭：用户自己给了字体文件，本来就该直接用。
  真正管产物真假与一致性的那批「不得」（不得虚构、不得静默覆盖基线、不得覆盖已有文件、
  不得把没验的说成验过了）**一处没动**。
- **按一次真实运行的复盘做了一轮优化。** 有人把整条链路（`requirement-clarify` → `prd-write`
  → `grill-with-prd` → `web-design-extractor` → `design-spec-prototyper`）真跑了一遍，
  逐条记下当时发生的事。按性质分四类改：

  **上游反转要有地方留痕**
  - `requirement-clarify` 产物内置「修订记录」节，定死三条：推翻已确认结论时**新增记录不删原文**、
    必须点名被推翻的是哪一条、下游引用时说明以哪一版为准
  - `docs/chain.md` 新增「跨文档约定」：同一事实只在一处定义（范围/验收归 PRD、价格权益归业务文档、
    视觉令牌归 `design.md`），其余只引用不复制

  **澄清 ≠ 裁决**
  - `grill-with-prd` 补「指出 ≠ 裁决」：措辞不一致可以直接改；业务取舍、设计选择、对外口径的冲突
    **必须回到用户**。重写时顺手做的非澄清性选择要在交付说明里**单独列出**，
    不能混进「本次审查的主要变更」——否则用户会以为他点过头
  - `requirement-clarify` 补：收工前必须做一次**跨题一致性检查**（矛盾只会出现在类与类之间，
    逐类自查发现不了）；选项式提问的「未勾选」一律记为待定

  **构图证据的来源要说清**
  - `design-spec-prototyper` 补「**图不属于本页**」分支：手上是参考站截图时，构图证据回退到
    `prd.md` 第 5 节，参考图降级为视觉语言参考。照抄参考站的构图会得到一张与 PRD 完全不符的页面，
    **而且评审时看不出来**——这是少数「错得很漂亮」的失败模式
  - 读规格时必须读完「适用性 / 边界 / 重建规则」这类章节：规格可能已写明「这个页面不能当模板」，
    而流程里没有任何一步会自动读到那个结论
  - `prd-write/template.md` 第 5 节加注：本节分区顺序就是下游的构图依据，要么写清、
    要么显式写「本节不作为构图依据」，**别留白**

  **静默失败要在当场喊出来**
  - `browser-extract.mjs` 加**重定向告警**：请求 `stripe.com/pricing` 被 302 到 `/zh-hk/pricing`
    （英文站变香港中文站、美元变港币），此前完全无声
  - 摘要打印每张截图的**实际像素尺寸**（读 PNG 头），比例超 1:4 标警告——一张 1440×16148 的全页图
    缩到可读尺寸后信息基本没了，而「有全页截图」会给人「视觉已覆盖」的错觉
  - 新增 `--slice` 分段截图（每段附文字索引）与 `--read` 只读摘要
    （原来说了「别把 JSON 读进上下文」却没给替代做法）
  - 「转录边界」改为「**证据边界**」，**两种路线都必填**，无缺口写「无」——浏览器路线一样会只覆盖首屏
  - `design-spec-prototyper` 补 `scripts/preview-check.mjs`：静态复查（乱码 / id 唯一 /
    `aria-controls` 悬空 / SVG aria-hidden / `<h1>` 数量）+ 四档视口横向溢出 + 字体实际加载 + 截图。
    此前契约要求验证却不给工具，结果是「验证过」和「没验证」在交付说明里长得一样
  - 品牌字体拿不到时**必须声明替代关系**（替代了谁、哪个字形维度不同）
- `prd-write` 补模式判据：**无任何可复用的体验基线，且本次涉及定位或商业模式变化 → 完整模式**。
  「已在迭代」不是增量模式的前提——项目里还没有产品，不代表这件事不重大。
- 会写中文产物的 skill 在「交付前检查」里统一补上乱码扫描。这个坑在两次独立运行里各复现了 4–5 次，
  且**损坏后文本读起来仍然通顺**，肉眼扫不出来。
- **统一 PRD 结构。** `context-to-prd` 原先自带一套模板（问题陈述 / 解决方案 / 用户故事 /
  实现决策 / 测试决策 / 范围外 / 补充说明），与 `prd-write/template.md` 的 0–10 节完全不同，
  却写同一个 `docs/prd/<feature-name>/prd.md`——读者会拿到两种结构的同名文档，
  下游按哪套找章节没有答案。现在两者**共用 `template.md`**，差别只在过程
  （是否强制读产品体验基线），并在 README、`docs/chain.md` 和各 skill 文档里统一说明
  「**二选一，不要连着跑**」。
- `context-to-prd` 独有的模块划分与测试范围，改为写进第 10 节「交接说明」而不是第 7 节——
  第 7 节只放用户可验证的行为，实现决策不混进去。
- `CLAUDE.md` 要求所有会写中文产物的 skill，在「交付前检查」里带一条 U+FFFD 扫描。
  这个坑只在仓库里防住了一半：skill 在用户项目里产出的中文文档同样会中招，
  而用户不知道要扫。

### Fixed

- `prd-write/template.md` 第 0 节的「关联产物」补上回填说明：PRD 通常先于原型产出，
  这一行写 PRD 时本来就是空的，等原型做完再补——不要为凑满而写不存在的文件。

### Removed

- **`prototype-to-product`** —— 移出本仓库，链路改为止于「高保真原型」。
  它的产物 `delivery.md` 只是一份交付路径记录（走了 `direct` 还是 `openspec`、为什么这么选），
  在「产品把原型交给开发」这个场景里对开发没有帮助；而它面向的 OpenSpec / Superpowers
  工程治理流程，本仓库的读者多数并不具备。相关引用已全部清理。
  （该 skill 仍在内部工程脚手架的 `.claude/skills/` 里，需要时可自行取用。）

## [0.1.0] - 2026-10-13

首个公开版本。12 个 skill，首尾相接成一条从 Word / 口头需求到验收的完整链路。

### Added

**链路入口**
- `product-prd-extract` —— 把 Word（`.docx`）PRD 转成结构化 markdown，含保真度校验（图片/表格/
  文本提取率打分，低于 70 分停下来请人介入）与 `[UNKNOWN]` 标注。**本仓库唯一需要 Node ≥ 20
  的 skill**：首次使用时 agent 自己查环境、自己装依赖，装不上给平台安装指引 + 粘贴文本退路。
  解析脚本与设计文档一并收录。
- `requirement-clarify` —— 写 PRD 之前的建设式采访，一次一个问题，追问「明确不做」这类边界。
  补上了链路里原本缺失的「需求澄清」环节。

**链路核心**
- `context-to-prd` —— 基于对话上下文与代码库现状直接生成 PRD。
- `prd-write` —— 编写与维护 PRD，完整模式与增量模式，复用 `docs/product/` 下的体验基线。
- `grill-with-prd` —— PRD 成文之后的对抗式压测，结论立刻写回原文。
- `design-spec-prototyper` —— `design.md` → 独立可点击的高保真 `prototype.html`。
- `prototype-to-product` —— 把评审通过的原型整理成 `delivery.md`，并判断交付路径
  （直接实现 / 走项目既有的工程流程）。
- `acceptance-checklist` —— 生成提测后与上线前的验收清单，每条都指回 PRD 的需求编号。

**支线与替换项**
- `product-experience-foundation` —— 建立 C 端 / Admin 各自的产品体验基线。
- `web-design-extractor` —— 从 URL 或截图提取有证据支撑的 `design.md`。
- `pm-frontend-prototype` —— 在已有前端项目里做隔离的可点击原型。
- `prototype-html` —— 单文件「界面 + 说明」原型（第三方作品，见 THIRD-PARTY.md）。

**仓库基建**
- `.claude-plugin/` 插件清单，支持从 Claude Code 插件市场安装。
- CI 四道门禁：U+FFFD 乱码、个人绝对路径、内部标识哨兵词、`skills/` 结构校验。
- `docs/installation.md` 安装说明、`docs/chain.md` 链路详解。
- `THIRD-PARTY.md` 第三方作品归属与授权声明。

### Changed

- 全部 skill 迁入 `skills/<name>/` 容器目录，符合 `npx skills` 的发现约定。
- `prd-write/template.md` 由英文改为中文，与仓库其余文档统一。
- 补齐 `context-to-prd`、`prd-write`、`grill-with-prd`、`pm-frontend-prototype`
  缺失的 `agents/openai.yaml`（Codex 支持）。
- 清理外部工具名引用（原指向若干个本仓库不存在的 skill，以及若干特定工程工具链），
  改为中性表述，使核心链路不依赖任何外部工具。
- 移除 `design-spec-prototyper/SKILL.md` 中写死的作者本机绝对路径。

### Fixed

- 修复 `prototype-html/README.md` 中失效的示例图引用。

[Unreleased]: https://github.com/mingdui/AI-Product-Skills/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mingdui/AI-Product-Skills/releases/tag/v0.1.0
