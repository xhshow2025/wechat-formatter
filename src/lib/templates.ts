export interface Template {
  id: string;
  name: string;
  description: string;
  gradient: string;
  textColor: string;
  backgroundColor: string;
  headingColor: string;
  subheadingColor: string;
  h3Color?: string; // 可选，H3专用颜色
  quoteBackground: string;
  quoteBorder: string;
  codeBackground: string;
  cardShadow: string;
  primaryColor: string; // 图片边框主色
  // 字节绿专用
  h1Background?: string; // H1背景色
  h1TextColor?: string; // H1文字颜色
}

export const templates: Template[] = [
  {
    id: "byte-green",
    name: "字节绿",
    description: "现代科技感，深绿到鲜绿渐变",
    gradient: "from-green-600 to-lime-400",
    textColor: "#4e5969",
    backgroundColor: "#f8faf9",
    headingColor: "#2ea250", // H2: 绿色文字+左边框
    subheadingColor: "#1d2129", // H3: 深色文字
    h3Color: "#4e5969", // H3专用颜色
    h1Background: "#1d2129", // H1: 深色背景
    h1TextColor: "#ffffff", // H1: 白色文字
    quoteBackground: "rgba(46, 162, 80, 0.08)",
    quoteBorder: "#2ea250",
    codeBackground: "#1e1e1e",
    cardShadow: "shadow-green-200/50",
    primaryColor: "#2ea250",
  },
  {
    id: "simple-white",
    name: "简约白",
    description: "白底黑字，留白充足，专注阅读",
    gradient: "from-gray-50 to-white",
    textColor: "#374151",
    backgroundColor: "#fafbfc",
    headingColor: "#111827",
    subheadingColor: "#374151",
    quoteBackground: "#f9fafb",
    quoteBorder: "#e5e7eb",
    codeBackground: "#f3f4f6",
    cardShadow: "shadow-gray-200/50",
    primaryColor: "#374151",
  },
  {
    id: "magazine",
    name: "杂志风",
    description: "大标题+小正文，图文混排感",
    gradient: "from-amber-50 to-orange-50",
    textColor: "#451a03",
    backgroundColor: "#fffaf5",
    headingColor: "#b45309",
    subheadingColor: "#92400e",
    quoteBackground: "#fef3c7",
    quoteBorder: "#f59e0b",
    codeBackground: "#ffedd5",
    cardShadow: "shadow-amber-200/50",
    primaryColor: "#b45309",
  },
  {
    id: "geek-dark",
    name: "极客黑",
    description: "深色背景，代码友好，科技感",
    gradient: "from-slate-900 to-gray-900",
    textColor: "#e5e7eb",
    backgroundColor: "#1a1d24",
    headingColor: "#38bdf8",
    subheadingColor: "#7dd3fc",
    quoteBackground: "#1e293b",
    quoteBorder: "#38bdf8",
    codeBackground: "#1e293b",
    cardShadow: "shadow-slate-950/50",
    primaryColor: "#38bdf8",
  },
  {
    id: "warm-time",
    name: "暖时光",
    description: "暖色调，适合生活/情感类",
    gradient: "from-pink-50 to-rose-50",
    textColor: "#881337",
    backgroundColor: "#fff7f8",
    headingColor: "#be123c",
    subheadingColor: "#9f1239",
    quoteBackground: "#ffe4e6",
    quoteBorder: "#fb7185",
    codeBackground: "#fecdd3",
    cardShadow: "shadow-rose-200/50",
    primaryColor: "#be123c",
  },
  {
    id: "business-blue",
    name: "商务蓝",
    description: "正式严肃，适合职场/科技",
    gradient: "from-blue-50 to-indigo-50",
    textColor: "#1e3a5f",
    backgroundColor: "#f0f6ff",
    headingColor: "#1e40af",
    subheadingColor: "#1e3a8a",
    quoteBackground: "#dbeafe",
    quoteBorder: "#3b82f6",
    codeBackground: "#bfdbfe",
    cardShadow: "shadow-blue-200/50",
    primaryColor: "#1e40af",
  },
  {
    id: "literary-green",
    name: "文艺绿",
    description: "小清新，绿色点缀",
    gradient: "from-emerald-50 to-teal-50",
    textColor: "#134e4a",
    backgroundColor: "#f0fdf7",
    headingColor: "#0d9488",
    subheadingColor: "#0f766e",
    quoteBackground: "#d1fae5",
    quoteBorder: "#34d399",
    codeBackground: "#a7f3d0",
    cardShadow: "shadow-emerald-200/50",
    primaryColor: "#0d9488",
  },
  {
    id: "gradient-cool",
    name: "渐变酷",
    description: "标题渐变，年轻人风格",
    gradient: "from-violet-500 via-purple-500 to-pink-500",
    textColor: "#581c87",
    backgroundColor: "#faf5ff",
    headingColor: "#7c3aed",
    subheadingColor: "#6d28d9",
    quoteBackground: "#ede9fe",
    quoteBorder: "#8b5cf6",
    codeBackground: "#ddd6fe",
    cardShadow: "shadow-violet-200/50",
    primaryColor: "#7c3aed",
  },
  {
    id: "academic-gray",
    name: "学术灰",
    description: "论文风，引用块突出",
    gradient: "from-stone-100 to-gray-100",
    textColor: "#292524",
    backgroundColor: "#f7f6f5",
    headingColor: "#1c1917",
    subheadingColor: "#44403c",
    quoteBackground: "#e7e5e4",
    quoteBorder: "#78716c",
    codeBackground: "#d6d3d1",
    cardShadow: "shadow-stone-200/50",
    primaryColor: "#1c1917",
  },
  {
    id: "apple-bento",
    name: "苹果Bento",
    description: "苹果风格，磨砂玻璃，圆角卡片",
    gradient: "from-blue-500 to-purple-500",
    textColor: "#1d1d1f",
    backgroundColor: "#f8f9ff",
    headingColor: "#0071e3",
    subheadingColor: "#bf5af2",
    quoteBackground: "rgba(0, 113, 227, 0.06)",
    quoteBorder: "#0071e3",
    codeBackground: "#1a1a25",
    cardShadow: "shadow-purple-200/50",
    primaryColor: "#0071e3",
  },
  {
    id: "mondrian",
    name: "蒙德里安",
    description: "几何色块，红黄蓝三原色，波普艺术",
    gradient: "from-red-500 to-yellow-500",
    textColor: "#111111",
    backgroundColor: "#fefdf5",
    headingColor: "#E63946",
    subheadingColor: "#1D3557",
    quoteBackground: "rgba(241, 196, 15, 0.1)",
    quoteBorder: "#1D3557",
    codeBackground: "#111111",
    cardShadow: "shadow-black/50",
    primaryColor: "#E63946",
  },
  {
    id: "cute-pink",
    name: "可爱粉",
    description: "彩虹渐变，活泼可爱，少女心爆棚",
    gradient: "from-pink-300 via-rose-200 to-pink-100",
    textColor: "#555555",
    backgroundColor: "#fff5f7",
    headingColor: "#FF85A2",
    subheadingColor: "#E8B4D5",
    quoteBackground: "rgba(255, 245, 249, 0.9)",
    quoteBorder: "#FFB5D9",
    codeBackground: "#FFF5F7",
    cardShadow: "shadow-pink-200/50",
    primaryColor: "#FF85A2",
  },
];

export const defaultTemplate = templates[0];
