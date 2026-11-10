import React from "react";
import Providers from "../components/Providers";

export const metadata = {
  title: "Platform-X Anime | Streaming & AI",
  description: "Plataforma de streaming de anime con IA modular",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
