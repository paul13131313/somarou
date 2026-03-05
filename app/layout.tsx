import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_JP, Yuji_Syuku } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const yujiSyuku = Yuji_Syuku({
  variable: "--font-yuji-syuku",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "走馬灯 - SOMATO",
  description: "写真が走馬灯のように駆け巡る動画を生成するWebアプリ",
  openGraph: {
    title: "走馬灯 - SOMATO",
    description: "写真が走馬灯のように駆け巡る動画を生成するWebアプリ",
    images: [{ url: "/ogp.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "走馬灯 - SOMATO",
    description: "写真が走馬灯のように駆け巡る動画を生成するWebアプリ",
    images: ["/ogp.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${dmSans.variable} ${notoSansJP.variable} ${yujiSyuku.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
