-- =====================================================
-- SCHEMA FINANCEIRO BASEADO NO SEU DBML (MySQL 8.x)
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================== TABELAS BASE ==================
CREATE TABLE meses (
  id INT PRIMARY KEY,
  nomeMeses VARCHAR(12) NOT NULL
);

CREATE TABLE conjuge (
  codigo VARCHAR(2) PRIMARY KEY,
  tipoConjuge ENUM('C1', 'C2', 'Do casal', 'Vazio') NOT NULL
);

CREATE TABLE categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipoCategoria VARCHAR(30) NOT NULL,
  nomeCategoria VARCHAR(60) NOT NULL,
  ativoCategoria BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================== METAS ==================
CREATE TABLE metaCasal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomeMeta VARCHAR(120) NOT NULL,
  valorMeta DECIMAL(12,2) NOT NULL,
  valorPorMes DECIMAL(12,2) NOT NULL,
  mesesNecessario INT NOT NULL,
  valorAtual DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE mesesMeta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metaCasal_id INT NOT NULL,
  meses_id INT NOT NULL,
  valorMesesMeta DECIMAL(12,2) NOT NULL DEFAULT 0,
  statusMesesMeta ENUM('Programado', 'Pago', 'Vazio') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mesesmeta_meta FOREIGN KEY (metaCasal_id) REFERENCES metaCasal(id),
  CONSTRAINT fk_mesesmeta_mes FOREIGN KEY (meses_id) REFERENCES meses(id),
  UNIQUE KEY uq_meta_mes (metaCasal_id, meses_id)
);

-- ================== RECEITAS ==================
CREATE TABLE receita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricaoReceita VARCHAR(120) NOT NULL,
  tipoRendaReceita ENUM('ATIVA','PASSIVA','EXTRA') NOT NULL,
  conjuge_codigo VARCHAR(2) NULL,
  dia TINYINT NULL,
  meses_id INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  status ENUM('PROGRAMADO','RECEBIDO','VAZIO') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_receita_conjuge FOREIGN KEY (conjuge_codigo) REFERENCES conjuge(codigo),
  CONSTRAINT fk_receita_mes FOREIGN KEY (meses_id) REFERENCES meses(id)
);

-- ================== DESPESAS ==================
CREATE TABLE despesa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricaoDespesa VARCHAR(120) NOT NULL,
  tipoRendaDespesa ENUM('ATIVA','PASSIVA','EXTRA') NOT NULL,
  conjuge_codigo VARCHAR(2) NULL,
  meses_id INT NOT NULL,
  categoria_id INT NOT NULL,
  valorDespesa DECIMAL(12,2) NOT NULL,
  statusDespesa ENUM('PROGRAMADO','PAGO','VAZIO') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesa_conjuge FOREIGN KEY (conjuge_codigo) REFERENCES conjuge(codigo),
  CONSTRAINT fk_despesa_mes FOREIGN KEY (meses_id) REFERENCES meses(id),
  CONSTRAINT fk_despesa_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

-- ================== DÍVIDAS ==================
CREATE TABLE divida (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricaoDivida VARCHAR(120) NOT NULL,
  conjuge_codigo VARCHAR(2) NULL,
  valorTotalDivida DECIMAL(12,2) NOT NULL,
  parcelasTotalDivida INT NOT NULL,
  valorParcelaDivida DECIMAL(12,2) NOT NULL,
  meses_id INT NOT NULL,
  statusDivida ENUM('PROGRAMADO','PAGO') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_divida_conjuge FOREIGN KEY (conjuge_codigo) REFERENCES conjuge(codigo),
  CONSTRAINT fk_divida_mes FOREIGN KEY (meses_id) REFERENCES meses(id)
);

-- ================== INVESTIMENTOS ==================
CREATE TABLE investimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricaoInvestimento VARCHAR(120) NOT NULL,
  categoria_id INT NOT NULL,
  metaValorInvestimento DECIMAL(12,2) NULL,
  aporteValorInvestimento DECIMAL(12,2) NOT NULL DEFAULT 0,
  retiradaValorInvestimento DECIMAL(12,2) NOT NULL DEFAULT 0,
  meses_id INT NOT NULL,
  statusInvestimento ENUM('PROGRAMADO','PAGO','VAZIO','REALIZADO','SEM RETIRADA','RETIRADO') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_investimento_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id),
  CONSTRAINT fk_investimento_mes FOREIGN KEY (meses_id) REFERENCES meses(id)
);

-- ================== RELATÓRIO FINANCEIRO ==================
CREATE TABLE relatorioFinanceiro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receita_id INT NULL,
  despesa_id INT NULL,
  divida_id INT NULL,
  investimento_id INT NULL,
  metaCasal_id INT NULL,
  conjuge_codigo VARCHAR(2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_relatorio_receita FOREIGN KEY (receita_id) REFERENCES receita(id),
  CONSTRAINT fk_relatorio_despesa FOREIGN KEY (despesa_id) REFERENCES despesa(id),
  CONSTRAINT fk_relatorio_divida FOREIGN KEY (divida_id) REFERENCES divida(id),
  CONSTRAINT fk_relatorio_investimento FOREIGN KEY (investimento_id) REFERENCES investimento(id),
  CONSTRAINT fk_relatorio_meta FOREIGN KEY (metaCasal_id) REFERENCES metaCasal(id),
  CONSTRAINT fk_relatorio_conjuge FOREIGN KEY (conjuge_codigo) REFERENCES conjuge(codigo)
);

-- ================== DADOS INICIAIS ==================
INSERT INTO meses (id, nomeMeses) VALUES
(1,'Janeiro'), (2,'Fevereiro'), (3,'Março'), (4,'Abril'),
(5,'Maio'), (6,'Junho'), (7,'Julho'), (8,'Agosto'),
(9,'Setembro'), (10,'Outubro'), (11,'Novembro'), (12,'Dezembro');

INSERT INTO conjuge (codigo, tipoConjuge) VALUES
('C1','C1'), ('C2','C2'), ('C3','Do casal'), ('C4','Vazio');

INSERT INTO categoria (tipoCategoria, nomeCategoria) VALUES
('MORADIA','Aluguel'), ('MORADIA','Condomínio'), ('MORADIA','Energia'),
('AUTOMOVEL','Combustível'), ('AUTOMOVEL','IPVA'), ('AUTOMOVEL','Seguro'),
('ALIMENTACAO','Supermercado'), ('ALIMENTACAO','Restaurantes'),
('SAUDE','Plano de Saúde'), ('SAUDE','Academia'),
('LAZER','Netflix'), ('LAZER','Spotify'),
('INVESTIMENTO','Reserva de Emergência'), ('INVESTIMENTO','Renda Fixa'),
('INVESTIMENTO','Ações'), ('INVESTIMENTO','FIIs');


SET FOREIGN_KEY_CHECKS = 1;