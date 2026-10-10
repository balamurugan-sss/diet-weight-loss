import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Malayalam, Noto_Sans_Tamil, Plus_Jakarta_Sans } from "next/font/google";
import { getLocale } from "@/server/i18n";
import "./globals.css";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading", weight: ["500", "600", "700"], display: "swap" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-tamil", weight: ["400", "500", "600", "700"], display: "swap" });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], variable: "--font-malayalam", weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Thali — Indian Diet Planner & Cooking Coach", template: "%s · Thali" },
  description:
    "Personalised Indian meal plans, keto and low-carb options, 1,000+ recipe catalogue pipeline, and a hands-free visual cooking assistant in English, Tamil and Malayalam.",
  applicationName: "Thali",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7ef",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLocale();
  return (
    <html lang={lang} className={`${body.variable} ${heading.variable} ${tamil.variable} ${malayalam.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
