import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "微信文章排版器 - 让你的文章更美观",
  description: "智能识别标题和子标题，多款精美模板，一键复制到微信公众号",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
