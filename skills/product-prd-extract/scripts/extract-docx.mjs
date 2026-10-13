#!/usr/bin/env node

/**
 * PRD Word 文档高保真解析脚本（v2 — 混合解析）
 *
 * 策略：mammoth 主解析 + JSZip/XML 补充解析
 *   - mammoth：文本结构、列表、基础表格、图片提取
 *   - XML 补充：合并单元格、文本框、图片 alt 文本
 *
 * 用法：node extract-docx.mjs <docx文件路径> [--output-dir <输出目录>]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, basename, extname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// ============================================================
// 依赖加载（需先执行 npm install）
// ============================================================

function loadDependency(pkg) {
  try {
    return require(pkg);
  } catch {
    console.error(`[extract-docx] 缺少依赖: ${pkg}`);
    console.error(`[extract-docx] 请先执行: npm --prefix "${__dirname}" install`);
    process.exit(1);
  }
}

// ============================================================
// 参数解析
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  let docxPath = null;
  let outputDir = null;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output-dir" && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === "--quiet") {
      quiet = true;
    } else if (!args[i].startsWith("-")) {
      docxPath = args[i];
    }
  }

  if (!docxPath) {
    console.error("用法: node extract-docx.mjs <docx文件路径> [--output-dir <输出目录>] [--quiet]");
    process.exit(1);
  }

  const resolvedPath = resolve(docxPath);
  if (!existsSync(resolvedPath)) {
    console.error(`文件不存在: ${resolvedPath}`);
    process.exit(1);
  }

  if (!outputDir) {
    const name = basename(docxPath, extname(docxPath));
    outputDir = join(dirname(resolvedPath), `${name}-extracted`);
  }

  return { docxPath: resolvedPath, outputDir: resolve(outputDir), quiet };
}

// ============================================================
// Phase 1: mammoth 主解析 — 图片提取
// ============================================================

function setupImageExtraction(outputDir) {
  const imageDir = join(outputDir, "images");
  let imageIndex = 0;
  const imageMap = new Map();

  return {
    imageDir,
    imageMap,
    convertImage: (element) => {
      return element.read("base64").then((base64) => {
        imageIndex++;
        const contentType = element.contentType || "image/png";
        const ext = contentType.split("/")[1] || "png";
        const filename = `image-${String(imageIndex).padStart(3, "0")}.${ext}`;
        const filepath = join(imageDir, filename);

        if (!existsSync(imageDir)) {
          mkdirSync(imageDir, { recursive: true });
        }
        writeFileSync(filepath, Buffer.from(base64, "base64"));

        const relativePath = `images/${filename}`;
        imageMap.set(imageIndex, { path: relativePath, alt: "" });

        return { src: relativePath };
      });
    },
  };
}

// ============================================================
// Phase 2: XML 补充解析
// ============================================================

// --- XML 工具函数 ---

/** 递归查找所有匹配标签名的节点（支持带命名空间的标签） */
function findAllNodes(node, tagName) {
  const results = [];
  if (!node || typeof node !== "object") return results;

  for (const key of Object.keys(node)) {
    if (key === tagName) {
      const val = node[key];
      if (Array.isArray(val)) results.push(...val);
      else results.push(val);
    }
    // 递归子节点
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        results.push(...findAllNodes(item, tagName));
      }
    } else if (typeof child === "object" && child !== null) {
      results.push(...findAllNodes(child, tagName));
    }
  }
  return results;
}

/** 从节点中提取所有 w:t 文本，拼接为字符串 */
function extractText(node) {
  if (!node || typeof node !== "object") return "";
  const texts = [];

  for (const key of Object.keys(node)) {
    if (key === "w:t") {
      const val = node[key];
      if (Array.isArray(val)) {
        for (const t of val) {
          if (typeof t === "string") texts.push(t);
          else if (t && t._ !== undefined) texts.push(String(t._));
          else if (t && typeof t === "object" && Object.keys(t).length === 0) texts.push("");
        }
      } else if (typeof val === "string") {
        texts.push(val);
      } else if (val && val._ !== undefined) {
        texts.push(String(val._));
      }
    }
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        texts.push(extractText(item));
      }
    } else if (typeof child === "object" && child !== null && key !== "w:t") {
      texts.push(extractText(child));
    }
  }
  return texts.join("");
}

