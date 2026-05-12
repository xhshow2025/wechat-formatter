import { templates } from "./templates";

export interface ParsedContent {
  type: "h1" | "h2" | "h3" | "paragraph" | "quote" | "code" | "ul" | "ol" | "hr" | "image" | "table";
  content: string;
  items?: string[];
}

export interface ParsedArticle {
  title: string;
  blocks: ParsedContent[];
}

type HeadingLevel = "h1" | "h2" | "h3";

// 解析行内格式：加粗、斜体、行内代码、内联颜色
function parseInlineFormatting(text: string): string {
  // 浏览器 execCommand("foreColor") 常生成 font 标签，转成微信更稳定的内联 span。
  text = text.replace(/<font\s+color=["']?([^"'>\s]+)["']?\s*>(.*?)<\/font>/gi, '<span style="color: $1;">$2</span>');
  // 行内代码 `code`
  text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
  // 加粗 **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600; color: inherit;">$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong style="font-weight: 600; color: inherit;">$1</strong>');
  // 斜体 *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em style="font-style: italic;">$1</em>');
  return text;
}

function isHeading(line: string): { level: number; text: string } | null {
  const trimmed = line.trim();

  // Markdown heading: supports "# 标题" and "#标题"; H4-H6 are rendered as H3.
  const markdownHeading = trimmed.match(/^(#{1,6})\s*(.+)$/);
  if (markdownHeading) {
    return { level: Math.min(markdownHeading[1].length, 3), text: markdownHeading[2].trim() };
  }

  // Chinese heading pattern: 一、二、三 or 1. 2. 3.
  const chineseNumMatch = trimmed.match(/^[一二三四五六七八九十]+[、.．](.+)$/);
  if (chineseNumMatch) {
    return { level: 2, text: chineseNumMatch[1] };
  }

  const numDotMatch = trimmed.match(/^(\d+)[\.．、](.+)$/);
  if (numDotMatch && parseInt(numDotMatch[1]) <= 10) {
    return { level: 2, text: numDotMatch[2] };
  }

  // Short line in uppercase or with special chars might be a heading
  if (
    trimmed.length < 30 &&
    trimmed.length > 2 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z\u4E00-\u9FA5]/.test(trimmed)
  ) {
    return { level: 2, text: trimmed };
  }

  return null;
}

function isQuote(lines: string[], index: number): { content: string; endIndex: number } | null {
  const line = lines[index].trim();
  if (line.startsWith(">") || line.startsWith("\u201C") || line.startsWith("\u300C")) {
    let content = line.replace(/^[>""\u300C]+/, "").replace(/[>""\u300D]+$/, "");
    let endIndex = index;

    // Collect consecutive quote lines
    for (let i = index + 1; i < lines.length; i++) {
      const nextLine = lines[i].trim();
      if (nextLine.startsWith(">") || nextLine.startsWith("\u201C") || nextLine.startsWith("\u300C") || nextLine === "") {
        if (nextLine !== "") {
          content += "\n" + nextLine.replace(/^[>""\u300C]+/, "").replace(/[>""\u300D]+$/, "");
        }
        endIndex = i;
      } else {
        break;
      }
    }

    return { content, endIndex };
  }

  return null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isCodeBlock(lines: string[], index: number): { content: string; language: string; endIndex: number } | null {
  const line = lines[index].trim();

  // Markdown code block
  if (line.startsWith("\`\`\`") || line.startsWith("~~~")) {
    const fence = line.startsWith("\`\`\`") ? "\`\`\`" : "~~~";
    const language = line.slice(3).trim();
    let content = "";
    let endIndex = index;

    for (let i = index + 1; i < lines.length; i++) {
      endIndex = i;
      if (lines[i].trim().startsWith(fence)) {
        endIndex = i;
        break;
      }
      content += lines[i] + "\n";
    }

    return { content: content.trim(), language, endIndex };
  }

  // Indented code - must have multiple indented lines to be considered code
  if (line.startsWith("    ") || line.startsWith("\t")) {
    let content = line.replace(/^[ ]{4}/, "").replace(/^\t/, "");
    let endIndex = index;
    let hasMultipleLines = false;

    for (let i = index + 1; i < lines.length; i++) {
      const nextLine = lines[i];
      if (nextLine.trim() === "") {
        // 空行可以属于代码块
        content += "\n";
        endIndex = i;
      } else if (nextLine.startsWith("    ") || nextLine.startsWith("\t")) {
        // 继续缩进的行是代码块
        content += "\n" + nextLine.trim().replace(/^[ ]{4}/, "").replace(/^\t/, "");
        endIndex = i;
        hasMultipleLines = true;
      } else {
        break;
      }
    }

    // 只有单行缩进不认为是代码块，必须有多行缩进才行
    if (!hasMultipleLines && content.trim() !== "") {
      return null;
    }

    return { content: content.trim(), language: "", endIndex };
  }

  return null;
}

function isMarkdownTable(lines: string[], index: number): { content: string; endIndex: number } | null {
  const current = lines[index]?.trim();
  const separator = lines[index + 1]?.trim();

  if (!current?.includes("|") || !separator?.includes("|")) return null;

  const separatorCells = separator
    .replace(/^\||\|$/g, "")
    .split("|")
    .map(cell => cell.trim());

  if (!separatorCells.every(cell => /^:?-{3,}:?$/.test(cell))) return null;

  const rows: string[][] = [];
  let endIndex = index + 1;

  for (let i = index; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row.includes("|")) break;
    rows.push(row.replace(/^\||\|$/g, "").split("|").map(cell => cell.trim()));
    endIndex = i;
  }

  const header = rows[0] || [];
  const body = rows.slice(2);
  const html = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px;">
    <thead><tr>${header.map(cell => `<th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; font-weight: 600; text-align: left;">${parseInlineFormatting(escapeHtml(cell))}</th>`).join("")}</tr></thead>
    <tbody>${body.map(row => `<tr>${row.map(cell => `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${parseInlineFormatting(escapeHtml(cell))}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;

  return { content: html, endIndex };
}

// 启发式检测纯文字内容类型
function detectContentType(line: string, prevBlock: ParsedContent | null, nextLines: string[]): { type: ParsedContent["type"]; content: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 引号内容判定（引用块）：15字以上，以引号开头，不以句号结尾
  if ((/"[^"]{15,}"|"[^"]{15,}"/.test(trimmed) || /「[^」]{15,}」/.test(trimmed)) && !/[。！？]$/.test(trimmed.slice(-3))) {
    return { type: "quote", content: trimmed };
  }

  // H2标题判定：必须符合以下明确模式之一
  // 1. 中文数字序号：一、二、三...
  // 2. 阿拉伯数字序号：1、2、3...
  // 3. 章节格式：第一章、第一部分
  // 4. 明确主题词：背景、前言、概述、特点、优势、功能、步骤、方法、原因、结果、总结
  const h2Patterns = [
    /^[一二三四五六七八九十]+[、.．](.+)$/,
    /^[0-9]+[、.．](.+)$/,
    /^(第[一二三四五六七八九十百千0-9]+[章节部分篇节集])([：:、]|$)/,
    /^(背景|前言|概述|简介|介绍|总结|结论|目录|索引|特点|优势|功能|步骤|方法|原因|结果|问题|方案|策略|实践|应用|场景|示例|说明|规则|条件|要求|流程|架构|设计|实现|配置|安装|升级|更新|常见|扩展|参考)([：:、]|$)/,
  ];

  for (const pattern of h2Patterns) {
    if (pattern.test(trimmed)) {
      return { type: "h2", content: trimmed };
    }
  }

  // H3标题判定：短标题(4-12字)，前面必须是H2，避免以句号结尾
  if (trimmed.length >= 4 && trimmed.length <= 12 && !/[。！？]$/.test(trimmed)) {
    if (prevBlock && (prevBlock.type === "h2" || prevBlock.type === "h3")) {
      return { type: "h3", content: trimmed };
    }
  }

  return null;
}

// 智能解析纯文字文章
function smartParseArticle(text: string): ParsedArticle {
  const lines = text.split("\n");
  const blocks: ParsedContent[] = [];
  let title = "未命名文章";
  let titleSet = false;

  // 第一遍：初步分类所有行
  const lineTypes: Array<{ type: string; content: string; index: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      lineTypes.push({ type: "empty", content: "", index: i });
      continue;
    }

    // 先用标准规则检测
    const heading = isHeading(line);
    if (heading) {
      lineTypes.push({ type: `h${heading.level}`, content: heading.text, index: i });
      continue;
    }

    const codeBlock = isCodeBlock(lines, i);
    if (codeBlock) {
      lineTypes.push({ type: "code", content: codeBlock.content, index: i });
      i = codeBlock.endIndex;
      continue;
    }

    const quote = isQuote(lines, i);
    if (quote) {
      lineTypes.push({ type: "quote", content: quote.content, index: i });
      i = quote.endIndex;
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      lineTypes.push({ type: "hr", content: "", index: i });
      continue;
    }

    if (/^[-*•]/.test(trimmed) || /^\d+[.、]/.test(trimmed)) {
      // 列表处理
      lineTypes.push({ type: "list", content: trimmed, index: i });
      continue;
    }

    // 图片检测：[IMAGE:url] 格式
    const imageMatch = trimmed.match(/^\[IMAGE:(.+)\]$/);
    if (imageMatch) {
      lineTypes.push({ type: "image", content: imageMatch[1], index: i });
      continue;
    }

    // 无法用标准规则识别的，用启发式
    const detected = detectContentType(line, blocks[blocks.length - 1] || null, lines.slice(i + 1));
    if (detected) {
      lineTypes.push({ type: detected.type, content: detected.content, index: i });
      continue;
    }

    // 默认作为段落
    lineTypes.push({ type: "paragraph", content: trimmed, index: i });
  }

  // 第二遍：合并连续相同类型的段落，提取标题
  for (let i = 0; i < lineTypes.length; i++) {
    const item = lineTypes[i];

    if (item.type === "empty") continue;

    if (item.type === "h1") {
      if (!titleSet) {
        title = item.content;
        titleSet = true;
      } else {
        blocks.push({ type: "h2", content: item.content });
      }
      continue;
    }

    if (item.type === "h2" || item.type === "h3") {
      blocks.push({ type: item.type as "h2" | "h3", content: item.content });
      continue;
    }

    if (item.type === "quote") {
      blocks.push({ type: "quote", content: item.content });
      continue;
    }

    if (item.type === "code") {
      blocks.push({ type: "code", content: item.content });
      continue;
    }

    if (item.type === "hr") {
      blocks.push({ type: "hr", content: "" });
      continue;
    }

    if (item.type === "image") {
      blocks.push({ type: "image", content: item.content });
      continue;
    }

    if (item.type === "list") {
      // 收集连续的有序/无序列表
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lineTypes.length; j++) {
        if (lineTypes[j].type === "list") {
          const match = lineTypes[j].content.match(/^[-*•]\s*(.+)$/) || lineTypes[j].content.match(/^\d+[.、]\s*(.+)$/);
          if (match) {
            items.push(match[1]);
            endIndex = j;
          }
        } else {
          break;
        }
      }
      const isOrdered = /^\d+[.、]/.test(lineTypes[i].content);
      blocks.push({ type: isOrdered ? "ol" : "ul", content: "", items });
      i = endIndex;
      continue;
    }

    // paragraph
    let paragraphContent = item.content;
    let endIndex = i;
    for (let j = i + 1; j < lineTypes.length; j++) {
      if (lineTypes[j].type === "paragraph") {
        paragraphContent += " " + lineTypes[j].content;
        endIndex = j;
      } else if (lineTypes[j].type === "empty") {
        // 空行中断段落合并
        break;
      } else {
        break;
      }
    }
    blocks.push({ type: "paragraph", content: paragraphContent });
    i = endIndex;
  }

  // 如果没有明确的H1标题，使用第一句话作为标题
  if (!titleSet && blocks.length > 0) {
    if (blocks[0].type === "paragraph") {
      title = blocks[0].content.slice(0, 30) + (blocks[0].content.length > 30 ? "..." : "");
    } else if (blocks[0].type === "h2" || blocks[0].type === "h3") {
      title = blocks[0].content;
    }
  }

  return { title, blocks };
}

// 统一入口：纯文本和Markdown都走同样的预处理，然后根据类型选择解析器
export function parseArticle(text: string): ParsedArticle {
  if (!text) return { title: "", blocks: [] };

  // 1. 预处理：将常见的不可见字符和非标准符号统一化
  let normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/\u200B/g, " ") // zero-width space
    .replace(/[\u201C\u201D]/g, '"') // 智能双引号 -> 直双引号
    .replace(/[\u2018\u2019]/g, "'"); // 智能单引号 -> 直单引号

  return smartParseArticle(normalizedText);
}

