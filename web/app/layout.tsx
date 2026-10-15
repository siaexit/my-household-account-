import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家計簿",
  description: "シンプルな家計簿アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
