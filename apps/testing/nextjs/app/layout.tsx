import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlagTok - Short Videos",
  description: "Watch trending videos on FlagTok",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  );
}