export function parseMarkdownArticle(text: string): ParsedArticle {
  if (!text) return { title: "", blocks: [] };

  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const blocks: ParsedContent[] = [];
  let title = "未命名文章";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    // Check for code block first (can contain other markdown syntax)
    const codeBlock = isCodeBlock(lines, i);
    if (codeBlock) {
      blocks.push({
        type: "code",
        content: codeBlock.content,
      });
      i = codeBlock.endIndex;
      continue;
    }

    const table = isMarkdownTable(lines, i);
    if (table) {
      blocks.push({
        type: "table",
        content: table.content,
      });
      i = table.endIndex;
      continue;
    }

    // Check for blockquote
    const quote = isQuote(lines, i);
    if (quote) {
      blocks.push({
        type: "quote",
        content: quote.content,
      });
      i = quote.endIndex;
      continue;
    }

    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      blocks.push({ type: "hr", content: "" });
      continue;
    }

    // Check for image: ![alt](url) or [IMAGE:url]
    const imageMatch = line.trim().match(/^!\[.*?\]\((.+)\)$/) || line.trim().match(/^\[IMAGE:(.+)\]$/);
    if (imageMatch) {
      blocks.push({ type: "image", content: imageMatch[1] });
      continue;
    }

    // Check for lists
    if (/^[-*•]\s/.test(line.trim())) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const match = lines[j].trim().match(/^[-*•]\s+(.+)$/);
        if (match) {
          items.push(match[1]);
          endIndex = j;
        } else {
          break;
        }
      }
      blocks.push({ type: "ul", content: "", items });
      i = endIndex;
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const match = lines[j].trim().match(/^\d+\.\s+(.+)$/);
        if (match) {
          items.push(match[1]);
          endIndex = j;
        } else {
          break;
        }
      }
      blocks.push({ type: "ol", content: "", items });
      i = endIndex;
      continue;
    }

    // Check for heading
    const heading = isHeading(line);
    if (heading) {
      if (heading.level === 1 && blocks.length === 0) {
        // First H1 is the title
        title = heading.text;
      } else {
        blocks.push({
          type: `h${heading.level}` as "h1" | "h2" | "h3",
          content: heading.text,
        });
      }
      continue;
    }

    // Regular paragraph - collect consecutive non-empty lines
    let paragraphContent = line.trim();
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim();
      if (nextLine === "") break;

      // Don't consume heading, code block, quote, or list indicators
      if (
        isHeading(nextLine) ||
        isCodeBlock(lines, j) ||
        isMarkdownTable(lines, j) ||
        isQuote(lines, j) ||
        /^[-*•]/.test(nextLine) ||
        /^\d+[.、]/.test(nextLine) ||
        nextLine === "---" ||
        nextLine === "***" ||
        nextLine === "___"
      ) {
        break;
      }

      paragraphContent += " " + nextLine;
      i = j;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphContent,
    });
  }

  return { title, blocks };
}

