import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect("/admin");
  const settings = await getSettings();
  return (
    <main
      id="conteudo"
      className="flex min-h-dvh items-center justify-center px-4 py-12"
    >
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-[19px] font-semibold tracking-[-0.03em]">
            {settings.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Entrar no painel
          </h1>
        </div>
        <div className="rounded-ui border border-line bg-surface p-6">
          <LoginForm />
        </div>
        <p className="text-sm text-muted">
          Esqueceu a senha? Peça a outra pessoa da equipe para gerar uma nova em
          Equipe.{" "}
          <Link href="/" className="text-accent-text hover:underline">
            Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  );
}
