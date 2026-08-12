import type { Metadata } from "next";

import { VhsSmoothCursor } from "@/components/ui/VhsSmoothCursor";

import "./globals.css";

export const metadata: Metadata = {
  title: "VHS Signal Station",
  description: "A browser-local VHS audio visualizer and playback station.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <VhsSmoothCursor />
      </body>
    </html>
  );
}
