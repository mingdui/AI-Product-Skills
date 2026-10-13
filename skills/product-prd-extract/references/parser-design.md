# PRD 高保真解析技术设计

## 问题定义

当前 `extract-docx.mjs` 基于 mammoth.js，存在以下保真度问题：

| 内容类型 | 当前状态 | 丢失信息 |
|---------|---------|---------|
| 文本 | ✅ 基本可用 | 文本框、SmartArt 文本 |
| 表格 | ⚠️ 基础表格可用 | 合并单元格（rowspan/colspan）、嵌套表格 |
| 图片 | ✅ 保存完整 | alt 文本、位置语义 |
| 列表 | ✅ 完整支持 | - |

## 解决方案：混合解析

### 架构

```
.docx 文件
    ↓
┌───────────────────────────────────────┐
│  Phase 1: mammoth 主解析              │
│  - 文本结构（标题、段落、列表）        │
│  - 基础表格（无合并单元格）            │
│  - 图片提取（base64 → 文件）          │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Phase 2: XML 补充解析                │
│  - JSZip 解压 .docx                   │
│  - 解析 word/document.xml             │
│  - 提取：                             │
│    • 合并单元格信息（gridSpan/vMerge）│
│    • 文本框内容（txbxContent）        │
│    • 图片 alt 文本（docPr/@descr）    │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Phase 3: 合并输出                    │
│  - 用 XML 数据增强 mammoth 输出       │
│  - 生成高保真 Markdown                │
└───────────────────────────────────────┘
```

### 关键技术点

#### 1. 合并单元格处理

Office Open XML 中的合并单元格表示：

**横向合并（gridSpan）：**
```xml
<w:tc>
  <w:tcPr>
    <w:gridSpan w:val="3"/>  <!-- 横跨 3 列 -->
  </w:tcPr>
  <w:p><w:r><w:t>合并单元格内容</w:t></w:r></w:p>
</w:tc>
```

**纵向合并（vMerge）：**
```xml
<!-- 第一行：合并起始 -->
<w:tc>
  <w:tcPr>
    <w:vMerge w:val="restart"/>
  </w:tcPr>
  <w:p><w:r><w:t>合并单元格内容</w:t></w:r></w:p>
</w:tc>

<!-- 第二行：合并继续（无内容） -->
<w:tc>
  <w:tcPr>
    <w:vMerge/>  <!-- 无 val 属性表示继续合并 -->
  </w:tcPr>
  <w:p/>
</w:tc>
```

**Markdown 表格限制：**
Markdown 不支持合并单元格，我们的策略：
- **横向合并** → 在单元格内容后添加 `[→ 跨 N 列]` 标记
- **纵向合并** → 在单元格内容后添加 `[↓ 跨 N 行]` 标记
- 被合并的空单元格填充 `—`（占位符）

#### 2. 文本框提取

文本框在 XML 中的结构：
```xml
<w:p>
  <w:r>
    <w:drawing>
      <wp:anchor>
        <a:graphic>
          <a:graphicData>
            <wps:wsp>
              <wps:txbx>
                <w:txbxContent>
                  <w:p><w:r><w:t>文本框内容</w:t></w:r></w:p>
                </w:txbxContent>
              </wps:txbx>
            </wps:wsp>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    </w:drawing>
  </w:r>
</w:p>
```

提取策略：
- 遍历所有 `<w:txbxContent>` 节点
- 提取内部的 `<w:t>` 文本
- 在 Markdown 中用引用块表示：`> [文本框] 内容`

#### 3. 图片 alt 文本

图片的 alt 文本在 `<wp:docPr>` 节点：
```xml
<w:drawing>
  <wp:inline>
    <wp:docPr id="1" name="图片1" descr="这是图片的描述文本"/>
    <a:graphic>
      <a:graphicData>
        <pic:pic>
          <pic:blipFill>
            <a:blip r:embed="rId5"/>
          </pic:blipFill>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing>
```

提取策略：
- 建立 `rId` → `alt 文本` 的映射
- mammoth 提取图片时会返回 `rId`
- 合并时用 alt 文本替换 `![]()` 中的空 alt

### 依赖

- `mammoth` — 已有依赖，主解析器
- `jszip` — 已有依赖（mammoth 的依赖），用于解压 .docx
- `xml2js` — 需新增，用于解析 XML

### 输出格式增强

**原输出（mammoth）：**
```markdown
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| A | B | C |
| D | E | F |

![](images/image-001.png)
```

**增强输出（混合解析）：**
```markdown
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| A [→ 跨 2 列] | — | C |
| D [↓ 跨 2 行] | E | F |
| — | G | H |

> [文本框] 这是文本框中的重要说明

![流程图示意](images/image-001.png)
```

## 实施步骤

1. ✅ 技术设计文档（本文件）
2. ⏳ 重写 `extract-docx.mjs`
3. ⏳ 添加单元测试（可选）
4. ⏳ 更新 SKILL.md 文档

## 风险与限制

| 风险 | 缓解措施 |
|------|---------|
| XML 解析失败 | 降级到纯 mammoth 输出，不中断流程 |
| 复杂嵌套表格 | 仅处理一层嵌套，深层嵌套标注 `[复杂表格]` |
| SmartArt 无法解析 | 标注 `[SmartArt 图形]`，建议用户手动补充 |
| 性能开销 | XML 解析是流式的，对 < 10MB 文档影响 < 1s |

## 后续优化方向

- **Phase 4：视觉补充** — 对于 SmartArt、复杂图表，用 LibreOffice 转 PDF 截图，让 Claude 视觉能力补充
- **Phase 5：语义增强** — 识别表格类型（字段定义表 vs 权限矩阵），自动添加语义标签
