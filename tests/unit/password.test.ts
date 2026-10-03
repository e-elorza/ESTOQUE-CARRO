import { describe, expect, it } from "vitest";
import {
  hashPassword,
  passwordProblem,
  temporaryPassword,
  verifyPassword,
} from "@/lib/auth/password";

describe("passwords", () => {
  it("hashes with a salt and verifies", async () => {
    const a = await hashPassword("uma-senha-boa-123");
    const b = await hashPassword("uma-senha-boa-123");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("uma-senha-boa-123", a)).toBe(true);
    expect(await verifyPassword("outra-senha", a)).toBe(false);
    expect(await verifyPassword("x", "lixo")).toBe(false);
  });
  it("rejects short passwords and generates readable temporary ones", () => {
    expect(passwordProblem("curta")).toMatch(/10 caracteres/);
    expect(passwordProblem("comprida-o-suficiente")).toBeNull();
    expect(temporaryPassword()).toMatch(/^[a-zA-Z2-9]{14}$/);
  });
});