/** 获取属性值（xml2js 将属性放在 $ 对象中） */
function getAttr(node, attrName) {
  if (!node || !node.$) return undefined;
  return node.$[attrName];
}

// --- 2a: 解析合并单元格表格 ---

function parseTablesFromXml(docXml) {
  const tables = [];
  const tblNodes = findAllNodes(docXml, "w:tbl");

  for (const tbl of tblNodes) {
    const rows = [];
    const trNodes = Array.isArray(tbl["w:tr"]) ? tbl["w:tr"] : tbl["w:tr"] ? [tbl["w:tr"]] : [];

    for (const tr of trNodes) {
      const cells = [];
      const tcNodes = Array.isArray(tr["w:tc"]) ? tr["w:tc"] : tr["w:tc"] ? [tr["w:tc"]] : [];

      for (const tc of tcNodes) {
        const tcPr = tc["w:tcPr"] ? (Array.isArray(tc["w:tcPr"]) ? tc["w:tcPr"][0] : tc["w:tcPr"]) : {};

        // 横向合并
        let gridSpan = 1;
        const gsNode = tcPr["w:gridSpan"] ? (Array.isArray(tcPr["w:gridSpan"]) ? tcPr["w:gridSpan"][0] : tcPr["w:gridSpan"]) : null;
        if (gsNode) {
          gridSpan = parseInt(getAttr(gsNode, "w:val") || "1", 10);
        }

        // 纵向合并
        let vMerge = "none"; // "none" | "restart" | "continue"
        const vmNode = tcPr["w:vMerge"] ? (Array.isArray(tcPr["w:vMerge"]) ? tcPr["w:vMerge"][0] : tcPr["w:vMerge"]) : null;
        if (vmNode !== null && vmNode !== undefined) {
          const vmVal = getAttr(vmNode, "w:val");
          vMerge = vmVal === "restart" ? "restart" : "continue";
        }

        const text = extractText(tc).trim();
        cells.push({ text, gridSpan, vMerge });
      }
      rows.push(cells);
    }
    tables.push(rows);
  }
  return tables;
}

// --- 2b: 解析文本框 ---

function parseTextBoxesFromXml(docXml) {
  const textBoxes = [];
  const txbxNodes = findAllNodes(docXml, "w:txbxContent");

  for (const txbx of txbxNodes) {
    const text = extractText(txbx).trim();
    if (text) {
      textBoxes.push(text);
    }
  }
  return textBoxes;
}

// --- 2c: 解析图片 alt 文本 ---

function parseImageAltTextsFromXml(docXml) {
  const altMap = new Map();
  const docPrNodes = findAllNodes(docXml, "wp:docPr");

  for (const docPr of docPrNodes) {
    const descr = getAttr(docPr, "descr") || "";
    const name = getAttr(docPr, "name") || "";
    const id = getAttr(docPr, "id");
    if (id && (descr || name)) {
      altMap.set(id, descr || name);
    }
  }
  return altMap;
}

// ============================================================
// Phase 3: 合并输出 — Markdown 生成
// ============================================================

// --- 3a: 表格转 Markdown（支持合并单元格） ---

