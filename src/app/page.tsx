"use client";

import { useState, useCallback, useEffect, useRef, CSSProperties } from "react";
import { useSession, signOut } from "next-auth/react";
import { parseArticle, parseMarkdownArticle, generateWechatHTML, ParsedArticle, ParsedContent } from "@/lib/parser";
import { templates, Template } from "@/lib/templates";
import Link from "next/link";

type HeadingLevel = "h1" | "h2" | "h3";

const defaultTypeFontSizes: Record<string, number> = {
  h1: 16,
  h2: 16,
  h3: 16,
  paragraph: 16,
  quote: 16,
  list: 16,
};

const defaultHeadingPreferences: Record<HeadingLevel, HeadingLevel> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

const localDraftStorageKey = "wechat-formatter-current-draft";

interface SavedFormatSettings {
  blockCustomStyles?: Record<number, { fontSize?: number; lineHeight?: number }>;
  typeFontSizes?: Record<string, number>;
  includeBackgroundColor?: boolean;
  headingPreferences?: Record<HeadingLevel, HeadingLevel>;
  isFormattedMode?: boolean;
}

interface SavedBlocksPayload {
  version: number;
  blocks: ParsedContent[];
  format?: SavedFormatSettings;
}

function InsertParagraphIcon({ direction }: { direction: "above" | "below" }) {
  const isAbove = direction === "above";

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M3 4.5h10M3 11.5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d={isAbove ? "M8 9V6M6.5 7.5 8 6l1.5 1.5" : "M8 7v3m-1.5-1.5L8 10l1.5-1.5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sampleText = `微信公众号排版工具使用指南

功能介绍

这是一款专为微信公众号打造的在线排版工具，支持智能识别文章结构，提供多种精美模板，一键复制即可在微信中使用。

主要功能

一键排版：粘贴文章内容，AI自动识别标题层级
多种模板：提供简约白、杂志风、商务蓝、文艺绿等12款风格模板
手动微调：选中任意段落可修改样式为标题、引用、列表等

使用步骤

第一步：选择输入格式（纯文本/MD文档/DOC文档）
第二步：粘贴或输入文章内容
第三步：选择喜欢的模板风格
第四步：点击"复制到微信"即可直接粘贴使用

智能提示

AI分析排版功能可以自动识别文章的大纲结构，准确判断哪些是标题、哪些是正文、哪些需要强调。

效果展示

重点内容高亮显示：本文档中的加粗文字会突出显示，数字如2024、99.9%等保持常规文本样式。

引用样式：以下是一段引用内容的示例效果，会以特殊的背景和边框呈现。

列表样式：无序列表会以前缀圆点展示，有序列表会自动编号。

联系方式

如有问题或建议，欢迎联系：support@formatter.com`;

const sampleMarkdown = `# 📝 微信公众号排版工具使用指南

## ✨ 功能介绍

这是一款专为**微信公众号**打造的在线排版工具，支持智能识别文章结构，提供多种精美模板，一键复制即可在微信中使用。

> 本工具完全免费使用，无需注册，即开即用！

## 🚀 快速开始

### 第一步：选择输入格式

支持三种输入格式切换：

- **纯文本**：直接粘贴文章内容，AI自动识别标题
- **MD文档**：使用Markdown语法，精确控制格式
- **DOC文档**：支持标准文档格式导入

### 第二步：粘贴文章内容

将你的文章内容粘贴到左侧输入框，支持：

- 中英文混合内容
- 特殊符号和emoji
- 代码片段
- 表格数据

### 第三步：选择模板

点击底部模板按钮切换风格，提供**12款精选模板**：

1. 简约白 - 白底黑字，专注阅读
2. 杂志风 - 大标题小正文
3. 商务蓝 - 正式严肃
4. 文艺绿 - 小清新风格
5. 字节绿 - 科技感
6. 手绘彩铅 - 柔和插画风

### 第四步：复制使用

点击"复制到微信"按钮，直接粘贴到微信公众号编辑器即可。

## 🎨 样式效果展示

### 标题样式

这是一级标题的效果，字体最大，用于文章大标题。

这是二级标题的效果，用于文章章节。

这是三级标题的效果，用于小节标题。

### 引用块样式

> 以下是一段引用内容的展示效果。引用块通常用于强调重要观点或引用他人言论，背景色和左边框会突出显示。

### 列表样式

无序列表项一：无序列表以前缀圆点展示，适合列举多项内容。

无序列表项二：每个模板的列表样式各有特色，可配合模板风格使用。

无序列表项三：列表可以嵌套使用，形成层级结构。

### 有序列表

步骤一：输入或粘贴文章内容到左侧区域。

步骤二：选择适合的模板风格。

步骤三：预览确认效果满意后，点击复制按钮。

步骤四：直接粘贴到微信公众号编辑器发布。

### 代码块样式

代码块采用深色背景显示，适合展示代码片段：

\`\`\`javascript
// 示例代码
function formatArticle(text) {
  return text.replace(/\\*\\*(.*?)\\*\\*/g, '【加粗】$1【/加粗】');
}
console.log('排版工具示例代码');
\`\`\`

### 加粗与高亮

本文档支持**加粗文字**高亮显示，数字如**2024**、**99.9%**等保持常规文本样式。

## 💡 高级编辑技巧

在右侧预览区，可以直接点击任意内容块进行编辑操作：

- **点击选中** - 选中后可修改样式或删除
- **H1/H2/H3** - 修改标题级别
- **正文** - 转为普通段落
- **引用** - 转为引用块样式
- **列表** - 转为有序或无序列表
- **+上/+下** - 在当前位置插入新段落
- **代码** - 插入代码块
- **🗑️** - 删除该内容块

## 📊 适用场景

| 场景 | 说明 |
|------|------|
| 新媒体运营 | 快速排版公众号文章 |
| 内容创作者 | 提升文章视觉效果 |
| 企业宣传 | 标准化品牌内容输出 |
| 个人博主 | 打造个性化文章风格 |

## ❓ 常见问题

**Q: 支持微信外链吗？**
A: 支持，复制后在微信编辑器中可正常添加外链。

**Q: 手机上能用吗？**
A: 支持，建议使用电脑端体验更佳。

**Q: 收费吗？**
A: 完全免费，可放心使用。

---

*详情咨询：support@formatter.com*`;

const sampleDoc = `# 📖 微信公众号排版神器使用教程

## 🎯 这是什么

一款专业的微信公众号排版工具，让你的文章告别单调样式，一键生成精美排版效果。

## 📋 使用流程

### 第一步：选择输入方式

本工具支持三种输入格式，满足不同使用习惯：

纯文本模式：直接粘贴文字，AI自动识别标题结构

MD文档模式：使用Markdown语法精细控制格式

DOC文档模式：导入标准文档自动转换

### 第二步：粘贴内容

支持多种内容类型粘贴，包括：

常规文章内容段落

**重点强调文字**自动高亮

数字数据如**2024年**、**99.9%**等保持常规文本样式

### 第三步：选择模板

点击底部模板卡片切换风格，共有12款风格可选：

简约白 - 经典白底黑字风格

杂志风 - 大标题配小正文

商务蓝 - 正式职场风格

文艺绿 - 清新绿色点缀

字节绿 - 现代科技风格

苹果Bento - 苹果设计风格

蒙德里安 - 波普艺术风格

可爱粉 - 少女心彩虹风格

渐变酷 - 渐变标题风格

暖时光 - 暖色生活风格

学术灰 - 论文引用风格

手绘彩铅 - 柔和插画风

### 第四步：复制发布

点击"复制到微信"按钮，直接粘贴到微信公众号编辑器即可完成发布。

## 🎨 样式演示

### 标题层级

这是一级标题，用于文章主标题

这是二级标题，用于文章章节标题

这是三级标题，用于小节标题

### 引用块

引用块效果展示，用于突出重要观点或引用他人言论，带有特殊背景色和左边框标识。

### 无序列表

列表项一：可配合模板呈现不同风格

列表项二：支持多级嵌套使用

列表项三：适合列举相关内容

### 有序列表

第一步：输入或粘贴文章内容

第二步：选择喜欢的模板风格

第三步：预览确认效果满意

第四步：复制粘贴到微信发布

### 代码展示

代码块采用深色主题显示，适合展示代码片段内容。

### 加粗高亮

支持**加粗文字**强调，数字如**2024**、**88.8%**保持常规文本样式。

## 💻 代码示例

工具支持代码块展示，以下是JavaScript示例：

\`\`\`javascript
// 格式化文章内容
function formatText(text) {
  // 识别标题
  const lines = text.split('\\n');
  return lines.map(line => {
    if (line.startsWith('##')) {
      return '<h2>' + line + '</h2>';
    }
    return '<p>' + line + '</p>';
  }).join('');
}
\`\`\`

## ⚡ 快捷编辑

在右侧预览区点击任意内容块即可进入编辑模式，支持：

点击选中内容块

修改标题级别H1/H2/H3

切换正文、引用、列表样式

插入新段落或删除内容

拖拽调整代码块高度

## 📊 模板推荐

| 内容类型 | 推荐模板 |
|----------|----------|
| 科技数码 | 字节绿、商务蓝 |
| 生活娱乐 | 暖时光、可爱粉 |
| 新闻资讯 | 简约白、学术灰 |
| 产品推广 | 苹果Bento、渐变酷 |
| 文艺清新 | 文艺绿、杂志风 |

## ❓ 常见问题

**收费吗？** 完全免费，无需注册。

**支持手机吗？** 支持，建议电脑端体验更佳。

**微信能用吗？** 支持，复制后直接粘贴到微信编辑器。

**能改模板吗？** 可以随时切换模板，实时预览效果。

---

*工具版本：v2.0 | 更新日期：2024年*`;

export default function EditorPage() {
  const { data: session, status } = useSession();
  const [articleIdFromUrl, setArticleIdFromUrl] = useState<string | null>(null);
  const [hasReadUrlParams, setHasReadUrlParams] = useState(false);
  const [inputText, setInputText] = useState(sampleText);
  const inputTextRef = useRef(sampleText);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [parsedArticle, setParsedArticle] = useState<ParsedArticle | null>(null);
  const parsedArticleRef = useRef<ParsedArticle | null>(null);
  const [isFormattedMode, setIsFormattedMode] = useState(true);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputType, setInputType] = useState<"text" | "md" | "doc">("text");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [blockText, setBlockText] = useState("");
  const [codeBlockHeights, setCodeBlockHeights] = useState<Record<number, number>>({});
  // 每个块的局部样式覆盖
  const [blockCustomStyles, setBlockCustomStyles] = useState<Record<number, { fontSize?: number; lineHeight?: number }>>({});
  // 分类字号配置
  const [typeFontSizes, setTypeFontSizes] = useState<Record<string, number>>(defaultTypeFontSizes);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [activeFontType, setActiveFontType] = useState<string>("paragraph");
  const [includeBackgroundColor, setIncludeBackgroundColor] = useState(true);
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [headingPreferences, setHeadingPreferences] = useState<Record<HeadingLevel, HeadingLevel>>(defaultHeadingPreferences);
  // 当前选中块的局部样式（编辑用）
  const [editingBlockFontSize, setEditingBlockFontSize] = useState<number>(15);
  const [editingBlockLineHeight, setEditingBlockLineHeight] = useState<number>(1.8);
  // 上传的图片列表
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // 文本框光标位置
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const shouldReplaceArticleAsPlainRef = useRef(false);
  const hasInitializedRef = useRef(false);
  // 撤销功能 - 历史记录
  const [history, setHistory] = useState<ParsedArticle[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1);
  // 选中文字检测。不要用 state 记录选区，否则重渲染会让浏览器选区消失。
  const selectionRangeRef = useRef<Range | null>(null);
  const previewEditorRef = useRef<HTMLDivElement | null>(null);
  const headingLevels: HeadingLevel[] = ["h1", "h2", "h3"];

  const getDisplayBlockType = (type: ParsedContent["type"]): ParsedContent["type"] => {
    return headingLevels.includes(type as HeadingLevel)
      ? headingPreferences[type as HeadingLevel]
      : type;
  };

  const getActiveToolbarBtnStyle = (active: boolean): CSSProperties => ({
    ...styles.toolbarBtn,
    ...(active ? {
      borderColor: "#1a73e8",
      backgroundColor: "#e8f0fe",
      color: "#1a73e8",
      fontWeight: 600,
    } : {}),
  });

  const serializeArticleToInput = (article: ParsedArticle): string => {
    const lines = [article.title, ""];

    article.blocks.forEach((block) => {
      switch (block.type) {
        case "h1":
          lines.push(`# ${block.content}`);
          break;
        case "h2":
          lines.push(`## ${block.content}`);
          break;
        case "h3":
          lines.push(`### ${block.content}`);
          break;
        case "quote":
          lines.push(`> ${block.content}`);
          break;
        case "code":
          lines.push("```", block.content, "```");
          break;
        case "ul":
          (block.items || []).forEach(item => lines.push(`- ${item}`));
          break;
        case "ol":
          (block.items || []).forEach((item, index) => lines.push(`${index + 1}. ${item}`));
          break;
        case "hr":
          lines.push("---");
          break;
        case "image":
          lines.push(`[IMAGE:${block.content}]`);
          break;
        case "table":
          lines.push(block.content);
          break;
        default:
          lines.push(block.content);
      }
      lines.push("");
    });

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  };

  const syncInputFromArticle = (article: ParsedArticle) => {
    const nextInput = serializeArticleToInput(article);
    inputTextRef.current = nextInput;
    setInputText(nextInput);
  };

  const setEditorInput = (value: string) => {
    inputTextRef.current = value;
    setInputText(value);
  };

  const saveCurrentSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
      selectionRangeRef.current = null;
      return;
    }

    const range = selection.getRangeAt(0);
    const previewEditor = previewEditorRef.current;
    if (!previewEditor || !previewEditor.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = null;
      return;
    }

    selectionRangeRef.current = range.cloneRange();
  }, []);

  const hasActivePreviewSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return false;

    const previewEditor = previewEditorRef.current;
    return !!previewEditor && previewEditor.contains(selection.getRangeAt(0).commonAncestorContainer);
  };

  const handlePreviewBlockClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasActivePreviewSelection()) {
      saveCurrentSelection();
      return;
    }
    setSelectedBlockIndex(index);
  };

  const restoreSavedSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRangeRef.current) return false;

    selection.removeAllRanges();
    selection.addRange(selectionRangeRef.current);
    return true;
  };

  // 保存快照到历史记录
  const saveToHistory = useCallback((article: ParsedArticle) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndexRef.current + 1);
      newHistory.push(JSON.parse(JSON.stringify(article)));
      // 最多保存50条历史
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => {
      const nextIndex = Math.min(prev + 1, 49);
      historyIndexRef.current = nextIndex;
      return nextIndex;
    });
  }, []);

  const parseInputToArticle = useCallback((text: string, typeOverride: "text" | "md" | "doc" = inputType): ParsedArticle | null => {
    if (!text.trim()) return null;
    return typeOverride === "md" ? parseMarkdownArticle(text) : parseArticle(text);
  }, [inputType]);

  const applyParsedInput = useCallback((text: string, saveHistorySnapshot = true, typeOverride: "text" | "md" | "doc" = inputType) => {
    const parsed = parseInputToArticle(text, typeOverride);
    parsedArticleRef.current = parsed;
    setParsedArticle(parsed);
    setIsFormattedMode(!!parsed);
    if (parsed && saveHistorySnapshot) {
      saveToHistory(parsed);
    }
  }, [inputType, parseInputToArticle, saveToHistory]);

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const createPlainArticleFromInput = (text: string): ParsedArticle | null => {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const blocks: ParsedContent[] = [];
    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      if (paragraphLines.length === 0) return;
      blocks.push({
        type: "paragraph",
        content: paragraphLines.map((line) => escapeHtml(line)).join("<br>"),
      });
      paragraphLines = [];
    };

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (!line.trim()) {
        flushParagraph();
        continue;
      }

      paragraphLines.push(line);
    }

    flushParagraph();
    if (blocks.length === 0) {
      return null;
    }

    return { title: "", blocks };
  };

  const applyPlainInput = (text: string) => {
    const plainArticle = createPlainArticleFromInput(text);
    parsedArticleRef.current = plainArticle;
    setParsedArticle(plainArticle);
    setIsFormattedMode(false);
    if (plainArticle) {
      saveToHistory(plainArticle);
    }
  };

  const parseEditableInputContent = (text: string): ParsedArticle => {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const firstContentIndex = lines.findIndex((line) => line.trim());
    const title = firstContentIndex >= 0
      ? lines[firstContentIndex].trim().replace(/^#{1,3}\s+/, "")
      : "";
    const blocks: ParsedContent[] = [];
    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      if (paragraphLines.length === 0) return;
      blocks.push({ type: "paragraph", content: paragraphLines.join(" ").trim() });
      paragraphLines = [];
    };

    for (let i = firstContentIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      if (trimmed.startsWith("```")) {
        flushParagraph();
        const codeLines: string[] = [];
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() === "```") {
            i = j;
            break;
          }
          codeLines.push(lines[j]);
          i = j;
        }
        blocks.push({ type: "code", content: codeLines.join("\n") });
        continue;
      }

      const imageMatch = trimmed.match(/^!\[.*?\]\((.+)\)$/) || trimmed.match(/^\[IMAGE:(.+)\]$/);
      if (imageMatch) {
        flushParagraph();
        blocks.push({ type: "image", content: imageMatch[1] });
        continue;
      }

      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        flushParagraph();
        blocks.push({ type: "hr", content: "" });
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s*(.+)$/);
      if (headingMatch) {
        flushParagraph();
        blocks.push({
          type: `h${Math.min(headingMatch[1].length, 3)}` as "h1" | "h2" | "h3",
          content: headingMatch[2].trim(),
        });
        continue;
      }

      if (trimmed.startsWith(">")) {
        flushParagraph();
        blocks.push({ type: "quote", content: trimmed.replace(/^>\s*/, "") });
        continue;
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        flushParagraph();
        const items: string[] = [];
        for (let j = i; j < lines.length; j++) {
          const match = lines[j].trim().match(/^[-*•]\s+(.+)$/);
          if (!match) break;
          items.push(match[1]);
          i = j;
        }
        blocks.push({ type: "ul", content: "", items });
        continue;
      }

      if (/^\d+[.、]\s+/.test(trimmed)) {
        flushParagraph();
        const items: string[] = [];
        for (let j = i; j < lines.length; j++) {
          const match = lines[j].trim().match(/^\d+[.、]\s+(.+)$/);
          if (!match) break;
          items.push(match[1]);
          i = j;
        }
        blocks.push({ type: "ol", content: "", items });
        continue;
      }

      paragraphLines.push(trimmed);
    }

    flushParagraph();
    return { title, blocks };
  };

  const coerceBlockContent = (existingBlock: ParsedContent | undefined, incomingBlock: ParsedContent): ParsedContent => {
    if (!existingBlock) {
      if (incomingBlock.type === "image" || incomingBlock.type === "code" || incomingBlock.type === "hr") {
        return incomingBlock;
      }
      return {
        type: "paragraph",
        content: incomingBlock.items?.join("\n") || incomingBlock.content || "",
      };
    }

    if (existingBlock.type === "ul" || existingBlock.type === "ol") {
      const items = incomingBlock.items && incomingBlock.items.length > 0
        ? incomingBlock.items
        : (incomingBlock.content || "").split(/\n+/).map((item) => item.trim()).filter(Boolean);
      return { ...existingBlock, items: items.length > 0 ? items : existingBlock.items };
    }

    if (existingBlock.type === "hr") {
      return existingBlock;
    }

    const content = incomingBlock.items?.join("\n") || incomingBlock.content || "";
    return { ...existingBlock, content };
  };

  const syncArticleTextWithoutReflow = (text: string) => {
    const incomingArticle = parseEditableInputContent(text);
    const currentArticle = parsedArticleRef.current;

    if (!currentArticle) {
      applyPlainInput(text);
      return;
    }

    const maxLength = Math.max(currentArticle.blocks.length, incomingArticle.blocks.length);
    const nextBlocks: ParsedContent[] = [];

    for (let index = 0; index < maxLength; index++) {
      const incomingBlock = incomingArticle.blocks[index];
      if (!incomingBlock) continue;
      nextBlocks.push(coerceBlockContent(currentArticle.blocks[index], incomingBlock));
    }

    const nextArticle: ParsedArticle = {
      title: incomingArticle.title || currentArticle.title,
      blocks: nextBlocks,
    };

    parsedArticleRef.current = nextArticle;
    setParsedArticle(nextArticle);
    saveToHistory(nextArticle);
  };

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const restoredArticle = JSON.parse(JSON.stringify(history[newIndex]));
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      parsedArticleRef.current = restoredArticle;
      setParsedArticle(restoredArticle);
      syncInputFromArticle(restoredArticle);
      showToast("已撤销");
    } else {
      showToast("没有可撤销的操作");
    }
  }, [history, historyIndex]);

  // 键盘事件 - Ctrl+Z 撤销
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const [selectionFontSize, setSelectionFontSize] = useState(15);
  // 标记正在转换格式的块索引，避免 onBlur 覆盖数据
  const [convertingBlockIndex, setConvertingBlockIndex] = useState<number | null>(null);

  const sampleTexts = {
    text: sampleText,
    md: sampleMarkdown,
    doc: sampleDoc,
  };

  const typeLabels = {
    text: "纯文本",
    md: "MD文档",
    doc: "DOC文档",
  };

  // 切换输入类型时加载示例
  const handleTypeChange = (type: "text" | "md" | "doc") => {
    const nextText = sampleTexts[type];
    setInputType(type);
    setEditorInput(nextText);
    if (type === "md") {
      applyParsedInput(nextText, true, type);
    } else {
      applyPlainInput(nextText);
    }
    setCurrentArticleId(null);
    setShowTypeDropdown(false);
    setSelectedBlockIndex(null);
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const selectedAll =
      target.selectionStart === 0 &&
      target.selectionEnd === inputTextRef.current.length;

    if (!inputTextRef.current.trim() || selectedAll) {
      shouldReplaceArticleAsPlainRef.current = true;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value;
    setEditorInput(nextText);
    setCursorPosition(e.target.selectionStart);

    if (!nextText.trim()) {
      parsedArticleRef.current = null;
      setParsedArticle(null);
      setIsFormattedMode(false);
      setSelectedBlockIndex(null);
      setEditingBlockIndex(null);
      setEditingTitle(false);
      return;
    }

    if (shouldReplaceArticleAsPlainRef.current) {
      shouldReplaceArticleAsPlainRef.current = false;
      if (inputType === "md") {
        applyParsedInput(nextText, true, "md");
      } else {
        applyPlainInput(nextText);
      }
      return;
    }

    if (inputType === "md") {
      applyParsedInput(nextText, true, "md");
      return;
    }

    syncArticleTextWithoutReflow(nextText);
  };

  // 选中块
  const handleSelectBlock = (index: number) => {
    setSelectedBlockIndex(selectedBlockIndex === index ? null : index);
    setEditingBlockIndex(null);
  };

  // 开始编辑块内容
  const handleStartEditBlock = (index: number) => {
    if (parsedArticle && parsedArticle.blocks[index]) {
      const block = parsedArticle.blocks[index];
      setEditingBlockIndex(index);
      // 列表类型用items.join换行符，普通类型用content
      setBlockText(block.items ? block.items.join("\n") : (block.content || ""));
      setSelectedBlockIndex(index);
    }
  };

  // 更新文章内容并保存历史
  const updateArticle = (article: ParsedArticle) => {
    parsedArticleRef.current = article;
    saveToHistory(article);
    setParsedArticle(article);
    syncInputFromArticle(article);
  };

  // 保存块编辑
  const handleSaveBlock = () => {
    const currentArticle = parsedArticleRef.current;
    if (!currentArticle || editingBlockIndex === null) return;

    const block = currentArticle.blocks[editingBlockIndex];
    if (!block) return;

    const newBlocks = [...currentArticle.blocks];
    if (block.type === "ul" || block.type === "ol") {
      newBlocks[editingBlockIndex] = { ...block, items: blockText.split("\n").filter(line => line.trim()) };
    } else {
      newBlocks[editingBlockIndex] = { ...block, content: blockText };
    }

    updateArticle({ ...currentArticle, blocks: newBlocks });
    setEditingBlockIndex(null);
  };

  // 开始编辑标题
  const handleStartEditTitle = () => {
    if (parsedArticle) {
      setEditingTitle(true);
      setTitleText(parsedArticle.title);
    }
  };

  // 保存标题
  const handleSaveTitle = () => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      updateArticle({ ...currentArticle, title: titleText });
      setEditingTitle(false);
    }
  };

  // 修改块类型
  const handleChangeBlockType = (index: number, newType: ParsedContent["type"]) => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);

      const newBlocks = [...currentArticle.blocks];
      const oldBlock = newBlocks[index];

      // 列表转正文
      if (newType === "paragraph" && (oldBlock.type === "ul" || oldBlock.type === "ol")) {
        const content = oldBlock.items?.join("\n") || oldBlock.content || "";
        newBlocks[index] = { type: "paragraph", content };
      }
      // 正文/其他类型转列表
      else if (newType === "ul" || newType === "ol") {
        if (oldBlock.type === "paragraph" || oldBlock.type === "quote" || oldBlock.type === "h1" || oldBlock.type === "h2" || oldBlock.type === "h3") {
          // 从段落类转列表：把content按换行拆分
          const items = (oldBlock.content || "")
            .split(/[\n\r]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
          newBlocks[index] = { type: newType, content: "", items: items.length > 0 ? items : [oldBlock.content || ""] };
        } else if (oldBlock.type === "ul" || oldBlock.type === "ol") {
          // 列表转列表：保留items
          newBlocks[index] = { ...oldBlock, type: newType };
        }
      }
      // 其他类型切换
      else {
        newBlocks[index] = { ...oldBlock, type: newType };
      }
      updateArticle({ ...currentArticle, blocks: newBlocks });
    }
  };

  // 删除块
  const handleDeleteBlock = (index: number) => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      const newBlocks = currentArticle.blocks.filter((_, i) => i !== index);
      updateArticle({ ...currentArticle, blocks: newBlocks });
      setSelectedBlockIndex(null);
    }
  };

  // 添加块
  const handleAddBlock = (index: number, position: "above" | "below") => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      const newBlock: ParsedContent = { type: "paragraph", content: "新段落" };
      const newBlocks = [...currentArticle.blocks];
      const insertIndex = position === "above" ? index : index + 1;
      newBlocks.splice(insertIndex, 0, newBlock);
      updateArticle({ ...currentArticle, blocks: newBlocks });
    }
  };

  // 转换为引用
  const handleConvertToQuote = (index: number) => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);
      const newBlocks = [...currentArticle.blocks];
      // 列表内容存在 items 中，需要合并为字符串
      const content = newBlocks[index].items
        ? newBlocks[index].items.join('\n')
        : newBlocks[index].content;
      newBlocks[index] = { type: "quote", content };
      updateArticle({ ...currentArticle, blocks: newBlocks });
    }
  };

  // 转换为列表
  const handleConvertToList = (index: number, listType: "ul" | "ol") => {
    const currentArticle = parsedArticleRef.current;
    if (currentArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);

      const newBlocks = [...currentArticle.blocks];
      const content = newBlocks[index].content;
      // 如果内容包含换行，按换行拆分；否则按句子拆分
      const items = content
        .split(/[\n\r]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      newBlocks[index] = {
        type: listType,
        content: "",
        items: items.length > 0 ? items : [content]
      };
      updateArticle({ ...currentArticle, blocks: newBlocks });
    }
  };

  // 调整代码块高度
  const handleCodeBlockResize = (index: number, delta: number) => {
    setCodeBlockHeights(prev => {
      const current = prev[index] || 120;
      const newHeight = Math.max(80, Math.min(600, current + delta));
      return { ...prev, [index]: newHeight };
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setArticleIdFromUrl(params.get("articleId"));
    setHasReadUrlParams(true);
  }, []);

  // 首次进入新文章时加载示例；MD 自动排版，其它保持纯内容。
  useEffect(() => {
    if (!hasReadUrlParams || hasInitializedRef.current || articleIdFromUrl) {
      return;
    }

    hasInitializedRef.current = true;
    const savedDraftRaw = localStorage.getItem(localDraftStorageKey);
    if (savedDraftRaw) {
      try {
        const savedDraft = JSON.parse(savedDraftRaw);
        const savedBlocks = savedDraft.blocks;
        const blocks = savedBlocks && Array.isArray((savedBlocks as SavedBlocksPayload).blocks)
          ? (savedBlocks as SavedBlocksPayload).blocks
          : [];
        const formatSettings = savedBlocks && Array.isArray((savedBlocks as SavedBlocksPayload).blocks)
          ? (savedBlocks as SavedBlocksPayload).format
          : undefined;
        const article: ParsedArticle = {
          title: savedDraft.title || "未命名文章",
          blocks,
        };

        setEditorInput(savedDraft.content || serializeArticleToInput(article));
        parsedArticleRef.current = article;
        setParsedArticle(article);
        setIsFormattedMode(formatSettings?.isFormattedMode ?? true);
        setBlockCustomStyles(formatSettings?.blockCustomStyles || {});
        setTypeFontSizes(formatSettings?.typeFontSizes || defaultTypeFontSizes);
        setIncludeBackgroundColor(formatSettings?.includeBackgroundColor ?? true);
        setHeadingPreferences(formatSettings?.headingPreferences || defaultHeadingPreferences);
        setSelectedTemplate(templates.find((template) => template.id === savedDraft.template) || templates[0]);
        setHistory([JSON.parse(JSON.stringify(article))]);
        setHistoryIndex(0);
        historyIndexRef.current = 0;
        return;
      } catch {
        localStorage.removeItem(localDraftStorageKey);
      }
    }

    if (inputType === "md") {
      applyParsedInput(inputTextRef.current, true, "md");
    } else {
      applyPlainInput(inputTextRef.current);
    }
  }, [articleIdFromUrl, applyParsedInput, hasReadUrlParams, inputType]);

  // 从文章库进入时加载已有文章。加载后左侧保留原文，右侧使用保存过的 blocks。
  useEffect(() => {
    if (!hasReadUrlParams) return;

    if (!articleIdFromUrl) {
      setCurrentArticleId(null);
      return;
    }

    if (status === "loading") return;
    if (!session?.user?.id) return;

    let cancelled = false;

    const loadArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${articleIdFromUrl}`);
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "加载文章失败");
          return;
        }

        let blocks: ParsedContent[] = [];
        let formatSettings: SavedFormatSettings | undefined;
        try {
          const savedBlocks = typeof data.blocks === "string"
            ? JSON.parse(data.blocks || "[]")
            : data.blocks;

          if (Array.isArray(savedBlocks)) {
            blocks = savedBlocks;
          } else if (savedBlocks && Array.isArray((savedBlocks as SavedBlocksPayload).blocks)) {
            blocks = (savedBlocks as SavedBlocksPayload).blocks;
            formatSettings = (savedBlocks as SavedBlocksPayload).format;
          }
        } catch {
          blocks = [];
        }

        const article: ParsedArticle = {
          title: data.title || "未命名文章",
          blocks,
        };

        if (cancelled) return;

        const nextInput = data.content || serializeArticleToInput(article);
        inputTextRef.current = nextInput;
        setInputText(nextInput);
        parsedArticleRef.current = article;
        setParsedArticle(article);
        setIsFormattedMode(formatSettings?.isFormattedMode ?? true);
        setBlockCustomStyles(formatSettings?.blockCustomStyles || {});
        setTypeFontSizes(formatSettings?.typeFontSizes || defaultTypeFontSizes);
        setIncludeBackgroundColor(formatSettings?.includeBackgroundColor ?? true);
        setHeadingPreferences(formatSettings?.headingPreferences || defaultHeadingPreferences);
        setCurrentArticleId(data.id);
        setHistory([JSON.parse(JSON.stringify(article))]);
        setHistoryIndex(0);
        historyIndexRef.current = 0;

        const savedTemplate = templates.find((template) => template.id === data.template);
        setSelectedTemplate(savedTemplate || templates[0]);
      } catch {
        if (!cancelled) {
          showToast("加载文章失败");
        }
      }
    };

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [articleIdFromUrl, hasReadUrlParams, session?.user?.id, status]);

  // AI分析文章结构
  const handleAIAnalyze = useCallback(async () => {
    const textToFormat = inputTextRef.current;
    if (!textToFormat.trim()) {
      showToast("请先输入文章内容");
      return;
    }
    setIsAnalyzing(true);
    try {
      const formattedArticle = parseInputToArticle(textToFormat);
      if (!formattedArticle) {
        showToast("请先输入文章内容");
        return;
      }
      updateArticle(formattedArticle);
      setIsFormattedMode(true);
      showToast("排版完成");
    } catch {
      showToast("排版失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  }, [parseInputToArticle]);

  // 模板切换
  const handleTemplateChange = (template: Template) => {
    setSelectedTemplate(template);
  };

  // 复制到微信
  const handleCopy = async () => {
    try {
      const articleToCopy = syncArticleFromPreview();
      if (!articleToCopy) {
        showToast("请先输入文章内容");
        return;
      }

      const html = isFormattedMode
        ? generateWechatHTML(articleToCopy, selectedTemplate.id, [], blockCustomStyles, typeFontSizes, includeBackgroundColor, headingPreferences)
        : generatePlainHTML(articleToCopy);
      const blob = new Blob([html], { type: "text/html" });
      const clipboardItem = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([clipboardItem]);
      showToast("已复制，可直接粘贴到微信");
    } catch {
      showToast("复制失败，请重试");
    }
  };

  // 清空
  const handleClear = () => {
    setEditorInput("");
    parsedArticleRef.current = null;
    setParsedArticle(null);
    setIsFormattedMode(false);
    setCurrentArticleId(null);
    setSelectedBlockIndex(null);
    setEditingBlockIndex(null);
    setEditingTitle(false);
    setUploadedImages([]);
    localStorage.removeItem(localDraftStorageKey);
  };

  const buildSaveBody = (articleToSave: ParsedArticle) => {
    const title = articleToSave.title || "未命名文章";
    const content = inputTextRef.current;
    const blocks: SavedBlocksPayload = {
      version: 2,
      blocks: articleToSave.blocks,
      format: {
        blockCustomStyles,
        typeFontSizes,
        includeBackgroundColor,
        headingPreferences,
        isFormattedMode,
      },
    };

    return {
      title,
      content,
      blocks,
      template: selectedTemplate.id,
    };
  };

  // 小保存：保存当前页面草稿，不写入文章库
  const handleSaveCurrent = () => {
    const articleToSave = syncArticleFromPreview();
    if (!articleToSave) {
      showToast("请先输入文章内容");
      return;
    }

    try {
      localStorage.setItem(localDraftStorageKey, JSON.stringify({
        ...buildSaveBody(articleToSave),
        savedAt: Date.now(),
      }));
      showToast("当前排版已保存");
    } catch {
      showToast("保存失败，请重试");
    }
  };

  // 保存到文章库：需要登录，写入服务端文章库
  const handleSaveToLibrary = async () => {
    const articleToSave = syncArticleFromPreview();
    if (!articleToSave) {
      showToast("请先输入文章内容");
      return;
    }

    if (!session) {
      showToast("请先登录后再保存到文章库");
      return;
    }

    const isUpdating = Boolean(currentArticleId);

    try {
      const res = await fetch(isUpdating ? `/api/articles/${currentArticleId}` : "/api/articles", {
        method: isUpdating ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSaveBody(articleToSave))
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        if (!isUpdating && data?.id) {
          setCurrentArticleId(data.id);
        }
        showToast(isUpdating ? "文章库已更新" : "已保存到文章库");
      } else {
        showToast(data?.error || "保存失败");
      }
    } catch {
      showToast("保存失败，请重试");
    }
  };

  // 处理图片上传 - 插入到光标位置
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let usedLocalFallback = false;
    let uploadErrorMessage = "";
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            const details = data?.details;
            const detailText = [
              details?.code,
              details?.message,
              details?.requestId ? `RequestId: ${details.requestId}` : "",
            ].filter(Boolean).join(" | ");

            throw new Error(detailText || data?.error || "Upload failed");
          }

          if (!data.url) {
            throw new Error("Upload missing url");
          }
          return data.url;
        } catch (error) {
          console.warn("图床上传失败，已降级为本地图片:", error);
          usedLocalFallback = true;
          uploadErrorMessage = error instanceof Error ? error.message : "未知错误";
          return readFileAsDataUrl(file);
        }
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url) => !!url);

      if (validUrls.length > 0) {
        // 在光标位置插入图片标记
        const before = inputText.slice(0, cursorPosition);
        const after = inputText.slice(cursorPosition);
        const imageMarkers = validUrls.map(url => `[IMAGE:${url}]`).join("\n");
        const newInputText = before + (before && !before.endsWith("\n") ? "\n\n" : "") + imageMarkers + "\n" + after;

        setEditorInput(newInputText);
        // 更新光标位置到插入内容之后
        setCursorPosition(before.length + imageMarkers.length + (before && !before.endsWith("\n") ? 2 : 1));
        showToast(usedLocalFallback ? `图床上传失败：${uploadErrorMessage}` : `成功插入 ${validUrls.length} 张图片`);
      }
    } catch (error) {
      console.error("图片上传失败:", error);
      showToast("图片处理失败，请重试");
    } finally {
      setIsUploading(false);
      // 清空input以便重复选择同一文件
      e.target.value = "";
    }
  };

  // 删除上传的图片
  const handleDeleteImage = (index: number) => {
    if (parsedArticle) {
      const newBlocks = parsedArticle.blocks.filter((_, i) => i !== index);
      updateArticle({ ...parsedArticle, blocks: newBlocks });
    }
  };

  // 图片拖拽排序
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const [dropImageIndex, setDropImageIndex] = useState<number | null>(null);

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDragImageIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragImageIndex !== null && dragImageIndex !== index) {
      setDropImageIndex(index);
    }
  };

  const handleImageDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragImageIndex !== null && dragImageIndex !== dropIdx) {
      setUploadedImages((prev) => {
        const newImages = [...prev];
        const [draggedImage] = newImages.splice(dragImageIndex, 1);
        newImages.splice(dropIdx, 0, draggedImage);
        return newImages;
      });
    }
    setDragImageIndex(null);
    setDropImageIndex(null);
  };

  const handleImageDragEnd = () => {
    setDragImageIndex(null);
    setDropImageIndex(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const normalizeEditableHtml = (html: string) => {
    return html
      .replace(/<div><br><\/div>/gi, "<br>")
      .replace(/<div>/gi, "<br>")
      .replace(/<\/div>/gi, "")
      .replace(/<font\s+color=["']?([^"'>\s]+)["']?\s*>(.*?)<\/font>/gi, '<span style="color: $1;">$2</span>')
      .trim();
  };

  const generatePlainHTML = (article: ParsedArticle) => {
    const renderContent = (content: string) => content || "";
    const blocks = article.blocks.map((block) => {
      switch (block.type) {
        case "image":
          return `<p style="margin: 12px 0;"><img src="${block.content}" style="max-width: 100%; height: auto;" /></p>`;
        case "ul":
          return `<ul style="margin: 8px 0; padding-left: 1.2em;">${(block.items || []).map((item) => `<li>${renderContent(item)}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol style="margin: 8px 0; padding-left: 1.2em;">${(block.items || []).map((item) => `<li>${renderContent(item)}</li>`).join("")}</ol>`;
        case "code":
          return `<pre style="white-space: pre-wrap; margin: 12px 0;">${escapeHtml(block.content)}</pre>`;
        case "table":
          return `<div style="overflow-x: auto; margin: 12px 0;">${block.content}</div>`;
        case "hr":
          return `<hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />`;
        default:
          return `<p style="margin: 8px 0; line-height: 1.7; color: #333;">${renderContent(block.content)}</p>`;
      }
    }).join("");

    return `<section style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif; color: #333; line-height: 1.7;">${blocks}</section>`;
  };

  const updateHtmlBlock = (index: number, html: string) => {
    const newContent = normalizeEditableHtml(html);
    const currentArticle = parsedArticleRef.current;
    const currentBlock = currentArticle?.blocks[index];
    if (!currentBlock || currentBlock.content === newContent) return;

    const newBlocks = [...currentArticle.blocks];
    newBlocks[index] = { ...newBlocks[index], content: newContent };
    updateArticle({ ...currentArticle, blocks: newBlocks });
  };

  const getListItemsFromHtml = (element: HTMLElement) => {
    const listItems = Array.from(element.querySelectorAll("li"));
    if (listItems.length > 0) {
      return listItems.map((item) => {
        const contentNode = item.querySelector("[data-list-content]") as HTMLElement | null;
        return normalizeEditableHtml((contentNode || item).innerHTML);
      }).filter(Boolean);
    }

    return normalizeEditableHtml(element.innerHTML)
      .split(/<br\s*\/?>|\n/gi)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const syncArticleFromPreview = (): ParsedArticle | null => {
    const currentArticle = parsedArticleRef.current;
    const previewEditor = previewEditorRef.current;
    if (!currentArticle || !previewEditor) return currentArticle;

    const titleElement = previewEditor.querySelector('[data-preview-title="true"]') as HTMLElement | null;
    const nextTitle = titleElement ? normalizeEditableHtml(titleElement.innerHTML) : currentArticle.title;
    const nextBlocks = currentArticle.blocks.map((block, index) => {
      const blockElement = previewEditor.querySelector(`[data-block-index="${index}"]`) as HTMLElement | null;
      if (!blockElement) return block;

      if (block.type === "ul" || block.type === "ol") {
        const items = getListItemsFromHtml(blockElement);
        return { ...block, items };
      }

      if (block.type === "code") {
        return { ...block, content: blockElement.textContent || "" };
      }

      if (block.type === "image" || block.type === "hr" || block.type === "table") {
        return block;
      }

      return { ...block, content: normalizeEditableHtml(blockElement.innerHTML) };
    });

    const nextArticle: ParsedArticle = { title: nextTitle, blocks: nextBlocks };
    const hasChanged = JSON.stringify({
      title: currentArticle.title,
      blocks: currentArticle.blocks,
    }) !== JSON.stringify({
      title: nextArticle.title,
      blocks: nextArticle.blocks,
    });

    if (hasChanged) {
      parsedArticleRef.current = nextArticle;
      setParsedArticle(nextArticle);
      saveToHistory(nextArticle);
      syncInputFromArticle(nextArticle);
    }

    return nextArticle;
  };

  const applyTextCommand = (command: string, value?: string) => {
    if (!restoreSavedSelection()) {
      saveCurrentSelection();
    }

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    syncArticleFromPreview();
    saveCurrentSelection();
  };

  // 获取H1样式
  const getH1Style = (): CSSProperties => {
    const size = typeFontSizes.h1;
    if (selectedTemplate.id === "byte-green") {
      return {
        display: "table",
        padding: "0.5em 2em",
        margin: "1.5em auto 1em",
        color: "#1d2129",
        fontSize: `${size}px`,
        fontWeight: 600,
        textAlign: "center",
        background: "linear-gradient(90deg, #2ea250, #09fc3c)",
        backgroundSize: "100% 35%",
        backgroundPosition: "bottom 0.15em center",
        backgroundRepeat: "no-repeat",
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        display: "table",
        padding: "0.8em 2em",
        margin: "2em auto 1.5em",
        color: "#FFFFFF",
        fontSize: `${size}px`,
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: "0.1em",
        position: "relative",
        lineHeight: 1.5,
        width: "fit-content",
        maxWidth: "90%",
        background: "linear-gradient(135deg, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2)",
        borderRadius: "20px",
        boxShadow: "0 5px 15px rgba(255, 133, 162, 0.3)",
        border: "3px solid #FFE6EE",
      };
    }
    if (selectedTemplate.h1Background) {
      return {
        fontSize: `${size}px`,
        fontWeight: 600,
        color: selectedTemplate.h1TextColor || "#ffffff",
        padding: "4px 12px",
        margin: "20px 0 12px",
        background: selectedTemplate.h1Background,
        borderLeft: `4px solid ${selectedTemplate.h1Color || selectedTemplate.primaryColor}`,
      };
    }
    // 默认H1样式
    return {
      fontSize: `${size}px`,
      fontWeight: 700,
      color: selectedTemplate.h1Color || selectedTemplate.headingColor,
      margin: "20px 0 12px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.h1Color || selectedTemplate.headingColor}`,
    };
  };

  // 获取H2样式
  const getH2Style = (blockIndex: number): CSSProperties => {
    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    const typeSize = typeFontSizes.h2;
    if (selectedTemplate.id === "byte-green") {
      return {
        display: "table",
        padding: "0.3em 1em",
        margin: "1em auto 0.6em",
        color: "white",
        background: "linear-gradient(135deg, #2ea250, #09fc3c)",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        fontWeight: 600,
        textAlign: "center",
        borderRadius: "6px",
        letterSpacing: "0.02em",
        boxShadow: "0 2px 4px rgba(46, 162, 80, 0.15)",
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        display: "table",
        padding: "0.7em 1.2em",
        margin: "2.5em auto 1.8em",
        color: "#FFFFFF",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: "0.1em",
        position: "relative",
        width: "fit-content",
        maxWidth: "85%",
        background: "linear-gradient(135deg, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5)",
        borderRadius: "30px",
        boxShadow: "0 4px 10px rgba(255, 133, 162, 0.2)",
        border: "2px solid #FFD6E4",
      };
    }
    // 默认H2样式
    return {
      fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
      fontWeight: 600,
      color: selectedTemplate.headingColor,
      margin: "18px 0 10px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.quoteBorder || selectedTemplate.headingColor}`,
    };
  };

  // 获取标题样式（文章大标题）
  const getTitleStyle = (): CSSProperties => {
    const size = typeFontSizes.h1;
    if (selectedTemplate.id === "byte-green") {
      return {
        display: "table",
        padding: "0.5em 2em",
        margin: "1.5em auto 1em",
        color: "#1d2129",
        fontSize: `${size}px`,
        fontWeight: 600,
        textAlign: "center",
        background: "linear-gradient(90deg, #2ea250, #09fc3c)",
        backgroundSize: "100% 35%",
        backgroundPosition: "bottom 0.15em center",
        backgroundRepeat: "no-repeat",
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        display: "table",
        padding: "0.8em 2em",
        margin: "2em auto 1.5em",
        color: "#FFFFFF",
        fontSize: `${size}px`,
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: "0.1em",
        position: "relative",
        lineHeight: 1.5,
        width: "fit-content",
        maxWidth: "90%",
        background: "linear-gradient(135deg, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2)",
        borderRadius: "20px",
        boxShadow: "0 5px 15px rgba(255, 133, 162, 0.3)",
        border: "3px solid #FFE6EE",
      };
    }
    if (selectedTemplate.h1Background) {
      return {
        fontSize: `${size}px`,
        fontWeight: 600,
        color: selectedTemplate.h1TextColor || "#ffffff",
        padding: "4px 12px",
        margin: "20px 0 12px",
        background: selectedTemplate.h1Background,
        borderLeft: `4px solid ${selectedTemplate.h1Color || selectedTemplate.primaryColor}`,
      };
    }
    // 默认标题样式
    return {
      fontSize: `${size}px`,
      fontWeight: 700,
      color: selectedTemplate.h1Color || selectedTemplate.headingColor,
      margin: "20px 0 12px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.h1Color || selectedTemplate.headingColor}`,
    };
  };

  // 获取H3样式
  const getH3Style = (blockIndex: number): CSSProperties => {
    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    const typeSize = typeFontSizes.h3;
    if (selectedTemplate.id === "byte-green") {
      return {
        padding: "0.2em 0",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        color: "#1d2129",
        margin: "0.8em 0 0.3em",
        fontWeight: 600,
        display: "inline-block",
        background: "linear-gradient(90deg, #2ea250, #09fc3c)",
        backgroundSize: "100% 1.8px",
        backgroundPosition: "bottom left",
        backgroundRepeat: "no-repeat",
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        padding: "0.5em 1em 0.5em 2.2em",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        lineHeight: 1.6,
        margin: "2em 0 0.75em",
        fontWeight: 600,
        position: "relative",
        color: "#FFFFFF",
        background: "linear-gradient(90deg, #FFB5D9, #E8B4D5, #FFDFD3)",
        borderRadius: "15px",
        boxShadow: "0 3px 8px rgba(255, 133, 162, 0.2)",
        border: "2px solid #FFE6EE",
        display: "block",
        width: "fit-content",
      };
    }
    // 默认H3样式
    return {
      fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
      fontWeight: 500,
      color: selectedTemplate.subheadingColor,
      margin: "14px 0 8px",
      paddingLeft: "8px",
      borderLeft: `3px solid ${selectedTemplate.subheadingColor}`,
    };
  };

  // 获取段落样式（支持局部字号和行高）
  const getParagraphStyle = (blockIndex: number): CSSProperties => {
    if (!isFormattedMode) {
      return {
        fontSize: "16px",
        margin: "8px 0",
        textAlign: "left",
        textIndent: 0,
        lineHeight: 1.7,
        color: "#333",
      };
    }

    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    const customHeight = blockCustomStyles[blockIndex]?.lineHeight;
    const typeSize = typeFontSizes.paragraph;
    if (selectedTemplate.id === "byte-green") {
      return {
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        margin: "0.8em 0",
        letterSpacing: "0",
        color: "#4e5969",
        textAlign: "justify" as const,
        lineHeight: customHeight || 1.8,
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        margin: "1em 0",
        letterSpacing: "0.05em",
        color: "#555",
        textAlign: "justify" as const,
        lineHeight: customHeight || 1.8,
        textIndent: 0,
      };
    }
    return {
      fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
      margin: "10px 0",
      textAlign: "justify" as const,
      textIndent: 0,
      lineHeight: customHeight || 1.8,
      color: selectedTemplate.textColor,
    };
  };

  // 获取引用样式
  const getQuoteStyle = (blockIndex?: number): CSSProperties => {
    const customSize = blockIndex !== undefined ? blockCustomStyles[blockIndex]?.fontSize : undefined;
    const customHeight = blockIndex !== undefined ? blockCustomStyles[blockIndex]?.lineHeight : undefined;
    const typeSize = typeFontSizes.quote;
    if (selectedTemplate.id === "byte-green") {
      return {
        fontStyle: "normal",
        padding: "0.8em 0.8em 0.8em 1.5em",
        borderLeft: "3px solid #2ea250",
        borderRadius: "4px",
        color: "#4e5969",
        background: "linear-gradient(90deg, rgba(46, 162, 80, 0.05), rgba(9, 252, 60, 0.05))",
        margin: "0.8em 0",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        lineHeight: customHeight || 1.8,
      };
    }
    if (selectedTemplate.id === "cute-pink") {
      return {
        fontStyle: "normal",
        padding: "0.5em 1em 0.5em 2em",
        borderRadius: "10px",
        color: "#666",
        background: "rgba(255, 245, 249, 0.8)",
        margin: "1.2em 0",
        position: "relative",
        borderLeft: "5px solid #FFB5D9",
        fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
        lineHeight: customHeight || 1.8,
      };
    }
    return {
      fontStyle: "normal",
      padding: "10px 15px",
      borderLeft: `4px solid ${selectedTemplate.quoteBorder}`,
      backgroundColor: selectedTemplate.quoteBackground,
      margin: "12px 0",
      color: selectedTemplate.textColor,
      fontSize: customSize ? `${customSize}px` : `${typeSize}px`,
      lineHeight: customHeight || 1.8,
    };
  };

  // 渲染预览内容
  const renderPreview = () => {
    if (!parsedArticle) {
      return (
        <div style={{ color: "#999", textAlign: "center", padding: "40px" }}>
          请输入文章内容
        </div>
      );
    }

    const elements: React.ReactNode[] = [];

    // 标题。纯粘贴模式不生成标题，避免未点击排版时出现标题样式。
    if (parsedArticle.title.trim()) {
      elements.push(
        <div key="title-wrapper" style={selectedTemplate.id === "cute-pink" ? { position: "relative", margin: "2em auto 1.5em", width: "80%" } : {}}>
          {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", top: "50%", left: "-1.2em", transform: "translateY(-50%)", fontSize: "1.2em", color: "#FFB5D9", zIndex: 2 }}>★</span>}
          <h1
            data-preview-title="true"
            onClick={(e) => {
              e.stopPropagation();
              if (hasActivePreviewSelection()) {
                saveCurrentSelection();
                return;
              }
              setSelectedBlockIndex(-1);
            }}
            style={selectedTemplate.id === "cute-pink" ? { ...getTitleStyle(), margin: 0, width: "100%" } : { ...getTitleStyle(), cursor: "text", outline: "none" }}
            dangerouslySetInnerHTML={{ __html: parsedArticle.title }}
          />
          {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", top: "50%", right: "-1.2em", transform: "translateY(-50%)", fontSize: "1.2em", color: "#FFB5D9", zIndex: 2 }}>★</span>}
        </div>
      );
    }

    // 内容块由外层统一 contentEditable 承载，支持跨段落选择和内联样式编辑。
    parsedArticle.blocks.forEach((block, i) => {
      // 添加拖放区域（上方）
      elements.push(
        <div
          key={`drop-before-${i}`}
          contentEditable={false}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.background = "rgba(46, 162, 80, 0.1)";
            e.currentTarget.style.borderColor = selectedTemplate.primaryColor;
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";

            const data = e.dataTransfer.getData("text/plain");
            if (data === "new-image" && e.dataTransfer.getData("image-url")) {
              const imageUrl = e.dataTransfer.getData("image-url");
              const newBlocks = [...parsedArticle.blocks];
              newBlocks.splice(i, 0, { type: "image" as const, content: imageUrl });
              updateArticle({ ...parsedArticle, blocks: newBlocks });
            }
          }}
          style={{
            height: "8px",
            margin: "2px 0",
            borderRadius: "4px",
            border: "2px dashed transparent",
            transition: "all 0.2s",
          }}
        />
      );

      const displayType = getDisplayBlockType(block.type);

      switch (displayType) {
        case "h1":
          elements.push(
            <div key={i} style={selectedTemplate.id === "cute-pink" ? { position: "relative", margin: "2em auto 1.5em", width: "80%" } : {}}>
              {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", top: "50%", left: "-1.2em", transform: "translateY(-50%)", fontSize: "1.2em", color: "#FFB5D9", zIndex: 2 }}>★</span>}
              <h1
                data-block-index={i}
                onClick={(e) => handlePreviewBlockClick(i, e)}
                style={selectedTemplate.id === "cute-pink" ? { ...getH1Style(), margin: 0, width: "100%" } : getH1Style()}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
              {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", top: "50%", right: "-1.2em", transform: "translateY(-50%)", fontSize: "1.2em", color: "#FFB5D9", zIndex: 2 }}>★</span>}
            </div>
          );
          break;
        case "h2":
          elements.push(
            <div key={i} style={selectedTemplate.id === "cute-pink" ? { position: "relative", margin: "2.5em auto 1.8em", width: "70%" } : {}}>
              {selectedTemplate.id === "cute-pink" && (
                <span contentEditable={false} style={{ position: "absolute", top: "-1.1em", right: "0.6em", fontSize: "1.1em", color: "#FF85A2", zIndex: 2, lineHeight: 1 }}>✧</span>
              )}
              <h2
                data-block-index={i}
                onClick={(e) => handlePreviewBlockClick(i, e)}
                style={selectedTemplate.id === "cute-pink" ? { ...getH2Style(i), margin: 0, width: "100%" } : getH2Style(i)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
          break;
        case "h3":
          elements.push(
            <div key={i} style={selectedTemplate.id === "cute-pink" ? { position: "relative", margin: "2em 0 0.75em", width: "fit-content" } : {}}>
              {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", left: "-1em", top: "50%", transform: "translateY(-50%)", fontSize: "1.1em", zIndex: 2, color: "#FF85A2", lineHeight: 1 }}>✦</span>}
              <h3
                data-block-index={i}
                onClick={(e) => handlePreviewBlockClick(i, e)}
                style={selectedTemplate.id === "cute-pink" ? { ...getH3Style(i), margin: 0, width: "100%" } : getH3Style(i)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
          break;
        case "paragraph":
          elements.push(
            <p
              key={i}
              data-block-index={i}
              onClick={(e) => handlePreviewBlockClick(i, e)}
              style={getParagraphStyle(i)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
          break;
        case "quote":
          elements.push(
            <div key={i} style={selectedTemplate.id === "cute-pink" ? { position: "relative" } : {}}>
              {selectedTemplate.id === "cute-pink" && <span contentEditable={false} style={{ position: "absolute", left: "0.5em", top: "-0.2em", fontSize: "2em", color: "#FF85A2", fontFamily: "Georgia, serif", zIndex: 2, lineHeight: 1 }}>❝</span>}
              <blockquote
                data-block-index={i}
                onClick={(e) => handlePreviewBlockClick(i, e)}
                style={getQuoteStyle(i)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
          break;
        case "ul":
          elements.push(
            <ul
              key={i}
              data-block-index={i}
              onClick={(e) => handlePreviewBlockClick(i, e)}
              style={selectedTemplate.id === "byte-green" ? {
                paddingLeft: "1.2em",
                margin: "0.8em 0",
                color: "#4e5969",
                listStyleType: "none",
              } : selectedTemplate.id === "cute-pink" ? {
                paddingLeft: "2em",
                margin: "1em 0",
                listStyleType: "none",
              } : {
                paddingLeft: "24px",
                margin: "8px 0",
                color: selectedTemplate.textColor,
                listStyleType: "none",
              }}
            >
              {(block.items || []).map((item, j) => (
                <li key={j} style={selectedTemplate.id === "byte-green" ? { margin: "0.3em 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative", paddingLeft: "0.8em" } : selectedTemplate.id === "cute-pink" ? { margin: "0.5em 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative" } : { margin: "8px 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative", paddingLeft: "16px" }}>
                  {selectedTemplate.id === "byte-green" ? (
                    <span contentEditable={false} style={{ position: "absolute", left: 0, top: "0.65em", width: "5px", height: "5px", borderRadius: "50%", background: "radial-gradient(circle, #09fc3c, #2ea250)", opacity: j % 2 !== 0 ? 0.7 : 1 }}></span>
                  ) : selectedTemplate.id === "cute-pink" ? (
                    <span contentEditable={false} style={{ position: "absolute", left: "-1.5em", fontSize: "0.9em", color: "#FF85A2" }}>♡</span>
                  ) : (
                    <span contentEditable={false} style={{ position: "absolute", left: "0", color: selectedTemplate.headingColor || "#2ea250", fontWeight: "bold" }}>•</span>
                  )}
                  <span data-list-content="true" dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          );
          break;
        case "ol":
          elements.push(
            <ol
              key={i}
              data-block-index={i}
              onClick={(e) => handlePreviewBlockClick(i, e)}
              style={selectedTemplate.id === "byte-green" ? {
                paddingLeft: "1.2em",
                margin: "0.8em 0",
                color: "#4e5969",
                listStyleType: "none",
                counterReset: "item",
              } : selectedTemplate.id === "cute-pink" ? {
                paddingLeft: "2em",
                margin: "1em 0",
                listStyleType: "none",
                counterReset: "item",
              } : {
                paddingLeft: "0",
                margin: "8px 0",
                color: selectedTemplate.textColor,
                listStyleType: "none",
                counterReset: "item",
              }}
            >
              {(block.items || []).map((item, j) => (
                <li key={j} style={selectedTemplate.id === "byte-green" ? { margin: "0.3em 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative", paddingLeft: "0.5em", counterIncrement: "item" } : selectedTemplate.id === "cute-pink" ? { margin: "0.5em 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative", listStyle: "none", counterIncrement: "item" } : { margin: "8px 0", lineHeight: blockCustomStyles[i]?.lineHeight || 1.8, fontSize: blockCustomStyles[i]?.fontSize ? `${blockCustomStyles[i].fontSize}px` : `${typeFontSizes.list}px`, position: "relative", paddingLeft: "32px", counterIncrement: "item" }}>
                  {selectedTemplate.id === "byte-green" ? (
                    <span contentEditable={false} style={{ position: "absolute", left: "-1em", top: "0.15em", color: "#2ea250", fontWeight: "bold", fontStyle: "italic" }}>{j + 1}.</span>
                  ) : selectedTemplate.id === "cute-pink" ? (
                    <span contentEditable={false} style={{ position: "absolute", left: "-2em", top: "0.2em", color: "#FFFFFF", background: "linear-gradient(135deg, #FFB5D9, #E8B4D5)", width: "1.5em", height: "1.5em", borderRadius: "50%", textAlign: "center", lineHeight: "1.5em", fontWeight: "bold" }}>{j + 1}</span>
                  ) : (
                    <span contentEditable={false} style={{ position: "absolute", left: "0", width: "22px", height: "22px", lineHeight: "22px", textAlign: "center", background: selectedTemplate.headingColor || "#2ea250", color: "#fff", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}>{j + 1}</span>
                  )}
                  <span data-list-content="true" dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ol>
          );
          break;
        case "code":
          const codeHeight = codeBlockHeights[i] || 160;
          elements.push(
            <div
              key={i}
              onClick={(e) => handlePreviewBlockClick(i, e)}
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                margin: "12px 0",
                background: "#1e1e1e",
              }}
            >
              <div contentEditable={false} style={{ background: "#2d2d2d", padding: "10px 12px", borderBottom: "1px solid #3c3c3c", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                </div>
                <span style={{ fontSize: "12px", color: "#888", fontFamily: "system-ui", marginLeft: "8px" }}>code.js</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                  <button onClick={(e) => { e.stopPropagation(); handleCodeBlockResize(i, -40); }} style={{ ...styles.toolbarBtn, padding: "2px 6px" }}>➖</button>
                  <button onClick={(e) => { e.stopPropagation(); handleCodeBlockResize(i, 40); }} style={{ ...styles.toolbarBtn, padding: "2px 6px" }}>➕</button>
                  <button onClick={(e) => { e.stopPropagation(); handleChangeBlockType(i, "paragraph"); }} style={{ ...styles.toolbarBtn, padding: "2px 6px" }}>转正文</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(i); }} style={{ ...styles.toolbarBtn, padding: "2px 6px", color: "#dc2626" }}>🗑️</button>
                </div>
              </div>
              <pre
                data-block-index={i}
                style={{
                  margin: 0,
                  padding: "12px",
                  maxHeight: codeHeight,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "#d4d4d4",
                  fontFamily: "Menlo, Monaco, monospace",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  cursor: "text",
                }}
              >
                {block.content}
              </pre>
            </div>
          );
          break;
        case "image":
          elements.push(
            <div
              key={i}
              contentEditable={false}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", `image:${i}`);
                e.dataTransfer.effectAllowed = "move";
              }}
              style={{
                margin: "12px 0",
                borderRadius: "8px",
                overflow: "hidden",
                border: selectedBlockIndex === i ? `2px solid ${selectedTemplate.primaryColor}` : "2px solid transparent",
                cursor: "grab",
                position: "relative",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
            >
              <img
                src={block.content}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: "8px",
                  border: `3px solid ${selectedTemplate.primaryColor}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                alt="文章图片"
              />
              {selectedBlockIndex === i && (
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  display: "flex",
                  gap: "4px",
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBlock(i);
                    }}
                    style={{
                      background: "rgba(220, 38, 38, 0.9)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >🗑️</button>
                </div>
              )}
            </div>
          );
          break;
        case "table":
          elements.push(
            <div
              key={i}
              contentEditable={false}
              onClick={(e) => handlePreviewBlockClick(i, e)}
              style={{
                overflowX: "auto",
                margin: "12px 0",
                border: selectedBlockIndex === i ? `1px solid ${selectedTemplate.primaryColor}` : "1px solid transparent",
                borderRadius: "6px",
              }}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
          break;
        case "hr":
          elements.push(
            <div key={i} contentEditable={false} style={selectedTemplate.id === "byte-green" ? { margin: "1.8em 0" } : selectedTemplate.id === "cute-pink" ? { margin: "2.5em auto", position: "relative" } : {}}>
              {selectedTemplate.id === "cute-pink" && (
                <div style={{ position: "relative", height: 0, top: "-18px" }}>
                  <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: "1.4em", zIndex: 2, color: "#FF85A2" }}>✦</span>
                </div>
              )}
              <hr
                style={selectedTemplate.id === "byte-green" ? {
                  height: "1px",
                  border: "none",
                  margin: 0,
                  background: "linear-gradient(to right, rgba(46, 162, 80, 0), rgba(46, 162, 80, 0.5), rgba(9, 252, 60, 0.5), rgba(9, 252, 60, 0))",
                  position: "relative",
                } : selectedTemplate.id === "cute-pink" ? {
                  height: "6px",
                  border: "none",
                  margin: 0,
                  background: "linear-gradient(to right, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2)",
                  borderRadius: "3px",
                  position: "relative",
                } : {
                  height: "1px",
                  border: "none",
                  margin: "20px 0",
                  background: selectedTemplate.quoteBorder,
                }}
              />
              {selectedTemplate.id === "byte-green" && (
                <div style={{ position: "relative", height: 0, top: "-1px" }}>
                  <span style={{ position: "absolute", left: "50%", top: 0, transform: "translate(-50%, -50%)", width: "5px", height: "5px", background: "radial-gradient(circle, #09fc3c, #2ea250)", borderRadius: "50%", boxShadow: "-18px 0 0 rgba(46, 162, 80, 0.5), 18px 0 0 rgba(9, 252, 60, 0.5)" }}></span>
                </div>
              )}
            </div>
          );
          break;
        case "hr":
          elements.push(
            <div key={i} style={selectedTemplate.id === "byte-green" ? { margin: "1.8em 0" } : selectedTemplate.id === "cute-pink" ? { margin: "2.5em auto", position: "relative" } : {}}>
              {selectedTemplate.id === "cute-pink" && (
                <div style={{ position: "relative", height: 0, top: "-18px" }}>
                  <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: "1.4em", zIndex: 2, color: "#FF85A2" }}>✦</span>
                </div>
              )}
              <hr
                style={selectedTemplate.id === "byte-green" ? {
                  height: "1px",
                  border: "none",
                  margin: 0,
                  background: "linear-gradient(to right, rgba(46, 162, 80, 0), rgba(46, 162, 80, 0.5), rgba(9, 252, 60, 0.5), rgba(9, 252, 60, 0))",
                  position: "relative",
                } : selectedTemplate.id === "cute-pink" ? {
                  height: "6px",
                  border: "none",
                  margin: 0,
                  background: "linear-gradient(to right, #FF85A2, #FFB5D9, #FFDFD3, #F4CAD8, #E8B4D5, #D4A0CB, #FF85A2)",
                  borderRadius: "3px",
                  position: "relative",
                } : {
                  height: "1px",
                  border: "none",
                  margin: "20px 0",
                  background: selectedTemplate.quoteBorder,
                }}
              />
              {selectedTemplate.id === "byte-green" && (
                <div style={{ position: "relative", height: 0, top: "-1px" }}>
                  <span style={{ position: "absolute", left: "50%", top: 0, transform: "translate(-50%, -50%)", width: "5px", height: "5px", background: "radial-gradient(circle, #09fc3c, #2ea250)", borderRadius: "50%", boxShadow: "-18px 0 0 rgba(46, 162, 80, 0.5), 18px 0 0 rgba(9, 252, 60, 0.5)" }}></span>
                </div>
              )}
            </div>
          );
          break;
      }
    });

    return elements;
  };

  const renderFontSizeControl = () => (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
        style={styles.toolbarBtn}
      >
        ⚙️ 字号调整
      </button>
      {showFontSizeMenu && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "white",
          border: "1px solid #e0e7ff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "16px",
          width: "280px",
          zIndex: 200,
        }}>
          <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "14px", color: "#333" }}>字号调整</div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "100px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { id: "h1", label: "一级标题" },
                { id: "h2", label: "二级标题" },
                { id: "h3", label: "三级标题" },
                { id: "paragraph", label: "正文" },
                { id: "quote", label: "引用" },
                { id: "list", label: "列表" },
              ].map(type => (
                <div
                  key={type.id}
                  onClick={() => setActiveFontType(type.id)}
                  style={{
                    padding: "6px 8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    backgroundColor: activeFontType === type.id ? "#e8f0fe" : "transparent",
                    color: activeFontType === type.id ? "#1a73e8" : "#666",
                    fontWeight: activeFontType === type.id ? "bold" : "normal"
                  }}
                >
                  {type.label}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: "12px", display: "flex", flexWrap: "wrap", gap: "6px", alignContent: "flex-start" }}>
              {[12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28].map(size => (
                <button
                  key={size}
                  onClick={() => setTypeFontSizes(prev => ({ ...prev, [activeFontType]: size }))}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    border: "1px solid",
                    borderColor: typeFontSizes[activeFontType] === size ? "#1a73e8" : "#ddd",
                    backgroundColor: typeFontSizes[activeFontType] === size ? "#e8f0fe" : "#fff",
                    color: typeFontSizes[activeFontType] === size ? "#1a73e8" : "#333",
                    borderRadius: "4px",
                    cursor: "pointer",
                    minWidth: "36px"
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTextFormatControls = () => (
    <div style={styles.toolbarGroup}>
      <span style={{ fontSize: "12px", color: "#666", fontWeight: 400 }}>文字格式</span>
      <button
        onMouseDown={(e) => { e.preventDefault(); applyTextCommand("bold"); }}
        style={{ ...styles.toolbarBtn, fontWeight: 700 }}
        title="加粗"
      >B</button>
      <button
        onMouseDown={(e) => { e.preventDefault(); applyTextCommand("italic"); }}
        style={{ ...styles.toolbarBtn, fontStyle: "italic" }}
        title="斜体"
      >I</button>
      <button
        onMouseDown={(e) => { e.preventDefault(); applyTextCommand("underline"); }}
        style={{ ...styles.toolbarBtn, textDecoration: "underline" }}
        title="下划线"
      >U</button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          applyTextCommand("foreColor", selectedTemplate.headingColor);
        }}
        style={{ ...styles.toolbarBtn, color: selectedTemplate.headingColor }}
        title="文字颜色"
      >🎨</button>
      <button
        onMouseDown={(e) => { e.preventDefault(); applyTextCommand("removeFormat"); }}
        style={styles.toolbarBtn}
        title="清除文字格式"
      >重置</button>
    </div>
  );

  const renderBackgroundControl = () => (
    <>
      <button
        onClick={() => setIncludeBackgroundColor(prev => !prev)}
        style={{
          ...styles.toolbarBtn,
          backgroundColor: includeBackgroundColor ? selectedTemplate.backgroundColor : "#FFF",
          borderColor: includeBackgroundColor ? selectedTemplate.primaryColor : "#E0E0E0",
          color: includeBackgroundColor ? selectedTemplate.textColor : "#333",
          fontWeight: includeBackgroundColor ? 600 : 400,
        }}
        title="切换文章背景颜色"
      >
        背景{includeBackgroundColor ? "开" : "关"}
      </button>
    </>
  );

  const renderTypographyPreferenceControl = () => (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowTypographyMenu(!showTypographyMenu)}
        style={styles.toolbarBtn}
      >
        自定义
      </button>
      {showTypographyMenu && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "white",
          border: "1px solid #e0e7ff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "14px",
          width: "240px",
          zIndex: 200,
        }}>
          <div style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "14px", color: "#333" }}>排版偏好</div>
          {(["h1", "h2"] as HeadingLevel[]).map(level => (
            <label
              key={level}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px", fontSize: "13px", color: "#666" }}
            >
              <span>{level.toUpperCase()} 显示为</span>
              <select
                value={headingPreferences[level]}
                onChange={(e) => setHeadingPreferences(prev => ({ ...prev, [level]: e.target.value as HeadingLevel }))}
                style={{
                  padding: "5px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                  background: "#fff",
                  color: "#333",
                }}
              >
                {(["h1", "h2"] as HeadingLevel[]).map(option => (
                  <option key={option} value={option}>{option.toUpperCase()}</option>
                ))}
              </select>
            </label>
          ))}
          <button
            onClick={() => setHeadingPreferences({ h1: "h1", h2: "h2", h3: "h3" })}
            style={{ ...styles.toolbarBtn, marginTop: "4px", width: "100%" }}
          >
            恢复默认
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* 顶部 */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <span style={styles.logo}>排</span>
          <span style={styles.title}>文字排版</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.templateLabel}>
            模板：{selectedTemplate.name}
          </div>
          {session ? (
            <div style={styles.userArea}>
              <span style={styles.userName}>{session.user?.name || session.user?.email}</span>
              <Link href="/articles" style={styles.articlesLink}>我的文章</Link>
              <button onClick={() => signOut()} style={styles.logoutBtn}>退出登录</button>
            </div>
          ) : (
            <div style={styles.userArea}>
              <Link href="/login" style={styles.loginBtn}>登录</Link>
            </div>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main style={styles.main}>
        {/* 左侧编辑 */}
        <div style={styles.editorPanel}>
          {/* 输入框包装 */}
          <div style={styles.inputWrapper}>
            {/* 下拉选择器 */}
            <div style={styles.inputHeader}>
              <span style={styles.inputLabel}>输入格式</span>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                style={styles.dropdownBtn}
              >
                {typeLabels[inputType]}
                <span style={styles.dropdownArrow}>▼</span>
              </button>
              {showTypeDropdown && (
                <div style={styles.dropdownMenu}>
                  <div
                    onClick={() => handleTypeChange("text")}
                    style={{ ...styles.dropdownItem, ...(inputType === "text" ? styles.dropdownItemActive : {}) }}
                  >
                    <span style={styles.dropdownItemTitle}>纯文本</span>
                    <span style={styles.dropdownItemDesc}>智能识别标题层级</span>
                  </div>
                  <div
                    onClick={() => handleTypeChange("md")}
                    style={{ ...styles.dropdownItem, ...(inputType === "md" ? styles.dropdownItemActive : {}) }}
                  >
                    <span style={styles.dropdownItemTitle}>MD文档</span>
                    <span style={styles.dropdownItemDesc}>Markdown格式解析</span>
                  </div>
                  <div
                    onClick={() => handleTypeChange("doc")}
                    style={{ ...styles.dropdownItem, ...(inputType === "doc" ? styles.dropdownItemActive : {}) }}
                  >
                    <span style={styles.dropdownItemTitle}>DOC文档</span>
                    <span style={styles.dropdownItemDesc}>Word格式解析</span>
                  </div>
                </div>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onPaste={handleInputPaste}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
              }}
              onKeyUp={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
              }}
              placeholder="粘贴文章内容，或点击上传图片按钮插入图片到光标位置..."
              style={styles.textarea}
            />
            {/* 图片上传按钮 */}
            <div style={{ padding: "8px 16px", borderTop: "1px solid #EEE", display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ cursor: isUploading ? "not-allowed" : "pointer", padding: "6px 14px", background: isUploading ? "#ccc" : selectedTemplate.primaryColor, color: "#fff", borderRadius: "16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                {isUploading ? "⏳ 上传中..." : "📷 上传图片"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 右侧预览 */}
        <div style={styles.previewPanel}>
          <div style={{ ...styles.previewCard, padding: 0, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* 顶部工具栏 - 固定在顶部 */}
            <div style={{
              ...styles.previewToolbar,
              background: selectedBlockIndex !== null || editingTitle ? "#f0f7ff" : "#fafafa",
            }}>
              {editingTitle ? (
                /* 标题编辑模式 */
                <input
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    border: "1px solid #1a73e8",
                    borderRadius: "6px",
                    outline: "none",
                  }}
                />
              ) : editingBlockIndex !== null ? (
                /* 块内容编辑模式 */
                <input
                  value={blockText}
                  onChange={(e) => setBlockText(e.target.value)}
                  onBlur={handleSaveBlock}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveBlock()}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    fontSize: "14px",
                    border: "1px solid #1a73e8",
                    borderRadius: "6px",
                    outline: "none",
                  }}
                />
              ) : selectedBlockIndex === -1 ? (
                /* 标题选中 */
                <div style={styles.toolbarGroup}>
                  <span style={{ fontSize: "12px", color: "#666", marginRight: "8px" }}>文章标题</span>
                  <button onClick={handleStartEditTitle} style={{ ...styles.toolbarBtn, background: "#e8f0fe", color: "#1a73e8" }}>✏️ 编辑</button>
                  <button onClick={() => setSelectedBlockIndex(null)} style={{ ...styles.toolbarBtn, color: "#16a34a" }}>✓</button>
                </div>
              ) : selectedBlockIndex !== null && selectedBlockIndex >= 0 ? (
                /* 选中块时的工具栏 */
                <div style={styles.toolbarGroup}>
                  {(() => {
                    const selectedBlock = parsedArticle?.blocks[selectedBlockIndex];
                    const displayType = getDisplayBlockType(selectedBlock?.type || "paragraph");
                    return (
                      <>
                  <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>
                    {displayType === "h1" ? "H1" :
                     displayType === "h2" ? "H2" :
                     displayType === "h3" ? "H3" :
                     selectedBlock?.type === "quote" ? "引用" :
                     selectedBlock?.type === "ul" || selectedBlock?.type === "ol" ? "列表" : "正文"}
                  </span>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h1")} style={getActiveToolbarBtnStyle(displayType === "h1")}>H1</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h2")} style={getActiveToolbarBtnStyle(displayType === "h2")}>H2</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h3")} style={getActiveToolbarBtnStyle(displayType === "h3")}>H3</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "paragraph")} style={getActiveToolbarBtnStyle(selectedBlock?.type === "paragraph")}>正文</button>
                  <button onClick={() => handleConvertToQuote(selectedBlockIndex)} style={getActiveToolbarBtnStyle(selectedBlock?.type === "quote")}>❝引用</button>
                  <button
                    onClick={() => selectedBlock?.type === "ol" || selectedBlock?.type === "ul" ? handleChangeBlockType(selectedBlockIndex, "ul") : handleConvertToList(selectedBlockIndex, "ul")}
                    style={getActiveToolbarBtnStyle(selectedBlock?.type === "ul")}
                  >☰</button>
                  <button
                    onClick={() => selectedBlock?.type === "ol" || selectedBlock?.type === "ul" ? handleChangeBlockType(selectedBlockIndex, "ol") : handleConvertToList(selectedBlockIndex, "ol")}
                    style={getActiveToolbarBtnStyle(selectedBlock?.type === "ol")}
                  >⑴</button>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* 无选中 */
                <div style={styles.toolbarGroup}>
                  <span style={{ fontSize: "12px", color: "#999", marginRight: "4px" }}>正文</span>
                  <button style={styles.toolbarBtn}>H1</button>
                  <button style={styles.toolbarBtn}>H2</button>
                  <button style={styles.toolbarBtn}>H3</button>
                  <button style={styles.toolbarBtn}>正文</button>
                  <button style={styles.toolbarBtn}>❝引用</button>
                  <button style={styles.toolbarBtn}>☰</button>
                  <button style={styles.toolbarBtn}>⑴</button>
                  <span style={{ fontSize: "12px", color: "#999" }}>整篇编辑</span>
                </div>
              )}
              {!editingTitle && editingBlockIndex === null && selectedBlockIndex !== null && selectedBlockIndex >= 0 && (
                <div style={styles.toolbarGroup}>
                  <button
                    onClick={() => handleAddBlock(selectedBlockIndex, "above")}
                    style={styles.iconToolbarBtn}
                    title="上加一段"
                    aria-label="上加一段"
                  >
                    <InsertParagraphIcon direction="above" />
                  </button>
                  <button
                    onClick={() => handleAddBlock(selectedBlockIndex, "below")}
                    style={styles.iconToolbarBtn}
                    title="下加一段"
                    aria-label="下加一段"
                  >
                    <InsertParagraphIcon direction="below" />
                  </button>
                  <button onClick={() => handleDeleteBlock(selectedBlockIndex)} style={{ ...styles.toolbarBtn, color: "#dc2626" }}>🗑️</button>
                  <button onClick={() => setSelectedBlockIndex(null)} style={{ ...styles.toolbarBtn, color: "#16a34a" }}>✓</button>
                </div>
              )}
              {renderTextFormatControls()}
              <div style={styles.toolbarSpacer} />
              <div style={styles.toolbarGroup}>
                {renderBackgroundControl()}
                {renderTypographyPreferenceControl()}
                {renderFontSizeControl()}
              </div>
            </div>

            <div
              ref={previewEditorRef}
              contentEditable={!!parsedArticle}
              suppressContentEditableWarning
              style={{
                ...styles.previewContent,
                lineHeight: 1.8,
                backgroundColor: isFormattedMode && includeBackgroundColor ? selectedTemplate.backgroundColor : "#FFF",
                color: isFormattedMode ? selectedTemplate.textColor : "#333",
                cursor: parsedArticle ? "text" : "default",
                outline: "none",
              }}
              onMouseUp={saveCurrentSelection}
              onKeyUp={saveCurrentSelection}
              onBlur={() => {
                syncArticleFromPreview();
                saveCurrentSelection();
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedBlockIndex(null);
                  setEditingBlockIndex(null);
                  setEditingTitle(false);
                }
              }}
            >
              {renderPreview()}
            </div>
          </div>
        </div>
      </main>

      {/* 模板栏 */}
      <div style={styles.templateBar}>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTemplateChange(t)}
            style={{
              ...styles.templateBtn,
              ...(selectedTemplate.id === t.id ? styles.templateBtnActive : {}),
              background: t.backgroundColor,
              color: t.textColor,
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* 工具栏 */}
      <footer style={styles.toolbar}>
        <button onClick={handleAIAnalyze} style={{ ...styles.aiBtn }} disabled={isAnalyzing}>
          {isAnalyzing ? "分析中..." : "✨ AI分析排版"}
        </button>
        <button onClick={handleSaveCurrent} style={styles.toolBtn}>保存</button>
        {session && <button onClick={handleSaveToLibrary} style={styles.toolBtn}>保存到文章库</button>}
        <button onClick={handleCopy} style={styles.primaryBtn}>复制到微信</button>
        <button onClick={handleClear} style={styles.toolBtn}>清空</button>
      </footer>

      {/* Toast */}
      {toastMessage && <div style={styles.toast}>{toastMessage}</div>}
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#FAFAFA",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    borderBottom: "1px solid #EEE",
    backgroundColor: "#FFF",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logo: {
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    backgroundColor: "#1a73e8",
    color: "#FFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "13px",
  },
  title: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#333",
  },
  templateLabel: {
    fontSize: "13px",
    color: "#666",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userName: {
    fontSize: "13px",
    color: "#333",
  },
  articlesLink: {
    fontSize: "13px",
    color: "#1a73e8",
    textDecoration: "none",
  },
  loginBtn: {
    fontSize: "13px",
    color: "#1a73e8",
    textDecoration: "none",
    padding: "6px 16px",
    border: "1px solid #1a73e8",
    borderRadius: "6px",
  },
  logoutBtn: {
    fontSize: "13px",
    color: "#666",
    background: "none",
    border: "1px solid #ddd",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  editorPanel: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
  },
  textarea: {
    width: "100%",
    height: "calc(100% - 50px)",
    padding: "16px",
    border: "none",
    borderRadius: "0 0 12px 12px",
    fontSize: "14px",
    lineHeight: 1.8,
    resize: "none",
    outline: "none",
    backgroundColor: "#FFF",
    fontFamily: "inherit",
  },
  inputWrapper: {
    backgroundColor: "#FFF",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  inputHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #EEE",
    position: "relative",
  },
  inputLabel: {
    fontSize: "13px",
    color: "#666",
    fontWeight: 500,
  },
  dropdownBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #E0E0E0",
    backgroundColor: "#FFF",
    fontSize: "13px",
    cursor: "pointer",
    color: "#333",
  },
  dropdownArrow: {
    fontSize: "10px",
    color: "#999",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    backgroundColor: "#FFF",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    border: "1px solid #E0E0E0",
    zIndex: 100,
    minWidth: "200px",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #F0F0F0",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  dropdownItemActive: {
    backgroundColor: "#F5F9FF",
  },
  dropdownItemTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  },
  dropdownItemDesc: {
    fontSize: "12px",
    color: "#999",
  },
  blockToolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    padding: "8px",
    backgroundColor: "#F5F5F5",
    borderRadius: "6px",
    marginTop: "8px",
    marginBottom: "8px",
  },
  previewToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: "1px solid #e0e7ff",
    minHeight: "54px",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  toolbarGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 6px",
    border: "1px solid #e8edf7",
    borderRadius: "6px",
    backgroundColor: "rgba(255,255,255,0.72)",
    flexWrap: "wrap",
    minHeight: "34px",
  },
  toolbarSpacer: {
    flex: "1 1 16px",
    minWidth: "8px",
  },
  toolbarBtn: {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid #E0E0E0",
    backgroundColor: "#FFF",
    fontSize: "12px",
    cursor: "pointer",
    color: "#333",
  },
  iconToolbarBtn: {
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid #E0E0E0",
    backgroundColor: "#FFF",
    fontSize: "12px",
    cursor: "pointer",
    color: "#333",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "26px",
  },
  previewPanel: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  previewCard: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#FFF",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  previewContent: {
    padding: "24px",
    minHeight: "400px",
    flex: 1,
    overflowY: "auto",
  },
  editArea: {
    width: "100%",
    minHeight: "400px",
    padding: "12px",
    border: "1px solid #E0E0E0",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "monospace",
    resize: "vertical",
    outline: "none",
  },
  templateBar: {
    display: "flex",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#FFF",
    borderTop: "1px solid #EEE",
    overflowX: "auto",
  },
  templateBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #E0E0E0",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: "#FFF",
    color: "#333",
  },
  templateBtnActive: {
    border: "2px solid #1a73e8",
  },
  toolbar: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    padding: "14px 24px",
    backgroundColor: "#FFF",
    borderTop: "1px solid #EEE",
  },
  toolBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #E0E0E0",
    backgroundColor: "#FFF",
    fontSize: "14px",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1a73e8",
    color: "#FFF",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 500,
  },
  aiBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "2px solid #9d4edd",
    backgroundColor: "#FFF",
    color: "#9d4edd",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  toast: {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "#FFF",
    borderRadius: "20px",
    fontSize: "13px",
    zIndex: 1000,
  },
};
