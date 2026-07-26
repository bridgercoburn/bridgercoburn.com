import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bridgercoburn.com"),
  title: {
    default: "Bridger Coburn",
    template: "%s — Bridger Coburn",
  },
  description: "Personal site of Bridger Coburn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Gilt edge across the top, matching the quiz page. */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-10 h-[5px] bg-[linear-gradient(90deg,#a67c22,#d4a94a_55%,#a67c22)]"
        />
        {children}
      </body>
    </html>
  );
}