function tableToMarkdown(tableRows) {
  if (!tableRows || tableRows.length === 0) return "";

  // 第一步：展开 gridSpan，构建逻辑网格
  const maxCols = Math.max(...tableRows.map((row) =>
    row.reduce((sum, cell) => sum + cell.gridSpan, 0)
  ));

  // 构建网格（处理横向合并）
  const grid = [];
  for (const row of tableRows) {
    const gridRow = [];
    for (const cell of row) {
      gridRow.push({
        text: cell.text,
        gridSpan: cell.gridSpan,
        vMerge: cell.vMerge,
        isPlaceholder: false,
      });
      // 横向合并的占位单元格
      for (let i = 1; i < cell.gridSpan; i++) {
        gridRow.push({
          text: "",
          gridSpan: 1,
          vMerge: cell.vMerge,
          isPlaceholder: true,
          hMergePlaceholder: true,
        });
      }
    }
    // 补齐列数
    while (gridRow.length < maxCols) {
      gridRow.push({ text: "", gridSpan: 1, vMerge: "none", isPlaceholder: true });
    }
    grid.push(gridRow);
  }

  // 第二步：处理纵向合并，计算跨行数
  for (let col = 0; col < maxCols; col++) {
    let mergeStart = -1;
    for (let row = 0; row < grid.length; row++) {
      if (col >= grid[row].length) continue;
      const cell = grid[row][col];

      if (cell.vMerge === "restart") {
        mergeStart = row;
      } else if (cell.vMerge === "continue" && mergeStart >= 0) {
        cell.isPlaceholder = true;
        cell.vMergePlaceholder = true;
      } else {
        // 计算上一个合并区域的跨行数
        if (mergeStart >= 0 && mergeStart < row) {
          const span = row - mergeStart;
          if (span > 1 && col < grid[mergeStart].length) {
            grid[mergeStart][col].vMergeSpan = span;
          }
        }
        mergeStart = -1;
      }
    }
    // 处理最后一个合并区域
    if (mergeStart >= 0 && mergeStart < grid.length) {
      const span = grid.length - mergeStart;
      if (span > 1 && col < grid[mergeStart].length) {
        grid[mergeStart][col].vMergeSpan = span;
      }
    }
  }

  // 第三步：生成 Markdown
  let md = "\n";
  for (let rowIdx = 0; rowIdx < grid.length; rowIdx++) {
    const row = grid[rowIdx];
    const cells = row.map((cell) => {
      if (cell.vMergePlaceholder) return "↑";
      if (cell.hMergePlaceholder) return "←";

      let text = cell.text || "";
      // 添加合并标记
      const marks = [];
      if (cell.gridSpan > 1) marks.push(`→跨${cell.gridSpan}列`);
      if (cell.vMergeSpan > 1) marks.push(`↓跨${cell.vMergeSpan}行`);
      if (marks.length > 0) text += ` [${marks.join(", ")}]`;

      return text;
    });

    md += "| " + cells.join(" | ") + " |\n";

    // 表头分隔行
    if (rowIdx === 0) {
      md += "| " + cells.map(() => "---").join(" | ") + " |\n";
    }
  }
  return md + "\n";
}

// --- 3b: HTML 后处理（mammoth 输出 → Markdown） ---

