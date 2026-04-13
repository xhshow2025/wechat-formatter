import { templates } from "./templates";

export interface ParsedContent {
  type: "h1" | "h2" | "h3" | "paragraph" | "quote" | "code" | "ul" | "ol" | "hr";
  content: string;
  items?: string[];
}

export interface ParsedArticle {
  title: string;
  blocks: ParsedContent[];
}

// 解析行内格式：加粗、斜体、行内代码、数字高亮
function parseInlineFormatting(text: string): string {
  // 行内代码 `code`
  text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
  // 加粗 **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600; color: inherit;">$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong style="font-weight: 600; color: inherit;">$1</strong>');
  // 斜体 *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em style="font-style: italic;">$1</em>');
  // 数字高亮：百分比、金额、倍数
  text = text.replace(/(\d+(?:\.\d+)?%)/g, '<span style="background: linear-gradient(90deg, rgba(255,150,0,0.15), rgba(255,100,0,0.1)); padding: 1px 4px; border-radius: 3px; font-weight: 500; color: inherit;">$1</span>');
  text = text.replace(/(\d+(?:\.\d+)?亿元)/g, '<span style="background: linear-gradient(90deg, rgba(255,150,0,0.15), rgba(255,100,0,0.1)); padding: 1px 4px; border-radius: 3px; font-weight: 500; color: inherit;">$1</span>');
  text = text.replace(/(\d+(?:\.\d+)?万)/g, '<span style="background: linear-gradient(90deg, rgba(255,150,0,0.15), rgba(255,100,0,0.1)); padding: 1px 4px; border-radius: 3px; font-weight: 500; color: inherit;">$1</span>');
  text = text.replace(/(\d+x)/gi, '<span style="background: linear-gradient(90deg, rgba(255,150,0,0.15), rgba(255,100,0,0.1)); padding: 1px 4px; border-radius: 3px; font-weight: 500; color: inherit;">$1</span>');
  return text;
}

