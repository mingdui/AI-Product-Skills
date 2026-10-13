# Design Spec Prototyper

把 `design.md` 和产品需求变成独立、可点击、可评审的高保真原型。它的视觉事实来源是设计规格，不是临时发挥。

## 何时使用

- PRD 和设计依据已经明确，需要先评审体验。
- 需要一个不依赖真实后端的 `prototype.html`。
- 需要展示页面状态、响应式布局、表单和关键交互。

## 输入

- `design.md` / `DESIGN.md`。
- 相关 `prd.md` 和产品体验基线（如存在）。
- 用户指定的技术栈、字体和交互范围。

## 产物

```text
docs/prd/<feature-name>/
├── prd.md
├── design.md
├── prototype.html
└── assets/fonts/        # 使用本地字体时才创建
```

在线独立原型默认可使用 Google Fonts；需要离线或稳定复现时，使用授权的本地字体或系统字体 fallback。

## 不做什么

- 不把独立 HTML 当作正式生产架构。
- 不凭截图猜测隐藏业务规则、API 或权限。
- 不覆盖已有需求目录中的原型文件。

## 下一步

评审确认后：需要贴合真实项目语境时使用 `$pm-frontend-prototype`；准备进入正式研发时使用 `$prototype-to-product`。

详细规则见 [SKILL.md](SKILL.md)。
