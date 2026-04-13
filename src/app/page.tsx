"use client";

import { useState, useCallback, useEffect, CSSProperties } from "react";
import { parseArticle, parseMarkdownArticle, generateWechatHTML, ParsedArticle, ParsedContent } from "@/lib/parser";
import { templates, Template } from "@/lib/templates";

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

重点内容高亮显示：本文档中的加粗文字会突出显示，数字如2024、99.9%等也会特殊标记。

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
3. 极客黑 - 深色背景，代码友好
4. 商务蓝 - 正式严肃
5. 文艺绿 - 小清新风格
6. 字节绿 - 科技感

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

本文档支持**加粗文字**高亮显示，数字如**2024**、**99.9%**等也会特殊标记，突出重点内容。

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

数字数据如**2024年**、**99.9%**等自动标记

### 第三步：选择模板

点击底部模板卡片切换风格，共有12款风格可选：

简约白 - 经典白底黑字风格

杂志风 - 大标题配小正文

极客黑 - 深色背景科技感

商务蓝 - 正式职场风格

文艺绿 - 清新绿色点缀

字节绿 - 现代科技风格

苹果Bento - 苹果设计风格

蒙德里安 - 波普艺术风格

可爱粉 - 少女心彩虹风格

渐变酷 - 渐变标题风格

暖时光 - 暖色生活风格

学术灰 - 论文引用风格

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

