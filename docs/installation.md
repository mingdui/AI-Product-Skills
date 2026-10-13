# 安装

三种方式，按你用的 agent 选择。**12 个里有 11 个是自包含的 Markdown 文件**——没有依赖、没有脚本、没有需要常驻的进程。

## 前置条件

**对 11 个 skill 而言：无。** 不需要 Node、Python 或任何运行环境。

唯一的例外是 `product-prd-extract`（解析 Word `.docx`），它需要 Node.js ≥ 20 和三个解析库。

**但这一步不用你手动做。** 第一次拿 `.docx` 用这个 skill 时，agent 会自己跑完这套准备：

| 它会做什么 | 说明 |
|---|---|
| 1. 查 Node | `node --version`，要求 ≥ 20 |
| 2. 装依赖 | 没有就自己装（`mammoth` / `jszip` / `xml2js`，几 MB，装一次永久有效）。装之前会先用一句话告诉你它在装什么 |
| 3. 装不上就引导 | 给你对应平台的安装命令（macOS / Windows / Linux），**并同时给出退路** |
| 4. 退路 | 把 Word 内容复制粘贴过来，后面的结构化流程完全一样——只是文档里内嵌的图片要你自己截图保存 |

想手动装也行：

```bash
npm --prefix "<本 skill 目录>/scripts" install
```

除了它，整个仓库零依赖。

唯一的前提是你的 agent 支持 skills（Claude Code、Codex 等），并且能看到 `SKILL.md` 里的 frontmatter。

---

## 方式一：Claude Code 插件市场（推荐）

```bash
# 添加本仓库为插件市场
/plugin marketplace add mingdui/AI-Product-Skills

# 安装
/plugin install ai-product-skills
```

装完后 12 个 skill 全部可用，用斜杠命令直接调：

```
/requirement-clarify
/prd-write
/grill-with-prd
/acceptance-checklist
```

**卸载**：`/plugin uninstall ai-product-skills`

---

## 方式二：npx skills

```bash
npx skills add mingdui/AI-Product-Skills
```

这条命令会发现仓库 `skills/` 下的所有 skill 并装进你的 agent。

只想装其中几个时，进仓库后按目录单独拷：

```bash
npx skills add mingdui/AI-Product-Skills/skills/prd-write
```

---

## 方式三：手动拷贝

把你要用的 skill 目录整个拷进目标位置：

| 目标 | 位置 |
|---|---|
| 单项目 | `<你的项目>/.claude/skills/<skill-name>/` |
| 全局 | `~/.claude/skills/<skill-name>/` |
| Codex | `~/.codex/skills/<skill-name>/` |

```bash
cp -r skills/prd-write ~/.claude/skills/
```

拷一个目录就够——`SKILL.md` 是入口，`README.md` 给人看，`references/`、`assets/`、`agents/` 是可选增强。

---

## 装完验证

调一个不产生任何文件、只做检查的 skill：

```
/grill-with-prd
```

它应该先问你 PRD 的 feature-name，而不是报「未知命令」。

也可以直接在对话里说「用 requirement-clarify 帮我梳理这个需求」，agent 应能自己选中对应 skill。

---

## 用在哪

这些 skill 的产物统一落在**你项目的** `docs/` 下：

```text
<你的项目>/
├── docs/
│   ├── prd/<feature-name>/       # 按功能归档，链路各环节的产物都在这
│   │   ├── clarify.md
│   │   ├── prd.md
│   │   ├── design.md
│   │   ├── prototype.html
│   │   ├── delivery.md
│   │   └── acceptance.md
│   └── product/<project-name>/   # 产品级体验基线（C 端 / Admin 分治）
└── ...你的代码
```

所以**在一个真实项目里用**，而不是在随便一个空目录里跑——`context-to-prd` 和 `prd-write` 都需要读代码库才能用好。

---

## 常见问题

**斜杠命令名和文档里写的不一样？**

不同 agent 对 skill 名的解析规则不同（有的会加插件前缀，例如 `/ai-product-skills:prd-write`）。以你 agent 的补全提示为准。

**能只用其中一个 skill 吗？**

可以。链路是「从哪一步进都行」。只装 `acceptance-checklist`，配一份已有的 `prd.md`，也能用。

**需要装 `ui-ux-pro-max` 吗？**

不需要。它只在 `design-spec-prototyper` 遇到设计规格不完整时作为**可选**补充。没装就依据你的产品体验基线判断，skill 会要求标注哪些决定缺少依据。

想装的话，它是独立项目（MIT 授权），和本仓库分开安装：

```bash
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max
```

```bash
# 也可以走 npx
npx skills add nextlevelbuilder/ui-ux-pro-max-skill
```

注意它自带一个 Python 检索脚本（`scripts/search.py`），所以这条路需要本机有 Python 3。这是它自己引入的依赖，与本站无关——**本站除 `product-prd-extract` 需要 Node 外，其余全部零依赖**。

> 本仓库的插件市场里**故意没有**列入它。引用外部插件需要 object 型 `source` 字段，
> 部分旧版 Claude Code 遇到这种写法会连整个市场一起加载失败。为了少一条命令不值得冒这个险。

**产物会不会被覆写？**

不会。各 skill 的规则都是：目录已存在则复用，同名文件不覆盖（`web-design-extractor` 遇到已有 `design.md` 会改写成 `design-extracted.md`）。
