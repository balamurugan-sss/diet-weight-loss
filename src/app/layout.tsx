import type { Metadata, Viewport } from "next";
import { Caveat, Noto_Sans_Malayalam, Noto_Sans_Tamil, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { getLocale } from "@/server/i18n";
import { getTheme } from "@/server/theme";
import "./globals.css";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Outfit({ subsets: ["latin"], variable: "--font-heading", weight: ["600", "700", "800"], display: "swap" });
const script = Caveat({ subsets: ["latin"], variable: "--font-script", weight: ["500", "600", "700"], display: "swap" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-tamil", weight: ["400", "500", "600", "700"], display: "swap" });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], variable: "--font-malayalam", weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Thali — Indian Diet Planner & Cooking Coach", template: "%s · Thali" },
  description:
    "Personalised Indian meal plans, keto and low-carb options, a validated recipe catalogue, and a hands-free visual cooking assistant in English, Tamil and Malayalam.",
  applicationName: "Thali",
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: theme === "dark" ? "#0c0c0b" : "#fbf7ef" };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lang, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${body.variable} ${heading.variable} ${script.variable} ${tamil.variable} ${malayalam.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
