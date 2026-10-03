import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

// Admin tests need a database (see README). They run once, on desktop, in order.
test.skip(!process.env.DATABASE_URL, "requer DATABASE_URL");
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "somente desktop");

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@valeautomoveis.com.br";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "senha-teste-123";
const stamp = Date.now().toString(36).toUpperCase();
const MODEL = `Testcar ${stamp}`;

async function signIn(page: Page) {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá");
}

// One session for the whole file: login attempts are rate limited on purpose.
let session: BrowserContext;
test.beforeAll(async ({ browser }) => {
  session = await browser.newContext();
  await signIn(await session.newPage());
});
test.afterAll(async () => session?.close());

async function login(page: Page) {
  await page.context().addCookies(await session.cookies());
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá");
}

test("login recusa senha errada e aceita a correta", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});

test("cadastra veículo, envia foto e o carro aparece no site", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Cadastrar veículo" }).first().click();

  // Validation in Portuguese
  await page.getByRole("button", { name: "Cadastrar veículo" }).click();
  await expect(page.getByText("Revise os campos destacados.")).toBeVisible();
  await expect(page.getByText("Informe a marca.")).toBeVisible();

  await page.getByLabel("Marca").fill("Volkswagen");
  await page.getByLabel("Modelo", { exact: true }).fill(MODEL);
  await page.getByLabel("Versão").fill("Comfortline 200 TSI");
  await page.getByLabel("Ano de fabricação").selectOption("2022");
  await page.getByLabel("Ano do modelo").selectOption("2023");
  await page.getByLabel("Quilometragem", { exact: true }).fill("31500");
  await page.getByLabel("Preço", { exact: true }).fill("98900");
  await page.getByLabel("Unidade onde está").selectOption({ label: "Morumbi" });
  await page.getByLabel("Câmbio").selectOption("automatico");
  await page.getByLabel("Combustível").selectOption("flex");
  await page.getByLabel("Carroceria").selectOption("suv");
  await page.getByLabel("Cor", { exact: true }).fill("Prata Sirius");
  await page.getByLabel("Apple CarPlay").check();
  await page.getByLabel("Único dono").check();
  await page.getByRole("button", { name: "Cadastrar veículo" }).click();

  await expect(
    page.getByText("Veículo salvo. O site já foi atualizado."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `Volkswagen ${MODEL}`,
  );

  // Photo upload (generated image)
  await mkdir("test-results", { recursive: true });
  const file = "test-results/foto-teste.jpg";
  await sharp({
    create: { width: 2400, height: 1600, channels: 3, background: "#7a8694" },
  })
    .jpeg()
    .toFile(file);
  await page.getByLabel("Escolher fotos").setInputFiles(file);
  await expect(page.getByAltText("Foto 1")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Capa", { exact: true })).toBeVisible();

  // Public site shows it immediately, with the photo
  await page.goto(
    `/estoque?modelo=${MODEL.toLowerCase().replace(/ /g, "-")}&marca=volkswagen`,
  );
  await expect(page.getByText("Encontramos 1 veículo.")).toBeVisible();
  await page
    .locator("article")
    .getByRole("link", { name: new RegExp(MODEL) })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(MODEL);
  await expect(page.getByText("Disponível na unidade")).toContainText(
    "Morumbi",
  );
  await expect(
    page.locator('img[src*="/media/vehicles/"]:visible').first(),
  ).toBeVisible();
});

test("marcar como vendido tira o carro do estoque e mantém a página", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/admin/veiculos?q=${encodeURIComponent(stamp)}`);
  await page.getByRole("link", { name: new RegExp(MODEL) }).click();
  await page.getByRole("button", { name: "Marcar vendido" }).click();
  await expect(
    page.locator("text=Situação:").locator("..").getByText("Vendido"),
  ).toBeVisible();

  await page.goto(
    `/estoque?modelo=${MODEL.toLowerCase().replace(/ /g, "-")}&marca=volkswagen`,
  );
  await expect(
    page.getByRole("heading", { name: "Nenhum veículo encontrado" }),
  ).toBeVisible();
});

test("lead do site chega no painel e muda de situação", async ({ page }) => {
  await page.goto("/contato?assunto=proposta&veiculo=VA-0141");
  await page.getByLabel("Nome completo").fill(`Cliente ${stamp}`);
  await page.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
  await page.getByLabel("Valor da sua proposta").fill("140000");
  await page.getByLabel(/Autorizo o uso dos meus dados/).check();
  await page.getByRole("button", { name: "Enviar proposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Proposta enviada" }),
  ).toBeVisible();

  await login(page);
  await page.getByRole("link", { name: /Leads/ }).first().click();
  await page
    .getByRole("link", { name: new RegExp(`Cliente ${stamp}`) })
    .click();
  await expect(page.getByText("R$ 140.000")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Toyota Corolla Cross/ }),
  ).toBeVisible();
  const reply = await page
    .getByRole("link", { name: "Responder no WhatsApp" })
    .getAttribute("href");
  expect(reply).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);

  await page.getByLabel("Situação do atendimento").selectOption("negociacao");
  await page
    .getByLabel("Anotações internas")
    .fill("Quer fechar com entrada de 50 mil.");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Atendimento atualizado.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Anotações internas")).toHaveValue(
    "Quer fechar com entrada de 50 mil.",
  );
});

test("configurações mudam o site na hora", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Configurações" }).click();
  const about = page.getByLabel("Texto institucional");
  const original = await about.inputValue();
  await about.fill(`Texto de teste ${stamp}.`);
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText(/Configurações salvas/)).toBeVisible();

  await page.goto("/sobre");
  await expect(
    page.getByText(`Texto de teste ${stamp}.`).first(),
  ).toBeVisible();

  // Restore
  await page.goto("/admin/configuracoes");
  await page.getByLabel("Texto institucional").fill(original);
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText(/Configurações salvas/)).toBeVisible();
});

test("novo acesso entra com senha temporária e precisa criar a própria", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Equipe" }).click();
  const email = `vendedor.${stamp.toLowerCase()}@valeautomoveis.com.br`;
  await page.getByLabel("Nome").fill("Vendedor Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Criar acesso" }).click();
  const temp = (await page.locator("code").textContent())!.trim();
  expect(temp).toHaveLength(14);

  const other = await browser.newPage();
  await other.goto("/admin/login");
  await other.getByLabel("E-mail").fill(email);
  await other.getByLabel("Senha").fill(temp);
  await other.getByRole("button", { name: "Entrar" }).click();
  await expect(
    other.getByRole("heading", { name: "Crie sua senha" }),
  ).toBeVisible();
  await other.getByLabel("Senha atual").fill(temp);
  await other
    .getByLabel("Nova senha", { exact: true })
    .fill("nova-senha-segura-1");
  await other.getByLabel("Repita a nova senha").fill("nova-senha-segura-1");
  await other.getByRole("button", { name: "Alterar senha" }).click();
  await expect(other.getByText(/Senha alterada/)).toBeVisible();
  await other.close();

  // Clean up
  await page.reload();
  const row = page.getByRole("listitem").filter({ hasText: email });
  await row.getByRole("button", { name: "Remover acesso" }).click();
  await row.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(page.getByText(email)).toHaveCount(0);
});

test("sair encerra a sessão", async ({ page }) => {
  await login(page); // last test: ending the shared session is fine
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
