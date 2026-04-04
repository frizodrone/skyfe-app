import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyFe — Condições de Voo para Drones em Tempo Real",
  description: "Veja agora se é seguro voar seu drone em qualquer lugar do mundo. Score de voo, previsão de 16 dias, mapa de zonas aéreas. 100% gratuito.",
  manifest: "/manifest.json",
  themeColor: "#04090f",
  openGraph: {
    title: "SkyFe — Condições de Voo para Drones em Tempo Real",
    description: "Veja agora se é seguro voar seu drone em qualquer lugar do mundo. Score de voo, previsão de 16 dias e mapa de zonas aéreas.",
    url: "https://app.skyfe.com.br",
    siteName: "SkyFe",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://skyfe.com.br/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkyFe — Condições de Voo para Drones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyFe — Condições de Voo para Drones",
    description: "Veja agora se é seguro voar seu drone. Score em tempo real, 100% gratuito.",
  },
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