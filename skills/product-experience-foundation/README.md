# Product Experience Foundation

为一个具体产品建立可持续维护的体验基线。它解决的是“多个功能应该遵循什么共同规则”，不是单个功能的实现。

## 何时使用

- 首版需求或产品启动。
- 旧项目首次接入，需要整理当前有效体验。
- C 端或 Admin 的导航、术语、页面模式开始不一致。
- 一个已确认的模式需要晋升为产品级规则。

## 输入

- 首版或相关 PRD。
- 现有 C 端 / Admin 页面和前端项目。
- 产品角色、领域术语、品牌资料和已确认决策。

## 产物

```text
docs/product/<project-name>/
├── product-context.md
├── shared/domain-language.md
├── c-end/ or admin/
│   ├── ux-foundations.md
│   └── patterns.md
└── component-promotion-log.md
```

旧项目得到的是“当前有效体验基线”，不是历史页面的资料堆积；事实、推断和待确认项会分开标记。

## 不做什么

- 不把具体项目业务写进通用前端脚手架。
- 不因为一次功能就创建全局组件。
- 不替代单个功能的 PRD、设计规格或工程实现。

## 下一步

基线建立后，使用 `$prd-write` 写功能增量，再按需要进入设计提取、原型和工程交付流程。

详细规则见 [SKILL.md](SKILL.md)。
