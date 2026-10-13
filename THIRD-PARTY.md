# 第三方作品声明

本仓库包含或参考了以下第三方作品。所有归属与授权情况列明如下。

---

## 一、收录的第三方 Skill

### `skills/prototype-html/`

| 项 | 说明 |
|---|---|
| 来源 | [github.com/vagerent/prototype-html](https://github.com/vagerent/prototype-html) |
| 作者 | vagerent |
| 授权 | **Apache License 2.0** |
| 收录方式 | **原样收录** |
| 修改情况 | 仅修正 `README.md` 中示例图的相对路径（`prototype-html1.png` → `assets/prototype-html1.png`） |

许可副本见 [`skills/prototype-html/LICENSE`](skills/prototype-html/LICENSE)。
`SKILL.md` 与 `README.md`（除上述图片路径外）与上游逐字节一致，未作任何内容修改。

Apache License 2.0 允许在保留版权声明与许可副本的前提下再分发。
Copyright 归原作者所有；本仓库不对该 skill 主张任何权利。

> 若你是原作者，希望调整收录方式或要求移除，请提 issue，我们会立即处理。

---

## 二、参考了思路、但未收录任何文件的作品

### `skills/acceptance-checklist/`

| 项 | 说明 |
|---|---|
| 参考来源 | [github.com/beautfulmt/PM-K12--skills](https://github.com/beautfulmt/PM-K12--skills) |
| 作者 | beautfulmt |
| 授权 | **该项目未附任何开源许可证** |
| 引用方式 | **仅借鉴「按维度拆解验收项」这一思路** |

**因该项目未声明开源许可，默认保留全部权利，本仓库未复制其任何代码、文本、脚本或结构。**

具体界限：

- **借鉴的**：把验收项归入「核心流程 / 边界与异常 / UI 还原度 / 数据埋点」四个维度这一分类思路。
- **未使用的**：其 HTML 验收清单实现、三态选择器、`localStorage` 进度存储、Python 导出服务、
  Playwright 截图链路、启动器脚本、PRD 模板与校验脚本——一概没有引入。

本仓库的 `acceptance-checklist` 在正文、章节结构、产物格式（markdown 而非 HTML）和实现方式上
均为独立编写。

> 若原作者认为该思路借鉴仍需授权，请联系我们，我们会移除或按你要求的方式调整。

---

## 三、README 中推荐的可选配套工具

以下工具在本仓库文档中被提及为**可选**依赖。**它们不属于本仓库、不随本仓库分发，
也没有复制任何文件或代码**——我们只提供安装指引，版权与维护都归原作者。

| 工具 | 来源 | 授权 | 提及位置 |
|---|---|---|---|
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（Next Level Builder） | MIT | `README.md`、`README.en.md`、`docs/installation.md`、`skills/design-spec-prototyper/SKILL.md` |

它是独立项目，**需要单独安装**（见 README 的「配套推荐」一节）。
因为它是另一个插件市场里的插件，我们**故意没有**把它列进本仓库的插件市场——
引用外部插件需要 object 型 `source` 字段，而部分旧版 Claude Code 遇到这种写法
会让整个插件市场加载失败。为了少敲一条命令，不值得赌上主插件能否装上。

另外注意：该工具自带一个 Python 检索脚本，装它会引入 Python 3 依赖。
**本仓库本体仍然零依赖。**

本仓库所有 skill 的核心链路——澄清 → PRD → 压测 → 原型 → 交付 → 验收——
**不依赖任何上述外部工具**。