function postProcessMarkdown(html, xmlTables, textBoxes, imageAltMap, mammothImageMap) {
  let md = html;

  // HTML 标签转 Markdown
  md = md.replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n");
  md = md.replace(/<h4>(.*?)<\/h4>/gi, "\n#### $1\n");
  md = md.replace(/<h5>(.*?)<\/h5>/gi, "\n##### $1\n");
  md = md.replace(/<h6>(.*?)<\/h6>/gi, "\n###### $1\n");
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p>(.*?)<\/p>/gis, "$1\n\n");

  // 列表
  md = md.replace(/<ul>/gi, "\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<ol>/gi, "\n");
  md = md.replace(/<\/ol>/gi, "\n");
  md = md.replace(/<li>(.*?)<\/li>/gis, "- $1\n");

  // 图片：增强 alt 文本
  let imgIdx = 0;
  md = md.replace(/<img\s+[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
    imgIdx++;
    // 尝试从 XML 解析的 alt 文本中匹配
    let alt = "";
    for (const [id, altText] of imageAltMap.entries()) {
      if (parseInt(id) === imgIdx) {
        alt = altText;
        break;
      }
    }
    // 也检查 mammoth 的 imageMap
    if (!alt && mammothImageMap.has(imgIdx)) {
      alt = mammothImageMap.get(imgIdx).alt || "";
    }
    return `\n![${alt}](${src})\n`;
  });

  // 表格：用 XML 解析的高保真表格替换 mammoth 的 HTML 表格
  if (xmlTables.length > 0) {
    let tableIdx = 0;
    md = md.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, () => {
      if (tableIdx < xmlTables.length) {
        const table = xmlTables[tableIdx++];
        return tableToMarkdown(table);
      }
      return "";
    });
  } else {
    // 降级：用原来的 HTML 表格转换
    md = convertHtmlTablesToMarkdown(md);
  }

  // 清理残留 HTML 标签
  md = md.replace(/<[^>]+>/g, "");

  // 追加文本框内容
  if (textBoxes.length > 0) {
    md += "\n\n---\n\n## 文本框内容\n\n";
    md += "_以下内容提取自文档中的文本框，可能包含重要说明、注释或补充信息：_\n\n";
    for (let i = 0; i < textBoxes.length; i++) {
      md += `> **[文本框 ${i + 1}]** ${textBoxes[i]}\n\n`;
    }
  }

  // 清理多余空行
  md = md.replace(/\n{3,}/g, "\n\n");

  // HTML 实体
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  return md.trim();
}

// --- 降级用：原始 HTML 表格转换（无合并单元格信息） ---

function convertHtmlTablesToMarkdown(html) {
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;

  return html.replace(tableRegex, (match, tableContent) => {
    const rows = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        let cellText = cellMatch[1].replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim();
        cells.push(cellText);
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length === 0) return "";

    const maxCols = Math.max(...rows.map((r) => r.length));
    rows.forEach((row) => {
      while (row.length < maxCols) row.push("");
    });

    let mdTable = "\n";
    mdTable += "| " + rows[0].join(" | ") + " |\n";
    mdTable += "| " + rows[0].map(() => "---").join(" | ") + " |\n";
    for (let i = 1; i < rows.length; i++) {
      mdTable += "| " + rows[i].join(" | ") + " |\n";
    }
    return mdTable + "\n";
  });
}

// ============================================================
// Phase 4: 保真度校验
// ============================================================

/** 从 XML 提取统计指标 */
function extractXmlMetrics(docXml, xmlTables, textBoxes, imageAltMap) {
  try {
    // 表格统计
    const tableCount = xmlTables.length;
    const totalCells = xmlTables.reduce((sum, table) => {
      return sum + table.reduce((rowSum, row) => rowSum + row.length, 0);
    }, 0);

    // 图片统计：通过 blip 节点计数（比 alt 更准确）
    const blipNodes = findAllNodes(docXml, "a:blip");
    const imageCount = blipNodes.length || imageAltMap.size;

    // 标题统计（w:pStyle 中包含 Heading 或 标题）
    const pNodes = findAllNodes(docXml, "w:p");
    let headingCount = 0;
    for (const p of pNodes) {
      const pPr = p["w:pPr"];
      if (!pPr) continue;
      const pPrObj = Array.isArray(pPr) ? pPr[0] : pPr;
      if (!pPrObj) continue;
      const pStyle = pPrObj["w:pStyle"];
      if (!pStyle) continue;
      const styleNode = Array.isArray(pStyle) ? pStyle[0] : pStyle;
      const styleVal = getAttr(styleNode, "w:val") || "";
      if (/heading|标题/i.test(styleVal)) {
        headingCount++;
      }
    }

    // 段落统计（所有 w:p 节点）
    const paragraphCount = pNodes.length;

    // 文本框统计
    const textBoxCount = textBoxes.length;

    // 总文本长度
    const totalText = extractText(docXml);
    const textLength = totalText.length;

    return { tableCount, totalCells, imageCount, headingCount, paragraphCount, textBoxCount, textLength };
  } catch (err) {
    console.error(`[extract-docx] XML 指标提取失败: ${err.message}`);
    return null;
  }
}

