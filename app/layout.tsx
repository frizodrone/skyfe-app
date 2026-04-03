import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyFe",
  description: "Condições de voo para pilotos de drones",
  manifest: "/manifest.json",
  themeColor: "#04090f",
  openGraph: {
    title: "SkyFe — Condições de Voo para Drones em Tempo Real",
    description:
      "Score de voo de 0 a 100. Mapa de zonas aéreas, previsão 16 dias. 100% gratuito.",
    url: "https://app.skyfe.com.br",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  icons: { icon: "/favicon.ico" },
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
