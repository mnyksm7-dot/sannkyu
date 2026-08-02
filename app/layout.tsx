import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINEスタンプ自動生成",
  description: "画像を送るとAIがLINEスタンプ風の画像セットを自動生成します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
