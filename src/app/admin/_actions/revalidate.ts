import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data";

/** After any change that affects public pages: expire the catalog cache and all rendered pages. */
export function revalidateCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}
