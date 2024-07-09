import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import RecoilRootWrapper from "./store/recoilWrapper";

const noto_sans_kr = Noto_Sans_KR({ subsets: [] });

export const metadata: Metadata = {
  title: "Egg Signal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={noto_sans_kr.className}>
        <RecoilRootWrapper>{children}</RecoilRootWrapper>
      </body>
    </html>
  );
}
