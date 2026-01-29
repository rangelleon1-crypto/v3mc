import { chromium } from "playwright";

const waitRandom = (min, max) =>
  new Promise(r =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1) + min))
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

export async function consultarRefrendo({ placa, serie }) {
  if (!placa || !serie) {
    throw new Error("Faltan parámetros: placa o serie");
  }

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
      waitUntil: "networkidle",
      timeout: 60000
    });

    await waitRandom(1500, 2500);

    await typeLikeHuman(page, 'input[name="placa"]', placa);
    await waitRandom(600, 1200);

    await typeLikeHuman(page, 'input[name="serie"]', serie);
    await waitRandom(800, 1500);

    // Click botón buscar
    const clicked =
      await page.getByRole("button", { name: "Left Align" }).click().then(() => true).catch(() => false);

    if (!clicked) {
      throw new Error("No se encontró el botón de búsqueda");
    }

    await page.waitForSelector("text=Nombre:", { timeout: 30000 }).catch(() => {});
    await waitRandom(1500, 2500);

    const data = await page.evaluate(() => {
      const getVal = regex => {
        const text = document.body.innerText;
        const match = text.match(regex);
        return match ? match[1].trim() : "No encontrado";
      };

      const cleanMoney = text => {
        const match = (text || "").match(/[\d,.]+/);
        return match ? `$ ${match[0]}` : "Sin adeudo";
      };

      return {
        titular: getVal(/Nombre:\s*(.+?)(?=\s+RFC:|$)/i),
        rfc: getVal(/RFC:\s*([A-Z0-9]{10,13})/i),
        vehiculo: {
          placa: getVal(/Placa:\s*(\S+)/i),
          serie: getVal(/Serie:\s*(\S+)/i),
          modelo: getVal(/Modelo:\s*(\d{4})/i),
          marca: getVal(/Marca:\s*(.+?)(?=\s+Tipo:|$)/i),
          tipo: getVal(/Tipo:\s*(.+?)(?=\s+Uso:|$)/i)
        },
        totalPagar: cleanMoney(getVal(/TOTAL A PAGAR\s*(.+)/i)),
        fechaVencimiento: getVal(/Vence el:\s*(\d{2}\/\d{2}\/\d{4})/i),
        fechaConsulta: new Date().toISOString().split("T")[0]
      };
    });

    return data;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
