import { NextRequest, NextResponse } from "next/server";

const API_KEY = "sk-cp-mtEPYVfNZidFTUuGDghkC6BNjkfsu47DrastxpDbtBTsLPvWnxWglYZ6v1CaXHp2alBK38botjs0BTbmZcZnucjdjp55G6vwUVFSdDDNrzTEZtP-_WhJGM8";
const API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";

interface Block {
  type: "h1" | "h2" | "h3" | "paragraph" | "quote" | "ul" | "ol" | "code" | "hr";
  content: string;
  items?: string[];
}

interface AnalysisResult {
  title: string;
  blocks: Block[];
}

// 本地智能解析器
function localParse(text: string): AnalysisResult {
  const lines = text.split("\n").filter((l) => l.trim());
  const blocks: Block[] = [];

  // 第一行作为标题，同时也作为h1加入blocks
  let title = lines[0]?.slice(0, 50) || "无标题";
  if (title && title !== "无标题") {
    blocks.push({ type: "h1", content: title });
  }
  let skippedFirst = true;
  let prevType: string | null = "h1";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 跳过第一行（已作为h1）
    if (skippedFirst && prevType === "h1" && blocks.length === 1) {
      skippedFirst = false;
      continue;
    }

    // H2标题：中文数字序号、阿拉伯数字序号、明确主题词
    if (/^[一二三四五六七八九十]+[、.．]/.test(trimmed) ||
        /^[0-9]+[、.．]/.test(trimmed) ||
        /^(背景|前言|概述|简介|介绍|总结|结论|特点|优势|功能|步骤|方法|原因|结果|问题|方案|使用|操作|教程|指南|说明|适用|常见)/.test(trimmed) ||
        /^(Introduction|Overview|Summary|Conclusion|Features|Benefits|Usage|Getting Started|Tutorial|Examples|How-To|How To|FAQ)/i.test(trimmed)) {
      blocks.push({ type: "h2", content: trimmed });
      prevType = "h2";
      continue;
    }

    // 特殊H2：必须是以关键词开头的短标题（4-10个字）
    // 中文标题模式：关键词 + 核心内容，如"功能介绍"、"使用方法"、"主要功能"
    let isH2Matched = false;
    if (trimmed.length >= 4 && trimmed.length <= 10 && !/[。！？]$/.test(trimmed)) {
      const h2KeywordsCN = ["功能", "使用", "操作", "教程", "指南", "说明", "特点", "优势", "介绍", "概述", "总结", "背景", "方法", "步骤", "适用", "常见", "主要", "重要", "核心"];
      for (const kw of h2KeywordsCN) {
        // 关键词必须在开头（位置0-2）
        if (trimmed.indexOf(kw) >= 0 && trimmed.indexOf(kw) <= 2) {
          blocks.push({ type: "h2", content: trimmed });
          prevType = "h2";
          isH2Matched = true;
          break;
        }
      }
    }

    // 如果被识别为H2，跳过后续检测
    if (isH2Matched) continue;

    // 英文关键词（任意位置），如"Main Features"、"Getting Started"
    if (!isH2Matched) {
      const h2KeywordsEN = ["Introduction", "Overview", "Summary", "Conclusion", "Features", "Benefits", "Usage", "Getting", "Tutorial", "Examples", "FAQ", "Main", "Important", "How-To"];
      for (const kw of h2KeywordsEN) {
        if (trimmed.toLowerCase().includes(kw.toLowerCase())) {
          blocks.push({ type: "h2", content: trimmed });
          prevType = "h2";
          isH2Matched = true;
          break;
        }
      }
    }

    // 如果被识别为H2，跳过后续检测
    if (isH2Matched) continue;

    // H3标题：必须是以关键词开头的短标题，前面是h2
    if (prevType === "h2" && trimmed.length >= 4 && trimmed.length <= 10 && !/[。！？]$/.test(trimmed)) {
      const h3KeywordsCN = ["第一", "第二", "第三", "第四", "第五", "原因", "结果", "小结"];
      for (const kw of h3KeywordsCN) {
        if (trimmed.indexOf(kw) >= 0 && trimmed.indexOf(kw) <= 2) {
          blocks.push({ type: "h3", content: trimmed });
          prevType = "h3";
          break;
        }
      }
      if (prevType === "h3") continue;
    }

    // 引用块：装饰性样式，主要识别引号内容和明确的引用句式
    // 1. 引号开头 2. 明确的引用句式（观点、强调、转折）
    const quotePatterns = [
      /^["""''「」『』]/,
      /^(“[^”]+”)$/, // 整句引号包裹
      /^(「[^」]+」)$/,
    ];
    const quoteStartPatterns = [
      /^(正如|事实上|实际上|其实|关键在于|值得注意的是|研究表明|数据显示|专家表示|核心观点|重要提示)/,
    ];

    let isQuote = false;
    for (const pattern of quotePatterns) {
      if (pattern.test(trimmed) && trimmed.length > 5) {
        isQuote = true;
        break;
      }
    }
    if (!isQuote) {
      for (const pattern of quoteStartPatterns) {
        if (pattern.test(trimmed)) {
          isQuote = true;
          break;
        }
      }
    }

    if (isQuote) {
      blocks.push({ type: "quote", content: trimmed });
      prevType = "quote";
      continue;
    }

    // 无序列表
    if (/^[•\-\*]\s/.test(trimmed)) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ul") {
        last.items!.push(trimmed.replace(/^[•\-\*]\s/, ""));
      } else {
        blocks.push({
          type: "ul",
          content: "",
          items: [trimmed.replace(/^[•\-\*]\s/, "")],
        });
      }
      prevType = "ul";
      continue;
    }

    // 有序列表
    if (/^\d+[、.。]/.test(trimmed)) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ol") {
        last.items!.push(trimmed.replace(/^\d+[、.。]\s*/, ""));
      } else {
        blocks.push({
          type: "ol",
          content: "",
          items: [trimmed.replace(/^\d+[、.。]\s*/, "")],
        });
      }
      prevType = "ol";
      continue;
    }

    // 其他归为正文
    blocks.push({ type: "paragraph", content: trimmed });
    prevType = "paragraph";
  }

  // 确保至少有内容
  if (blocks.length === 0) {
    blocks.push({ type: "paragraph", content: "请输入文章内容" });
  }

  return { title, blocks };
}

// 解析AI返回的JSON
function parseAIResponse(content: string): AnalysisResult | null {
  try {
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// 带重试的API调用 - MiniMax-M2.7不支持，改用本地解析
async function callAIWithRetry(prompt: string, retries = 0): Promise<string | null> {
  // Coding plan不支持MiniMax-M2.7，直接返回null使用本地解析
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "请提供文章内容" }, { status: 400 });
    }

    const prompt = `你是一个专业的文章结构分析师。请分析以下文章，返回合理的文章结构。

文章内容：
${text.slice(0, 3000)}

**重要原则：**
1. **标题层级要合理**：一篇文章通常有1个主标题（H1），2-5个章节标题（H2），每个章节下1-3个小节（H3）
2. **正文内容要完整**：不要把正文误判为标题，除非是明显的章节分隔
3. **列表要合并**：同一类型的列表项要合并到一个ul或ol中
4. **引用要精选**：只有真正重要的引述、名言、观点才用quote

**判断标准：**
- **H2标题特征**：中文数字序号(如"一、")、阿拉伯数字序号(如"1、")、明确的主题词(如"背景介绍"、"总结"等)、章节格式(如"第一章")
- **H3标题特征**：必须是H2下面的子章节，且有明确的层级关系
- **Quote引用**：名人名言、重要观点、结论性语句用引号包裹的内容
- **正文段落**：描述性内容、解释说明、论证过程等都是正文

**常见错误要避免：**
- 短句但不是标题模式的内容不要误判为H2
- 列表项不要拆分成多个paragraph
- 连续的数字列表不要误判为标题

返回格式（必须是有效JSON）：
{"title":"文章主标题","blocks":[{"type":"h1|h2|h3|paragraph|quote|ul|ol","content":"内容","items":["列表项1","列表项2"]}]}

示例1：
输入："什么是AI人工智能" "AI是Artificial Intelligence的缩写" "机器学习是AI的核心技术" "深度学习是机器学习的进阶"
输出：{"title":"什么是AI人工智能","blocks":[{"type":"paragraph","content":"AI是Artificial Intelligence的缩写"},{"type":"h2","content":"机器学习是AI的核心技术"},{"type":"paragraph","content":"深度学习是机器学习的进阶"}]}

示例2：
输入："产品发布报告一季度营收突破百亿" "一季度收入同比增长45%" "其中核心产品贡献了60%的营收" "预计二季度将保持增长势头"
输出：{"title":"产品发布报告","blocks":[{"type":"h2","content":"一季度营收突破百亿"},{"type":"paragraph","content":"一季度收入同比增长45%，其中核心产品贡献了60%的营收，预计二季度将保持增长势头。"}]}`;

    // 尝试AI解析，最多重试2次
    const aiContent = await callAIWithRetry(prompt, 2);

    if (aiContent) {
      const result = parseAIResponse(aiContent);
      if (result) {
        return NextResponse.json(result);
      }
    }

    // AI失败，降级到本地解析
    console.log("Falling back to local parser");
    const localResult = localParse(text);
    return NextResponse.json(localResult);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(localParse("分析失败"));
  }
}
