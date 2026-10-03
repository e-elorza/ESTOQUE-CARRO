import { SiteChrome } from "@/components/layout/site-chrome";
import SiteNotFound from "./(site)/not-found";

/** Unmatched URLs anywhere: same 404 as the site, with header and footer. */
export default function NotFound() {
  return (
    <SiteChrome>
      <SiteNotFound />
    </SiteChrome>
  );
}