function isHeading(line: string): { level: number; text: string } | null {
  const trimmed = line.trim();

  // Markdown heading: # ## ###
  if (trimmed.startsWith("### ")) {
    return { level: 3, text: trimmed.slice(4) };
  }
  if (trimmed.startsWith("## ")) {
    return { level: 2, text: trimmed.slice(3) };
  }
  if (trimmed.startsWith("# ")) {
    return { level: 1, text: trimmed.slice(2) };
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

function isCodeBlock(lines: string[], index: number): { content: string; language: string; endIndex: number } | null {
  const line = lines[index].trim();

  // Markdown code block
  if (line.startsWith("```")) {
    const language = line.slice(3).trim();
    let content = "";
    let endIndex = index;

    for (let i = index + 1; i < lines.length; i++) {
      if (lines[i].trim() === "```") {
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

    // 段落：合并连续的非标题/非引用行
    if (item.type === "paragraph") {
      let paragraphContent = item.content;

      // 合并后续连续的段落行
      let j = i + 1;
      while (j < lineTypes.length) {
        const next = lineTypes[j];
        if (next.type === "paragraph") {
          paragraphContent += " " + next.content;
          j++;
        } else if (next.type === "empty") {
          j++;
        } else {
          break;
        }
      }

      blocks.push({ type: "paragraph", content: paragraphContent });
      i = j - 1;
      continue;
    }
  }

  // 如果没有设置标题，用第一段作为标题
  if (!titleSet && blocks.length > 0) {
    const firstBlock = blocks[0];
    if (firstBlock.type === "paragraph") {
      title = firstBlock.content.slice(0, 50) + (firstBlock.content.length > 50 ? "..." : "");
      blocks.shift();
    }
  }

  return { title, blocks };
}

// 强制Markdown解析（不自动检测）
export function parseMarkdownArticle(text: string): ParsedArticle {
  const lines = text.split("\n");
  const blocks: ParsedContent[] = [];
  let title = "未命名文章";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      continue;
    }

    // Check for code block first
    const codeBlock = isCodeBlock(lines, i);
    if (codeBlock) {
      blocks.push({
        type: "code",
        content: codeBlock.content,
      });
      i = codeBlock.endIndex;
      continue;
    }

    // Check for quote
    const quote = isQuote(lines, i);
    if (quote) {
      blocks.push({
        type: "quote",
        content: quote.content,
      });
      i = quote.endIndex;
      continue;
    }

    // Check for hr
    const trimmed = line.trim();
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ type: "hr", content: "" });
      continue;
    }

    // Check for unordered list
    if (/^[-*•]/.test(trimmed)) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const listLine = lines[j].trim();
        const match = listLine.match(/^[-*•]\s*(.+)$/);
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

    // Check for ordered list
    if (/^\d+[.、]/.test(trimmed)) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const listLine = lines[j].trim();
        const match = listLine.match(/^\d+[.、]\s*(.+)$/);
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
        title = heading.text;
      } else {
        blocks.push({
          type: `h${heading.level}` as "h2" | "h3",
          content: heading.text,
        });
      }
      continue;
    }

    // Regular paragraph
    let paragraphContent = line.trim();
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim();
      if (nextLine === "") break;

      if (
        isHeading(nextLine) ||
        isCodeBlock(lines, j) ||
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

export function parseArticle(text: string): ParsedArticle {
  // 检查是否包含Markdown标记
  const hasMarkdown = /^[#>`*\-+]/.test(text.trim()) || /```/.test(text);

  // 如果是纯文字，使用智能启发式解析
  if (!hasMarkdown) {
    return smartParseArticle(text);
  }

  // 否则使用标准Markdown解析
  const lines = text.split("\n");
  const blocks: ParsedContent[] = [];
  let title = "未命名文章";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines but maintain paragraph separation
    if (line.trim() === "") {
      continue;
    }

    // Check for code block first
    const codeBlock = isCodeBlock(lines, i);
    if (codeBlock) {
      blocks.push({
        type: "code",
        content: codeBlock.content,
      });
      i = codeBlock.endIndex;
      continue;
    }

    // Check for quote
    const quote = isQuote(lines, i);
    if (quote) {
      blocks.push({
        type: "quote",
        content: quote.content,
      });
      i = quote.endIndex;
      continue;
    }

    // Check for hr (--- or *** or ___)
    const trimmed = line.trim();
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({
        type: "hr",
        content: "",
      });
      continue;
    }

    // Check for unordered list (- or * or •)
    if (/^[-*•]/.test(trimmed)) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const listLine = lines[j].trim();
        const match = listLine.match(/^[-*•]\s*(.+)$/);
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

    // Check for ordered list (1. or 1、)
    if (/^\d+[.、]/.test(trimmed)) {
      const items: string[] = [];
      let endIndex = i;
      for (let j = i; j < lines.length; j++) {
        const listLine = lines[j].trim();
        const match = listLine.match(/^\d+[.、]\s*(.+)$/);
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
          type: `h${heading.level}` as "h2" | "h3",
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

export function generateWechatHTML(article: ParsedArticle, templateId: string, images: string[] = []): string {
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const isByteGreen = templateId === "byte-green";
  const isAppleBento = templateId === "apple-bento";
  const isMondrian = templateId === "mondrian";
  const isCyberpunk = templateId === "cyberpunk";
  const isCutePink = templateId === "cute-pink";

  // 字节绿专用样式
  const byteGreenGradient = "linear-gradient(90deg, #2ea250, #09fc3c)";
  const byteGreenBg = "rgba(46, 162, 80, 0.05)";

  // 苹果Bento专用样式
  const appleGradient = "linear-gradient(90deg, #0071e3, #bf5af2)";
  const appleBg = "#ffffff";
  const appleShadow = "";

  // 蒙德里安专用样式
  const mondrianRed = "#E63946";
  const mondrianBlue = "#1D3557";
  const mondrianYellow = "#F1C40F";
  const mondrianBlack = "#111111";

  // 赛博朋克专用样式
  const cyberPurple = "#D24AFC";
  const cyberBlue = "#293DD4";
  const cyberBg = "rgba(41, 9, 104, 0.3)";
  const cyberGradient = "linear-gradient(to bottom, #D24AFC, #293DD4)";

  // 可爱粉专用样式
  const cutePinkGradient = "linear-gradient(90deg, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB)";
  const cutePinkBg = "rgba(255, 249, 251, 0.95)";

  // 根据模板决定外层背景色
  let outerBackground = template.backgroundColor;
  if (isCutePink) {
    outerBackground = cutePinkBg;
  }

  let html = `
<section style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif; background-color: ${outerBackground}; padding: 20px; color: ${template.textColor}; line-height: 1.8; max-width: 100%;">
`;

  // 标题特殊处理 - 字节绿H1：深色背景+白色文字
  if (isByteGreen) {
    html += `
  <h1 style="display: block; padding: 0.5em 0; margin: 1.5em 0 1em 0.5em; color: #1d2129; font-size: 1.8em; font-weight: 600; position: relative; border-left: 5px solid #2ea250; padding-left: 12px; line-height: 1.4;">
    ${article.title}
  </h1>
`;
  } else if (isAppleBento) {
    html += `
  <h1 style="display: block; padding: 1.2rem 1.8rem; margin: 1.5rem 0; color: #1d1d1f; font-size: 2.2rem; font-weight: 700; text-align: center; background: ${appleBg}; border-radius: 16px; border: 1px solid #e5e5e5;">
    ${article.title}
  </h1>
`;
  } else if (isMondrian) {
    html += `
  <h1 style="display: inline-block; padding: 0.5em 1em; margin: 1em 0; background-color: ${mondrianRed}; color: #F1FAEE; font-size: 2.5em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; position: relative; box-shadow: 8px 8px 0px ${mondrianBlack}; border: 4px solid ${mondrianBlack};">
    ${article.title}
  </h1>
`;
  } else if (isCyberpunk) {
    html += `
  <h1 style="display: table; padding: 0.8em 1.5em; margin: 2em auto 1.5em; font-size: 1.8em; font-weight: 600; text-align: center; position: relative; background: linear-gradient(135deg, #D24AFC 0%, #293DD4 100%); border-radius: 8px; box-shadow: 0 0 20px rgba(210, 74, 252, 0.4); color: #FFFFFF; text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
    ${article.title}
  </h1>
`;
  } else if (isCutePink) {
    html += `
  <h1 style="display: block; padding: 0.8em 0; margin: 1.5em auto; color: #FFFFFF; font-size: 2.2em; font-weight: bold; text-align: center; letter-spacing: 0.1em; position: relative; line-height: 1.5; background: ${cutePinkGradient}; border-radius: 20px; box-shadow: 0 5px 15px rgba(255, 133, 162, 0.3); border: 3px solid #FFE6EE; padding-left: 1em; padding-right: 1em;">
    ${article.title}
  </h1>
`;
  } else {
    html += `
  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 24px; text-align: center; line-height: 1.4;"><font color="${template.headingColor}">${article.title}</font></h1>
`;
  }

  for (const block of article.blocks) {
    switch (block.type) {
      case "h1":
        if (isByteGreen) {
          // H1样式：绿色文字+左边框
          html += `
  <h2 style="display: block; padding: 0.3em 0 0.3em 0.5em; margin: 1.5em 0 0.8em; font-size: 1.3em; font-weight: 600; color: #2ea250; border-left: 4px solid #2ea250; padding-left: 10px; line-height: 1.5;">${block.content}</h2>
`;
        } else if (isAppleBento) {
          html += `
  <h2 style="display: block; padding: 1rem 1.5rem; margin: 1.8em 0 1.2em; color: #1d1d1f; background: ${appleBg};  font-size: 1.8rem; font-weight: 600; text-align: left; border-radius: 14px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07); position: relative; border: 1px solid rgba(255, 255, 255, 0.9);">
    ${block.content}
  </h2>
`;
        } else if (isMondrian) {
          html += `
  <h2 style="display: inline-block; padding: 0.4em 0.8em; margin: 1.5em 0 1em; background-color: ${mondrianBlue}; color: #F1FAEE; font-size: 1.8em; font-weight: bold; letter-spacing: 0.05em; position: relative; box-shadow: 6px 6px 0px ${mondrianYellow}; border: 3px solid ${mondrianBlack};">${block.content}</h2>
`;
        } else if (isCyberpunk) {
          html += `
  <h2 style="display: inline-block; padding: 0.4em 1em; margin: 2em 0 0.8em; font-size: 1.4em; font-weight: 600; background: rgba(41, 61, 212, 0.2); border-radius: 4px; border-left: 4px solid ${cyberBlue}; box-shadow: 0 0 12px rgba(41, 61, 212, 0.2); color: #00FFFF; text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);">${block.content}</h2>
`;
        } else if (isCutePink) {
          html += `
  <h2 style="display: block; padding: 0.7em 1em; margin: 2em auto 1.5em; color: #FFFFFF; font-size: 1.6em; font-weight: bold; text-align: center; letter-spacing: 0.1em; background: linear-gradient(90deg, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5); border-radius: 30px; box-shadow: 0 4px 10px rgba(255, 133, 162, 0.2); border: 2px solid #FFD6E4;">${block.content}</h2>
`;
        } else {
          html += `
  <h2 style="font-size: 24px; font-weight: 700; margin: 28px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid ${template.quoteBorder};"><font color="${template.headingColor}">${block.content}</font></h2>
`;
        }
        break;
      case "h2":
        if (isByteGreen) {
          // H2样式：绿色文字+底部边框
          html += `
  <h2 style="display: inline-block; padding: 0.3em 0; margin: 1.5em auto 0.8em; font-size: 1.3em; font-weight: 600; text-align: center; border-bottom: 3px solid #2ea250; color: #2ea250; letter-spacing: 0.02em;">${block.content}</h2>
`;
        } else if (isAppleBento) {
          html += `
  <h3 style="padding: 0.8rem 1.3rem; font-size: 1.5rem; line-height: 1.4; border-radius: 12px; background: ${appleBg};  color: #1d1d1f; margin: 1.5em 0 1em; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); border: 1px solid rgba(255, 255, 255, 0.9);">${block.content}</h3>
`;
        } else if (isMondrian) {
          html += `
  <h3 style="display: inline-block; padding: 0.3em 0.6em; margin: 1.2em 0 0.8em; background-color: ${mondrianYellow}; color: ${mondrianBlack}; font-size: 1.5em; font-weight: bold; letter-spacing: 0.03em; position: relative; box-shadow: 4px 4px 0px ${mondrianBlue}; border: 2px solid ${mondrianBlack};">${block.content}</h3>
`;
        } else if (isCyberpunk) {
          html += `
  <h3 style="padding: 0.4em 0.8em; font-size: 1.2em; border-radius: 4px; line-height: 1.5; margin: 1.5em 0 0.6em; font-weight: 500; position: relative; border-left: 3px solid ${cyberPurple}; background: rgba(210, 74, 252, 0.1); box-shadow: 0 0 8px rgba(210, 74, 252, 0.1); color: #D24AFC; text-shadow: 0 0 6px rgba(210, 74, 252, 0.3);">${block.content}</h3>
`;
        } else if (isCutePink) {
          html += `
  <h3 style="padding: 0.5em 1em; font-size: 1.4em; line-height: 1.6; margin: 2em 0 0.75em; font-weight: 600; color: #FFFFFF; background: linear-gradient(90deg, #FFB5D9, #E8B4D5, #FFDFD3); border-radius: 15px; box-shadow: 0 3px 8px rgba(255, 133, 162, 0.2); border: 2px solid #FFE6EE;">${block.content}</h3>
`;
        } else {
          html += `
  <h2 style="font-size: 20px; font-weight: 600; margin: 24px 0 14px 0; padding-left: 12px; border-left: 4px solid ${template.quoteBorder};"><font color="${template.headingColor}">${block.content}</font></h2>
`;
        }
        break;
      case "h3":
        if (isByteGreen) {
          // H3样式：深色文字+左边框
          html += `
  <h3 style="padding: 0.2em 0 0.2em 0.5em; font-size: 1.15em; color: #1d2129; margin: 0.8em 0 0.3em; font-weight: 600; border-left: 3px solid #4ade80; padding-left: 10px; line-height: 1.5;">${block.content}</h3>
`;
        } else if (isAppleBento) {
          html += `
  <h4 style="margin: 1.5em 0 1em; color: #0071e3; background: ${appleBg};  font-size: 1.3rem; font-weight: 600; padding: 0.6rem 1.2rem; display: inline-block; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); border: 1px solid rgba(255, 255, 255, 0.9);">${block.content}</h4>
`;
        } else if (isMondrian) {
          html += `
  <h4 style="display: inline-block; padding: 0.2em 0.4em; margin: 1em 0 0.6em; color: ${mondrianBlack}; font-size: 1.2em; font-weight: bold; letter-spacing: 0.02em; position: relative; border: 2px solid ${mondrianBlack};">${block.content}</h4>
`;
        } else if (isCyberpunk) {
          html += `
  <h4 style="margin: 1.5em 0 0.5em; color: #00FFFF; font-size: 1.05em; font-weight: 500; position: relative; padding-left: 1em; border-left: 2px solid #00FFFF;">${block.content}</h4>
`;
        } else if (isCutePink) {
          html += `
  <h4 style="margin: 1.5em 0 0.8em; color: #FFFFFF; font-size: 1.2em; font-weight: bold; padding: 0.3em 1em; background: linear-gradient(90deg, #FFB5D9, #FFDFD3); border-radius: 10px; display: inline-block; box-shadow: 0 2px 6px rgba(255, 133, 162, 0.2); border: 2px solid #FFE6EE;">${block.content}</h4>
`;
        } else {
          html += `
  <h3 style="font-size: 17px; font-weight: 600; margin: 18px 0 10px 0;"><font color="${template.subheadingColor}">${block.content}</font></h3>
`;
        }
        break;
      case "paragraph":
        if (isByteGreen) {
          html += `
  <p style="margin: 0.8em 0; letter-spacing: 0; color: #4e5969; text-align: justify; line-height: 1.7; font-size: 14px;">${parseInlineFormatting(block.content)}</p>
`;
        } else if (isAppleBento) {
          html += `
  <p style="margin: 1.2rem 0; font-size: 1.05rem; color: #1d1d1f; text-align: left; line-height: 1.7;">${parseInlineFormatting(block.content)}</p>
`;
        } else if (isMondrian) {
          html += `
  <p style="margin: 1em 0; color: ${mondrianBlack}; line-height: 1.8;">${parseInlineFormatting(block.content)}</p>
`;
        } else if (isCyberpunk) {
          html += `
  <p style="margin: 1.2em 0; letter-spacing: 0.02em; color: #0a011a; text-align: justify; line-height: 1.8; font-size: 15px; background-color: rgba(255, 255, 255, 0.95); padding: 12px 14px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); border: 1px solid rgba(210, 74, 252, 0.3);">${parseInlineFormatting(block.content)}</p>
`;
        } else if (isCutePink) {
          html += `
  <p style="margin: 1em 0; letter-spacing: 0.05em; color: #555555; text-align: justify; line-height: 1.8; text-indent: 2em;">${parseInlineFormatting(block.content)}</p>
`;
        } else {
          html += `
  <p style="font-size: 16px; margin: 12px 0; text-align: justify; text-indent: 2em;"><font color="${template.textColor}">${parseInlineFormatting(block.content)}</font></p>
`;
        }
        break;
      case "quote":
        if (isByteGreen) {
          html += `
  <blockquote style="font-style: normal; padding: 0.8em 0.8em 0.8em 1.5em; border-left: 3px solid #2ea250; border-radius: 4px; color: #4e5969; background: ${byteGreenBg}; margin: 0.8em 0; position: relative;">${parseInlineFormatting(block.content)}</blockquote>
`;
        } else if (isAppleBento) {
          html += `
  <blockquote style="font-style: italic; padding: 1.2rem 1.5rem; color: #1d1d1f; margin: 1.5em 0; font-weight: 500; position: relative; border-left: 4px solid #0071e3; background: rgba(0, 113, 227, 0.05); border-radius: 0 8px 8px 0;">${parseInlineFormatting(block.content)}</blockquote>
`;
        } else if (isMondrian) {
          html += `
  <blockquote style="margin: 1.5em 0; padding: 1em; border-left: 8px solid ${mondrianBlue}; background-color: rgba(241, 196, 15, 0.1); font-style: italic;">${parseInlineFormatting(block.content)}</blockquote>
`;
        } else if (isCyberpunk) {
          html += `
  <blockquote style="font-style: normal; padding: 0.8em 1.2em; margin: 1.2em 0; color: #0a011a; background: rgba(255, 255, 255, 0.9); border-left: 4px solid ${cyberPurple}; box-shadow: 0 0 10px rgba(210, 74, 252, 0.2); border-radius: 0 6px 6px 0;">${parseInlineFormatting(block.content)}</blockquote>
`;
        } else if (isCutePink) {
          html += `
  <blockquote style="font-style: normal; padding: 0.8em 1.2em 0.8em 2em; border-radius: 10px; color: #666666; background: rgba(255, 245, 249, 0.8); margin: 1.2em 0; position: relative; border-left: 5px solid #FFB5D9;">${parseInlineFormatting(block.content)}</blockquote>
`;
        } else {
          html += `
  <blockquote style="background: ${template.quoteBackground}; border-left: 4px solid ${template.quoteBorder}; padding: 16px 20px; margin: 16px 0; border-radius: 0 8px 8px 0; font-style: italic;">${parseInlineFormatting(block.content)}</blockquote>
`;
        }
        break;
      case "code":
        // 微信最基础代码块
        const codeContentEscaped = block.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
        html += `
<fieldset style="border: 2px solid #888; border-radius: 4px; margin: 12px 0; padding: 8px 12px; background: #1e1e1e;">
  <legend style="color: #888; font-size: 12px; padding: 0 4px;">● ● ● code.js</legend>
  <p style="margin: 0; padding: 0; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #fff; line-height: 1.6;">${codeContentEscaped}</p>
</fieldset>`;
        break;
      case "ul":
        if (isByteGreen) {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: #4e5969;">◉ <span style="color: #2ea250;">${parseInlineFormatting(item)}</span></li>`).join("")}
</ul>`;
        } else if (isAppleBento) {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: #1d1d1f;">● ${parseInlineFormatting(item)}</li>`).join("")}
</ul>`;
        } else if (isMondrian) {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: ${mondrianBlack};">■ ${parseInlineFormatting(item)}</li>`).join("")}
</ul>`;
        } else if (isCyberpunk) {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: #00FFFF;">▹ ${parseInlineFormatting(item)}</li>`).join("")}
</ul>`;
        } else if (isCutePink) {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: #555555;">💖 ${parseInlineFormatting(item)}</li>`).join("")}
