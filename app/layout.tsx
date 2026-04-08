import { PrivacyPreferences } from "@/app/components/privacy/privacy-preferences";
import { SupportWidget } from "@/app/components/support/support-widget";
import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const uiFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeTrail | Sistema de estudo para carreiras em tecnologia",
  description:
    "Planejamento de estudos em tecnologia com trilhas, sessoes, revisoes, projetos e um workspace web premium para executar sua rotina.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${uiFont.variable}`}>
        {children}
        <SupportWidget origin="Web App" prefillAuthenticatedUser />
        <PrivacyPreferences />
      </body>
    </html>
  );
}
