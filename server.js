import express from "express";
import { consultarRefrendo } from "./refrendo.js";

const app = express();
app.use(express.json());

// API KEY opcional
const API_KEY = process.env.API_KEY || "";

app.use((req, res, next) => {
  if (!API_KEY) return next();
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

// /consulta?placa=XXX&serie=YYY
app.get("/consulta", async (req, res) => {
  try {
    const { placa, serie } = req.query;

    if (!placa || !serie) {
      return res.status(400).json({
        error: "Faltan parámetros",
        ejemplo: "/consulta?placa=PJW344D&serie=JE3AJ66F650041310"
      });
    }

    const data = await consultarRefrendo({ placa, serie });
    res.json({ ok: true, data });
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
