import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getLocations, getSettings } from "@/lib/data";
import { whatsappUrl } from "@/lib/format";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [settings, locations] = await Promise.all([
    getSettings(),
    getLocations(),
  ]);
  return (
    <>
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
    </>
  );
}