export function generateWechatHTML(
  article: ParsedArticle, 
  templateId: string, 
  images: string[] = [], 
  blockCustomStyles: Record<number, { fontSize?: number; lineHeight?: number }> = {},
  typeFontSizes: Record<string, number> = { h1: 16, h2: 16, h3: 16, paragraph: 16, quote: 16, list: 16 },
  includeBackgroundColor: boolean = true,
  headingPreferences: Record<HeadingLevel, HeadingLevel> = { h1: "h1", h2: "h2", h3: "h3" }
): string {
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const sectionBackgroundStyle = includeBackgroundColor ? `background-color: ${template.backgroundColor}; ` : "";
  const headingLevels: HeadingLevel[] = ["h1", "h2", "h3"];
  const getDisplayBlockType = (type: ParsedContent["type"]): ParsedContent["type"] => {
    return headingLevels.includes(type as HeadingLevel)
      ? headingPreferences[type as HeadingLevel]
      : type;
  };

  const getH1StyleStr = () => {
    const size = typeFontSizes.h1;
    if (template.id === "byte-green") {
      return `display: table; padding: 0.5em 2em; margin: 1.5em auto 1em; color: #1d2129; font-size: ${size}px; font-weight: 600; text-align: center; background: linear-gradient(90deg, #2ea250, #09fc3c); background-size: 100% 35%; background-position: bottom 0.15em center; background-repeat: no-repeat;`;
    }
    if (template.id === "cute-pink") {
      return `display: table; padding: 0.8em 2em; margin: 2em auto 1.5em; color: #FFFFFF; font-size: ${size}px; font-weight: bold; text-align: center; letter-spacing: 0.1em; position: relative; line-height: 1.5; width: fit-content; max-width: 90%; background: linear-gradient(135deg, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2); border-radius: 20px; box-shadow: 0 5px 15px rgba(255, 133, 162, 0.3); border: 3px solid #FFE6EE;`;
    }
    if (template.h1Background) {
      return `font-size: ${size}px; font-weight: 600; color: ${template.h1TextColor || "#ffffff"}; padding: 4px 12px; margin: 20px 0 12px; background: ${template.h1Background}; border-left: 4px solid ${template.h1Color || template.primaryColor};`;
    }
    return `font-size: ${size}px; font-weight: 700; color: ${template.h1Color || template.headingColor}; margin: 20px 0 12px; padding-left: 10px; border-left: 4px solid ${template.h1Color || template.headingColor};`;
  };

  const getH2StyleStr = (customSize?: number) => {
    const typeSize = typeFontSizes.h2;
    if (template.id === "byte-green") {
      return `display: table; padding: 0.3em 1em; margin: 1em auto 0.6em; color: white; background: linear-gradient(135deg, #2ea250, #09fc3c); font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; font-weight: 600; text-align: center; border-radius: 6px; letter-spacing: 0.02em; box-shadow: 0 2px 4px rgba(46, 162, 80, 0.15);`;
    }
    if (template.id === "cute-pink") {
      return `display: table; padding: 0.7em 1.2em; margin: 2.5em auto 1.8em; color: #FFFFFF; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; font-weight: bold; text-align: center; letter-spacing: 0.1em; position: relative; width: fit-content; max-width: 85%; background: linear-gradient(135deg, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5); border-radius: 30px; box-shadow: 0 4px 10px rgba(255, 133, 162, 0.2); border: 2px solid #FFD6E4;`;
    }
    return `font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; font-weight: 600; color: ${template.headingColor}; margin: 18px 0 10px; padding-left: 10px; border-left: 4px solid ${template.quoteBorder || template.headingColor};`;
  };

  const getH3StyleStr = (customSize?: number) => {
    const typeSize = typeFontSizes.h3;
    if (template.id === "byte-green") {
      return `padding: 0.2em 0; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; color: #1d2129; margin: 0.8em 0 0.3em; font-weight: 600; display: inline-block; background: linear-gradient(90deg, #2ea250, #09fc3c); background-size: 100% 1.8px; background-position: bottom left; background-repeat: no-repeat;`;
    }
    if (template.id === "cute-pink") {
      return `padding: 0.5em 1em 0.5em 2.2em; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; line-height: 1.6; margin: 2em 0 0.75em; font-weight: 600; position: relative; color: #FFFFFF; background: linear-gradient(90deg, #FFB5D9, #E8B4D5, #FFDFD3); border-radius: 15px; box-shadow: 0 3px 8px rgba(255, 133, 162, 0.2); border: 2px solid #FFE6EE; display: block; width: fit-content;`;
    }
    return `font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; font-weight: 500; color: ${template.subheadingColor}; margin: 14px 0 8px; padding-left: 8px; border-left: 3px solid ${template.subheadingColor};`;
  };

  const getParagraphStyleStr = (customSize?: number, customHeight?: number) => {
    const typeSize = typeFontSizes.paragraph;
    if (template.id === "byte-green") {
      return `font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; margin: 0.8em 0; letter-spacing: 0; color: #4e5969; text-align: justify; line-height: ${customHeight || 1.8};`;
    }
    if (template.id === "cute-pink") {
      return `font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; margin: 1em 0; letter-spacing: 0.05em; color: #555; text-align: justify; line-height: ${customHeight || 1.8}; text-indent: 0;`;
    }
    return `font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; margin: 10px 0; text-align: justify; text-indent: 0; line-height: ${customHeight || 1.8}; color: ${template.textColor};`;
  };

  const getQuoteStyleStr = (customSize?: number, customHeight?: number) => {
    const typeSize = typeFontSizes.quote;
    if (template.id === "byte-green") {
      return `font-style: normal; padding: 0.8em 0.8em 0.8em 1.5em; border-left: 3px solid #2ea250; border-radius: 4px; color: #4e5969; background: linear-gradient(90deg, rgba(46, 162, 80, 0.05), rgba(9, 252, 60, 0.05)); margin: 0.8em 0; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; line-height: ${customHeight || 1.8};`;
    }
    if (template.id === "cute-pink") {
      return `font-style: normal; padding: 0.5em 1em 0.5em 2em; border-radius: 10px; color: #666; background: rgba(255, 245, 249, 0.8); margin: 1.2em 0; position: relative; border-left: 5px solid #FFB5D9; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; line-height: ${customHeight || 1.8};`;
    }
    return `font-style: normal; padding: 10px 15px; border-left: 4px solid ${template.quoteBorder}; background-color: ${template.quoteBackground}; margin: 12px 0; color: ${template.textColor}; font-size: ${customSize ? customSize + 'px' : typeSize + 'px'}; line-height: ${customHeight || 1.8};`;
  };

  let html = `
<section style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif; ${sectionBackgroundStyle}padding: 20px; color: ${template.textColor}; line-height: 1.8; font-size: ${typeFontSizes.paragraph}px; max-width: 100%;">
`;

  // 标题
  if (template.id === "cute-pink") {
    html += `
  <div style="position: relative; margin: 2em auto 1.5em; width: fit-content; max-width: 90%;">
    <span style="position: absolute; top: 50%; left: -1.2em; transform: translateY(-50%); font-size: 1.2em; color: #FFB5D9; z-index: 2;">★</span>
    <h1 style="${getH1StyleStr()} margin: 0; width: 100%;">
      ${article.title}
    </h1>
    <span style="position: absolute; top: 50%; right: -1.2em; transform: translateY(-50%); font-size: 1.2em; color: #FFB5D9; z-index: 2;">★</span>
  </div>
`;
  } else {
    html += `
  <h1 style="${getH1StyleStr()}">
    ${article.title}
  </h1>
`;
  }

  for (let i = 0; i < article.blocks.length; i++) {
    const block = article.blocks[i];
    const customStyles = blockCustomStyles[i] || {};
    const customFontSize = customStyles.fontSize;
    const customLineHeight = customStyles.lineHeight;

    const displayType = getDisplayBlockType(block.type);

    switch (displayType) {
      case "h1":
        if (template.id === "cute-pink") {
          html += `
  <div style="position: relative; margin: 2em auto 1.5em; width: fit-content; max-width: 90%;">
    <span style="position: absolute; top: 50%; left: -1.2em; transform: translateY(-50%); font-size: 1.2em; color: #FFB5D9; z-index: 2;">★</span>
    <h1 style="${getH1StyleStr()} margin: 0; width: 100%;">${block.content}</h1>
    <span style="position: absolute; top: 50%; right: -1.2em; transform: translateY(-50%); font-size: 1.2em; color: #FFB5D9; z-index: 2;">★</span>
  </div>
`;
        } else {
          html += `
  <h1 style="${getH1StyleStr()}">${block.content}</h1>
`;
        }
        break;
      case "h2":
        if (template.id === "cute-pink") {
          html += `
  <div style="position: relative; margin: 2.5em auto 1.8em; width: fit-content; max-width: 85%;">
    <span style="position: absolute; top: -1.1em; right: 0.6em; font-size: 1.1em; color: #FF85A2; z-index: 2; line-height: 1;">✧</span>
    <h2 style="${getH2StyleStr(customFontSize)} margin: 0; width: 100%;">${block.content}</h2>
  </div>
`;
        } else {
          html += `
  <h2 style="${getH2StyleStr(customFontSize)}">${block.content}</h2>
`;
        }
        break;
      case "h3":
        if (template.id === "cute-pink") {
          html += `
  <div style="position: relative; margin: 2em 0 0.75em; width: fit-content;">
    <span style="position: absolute; left: -1em; top: 50%; transform: translateY(-50%); font-size: 1.1em; z-index: 2; color: #FF85A2; line-height: 1;">✦</span>
    <h3 style="${getH3StyleStr(customFontSize)} margin: 0; width: 100%;">${block.content}</h3>
  </div>
`;
        } else {
          html += `
  <h3 style="${getH3StyleStr(customFontSize)} display: block;">${block.content}</h3>
`;
        }
        break;
      case "paragraph":
        html += `
  <p style="${getParagraphStyleStr(customFontSize, customLineHeight)}">${parseInlineFormatting(block.content)}</p>
`;
        break;
      case "quote":
        if (template.id === "cute-pink") {
          html += `
  <div style="position: relative;">
    <span style="position: absolute; left: 0.5em; top: -0.2em; font-size: 2em; color: #FF85A2; font-family: Georgia, serif; z-index: 2; line-height: 1;">❝</span>
    <blockquote style="${getQuoteStyleStr(customFontSize, customLineHeight)}">${parseInlineFormatting(block.content)}</blockquote>
  </div>
`;
        } else {
          html += `
  <blockquote style="${getQuoteStyleStr(customFontSize, customLineHeight)}">${parseInlineFormatting(block.content)}</blockquote>
`;
        }
        break;
      case "code":
        const codeContentEscaped = block.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
        html += `
<div style="border-radius: 8px; overflow: hidden; margin: 12px 0; background: #1e1e1e;">
  <div style="background: #2d2d2d; padding: 10px 12px; border-bottom: 1px solid #3c3c3c; display: flex; align-items: center; gap: 8px;">
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; display: inline-block; margin-right: 6px;"></span>
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e; display: inline-block; margin-right: 6px;"></span>
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #28c840; display: inline-block;"></span>
    <span style="font-size: 12px; color: #888; font-family: system-ui; margin-left: 8px;">code.js</span>
  </div>
  <pre style="margin: 0; padding: 16px; overflow-x: auto; color: #d4d4d4; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;">${codeContentEscaped}</pre>
</div>`;
        break;
      case "ul":
        if (template.id === "byte-green") {
          html += `
<ul style="padding-left: 1.2em; margin: 0.8em 0; color: #4e5969; list-style-type: none;">
${block.items?.map((item, j) => `  <li style="margin: 0.3em 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative; padding-left: 0.8em;">
    <span style="position: absolute; left: 0; top: 0.65em; width: 5px; height: 5px; border-radius: 50%; background: radial-gradient(circle, #09fc3c, #2ea250); opacity: ${j % 2 !== 0 ? 0.7 : 1};"></span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ul>`;
        } else if (template.id === "cute-pink") {
          html += `
<ul style="padding-left: 2em; margin: 1em 0; list-style-type: none;">
${block.items?.map(item => `  <li style="margin: 0.5em 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative;">
    <span style="position: absolute; left: -1.5em; font-size: 0.9em; color: #FF85A2;">♡</span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ul>`;
        } else {
          html += `
<ul style="padding-left: 24px; margin: 8px 0; color: ${template.textColor}; list-style-type: none;">
${block.items?.map(item => `  <li style="margin: 8px 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative; padding-left: 16px;">
    <span style="position: absolute; left: 0; color: ${template.headingColor || "#2ea250"}; font-weight: bold;">•</span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ul>`;
        }
        break;
      case "ol":
        if (template.id === "byte-green") {
          html += `
<ol style="padding-left: 1.2em; margin: 0.8em 0; color: #4e5969; list-style-type: none; counter-reset: item;">
${block.items?.map((item, j) => `  <li style="margin: 0.3em 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative; padding-left: 0.5em; counter-increment: item;">
    <span style="position: absolute; left: -1em; top: 0.15em; color: #2ea250; font-weight: bold; font-style: italic;">${j + 1}.</span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ol>`;
        } else if (template.id === "cute-pink") {
          html += `
<ol style="padding-left: 2em; margin: 1em 0; list-style-type: none; counter-reset: item;">
${block.items?.map((item, j) => `  <li style="margin: 0.5em 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative; counter-increment: item;">
    <span style="position: absolute; left: -2em; top: 0.2em; color: #FFFFFF; background: linear-gradient(135deg, #FFB5D9, #E8B4D5); width: 1.5em; height: 1.5em; border-radius: 50%; text-align: center; line-height: 1.5em; font-weight: bold;">${j + 1}</span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ol>`;
        } else {
          html += `
<ol style="padding-left: 0; margin: 8px 0; color: ${template.textColor}; list-style-type: none; counter-reset: item;">
${block.items?.map((item, j) => `  <li style="margin: 8px 0; line-height: ${customLineHeight || 1.8}; font-size: ${customFontSize ? customFontSize + 'px' : typeFontSizes.list + 'px'}; position: relative; padding-left: 32px; counter-increment: item;">
    <span style="position: absolute; left: 0; width: 22px; height: 22px; line-height: 22px; text-align: center; background: ${template.headingColor || "#2ea250"}; color: #fff; border-radius: 50%; font-size: 12px; font-weight: bold;">${j + 1}</span>
    ${parseInlineFormatting(item)}
  </li>`).join("\n")}
</ol>`;
        }
        break;
      case "image":
        html += `
  <img src="${block.content}" style="max-width: 100%; height: auto; border-radius: 8px; border: 3px solid ${template.primaryColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 16px 0;" />
`;
        break;
      case "table":
        html += `
  <div style="overflow-x: auto; margin: 12px 0;">${block.content}</div>
`;
        break;
      case "hr":
        if (template.id === "byte-green") {
          html += `
<div style="margin: 1.8em 0;">
  <hr style="height: 1px; border: none; margin: 0; background: linear-gradient(to right, rgba(46, 162, 80, 0), rgba(46, 162, 80, 0.5), rgba(9, 252, 60, 0.5), rgba(9, 252, 60, 0)); position: relative;">
  <div style="position: relative; height: 0; top: -1px;">
    <span style="position: absolute; left: 50%; top: 0; transform: translate(-50%, -50%); width: 5px; height: 5px; background: radial-gradient(circle, #09fc3c, #2ea250); border-radius: 50%; box-shadow: -18px 0 0 rgba(46, 162, 80, 0.5), 18px 0 0 rgba(9, 252, 60, 0.5);"></span>
  </div>
</div>
`;
        } else if (template.id === "cute-pink") {
          html += `
<div style="margin: 2.5em auto; position: relative;">
  <div style="position: relative; height: 0; top: -18px;">
    <span style="position: absolute; left: 50%; transform: translateX(-50%); font-size: 1.4em; z-index: 2; color: #FF85A2;">✦</span>
  </div>
  <hr style="height: 6px; border: none; margin: 0; background: linear-gradient(to right, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2); border-radius: 3px; position: relative;">
</div>
`;
        } else {
          html += `
  <hr style="height: 1px; border: none; margin: 24px 0; background: ${template.quoteBorder};">
`;
        }
        break;
    }
  }

  // 添加图片
  if (images.length > 0) {
    html += `
  <div style="margin-top: 24px; display: flex; flex-wrap: wrap; gap: 12px;">
    ${images.map(img => `
    <img src="${img}" style="max-width: 100%; height: auto; border-radius: 8px; border: 3px solid ${template.primaryColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
    `).join("")}
  </div>
`;
  }

  html += `
</section>`;

  return html;
}
