# 贡献指南

欢迎提 issue 和 PR。本仓库全是 Markdown，没有构建、没有依赖、没有测试套件——门槛很低，但有几条硬规矩。

> **skill 的具体编写规范（frontmatter、章节骨架、产物路径、证据标注）见 [CLAUDE.md](CLAUDE.md)。**
> 本文件只讲贡献流程；写 skill 前请先读 CLAUDE.md，避免两份文档各说一套。

---

## 环境要求

无。不需要 Node、Python 或任何运行环境。

本地校验只需要 `git` 和 `grep`——仓库的 CI 也只用了这两样。

---

## 仓库结构

```text
.
├── .claude-plugin/          # 插件清单（marketplace.json + plugin.json）
├── .github/workflows/       # CI：乱码、个人路径、内部标识、skills 结构
├── docs/                    # 安装说明、链路详解
├── skills/<name>/           # 11 个 skill，每个自包含
│   ├── SKILL.md             # 必需
│   ├── README.md            # 必需
│   ├── agents/              # 可选（Codex）
│   ├── references/          # 可选
│   └── assets/              # 可选
├── CHANGELOG.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md / README.en.md
└── THIRD-PARTY.md
```

---

## 提交规范

格式 `<type>: <描述>`，首行祈使句、不超过 72 字符。一个提交只做一件事。

| type | 用于 |
|---|---|
| `feat` | 新增 skill 或新增能力 |
| `fix` | 修 skill 里的错误行为、错误路径、悬空引用 |
| `docs` | 只改文档 |
| `refactor` | 不改行为的重构（改名、重排、抽公共说明） |
| `ci` | CI / 构建 |
| `chore` | 其他 |

末尾固定带署名：

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

破坏性变更（比如给某个 skill 改名、改了产物路径）在正文说明，并同步更新 `CHANGELOG.md`。

### ⚠️ 中文提交信息不要用 heredoc

Windows + Git Bash 会把 heredoc 里的中文写成 U+FFFD 乱码，**而且不报错**——静默进历史。

```bash
# 用编辑器把提交信息写到仓库外的临时文件，然后：
git commit -F <文件路径>
rm <文件路径>

# 提交后回读确认
git log -1 --format=%B
```

### ⚠️ 先设本地 git 身份

本仓库是公开仓库。**全局配置可能是你的公司身份**，一旦进入公开提交历史就抹不掉——force push 也改不了已被 fork 的副本。

```bash
git config --local user.name  "mingdui"
git config --local user.email "37131158+mingdui@users.noreply.github.com"
git config --local user.email   # 每次提交前回读确认
```

---

## 提交前自检

与 CI 门禁一致，本地先跑一遍：

```bash
# 1. 乱码
grep -rnI $'\xef\xbf\xbd' . --exclude-dir=.git && echo "发现乱码" || echo "无乱码"

# 2. 个人绝对路径
grep -rnIE '(/Users/[A-Za-z0-9._-]+/|/home/[A-Za-z0-9._-]+/|[A-Za-z]:.Users.)' . --exclude-dir=.git

# 3. skills 结构：每个目录有 SKILL.md，且 frontmatter name 等于目录名
for d in skills/*/; do
  printf '%s -> %s\n' "$(basename $d)" "$(sed -n '1,10p' $d/SKILL.md | grep -m1 '^name:')"
done

# 4. 暂存内容与预期一致
git status --short
```

---

## 新增一个 Skill

**步骤清单见 [CLAUDE.md](CLAUDE.md) 的「新增一个 skill 的步骤」**。流程之外，PR 里请额外说明：

- 它接在链路的哪个位置？前一个 skill 的「下一步」改了没有？
- 它和已有 skill 会不会功能重叠？重叠的话分工边界画在哪？
- `README.md` / `README.en.md` 的清单和链路图更新了没有？

**最容易犯的错是让它变成孤儿**——新 skill 写得很完整，但没有任何 skill 指向它，读者永远发现不了它。

---

## 第三方内容

收录任何第三方作品前，先确认对方的 **LICENSE**：

| 对方许可情况 | 你能做的 |
|---|---|
| 有 MIT / Apache-2.0 等许可 | 可收录。**必须**保留许可副本，并在 [THIRD-PARTY.md](THIRD-PARTY.md) 写明来源、授权、修改情况 |
| **没有任何 LICENSE** | **默认保留全部权利，一个字都不能拷。**只能借鉴思路，且必须独立重写。**不需要在 THIRD-PARTY.md 留痕**——思路不受著作权保护，没有署名义务 |

涉及第三方作品的 PR，请在描述里附上对方仓库地址和 LICENSE 链接。

---

## PR 流程

1. Fork 或从 `main` 开分支。
2. 改完跑一遍上面的自检。
3. 提交（信息格式见上）。
4. 开 PR，描述里说清**改了什么、为什么改、怎么验证的**。
5. CI 的门禁必须全绿。

CI 会拦四件事：U+FFFD 乱码、个人绝对路径、内部标识哨兵词（需仓库变量 `INTERNAL_SENTINELS`）、
`skills/` 结构（frontmatter `name` 必须等于目录名）。
