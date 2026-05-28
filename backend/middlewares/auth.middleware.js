const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "planilha-orcamento-dev-secret";

function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token não informado." });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

module.exports = {
  JWT_SECRET,
  autenticarToken,
};
