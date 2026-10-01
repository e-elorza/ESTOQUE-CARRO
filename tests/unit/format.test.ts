import { describe, expect, it } from "vitest";
import {
  formatKm,
  formatPhone,
  formatPrice,
  slugify,
  whatsappUrl,
} from "@/lib/format";

describe("format", () => {
  it("formats prices in BRL without cents", () => {
    expect(formatPrice(129900)).toBe("R$ 129.900");
  });
  it("formats mileage", () => {
    expect(formatKm(42000)).toBe("42.000 km");
  });
  it("formats Brazilian phone numbers with or without country code", () => {
    expect(formatPhone("5511987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1130000000")).toBe("(11) 3000-0000");
  });
  it("builds wa.me links with an encoded message", () => {
    expect(whatsappUrl("55 (11) 90000-0000", "Olá! T-Cross 2024")).toBe(
      "https://wa.me/5511900000000?text=Ol%C3%A1!%20T-Cross%202024",
    );
  });
  it("slugifies Portuguese text", () => {
    expect(slugify("Sedã Automático 2.0")).toBe("seda-automatico-2-0");
  });
});
