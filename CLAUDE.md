# 面向 agent 的仓库说明

本文件给**在本仓库干活的 agent** 看：命令、隐性规范、踩坑点。
使用者的安装与用法见 [README.md](README.md)；贡献者流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 这是什么

11 个产品经理 skill 的集合，首尾相接成一条链路。全是 Markdown，**没有代码、没有构建、没有测试**。

```
skills/<name>/
├── SKILL.md          # 必需。agent 读它执行
├── README.md         # 必需。给人看的使用说明
├── agents/           # 可选。Codex 的 openai.yaml
├── references/       # 可选。展开文档
└── assets/           # 可选。模板、示例
```

## 常用命令

```bash
# 发布前自检（与 CI 门禁一致）
grep -rnI $'\xef\xbf\xbd' . --exclude-dir=.git && echo "发现乱码" || echo "无乱码"
grep -rnIE '(/Users/[A-Za-z0-9._-]+/|/home/[A-Za-z0-9._-]+/|[A-Za-z]:.Users.)' . --exclude-dir=.git

# 校验 frontmatter name 与目录名一致
for d in skills/*/; do
  echo "$(basename $d) -> $(sed -n '1,10p' $d/SKILL.md | grep -m1 '^name:')"
done

# 链路闭环检查：每个「下一步」指向的 skill 必须真实存在
grep -rhoE '\[`[a-z-]+`\]\(\.\./[a-z-]+/\)' skills/ | sort -u
```

仓库没有构建步骤。改完 Markdown 就是改完了，但**必须跑上面几条**。

---

## 隐性规范（不照做会被 CI 拦住，或者更糟——静默出错）

### 1. frontmatter 的 `name` 必须等于目录名

CI 的 `structure` job 会拦。不一致时 agent 的 skill 发现机制会错位。

### 2. 产物路径是硬约定

- 功能级产物 → `docs/prd/<feature-name>/`
- 产品级基线 → `docs/product/<project-name>/`

`<feature-name>` 用**小写短横线**（`user-auth`、`payment-flow`）。

链路靠这个目录约定衔接：上一个 skill 写进去，下一个 skill 直接读。**改任何 skill 的输出路径前，
先 grep 全仓库看谁在读它**。

### 3. 证据标注三分法

所有面向事实的 skill 都用同一套标记，不要自创：

| 标记 | 含义 |
|---|---|
| `[OBSERVED: URL]` / `[OBSERVED: SCREENSHOT]` | 直接可见的事实 |
| `[INFERRED]` | 合理的重建推断 |
| `[UNKNOWN]` | 输入资料无法确立，**必须写明归属人** |

**绝不允许把 `[UNKNOWN]` 编成事实**。这是本仓库所有 skill 的共同底线。

### 4. 「下一步」只能指向仓库内真实存在的 skill

这是最容易犯、也最伤的错误——读者被指去用一个他根本没有的 skill。新增或改名 skill 后，
**grep 全仓库**确认没有悬空引用：

```bash
grep -rnI "某个被删掉的-skill-名" --include="*.md" skills/
```

### 5. 不引入外部工具链依赖

本仓库的 skill **默认不依赖任何外部工具、MCP 服务或常驻进程**。可以提及某个外部工具是「可选」，
但必须写清「不装也不影响链路」，且**不得写死绝对路径**。

被允许的例外只有「绕不开的运行环境」，目前两个，都必须严格遵守下面第 7 条：

- **`product-prd-extract`**——`.docx` 是 ZIP+XML，非 Node 不可。
- **`web-design-extractor`**——要拿**计算样式**就非浏览器不可。
  这不是可有可无：实测同一页，源码里写着导航高 `64px`，浏览器量出来是 `76px`；
  源码里看不到标题字重，实测是 `500`（`700` 全页只用了 9 次）。
  **颜色类两条路线一致，尺寸与字重类源码路线基本是错的。**
  它发了一个零依赖脚本（只用 Node 内置模块），**探测不到 Node ≥ 22 或浏览器时自动退回
  源码路线**，所以不算硬依赖——退回后仍能出产物，只是在 `design.md` 里强制标注「转录边界」。

历史上这里踩过两个坑：
- `design-spec-prototyper/SKILL.md` 里写过 `/Users/<原作者>/...` 的硬编码路径（已删）
- 多个 README 引用过一批本仓库根本没有的 skill（已清）

### 6. 不写死作者本机路径

CI 门禁 2 会拦。

### 7. 需要运行环境时，必须「自检 → 自动装 → 给退路」

如果某个 skill 确实需要 Node / Python 之类，**不允许把安装步骤甩给用户**。必须写成 agent 的主动行为：

