# Prototype To Product

把已确认的原型交给正确的工程交付路径。它不把原型 HTML 或临时代码直接当成生产架构。

## 何时使用

- 独立 `prototype.html` 已经评审确认。
- 项目内原型路由已经确认，需要提升为正式业务功能。
- 需要判断 direct、OpenSpec、Superpowers 或项目自定义流程。

## 输入

- `prd.md`、`design.md`、已确认的 `prototype.html`。
- `demo.md` 和产品体验基线（如存在）。
- 仓库的 `AGENTS.md`、工程规范、脚本和现有组件架构。

## 产物

### direct

- 按项目既有架构实现正式路由、组件、数据、权限、状态和测试。

### openspec / superpowers / 项目流程

- 创建或更新对应的工程交接工件。
- 在功能目录记录 `delivery.md`，并等待开发流程实施，不绕过治理流程直接改业务代码。

## 路由判断

默认 `delivery_mode: auto`：先读项目规则和已配置工具。涉及 API、数据模型、迁移、权限、跨模块流程、多人协作或高风险发布时，不默认选择 direct。

## 不做什么

- 不复制原型中的 CDN、临时 mock、重复组件或另一套框架。
- 不虚构后端 API、认证、支付或第三方集成。
- 不在项目已有工程流程之外偷偷修改生产代码。

## 下一步

按选定路径完成工程实现或正式交接，并报告判断证据、保留的视觉契约、检查结果和未决产品决策。

研发提测后，用 [`acceptance-checklist`](../acceptance-checklist/) 生成验收清单——它会直接引用本节留下的交付范围与验收口径。

详细规则见 [SKILL.md](SKILL.md)。
