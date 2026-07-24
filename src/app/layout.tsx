import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KHO LƯU TRỮ 2212 VIET NAM — SECURE ARCHIVE",
  description:
    "Nơi kết nối cộng đồng yêu lịch sử, quân sự, an ninh và tình báo qua các tiểu thuyết tư liệu, sự kiện và góc nhìn chiến lược.",
  applicationName: "2212 Viet Nam",
  creator: "2212 Viet Nam",
  publisher: "2212 Viet Nam",
  metadataBase: new URL("https://www.2212.vn"),
  alternates: {
    canonical: "https://www.2212.vn",
  },
  openGraph: {
    title: "KHO LƯU TRỮ 2212 VIET NAM",
    description:
      "Kho lưu trữ các hồ sơ, chuyên án và tư liệu lịch sử, quân sự, an ninh, tình báo của 2212 Viet Nam.",
    url: "https://www.2212.vn",
    siteName: "2212 Viet Nam",
    locale: "vi_VN",
    type: "website",
    images: ["/seo/2212-archive-og.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "KHO LƯU TRỮ 2212 VIET NAM — SECURE ARCHIVE",
    description:
      "Nơi kết nối cộng đồng yêu lịch sử, quân sự, an ninh và tình báo qua các tiểu thuyết tư liệu, sự kiện và góc nhìn chiến lược.",
    images: ["/seo/2212-archive-og.webp"],
  },
  icons: {
    icon: "/seo/logo.png",
    shortcut: "/seo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="dark" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
