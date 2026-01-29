import express from "express";
import { consultarRefrendo } from "./refrendo.js";

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY || "";

// Protección opcional
app.use((req, res, next) => {
  if (!API_KEY) return next();
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

// 👉 USAR raw=1 PARA VER TODO EL TEXTO REAL DE LA PÁGINA
// /consulta?placa=XXX&serie=YYY&raw=1
app.get("/consulta", async (req, res) => {
  try {
    const placa = String(req.query.placa || "").trim();
    const serie = String(req.query.serie || "").trim();
    const raw = String(req.query.raw || "") === "1";

    if (!placa || !serie) {
      return res.status(400).json({
        error: "Faltan parámetros",
        ejemplo: "/consulta?placa=PJW344D&serie=JE3AJ66F650041310&raw=1"
      });
    }

    const result = await consultarRefrendo({ placa, serie, raw });
    res.json({ ok: true, ...result });

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || "Error inesperado"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API corriendo en puerto ${PORT}`)
);
