import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@flaggable/ui/utils";
import { AuthWrapper } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "flaggable.dev — Feature flags without the fog",
  description: "Feature flags for teams that ship.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthWrapper>
          <QueryProvider>{children}</QueryProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
