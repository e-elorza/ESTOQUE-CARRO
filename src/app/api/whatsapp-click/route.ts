import { recordWhatsappClick } from "@/lib/data/leads";
import { allow } from "@/lib/rate-limit";

/** Receives navigator.sendBeacon() pings from WhatsApp buttons. Stores no personal data. */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allow("wa-click", ip, 30, 10 * 60_000)))
    return new Response(null, { status: 204 });
  try {
    const body = (await request.json()) as { vehicleId?: unknown };
    await recordWhatsappClick(
      typeof body.vehicleId === "string" ? body.vehicleId : null,
    );
  } catch {
    // Ignore malformed pings
  }
  return new Response(null, { status: 204 });
}
