# 更新日志

本文件记录本仓库的所有重要变更。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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
