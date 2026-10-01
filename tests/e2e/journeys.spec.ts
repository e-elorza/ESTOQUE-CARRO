import { expect, test } from "@playwright/test";

const SOLD = "/estoque/chevrolet-tracker-premier-1-2-turbo-2023-va-0166";

test("busca na home leva ao estoque filtrado e ao WhatsApp do carro", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Marca").selectOption("toyota");
  await page.getByLabel("Modelo").selectOption("corolla-cross");
  await page.getByRole("button", { name: "Buscar veículos" }).click();
  await expect(page).toHaveURL(/marca=toyota&modelo=corolla-cross/);
  await expect(page.getByText("Encontramos 1 veículo.")).toBeVisible();

  await page.getByRole("link", { name: /Corolla Cross XRE 2\.0/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Corolla Cross",
  );
  const wa = page
    .getByRole("main")
    .getByRole("link", { name: "Falar no WhatsApp" })
    .first();
  const href = decodeURIComponent((await wa.getAttribute("href")) ?? "");
  expect(href).toMatch(/^https:\/\/wa\.me\/55\d+\?text=/);
  expect(href).toContain("código VA-0141");
});

test("filtros sem resultado mostram estado vazio", async ({ page }) => {
  await page.goto("/estoque?preco_max=50000");
  await expect(
    page.getByRole("heading", { name: "Nenhum veículo encontrado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page.getByText(/Encontramos \d+ veículos\./)).toBeVisible();
});

test("financiamento valida campos e confirma envio", async ({ page }) => {
  await page.goto("/financiamento?veiculo=VA-0140");
  await expect(page.getByText("Veículo de interesse")).toBeVisible();
  await page.getByRole("button", { name: "Solicitar financiamento" }).click();
  await expect(page.getByText("Revise os campos destacados.")).toBeVisible();
  await expect(page.getByText("Informe seu nome completo.")).toBeVisible();

  await page.getByLabel("Nome completo").fill("Ana Paula Ribeiro");
  await page.getByLabel("WhatsApp", { exact: true }).fill("11987654321");
  await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveValue(
    "(11) 98765-4321",
  );
  await page.getByLabel("Prazo desejado").selectOption("48");
  await page.getByLabel(/Autorizo o uso dos meus dados/).check();
  await page.getByRole("button", { name: "Solicitar financiamento" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido enviado" }),
  ).toBeVisible();
});

test("troca confirma envio e oferece enviar fotos pelo WhatsApp", async ({
  page,
}) => {
  await page.goto("/venda-seu-carro");
  await page.getByLabel("Nome completo").fill("Rafael Monteiro");
  await page.getByLabel("WhatsApp", { exact: true }).fill("21998765432");
  await page.getByLabel("Marca", { exact: true }).fill("Volkswagen");
  await page.getByLabel("Modelo", { exact: true }).fill("Polo");
  await page.getByLabel("Ano do modelo").selectOption("2021");
  await page.getByLabel("Quilometragem").fill("45000");
  await page.getByText("Manual", { exact: true }).click();
  await page.getByText("Bom", { exact: true }).click();
  await page.getByLabel(/Autorizo o uso dos meus dados/).check();
  await page.getByRole("button", { name: "Enviar para avaliação" }).click();
  await expect(
    page.getByRole("link", { name: "Enviar fotos pelo WhatsApp" }),
  ).toBeVisible();
});

test("carro vendido mantém a página e mostra alternativas", async ({
  page,
}) => {
  await page.goto(SOLD);
  await expect(page.getByText("Este veículo já foi vendido.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Carros parecidos disponíveis" }),
  ).toBeVisible();
});

test("página inexistente responde 404 em português", async ({ page }) => {
  const res = await page.goto("/estoque/carro-que-nao-existe");
  expect(res?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "somente mobile");

  test("menu, filtro na gaveta e página do carro", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name: "Estoque" })
      .click();
    await expect(page).toHaveURL(/\/estoque$/);

    await page.getByRole("button", { name: /^Filtrar/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filtros" });
    await sheet.getByLabel("SUV").check();
    const apply = sheet.getByRole("button", { name: /^Ver \d+ veículos$/ });
    await expect(apply).toBeVisible();
    await apply.click();
    await expect(page).toHaveURL(/carroceria=suv/);

    await page.locator("article a").first().click();
    await expect(
      page.getByRole("link", { name: "WhatsApp", exact: true }),
    ).toBeVisible();
  });

  test("sem rolagem horizontal nas páginas principais", async ({ page }) => {
    for (const path of [
      "/",
      "/estoque",
      "/financiamento",
      "/venda-seu-carro",
      "/contato",
      "/sobre",
      SOLD,
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test("nenhum texto em inglês visível nas páginas principais", async ({
  page,
}) => {
  const english =
    /\b(Search|Loading|Submit|Next|Previous|Page not found|Read more|Learn more|Contact us|Sign up|Error)\b/;
  for (const path of [
    "/",
    "/estoque",
    "/financiamento",
    "/venda-seu-carro",
    "/contato",
    "/sobre",
    "/politica-de-privacidade",
  ]) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(english);
  }
});