/** 从 Markdown 提取统计指标 */
function extractMarkdownMetrics(markdown) {
  try {
    const lines = markdown.split("\n");

    // 表格统计（| --- | 分隔行）
    const tableCount = lines.filter((l) => /^\|\s*-{3,}/.test(l.trim())).length;

    // 图片统计（![）
    const imageCount = (markdown.match(/!\[/g) || []).length;

    // 标题统计（# 开头）
    const headingCount = lines.filter((l) => /^#{1,6}\s/.test(l.trim())).length;

    // 段落统计（非空行块，排除标题/表格/图片/引用/列表行）
    let paragraphCount = 0;
    let inParagraph = false;
    for (const line of lines) {
      const t = line.trim();
      if (t.length > 0 && !/^(#{1,6}\s|\||!\[|>\s|[-*]\s|---)/.test(t)) {
        if (!inParagraph) { paragraphCount++; inParagraph = true; }
      } else if (t.length === 0) {
        inParagraph = false;
      }
    }

    // 文本框统计（> **[文本框）
    const textBoxCount = (markdown.match(/>\s*\*\*\[文本框/g) || []).length;

    // 总文本长度
    const textLength = markdown.length;

    return { tableCount, imageCount, headingCount, paragraphCount, textBoxCount, textLength };
  } catch (err) {
    console.error(`[extract-docx] Markdown 指标提取失败: ${err.message}`);
    return null;
  }
}

/** 生成保真度报告 */
function generateFidelityReport(docXml, markdown, xmlTables, textBoxes, imageAltMap, outputDir, imageMap) {
  console.error(`\n[extract-docx] Phase 4: 保真度校验...`);

  if (!docXml) {
    const skipMsg = "保真度校验跳过（XML 解析失败）";
    console.error(`[extract-docx]   ${skipMsg}`);
    try { writeFileSync(join(outputDir, "fidelity-report.txt"), skipMsg, "utf-8"); } catch {}
    return;
  }

  const xmlM = extractXmlMetrics(docXml, xmlTables, textBoxes, imageAltMap);
  const mdM = extractMarkdownMetrics(markdown);

  if (!xmlM || !mdM) {
    const skipMsg = "保真度校验跳过（指标提取失败）";
    console.error(`[extract-docx]   ${skipMsg}`);
    try { writeFileSync(join(outputDir, "fidelity-report.txt"), skipMsg, "utf-8"); } catch {}
    return;
  }

  const rate = (actual, expected) => {
    if (expected === 0) return actual === 0 ? 100 : 100;
    return Math.min(Math.round((actual / expected) * 100), 100);
  };

  const extractedImageCount = imageMap?.size || 0;
  const referencedImageCount = mdM.imageCount;

  const extractionMetrics = [
    { name: "图片文件", actual: extractedImageCount, expected: xmlM.imageCount },
    { name: "表格", actual: xmlM.tableCount, expected: xmlM.tableCount },
    { name: "文本长度", actual: mdM.textLength, expected: xmlM.textLength, unit: " 字符" },
  ];

  const consumableMetrics = [
    { name: "图片引用", actual: referencedImageCount, expected: extractedImageCount },
    { name: "标题", actual: mdM.headingCount, expected: xmlM.headingCount },
    { name: "文本框", actual: mdM.textBoxCount, expected: xmlM.textBoxCount },
    { name: "段落", actual: mdM.paragraphCount, expected: xmlM.paragraphCount },
  ];

  const extractionRates = extractionMetrics.map((m) => rate(m.actual, m.expected));
  const consumableRates = consumableMetrics.map((m) => rate(m.actual, m.expected));

  const extractionScore = Math.round(extractionRates.reduce((s, r) => s + r, 0) / extractionRates.length);
  const consumableScore = Math.round(consumableRates.reduce((s, r) => s + r, 0) / consumableRates.length);
  const score = Math.round((extractionScore * 0.6) + (consumableScore * 0.4));

  const lines = [];
  lines.push("========================================");
  lines.push("保真度校验报告");
  lines.push("========================================");
  lines.push("");
  lines.push("层 1：提取完整性");

  for (const m of extractionMetrics) {
    const r = rate(m.actual, m.expected);
    const icon = r >= 90 ? "✅" : r >= 70 ? "⚠️ " : "❌";
    const suffix = m.unit || "";
    lines.push(`${icon} ${m.name}: ${m.actual}/${m.expected}${suffix} (${r}%)`);
  }

  lines.push("");
  lines.push("层 2：Markdown 可消费性");

  for (const m of consumableMetrics) {
    const r = rate(m.actual, m.expected);
    const icon = r >= 90 ? "✅" : r >= 70 ? "⚠️ " : "❌";
    lines.push(`${icon} ${m.name}: ${m.actual}/${m.expected} (${r}%)`);
  }

  const hardFailures = [];
  if (rate(extractedImageCount, xmlM.imageCount) < 90) {
    hardFailures.push("图片文件提取率 < 90%", `实际 ${extractedImageCount}/${xmlM.imageCount}`);
  }
  if (rate(referencedImageCount, extractedImageCount) < 90) {
    hardFailures.push("图片引用率 < 90%", `实际 ${referencedImageCount}/${extractedImageCount}`);
  }
  if (rate(xmlM.tableCount, xmlM.tableCount) < 90) {
    hardFailures.push("表格提取率 < 90%", `实际 ${xmlM.tableCount}/${xmlM.tableCount}`);
  }

  lines.push("");
  lines.push(`提取完整性评分: ${extractionScore}/100`);
  lines.push(`Markdown 可消费性评分: ${consumableScore}/100`);
  lines.push(`综合评分: ${score}/100`);

  const risks = [];
  if (rate(extractedImageCount, xmlM.imageCount) < 90) {
    risks.push(`- ${xmlM.imageCount - extractedImageCount} 张图片文件未成功提取（可能是嵌入式图表或 OLE 对象）`);
  }
  if (rate(referencedImageCount, extractedImageCount) < 90) {
    risks.push(`- ${extractedImageCount - referencedImageCount} 张图片已提取但未在 Markdown 中引用`);
  }
  if (rate(mdM.textLength, xmlM.textLength) < 90) {
    risks.push(`- 文本长度保留不足，可能存在 SmartArt / 文本框内容丢失`);
  }
  if (rate(mdM.paragraphCount, xmlM.paragraphCount) < 60) {
    risks.push(`- 段落结构保留较低，该指标仅作参考，不单独决定是否通过`);
  }

  if (hardFailures.length > 0) {
    lines.push("");
    lines.push("硬门槛告警：");
    for (let i = 0; i < hardFailures.length; i += 2) {
      lines.push(`❌ ${hardFailures[i]}（${hardFailures[i + 1]}）`);
    }
  }

  if (risks.length > 0) {
    lines.push("");
    lines.push("风险提示：");
    lines.push(...risks);
  }

  lines.push("");
  if (score >= 90 && hardFailures.length === 0) {
    lines.push("结论：✅ 可直接进入结构化提取");
  } else if (score >= 70 && hardFailures.length === 0) {
    lines.push("结论：⚠️ 建议检查告警项后继续");
  } else {
    lines.push("结论：❌ 需要人工介入后再继续");
  }

  lines.push("========================================");

  const report = lines.join("\n");
  console.error(report);

  try {
    writeFileSync(join(outputDir, "fidelity-report.txt"), report, "utf-8");
    console.error(`[extract-docx]   报告已保存: ${join(outputDir, "fidelity-report.txt")}`);
  } catch (err) {
    console.error(`[extract-docx]   保真度报告保存失败: ${err.message}`);
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const { docxPath, outputDir, quiet } = parseArgs();

  const mammothModule = loadDependency("mammoth");
  const mammoth = mammothModule.default || mammothModule;

  const jszipModule = loadDependency("jszip");
  const JSZip = jszipModule.default || jszipModule;

  const xml2jsModule = loadDependency("xml2js");
  const xml2js = xml2jsModule.default || xml2jsModule;

  console.error(`[extract-docx] 解析文件: ${docxPath}`);
  console.error(`[extract-docx] 输出目录: ${outputDir}`);
  console.error(`[extract-docx] 模式: 混合解析（mammoth + XML 补充）`);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const buffer = readFileSync(docxPath);

  // ---- Phase 1: mammoth 主解析 ----
  console.error(`[extract-docx] Phase 1: mammoth 主解析...`);
  const { imageDir, imageMap, convertImage } = setupImageExtraction(outputDir);

  const mammothResult = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(convertImage),
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='标题 1'] => h1:fresh",
        "p[style-name='标题 2'] => h2:fresh",
        "p[style-name='标题 3'] => h3:fresh",
        "p[style-name='标题 4'] => h4:fresh",
      ],
    }
  );

  // ---- Phase 2: XML 补充解析 ----
  console.error(`[extract-docx] Phase 2: XML 补充解析...`);
  let xmlTables = [];
  let textBoxes = [];
  let imageAltMap = new Map();
  let xmlBody = null; // 保留引用，供 Phase 4 校验使用

  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlStr = await zip.file("word/document.xml").async("string");
    const docXml = await xml2js.parseStringPromise(docXmlStr, {
      explicitArray: false,
      preserveChildrenOrder: true,
    });

    xmlBody = docXml["w:document"]?.["w:body"] || {};
    xmlTables = parseTablesFromXml(xmlBody);
    textBoxes = parseTextBoxesFromXml(xmlBody);
    imageAltMap = parseImageAltTextsFromXml(xmlBody);

    console.error(`[extract-docx]   表格: ${xmlTables.length} 个（含合并单元格信息）`);
    console.error(`[extract-docx]   文本框: ${textBoxes.length} 个`);
    console.error(`[extract-docx]   图片 alt: ${imageAltMap.size} 个`);
  } catch (xmlErr) {
    console.error(`[extract-docx]   XML 补充解析失败，降级到纯 mammoth: ${xmlErr.message}`);
  }

  // ---- Phase 3: 合并输出 ----
  console.error(`[extract-docx] Phase 3: 合并输出...`);
  const markdown = postProcessMarkdown(
    mammothResult.value,
    xmlTables,
    textBoxes,
    imageAltMap,
    imageMap
  );

  const mdPath = join(outputDir, "content.md");
  writeFileSync(mdPath, markdown, "utf-8");
  if (!quiet) {
    console.log(markdown);
  }

  // ---- Phase 4: 保真度校验 ----
  generateFidelityReport(xmlBody, markdown, xmlTables, textBoxes, imageAltMap, outputDir, imageMap);

  // 汇总
  console.error(`\n[extract-docx] 提取完成:`);
  console.error(`  - Markdown: ${mdPath}`);
  console.error(`  - 图片数量: ${imageMap.size}`);
  if (imageMap.size > 0) console.error(`  - 图片目录: ${imageDir}`);
  console.error(`  - 表格数量: ${xmlTables.length}（高保真模式）`);
  console.error(`  - 文本框数量: ${textBoxes.length}`);
  if (mammothResult.messages?.length > 0) {
    console.error(`  - 警告信息:`);
    mammothResult.messages.forEach((msg) => console.error(`    ${msg.type}: ${msg.message}`));
  }
}

main().catch((err) => {
  console.error(`[extract-docx] 错误: ${err.message}`);
  process.exit(1);
});
