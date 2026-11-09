import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = {
  title: "MUSE · 创意素材工作室",
  description: "用灵感，制作属于你的画面",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
