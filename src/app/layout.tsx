import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getLocations, getSettings } from "@/lib/data";
import { whatsappUrl } from "@/lib/format";
import { onAccent } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(s.siteUrl),
    title: { default: s.seoTitle, template: `%s | ${s.name}` },
    description: s.seoDescription,
    openGraph: { siteName: s.name, locale: "pt_BR", type: "website" },
    alternates: { canonical: "/" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await getSettings();
  return {
    themeColor: s.theme === "dark" ? "#111316" : "#f4f5f7",
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, locations] = await Promise.all([
    getSettings(),
    getLocations(),
  ]);
  const style = {
    "--accent": settings.accentColor,
    "--on-accent": onAccent(settings.accentColor),
  } as React.CSSProperties;

  return (
    <html
      lang="pt-BR"
      data-theme={settings.theme}
      style={style}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-ui focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader settings={settings} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} locations={locations} />
        <WhatsAppFloat
          href={whatsappUrl(
            settings.whatsapp,
            `Olá! Vim pelo site da ${settings.name} e gostaria de falar com um consultor.`,
          )}
        />
      </body>
    </html>
  );
}