1. **先自检，不要先问用户**——自己跑 `node --version` 之类确认环境。
2. **缺依赖就直接装**，不必先征求同意，但装之前要用一句话说清在装什么、多大、装几次。
3. **装不上要给可照做的指引**——按平台（macOS / Windows / Linux）给具体命令，不要只说「请安装 Node」。
4. **必须同时给退路**——让用户有办法在不装环境的情况下继续（例如粘贴文本），并说明走了退路会损失什么
   （例如没做保真度校验、没提取内嵌图片）。

反面教材：文档里写「本 skill 需要 Node，请自行安装」。正面参照：`skills/product-prd-extract/SKILL.md`
的「依赖与自动准备」一节。

---

## 新增一个 skill 的步骤

1. 建 `skills/<name>/`，目录名用**小写短横线**。
2. 写 `SKILL.md`：frontmatter 至少 `name` + `description`；正文照现有 skill 的骨架
   （`## 使用边界` / `## 开始前` / 产物 / `## 不做什么` / `## 下一步`）。
3. `description` 要同时说清**做什么**和**什么时候用**，并写明**不适用**的情况与替代 skill。
   这段文字决定 agent 会不会选它。
4. 写 `README.md`：面向使用者，说清用途、输入、产物、不做什么。**别抄 SKILL.md**——
   README 讲「什么时候用」，SKILL.md 讲「怎么做」。
5. 如果是 Codex 也要用，加 `agents/openai.yaml`（三字段：`display_name` / `short_description` / `default_prompt`）。
6. 把它接进链路：改前一个 skill 的「下一步」和 README 的链路图，别让它成为孤儿。
7. 更新 `README.md` 和 `README.en.md` 的 skill 清单与链路图。

---

## 踩坑点

### 中文提交信息不要用 heredoc

Windows + Git Bash 会把 heredoc 里的中文写成 U+FFFD 乱码，**而且不报错**——静默进历史。

用编辑器写入仓库外的临时文件，再 `git commit -F <文件路径>`，提交后回读确认。

### 工具参数里的中文也会被吞字

不只是 heredoc。**agent 传工具参数时，中文偶发被替换成 U+FFFD**——这个仓库实测中过招的字有
「合」「的」「依赖」「完整」「且」「外」。写完文件必须复扫，提交信息也一样。

**这条不只管本仓库。** skill 在用户项目里产出的中文文档会以同样的方式中招，而用户根本不知道要扫。
所以每个会写中文产物的 skill，`## 交付前检查` 里都该带一条：

```bash
grep -rnI $'\xef\xbf\xbd' <产物目录> && echo "发现乱码，先修再交付" || echo "无乱码"
```

让 agent 交付前自己扫一遍，而不是等用户肉眼发现某个字变成了两个黑方块。

工具参数这个通道没法从源头防，只能靠**写完就扫**。CI 两道门禁合起来才覆盖全：
**门禁 1 扫工作区，门禁 4 扫提交信息**。本地推之前先跑一遍：

```bash
# 工作区
grep -rnI $'\xef\xbf\xbd' . --exclude-dir=.git --exclude-dir=node_modules

# 待推送的提交信息
for sha in $(git log --format=%H origin/main..HEAD); do
  git log -1 --format=%B "$sha" | grep -q $'\xef\xbf\xbd' && echo "❌ $sha 提交信息有乱码"
done
```

**提交信息里的乱码只能靠 `git commit --amend` + force push 修**，比改文件麻烦得多——
所以别偷懒，提交前先扫。

### 提交身份

本仓库是公开仓库，**必须先设本地身份再提交**——全局配置是公司身份，一旦进入公开历史就抹不掉：

```bash
git config --local user.name  "mingdui"
git config --local user.email "37131158+mingdui@users.noreply.github.com"
git config --local user.email   # 每次提交前回读确认
```

### 第三方内容

收录任何第三方作品前，先确认对方 **LICENSE**：

- 有许可（如 Apache-2.0 / MIT）→ 保留许可副本 + 在 [THIRD-PARTY.md](THIRD-PARTY.md) 写明来源与修改情况
- **没有 LICENSE → 默认保留全部权利，一个字都不能拷**。可以借鉴思路（思路不受著作权保护），
  但必须独立重写。**这种情况不需要在 THIRD-PARTY.md 留痕**——没有署名义务，写多了是噪音

### `prototype-html` 是第三方，不要顺手改

它原样收录自 `vagerent/prototype-html`（Apache-2.0），改动会让「原样收录」的声明失准。
要改就先更新 THIRD-PARTY.md 里的修改说明。

---

## 推送前

`git commit` / `git push` 是对外发布动作。**先确认再推**：远端地址、目标分支、提交身份、提交内容。