支持**加粗文字**强调，数字如**2024**、**88.8%**自动高亮显示。

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
| 科技数码 | 极客黑、商务蓝 |
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
  const [inputText, setInputText] = useState(sampleText);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [parsedArticle, setParsedArticle] = useState<ParsedArticle | null>(null);
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
  // 当前选中块的局部样式（编辑用）
  const [editingBlockFontSize, setEditingBlockFontSize] = useState<number>(15);
  const [editingBlockLineHeight, setEditingBlockLineHeight] = useState<number>(1.8);
  // 上传的图片列表
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  // 撤销功能 - 历史记录
  const [history, setHistory] = useState<ParsedArticle[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // 选中文字检测
  const [hasSelection, setHasSelection] = useState(false);

  // 检测选中文字
  const checkSelection = useCallback(() => {
    const selection = window.getSelection();
    const hasSel = selection && selection.toString().trim().length > 0;
    setHasSelection(!!hasSel);
  }, []);

  // 保存快照到历史记录
  const saveToHistory = useCallback((article: ParsedArticle) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(article)));
      // 最多保存50条历史
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setParsedArticle(JSON.parse(JSON.stringify(history[newIndex])));
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

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const hasText = selection && selection.toString().trim().length > 0;
      setHasSelection(!!hasText);
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

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
    setInputType(type);
    setInputText(sampleTexts[type]);
    setShowTypeDropdown(false);
    setSelectedBlockIndex(null);
  };

  // 选中块
  const handleSelectBlock = (index: number) => {
    setSelectedBlockIndex(selectedBlockIndex === index ? null : index);
    setEditingBlockIndex(null);
    // 初始化选中块的局部样式值
    if (blockCustomStyles[index]) {
      setEditingBlockFontSize(blockCustomStyles[index].fontSize || 15);
      setEditingBlockLineHeight(blockCustomStyles[index].lineHeight || 1.8);
    } else {
      setEditingBlockFontSize(15);
      setEditingBlockLineHeight(1.8);
    }
  };

  // 调整选中块的字号
  const adjustBlockFontSize = (delta: number) => {
    if (selectedBlockIndex === null) return;
    const newSize = Math.max(10, Math.min(32, editingBlockFontSize + delta));
    setEditingBlockFontSize(newSize);
    setBlockCustomStyles(prev => ({
      ...prev,
      [selectedBlockIndex]: {
        ...prev[selectedBlockIndex],
        fontSize: newSize,
      }
    }));
  };

  // 调整选中块的行高
  const adjustBlockLineHeight = (delta: number) => {
    if (selectedBlockIndex === null) return;
    const newHeight = Math.max(1.0, Math.min(3.0, editingBlockLineHeight + delta));
    setEditingBlockLineHeight(newHeight);
    setBlockCustomStyles(prev => ({
      ...prev,
      [selectedBlockIndex]: {
        ...prev[selectedBlockIndex],
        lineHeight: newHeight,
      }
    }));
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
    saveToHistory(article);
    setParsedArticle(article);
  };

  // 保存块编辑
  const handleSaveBlock = () => {
    if (!parsedArticle || editingBlockIndex === null) return;

    const block = parsedArticle.blocks[editingBlockIndex];
    if (!block) return;

    const newBlocks = [...parsedArticle.blocks];
    if (block.type === "ul" || block.type === "ol") {
      newBlocks[editingBlockIndex] = { ...block, items: blockText.split("\n").filter(line => line.trim()) };
    } else {
      newBlocks[editingBlockIndex] = { ...block, content: blockText };
    }

    saveToHistory({ ...parsedArticle, blocks: newBlocks });
    setParsedArticle({ ...parsedArticle, blocks: newBlocks });
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
    if (parsedArticle) {
      updateArticle({ ...parsedArticle, title: titleText });
      setEditingTitle(false);
    }
  };

  // 修改块类型
  const handleChangeBlockType = (index: number, newType: ParsedContent["type"]) => {
    if (parsedArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);

      const newBlocks = [...parsedArticle.blocks];
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
      updateArticle({ ...parsedArticle, blocks: newBlocks });
    }
  };

  // 删除块
  const handleDeleteBlock = (index: number) => {
    if (parsedArticle) {
      const newBlocks = parsedArticle.blocks.filter((_, i) => i !== index);
      updateArticle({ ...parsedArticle, blocks: newBlocks });
      setSelectedBlockIndex(null);
    }
  };

  // 添加块
  const handleAddBlock = (index: number, position: "above" | "below") => {
    if (parsedArticle) {
      const newBlock: ParsedContent = { type: "paragraph", content: "新段落" };
      const newBlocks = [...parsedArticle.blocks];
      const insertIndex = position === "above" ? index : index + 1;
      newBlocks.splice(insertIndex, 0, newBlock);
      updateArticle({ ...parsedArticle, blocks: newBlocks });
    }
  };

  // 转换为引用
  const handleConvertToQuote = (index: number) => {
    if (parsedArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);
      const newBlocks = [...parsedArticle.blocks];
      // 列表内容存在 items 中，需要合并为字符串
      const content = newBlocks[index].items
        ? newBlocks[index].items.join('\n')
        : newBlocks[index].content;
      newBlocks[index] = { type: "quote", content };
      updateArticle({ ...parsedArticle, blocks: newBlocks });
    }
  };

  // 转换为列表
  const handleConvertToList = (index: number, listType: "ul" | "ol") => {
    if (parsedArticle) {
      // 设置标记，避免 onBlur 覆盖数据
      setConvertingBlockIndex(index);
      setTimeout(() => setConvertingBlockIndex(null), 100);

      const newBlocks = [...parsedArticle.blocks];
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
      updateArticle({ ...parsedArticle, blocks: newBlocks });
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

  // 解析文章
  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      setParsedArticle(null);
      return;
    }
    let parsed: ParsedArticle;
    if (inputType === "md") {
      // MD文档：强制Markdown解析
      parsed = parseMarkdownArticle(inputText);
    } else {
      // 纯文本/DOC：智能解析
      parsed = parseArticle(inputText);
    }
    setParsedArticle(parsed);
    saveToHistory(parsed);
  }, [inputText, inputType, saveToHistory]);

  // AI分析文章结构
  const handleAIAnalyze = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先输入文章内容");
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "分析失败");
        return;
      }
      const newArticle = { title: data.title, blocks: data.blocks };
      setParsedArticle(newArticle);
      saveToHistory(newArticle);
      showToast("AI分析完成！");
    } catch {
      showToast("网络错误，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, saveToHistory]);

  // 初始化解析
  useEffect(() => {
    handleParse();
  }, [handleParse]);

  // 模板切换
  const handleTemplateChange = (template: Template) => {
    setSelectedTemplate(template);
  };

  // 复制到微信
  const handleCopy = async () => {
    try {
      const html = generateWechatHTML(parsedArticle!, selectedTemplate.id, uploadedImages);
      const blob = new Blob([html], { type: "text/html" });
      const clipboardItem = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([clipboardItem]);
      showToast("已复制，可直接粘贴到微信");
    } catch {
      showToast("复制失败，请重试");
    }
  };

  // 分享链接
  const handleShare = async () => {
    const html = generateWechatHTML(parsedArticle!, selectedTemplate.id);
    const encoded = btoa(encodeURIComponent(html));
    const url = `${window.location.origin}/share?c=${encoded}`;
    await navigator.clipboard.writeText(url);
    showToast("分享链接已复制");
  };

  // 清空
  const handleClear = () => {
    setInputText("");
    setParsedArticle(null);
    setSelectedBlockIndex(null);
    setEditingBlockIndex(null);
    setEditingTitle(false);
    setUploadedImages([]);
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // 清空input以便重复选择同一文件
    e.target.value = "";
  };

  // 删除上传的图片
  const handleDeleteImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
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

  // 处理文字中的格式标记
  const processText = (text: string) => {
    // 高亮数字
    let result = text.replace(
      /(\d+(?:\.\d+)?%|\d+\.\d+亿元|\d+亿|\d+x)/g,
      '§§§§§$1§§§§§'
    );
    // 加粗
    result = result.replace(/\*\*(.*?)\*\*/g, '【加粗】$1【/加粗】');
    return result;
  };

  // 获取H1样式（字节绿专用）
  const getH1Style = (): CSSProperties => {
    if (selectedTemplate.id === "byte-green") {
      return {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1d2129",
        paddingLeft: "12px",
        margin: "20px 0 12px",
        borderLeft: `5px solid #2ea250`,
      };
    }
    // 默认H1样式
    return {
      fontSize: "20px",
      fontWeight: 700,
      color: selectedTemplate.headingColor,
      margin: "20px 0 12px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.headingColor}`,
    };
  };

  // 获取H2样式
  const getH2Style = (blockIndex: number): CSSProperties => {
    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    if (selectedTemplate.id === "byte-green") {
      // 字节绿H2: 绿色文字+左边框（原来的H1样式）
      return {
        fontSize: customSize ? `${customSize}px` : "18px",
        fontWeight: 600,
        color: selectedTemplate.headingColor, // 绿色
        margin: "20px 0 12px",
        paddingLeft: "10px",
        borderLeft: `4px solid ${selectedTemplate.headingColor}`,
      };
    }
    // 默认H2样式
    return {
      fontSize: customSize ? `${customSize}px` : "17px",
      fontWeight: 600,
      color: selectedTemplate.headingColor,
      margin: "18px 0 10px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.quoteBorder || selectedTemplate.headingColor}`,
    };
  };

  // 获取标题样式（文章大标题）
  const getTitleStyle = (): CSSProperties => {
    if (selectedTemplate.id === "byte-green") {
      return {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1d2129",
        paddingLeft: "12px",
        margin: "20px 0 12px",
        borderLeft: `5px solid #2ea250`,
      };
    }
    // 默认标题样式
    return {
      fontSize: "20px",
      fontWeight: 700,
      color: selectedTemplate.headingColor,
      margin: "20px 0 12px",
      paddingLeft: "10px",
      borderLeft: `4px solid ${selectedTemplate.headingColor}`,
    };
  };

  // 获取H3样式
  const getH3Style = (blockIndex: number): CSSProperties => {
    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    if (selectedTemplate.id === "byte-green") {
      // 字节绿H3: 深色文字（原来的H2样式）
      return {
        fontSize: customSize ? `${customSize}px` : "15px",
        fontWeight: 500,
        color: selectedTemplate.subheadingColor, // 深色
        margin: "16px 0 8px",
        paddingLeft: "8px",
        borderLeft: `3px solid ${selectedTemplate.subheadingColor}`,
      };
    }
    // 默认H3样式
    return {
      fontSize: customSize ? `${customSize}px` : "15px",
      fontWeight: 500,
      color: selectedTemplate.subheadingColor,
      margin: "14px 0 8px",
      paddingLeft: "8px",
      borderLeft: `3px solid ${selectedTemplate.subheadingColor}`,
    };
  };

  // 获取段落样式（支持局部字号和行高）
  const getParagraphStyle = (blockIndex: number): CSSProperties => {
    const customSize = blockCustomStyles[blockIndex]?.fontSize;
    const customHeight = blockCustomStyles[blockIndex]?.lineHeight;
    return {
      fontSize: customSize ? `${customSize}px` : "15px",
      margin: "10px 0",
      textAlign: "justify" as const,
      textIndent: "2em",
      lineHeight: customHeight || 1.8,
      color: selectedTemplate.textColor,
    };
  };

  // 获取引用样式
  const getQuoteStyle = (): CSSProperties => ({
    fontStyle: "normal",
    padding: "10px 15px",
    borderLeft: `4px solid ${selectedTemplate.quoteBorder}`,
    backgroundColor: selectedTemplate.quoteBackground,
    margin: "12px 0",
    color: selectedTemplate.textColor,
  });

  // 渲染预览内容
  const renderPreview = () => {
    if (!parsedArticle) {
      return (
        <div style={{ color: "#999", textAlign: "center", padding: "40px" }}>
          请输入文章内容<br/>
          <span style={{ fontSize: "12px", color: "#bbb" }}>点击下方模板可切换风格 | 选中内容块可编辑</span>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];

    // 标题
    elements.push(
      <h1
        key="title"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const newTitle = e.currentTarget.textContent || "";
          if (parsedArticle.title !== newTitle) {
            const newArticle = { ...parsedArticle, title: newTitle };
            saveToHistory(newArticle);
            setParsedArticle(newArticle);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBlockIndex(-1);
        }}
        style={{
          ...getTitleStyle(),
          cursor: "text",
          outline: "none",
          ...(selectedBlockIndex === -1 ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
        }}
      >
        {parsedArticle.title}
      </h1>
    );

    // 内容块 - 直接使用contentEditable在原位置编辑
    parsedArticle.blocks.forEach((block, i) => {
      switch (block.type) {
        case "h1":
          elements.push(
            <h1
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                if (block.content !== newContent) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], content: newContent };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                ...getH1Style(),
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {block.content}
            </h1>
          );
          break;
        case "h2":
          elements.push(
            <h2
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                if (block.content !== newContent) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], content: newContent };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                ...getH2Style(i),
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {block.content}
            </h2>
          );
          break;
        case "h3":
          elements.push(
            <h3
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                if (block.content !== newContent) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], content: newContent };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                ...getH3Style(i),
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {block.content}
            </h3>
          );
          break;
        case "paragraph":
          elements.push(
            <p
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                if (block.content !== newContent) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], content: newContent };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                ...getParagraphStyle(i),
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {block.content}
            </p>
          );
          break;
        case "quote":
          elements.push(
            <blockquote
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                if (block.content !== newContent) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], content: newContent };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                ...getQuoteStyle(),
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {block.content}
            </blockquote>
          );
          break;
        case "ul":
          elements.push(
            <ul
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                const items = newContent.split("\n").filter(line => line.trim());
                if (JSON.stringify(block.items) !== JSON.stringify(items)) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], items };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                paddingLeft: "24px",
                margin: "8px 0",
                color: selectedTemplate.textColor,
                listStyleType: "none",
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {(block.items || []).map((item, j) => (
                <li key={j} style={{ margin: "8px 0", lineHeight: 1.6, position: "relative", paddingLeft: "16px" }}>
                  <span style={{ position: "absolute", left: "0", color: selectedTemplate.headingColor || "#2ea250", fontWeight: "bold" }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          );
          break;
        case "ol":
          elements.push(
            <ol
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || "";
                const items = newContent.split("\n").filter(line => line.trim());
                if (JSON.stringify(block.items) !== JSON.stringify(items)) {
                  const newBlocks = [...parsedArticle.blocks];
                  newBlocks[i] = { ...newBlocks[i], items };
                  saveToHistory({ ...parsedArticle, blocks: newBlocks });
                  setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                paddingLeft: "0",
                margin: "8px 0",
                color: selectedTemplate.textColor,
                listStyleType: "none",
                counterReset: "item",
                ...(selectedBlockIndex === i ? { boxShadow: "0 0 0 2px #1a73e8", borderRadius: "4px" } : {}),
              }}
            >
              {(block.items || []).map((item, j) => (
                <li key={j} style={{ margin: "8px 0", lineHeight: 1.6, position: "relative", paddingLeft: "32px", counterIncrement: "item" }}>
                  <span
                    style={{ position: "absolute", left: "0", width: "22px", height: "22px", lineHeight: "22px", textAlign: "center", background: selectedTemplate.headingColor || "#2ea250", color: "#fff", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}
                  >{j + 1}</span>
                  {item}
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockIndex(i);
              }}
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                margin: "12px 0",
                background: "#1e1e1e",
                outline: selectedBlockIndex === i ? "2px solid #1a73e8" : "none",
              }}
            >
              <div style={{ background: "#2d2d2d", padding: "10px 12px", borderBottom: "1px solid #3c3c3c", display: "flex", alignItems: "center", gap: "8px" }}>
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
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = e.currentTarget.textContent || "";
                  if (block.content !== newContent) {
                    const newBlocks = [...parsedArticle.blocks];
                    newBlocks[i] = { ...newBlocks[i], content: newContent };
                    saveToHistory({ ...parsedArticle, blocks: newBlocks });
                    setParsedArticle({ ...parsedArticle, blocks: newBlocks });
                  }
                }}
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
        case "hr":
          elements.push(
            <hr
              key={i}
              style={{
                height: "1px",
                border: "none",
                margin: "20px 0",
                background: selectedTemplate.quoteBorder,
              }}
            />
          );
          break;
      }
    });

    // 渲染上传的图片
    if (uploadedImages.length > 0) {
      elements.push(
        <div key="images-section" style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📷 图片 ({uploadedImages.length})</span>
            <label style={{ cursor: "pointer", padding: "4px 12px", background: selectedTemplate.primaryColor, color: "#fff", borderRadius: "12px", fontSize: "12px" }}>
              + 添加图片
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {uploadedImages.map((img, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleImageDragStart(e, idx)}
                onDragOver={(e) => handleImageDragOver(e, idx)}
                onDrop={(e) => handleImageDrop(e, idx)}
                onDragEnd={handleImageDragEnd}
                style={{
                  position: "relative",
                  maxWidth: "200px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: `3px solid ${dragImageIndex === idx ? "#ff6b6b" : dropImageIndex === idx ? "#51cf66" : selectedTemplate.primaryColor}`,
                  boxShadow: dragImageIndex === idx ? "0 4px 16px rgba(255,107,107,0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                  opacity: dragImageIndex === idx ? 0.5 : 1,
                  transform: dragImageIndex === idx ? "scale(0.95)" : "scale(1)",
                  transition: "all 0.2s ease",
                  cursor: "grab",
                }}
              >
                <img
                  src={img}
                  alt={`上传图片 ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "4px",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                }}>
                  ⋮⋮ 拖拽排序
                </div>
                <button
                  onClick={() => handleDeleteImage(idx)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: "24px",
                    textAlign: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return elements;
  };

  return (
    <div style={styles.container}>
      {/* 顶部 */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <span style={styles.logo}>排</span>
          <span style={styles.title}>文字排版</span>
        </div>
        <div style={styles.templateLabel}>
          模板：{selectedTemplate.name}
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
              onChange={(e) => setInputText(e.target.value)}
              placeholder="粘贴文章内容..."
              style={styles.textarea}
            />
            {/* 图片上传按钮 */}
            <div style={{ padding: "8px 16px", borderTop: "1px solid #EEE", display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ cursor: "pointer", padding: "6px 14px", background: selectedTemplate.primaryColor, color: "#fff", borderRadius: "16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                📷 上传图片
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
              {uploadedImages.length > 0 && (
                <span style={{ fontSize: "12px", color: "#666" }}>已上传 {uploadedImages.length} 张图片</span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧预览 */}
        <div style={styles.previewPanel}>
          <div style={{ ...styles.previewCard, padding: 0, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* 顶部工具栏 - 固定在顶部 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: selectedBlockIndex !== null || editingTitle || hasSelection ? "#f0f7ff" : "#fafafa",
              borderBottom: "1px solid #e0e7ff",
              minHeight: "50px",
              flexWrap: "wrap",
              position: "sticky",
              top: 0,
              zIndex: 100,
              flexShrink: 0
            }}>
              {/* 选中文字时的格式工具栏 */}
              {hasSelection ? (
                <>
                  <span style={{ fontSize: "12px", color: "#1a73e8", fontWeight: 600 }}>选中文字</span>
                  <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
                  <button onClick={() => document.execCommand("bold")} style={{ ...styles.toolbarBtn, fontWeight: 700 }}>B</button>
                  <button onClick={() => document.execCommand("italic")} style={{ ...styles.toolbarBtn, fontStyle: "italic" }}>I</button>
                  <button onClick={() => document.execCommand("underline")} style={{ ...styles.toolbarBtn, textDecoration: "underline" }}>U</button>
                  <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
                  <button onClick={() => document.execCommand("foreColor", false, selectedTemplate.headingColor)} style={styles.toolbarBtn}>🎨</button>
                  <button onClick={() => document.execCommand("removeFormat")} style={styles.toolbarBtn}>重置</button>
                </>
              ) : editingTitle ? (
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
              ) : hasSelection ? (
                /* 选中文字时的工具栏 */
                <>
                  <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>文字格式</span>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold"); }}
                    style={{ ...styles.toolbarBtn, fontWeight: "bold" }}
                  >B</button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic"); }}
                    style={{ ...styles.toolbarBtn, fontStyle: "italic" }}
                  >I</button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("underline"); }}
                    style={{ ...styles.toolbarBtn, textDecoration: "underline" }}
                  >U</button>
                  <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("foreColor", false, "#e166af"); }} style={styles.toolbarBtn}>🎨</button>
                  <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
                  <button onMouseDown={(e) => { e.preventDefault(); }} style={{ ...styles.toolbarBtn, color: "#666" }}>重置</button>
                </>
              ) : selectedBlockIndex !== null ? (
                /* 选中块时的工具栏 */
                <>
                  <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>
                    {parsedArticle?.blocks[selectedBlockIndex]?.type === "h1" ? "H1" :
                     parsedArticle?.blocks[selectedBlockIndex]?.type === "h2" ? "H2" :
                     parsedArticle?.blocks[selectedBlockIndex]?.type === "h3" ? "H3" :
                     parsedArticle?.blocks[selectedBlockIndex]?.type === "quote" ? "引用" :
                     parsedArticle?.blocks[selectedBlockIndex]?.type === "ul" || parsedArticle?.blocks[selectedBlockIndex]?.type === "ol" ? "列表" : "正文"}
                  </span>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h1")} style={styles.toolbarBtn}>H1</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h2")} style={styles.toolbarBtn}>H2</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "h3")} style={styles.toolbarBtn}>H3</button>
                  <button onClick={() => handleChangeBlockType(selectedBlockIndex, "paragraph")} style={styles.toolbarBtn}>正文</button>
                  <button onClick={() => handleConvertToQuote(selectedBlockIndex)} style={styles.toolbarBtn}>❝引用</button>
                  {parsedArticle?.blocks[selectedBlockIndex]?.type === "ol" ? (
                    <button onClick={() => handleChangeBlockType(selectedBlockIndex, "ul")} style={styles.toolbarBtn}>☰</button>
                  ) : parsedArticle?.blocks[selectedBlockIndex]?.type === "ul" ? (
                    <button onClick={() => handleChangeBlockType(selectedBlockIndex, "ol")} style={styles.toolbarBtn}>⑴</button>
                  ) : (
                    <>
                      <button onClick={() => handleConvertToList(selectedBlockIndex, "ul")} style={styles.toolbarBtn}>☰</button>
                      <button onClick={() => handleConvertToList(selectedBlockIndex, "ol")} style={styles.toolbarBtn}>⑴</button>
                    </>
                  )}
                  <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
                  <button onClick={() => handleStartEditBlock(selectedBlockIndex)} style={{ ...styles.toolbarBtn, background: "#e8f0fe", color: "#1a73e8" }}>✏️ 编辑</button>
                  <button onClick={() => handleAddBlock(selectedBlockIndex, "above")} style={styles.toolbarBtn}>⤴</button>
                  <button onClick={() => handleAddBlock(selectedBlockIndex, "below")} style={styles.toolbarBtn}>⤵</button>
                  <button onClick={() => handleDeleteBlock(selectedBlockIndex)} style={{ ...styles.toolbarBtn, color: "#dc2626" }}>🗑️</button>
                  <button onClick={() => setSelectedBlockIndex(null)} style={{ ...styles.toolbarBtn, color: "#16a34a" }}>✓</button>
                </>
              ) : selectedBlockIndex === -1 ? (
                /* 标题选中 */
                <>
                  <span style={{ fontSize: "12px", color: "#666", marginRight: "8px" }}>文章标题</span>
                  <button onClick={handleStartEditTitle} style={{ ...styles.toolbarBtn, background: "#e8f0fe", color: "#1a73e8" }}>✏️ 编辑</button>
                  <button onClick={() => setSelectedBlockIndex(null)} style={{ ...styles.toolbarBtn, color: "#16a34a" }}>✓</button>
                </>
              ) : (
                /* 无选中 */
                <span style={{ fontSize: "12px", color: "#999" }}>💡 点击内容块即可选中编辑</span>
              )}
            </div>

            <div
              style={styles.previewContent}
              onMouseUp={checkSelection}
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
        <button onClick={handleCopy} style={styles.primaryBtn}>复制到微信</button>
        <button onClick={handleShare} style={styles.toolBtn}>分享</button>
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
  toolbarBtn: {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid #E0E0E0",
    backgroundColor: "#FFF",
    fontSize: "12px",
    cursor: "pointer",
    color: "#333",
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
