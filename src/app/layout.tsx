import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Noto_Sans_Malayalam, Noto_Sans_Tamil } from "next/font/google";
import { getLocale } from "@/server/i18n";
import { getTheme } from "@/server/theme";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Inter({ subsets: ["latin"], variable: "--font-heading", weight: ["600", "700", "800"], display: "swap" });
const script = Caveat({ subsets: ["latin"], variable: "--font-script", weight: ["500", "600", "700"], display: "swap" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-tamil", weight: ["400", "500", "600", "700"], display: "swap" });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], variable: "--font-malayalam", weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Movewell — Workouts, Indian Meal Plans & Health Data", template: "%s · Movewell" },
  description:
    "Home and gym workout plans, Indian meal plans that fuel them, and heart rate, steps and sleep from Fitbit, Google or Apple Health on one daily timeline.",
  applicationName: "Movewell",
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: theme === "dark" ? "#121212" : "#f4f4f5" };
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
