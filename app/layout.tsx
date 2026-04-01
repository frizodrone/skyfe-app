import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyFe",
  description: "Condições de voo para pilotos de drones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}