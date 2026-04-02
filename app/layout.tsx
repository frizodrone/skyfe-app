import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyFe",
  description: "Condições de voo para pilotos de drones",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen w-full justify-center">
        <div className="w-full">{children}</div>
      </body>
    </html>
  );
}