</ul>`;
        } else {
          html += `
<ul style="margin: 12px 0; padding-left: 20px;">
${block.items?.map(item => `<li style="margin: 6px 0; color: ${template.textColor};">• ${parseInlineFormatting(item)}</li>`).join("")}
</ul>`;
        }
        break;
      case "ol":
        if (isByteGreen) {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: #4e5969;">${idx + 1}. <span style="color: #2ea250;">${parseInlineFormatting(item)}</span></li>`).join("")}
</ol>`;
        } else if (isAppleBento) {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: #1d1d1f;">${idx + 1}. ${parseInlineFormatting(item)}</li>`).join("")}
</ol>`;
        } else if (isMondrian) {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: ${mondrianBlack};">${idx + 1}. ${parseInlineFormatting(item)}</li>`).join("")}
</ol>`;
        } else if (isCyberpunk) {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: #00FFFF;">${idx + 1}. ${parseInlineFormatting(item)}</li>`).join("")}
</ol>`;
        } else if (isCutePink) {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: #555555;">${idx + 1}. ${parseInlineFormatting(item)}</li>`).join("")}
</ol>`;
        } else {
          html += `
<ol style="margin: 12px 0; padding-left: 24px; list-style: none;">
${block.items?.map((item, idx) => `<li style="margin: 6px 0; color: ${template.textColor};">${idx + 1}. ${parseInlineFormatting(item)}</li>`).join("")}
</ol>`;
        }
        break;
      case "hr":
        if (isByteGreen) {
          html += `
  <hr style="height: 3px; border: none; margin: 2em auto; background: ${byteGreenGradient}; border-radius: 3px;">
`;
        } else if (isAppleBento) {
          html += `
  <hr style="height: 2px; border: none; margin: 2em auto; background: ${appleGradient}; border-radius: 2px;">
`;
        } else if (isMondrian) {
          html += `
  <hr style="height: 4px; border: none; margin: 2em auto; background: ${mondrianRed} ${mondrianYellow} ${mondrianBlue}; border-radius: 2px;">
`;
        } else if (isCyberpunk) {
          html += `
  <hr style="height: 2px; border: none; margin: 2em auto; background: linear-gradient(90deg, transparent, ${cyberPurple}, ${cyberBlue}, transparent);">
`;
        } else if (isCutePink) {
          html += `
  <hr style="height: 6px; border: none; margin: 2em auto; background: linear-gradient(90deg, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB); border-radius: 3px;">
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
