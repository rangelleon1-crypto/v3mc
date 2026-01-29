import { chromium } from "playwright";

const waitRandom = (min, max) =>
  new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min))
  );

async function typeLikeHuman(page, selector, text) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.click(selector, { clickCount: 3 });
  for (const char of text) {
    await page.keyboard.type(char, {
      delay: Math.random() * (200 - 80) + 80
    });
  }
}

async function clickBuscar(page) {
  const attempts = [
    () => page.getByRole("button").filter({ hasText: "Buscar" }).first().click(),
    () => page.getByRole("button").filter({ hasText: "Consultar" }).first().click(),
    () => page.locator('button:has-text("Buscar")').first().click(),
    () => page.locator("button").nth(0).click(),
    () => page.getByRole("button", { name: "Left Align" }).click()
  ];

  for (const fn of attempts) {
    try {
      await fn();
      return true;
    } catch {}
  }
  return false;
}

export async function consultarRefrendo({ placa, serie, raw = false }) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();

  try {
    await page.goto("https://refrendodigital.michoacan.gob.mx/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await waitRandom(1200, 2000);

    await typeLikeHuman(page, 'input[name="placa"]', placa);
    await waitRandom(500, 1000);

    await typeLikeHuman(page, 'input[name="serie"]', serie);
    await waitRandom(800, 1500);

    const clicked = await clickBuscar(page);
    if (!clicked) {
      throw new Error("No se encontró el botón Buscar");
    }

    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await waitRandom(1500, 2500);

    const urlFinal = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);

    // 🔥 DEVUELVE TODO EL TEXTO REAL
    if (raw) {
      return {
        raw: true,
        urlFinal,
        bodyText
      };
    }

    // Placeholder si luego quieres extracción limpia
    return {
      mensaje: "Modo normal aún no implementado",
      urlFinal
    };

  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
