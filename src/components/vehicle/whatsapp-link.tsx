"use client";

/** WhatsApp link that also sends an anonymous click ping (no personal data). */
export function WhatsAppLink({
  href,
  vehicleId,
  className,
  children,
  ...rest
}: {
  href: string;
  vehicleId?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => {
        try {
          navigator.sendBeacon?.(
            "/api/whatsapp-click",
            new Blob([JSON.stringify({ vehicleId: vehicleId ?? null })], {
              type: "application/json",
            }),
          );
        } catch {
          // Tracking must never block the click
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
