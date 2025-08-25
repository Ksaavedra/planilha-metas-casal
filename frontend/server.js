const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rota para servir o JSON das metas
app.get("/api/metas", (req, res) => {
  try {
    const metasPath = path.join(__dirname, "src/app/api/metas.json");
    const metasData = JSON.parse(fs.readFileSync(metasPath, "utf8"));
    res.json(metasData);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar metas" });
  }
});

// Rota para buscar uma meta específica
app.get("/api/metas/:id", (req, res) => {
  try {
    const metasPath = path.join(__dirname, "src/app/api/metas.json");
    const metasData = JSON.parse(fs.readFileSync(metasPath, "utf8"));
    const meta = metasData.metas.find((m) => m.id === parseInt(req.params.id));

    if (meta) {
      res.json(meta);
    } else {
      res.status(404).json({ error: "Meta não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar meta" });
  }
});

// Rota para atualizar metas
app.put("/api/metas/:id", (req, res) => {
  try {
    const metasPath = path.join(__dirname, "src/app/api/metas.json");
    const metasData = JSON.parse(fs.readFileSync(metasPath, "utf8"));
    const index = metasData.metas.findIndex(
      (m) => m.id === parseInt(req.params.id)
    );

    if (index !== -1) {
      metasData.metas[index] = { ...metasData.metas[index], ...req.body };
      fs.writeFileSync(metasPath, JSON.stringify(metasData, null, 2));
      res.json(metasData.metas[index]);
    } else {
      res.status(404).json({ error: "Meta não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar meta" });
  }
});

// Rota para criar nova meta
app.post("/api/metas", (req, res) => {
  try {
    const metasPath = path.join(__dirname, "src/app/api/metas.json");
    const metasData = JSON.parse(fs.readFileSync(metasPath, "utf8"));

    const newMeta = {
      id: Math.max(...metasData.metas.map((m) => m.id)) + 1,
      ...req.body,
    };

    metasData.metas.push(newMeta);
    fs.writeFileSync(metasPath, JSON.stringify(metasData, null, 2));
    res.status(201).json(newMeta);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar meta" });
  }
});

// Rota para deletar meta
app.delete("/api/metas/:id", (req, res) => {
  try {
    const metasPath = path.join(__dirname, "src/app/api/metas.json");
    const metasData = JSON.parse(fs.readFileSync(metasPath, "utf8"));
    const index = metasData.metas.findIndex(
      (m) => m.id === parseInt(req.params.id)
    );

    if (index !== -1) {
      metasData.metas.splice(index, 1);
      fs.writeFileSync(metasPath, JSON.stringify(metasData, null, 2));
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Meta não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar meta" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em: http://localhost:${PORT}/api/metas`);
});
