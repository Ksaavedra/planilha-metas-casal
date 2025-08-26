-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS planilha_organizacao;
USE planilha_organizacao;

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valorMeta DECIMAL(15,2) NOT NULL,
    valorPorMes DECIMAL(15,2) NOT NULL,
    mesesNecessarios INT NOT NULL,
    valorAtual DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de meses para cada meta
CREATE TABLE IF NOT EXISTS meses_meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meta_id INT NOT NULL,
    mes_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    valor DECIMAL(15,2) DEFAULT 0,
    status ENUM('Vazio', 'Parcial', 'Completo') DEFAULT 'Vazio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
);

-- Inserir meses padrão (1-12)
INSERT IGNORE INTO meses_meta (meta_id, mes_id, nome) VALUES
(1, 1, 'Janeiro'),
(1, 2, 'Fevereiro'),
(1, 3, 'Março'),
(1, 4, 'Abril'),
(1, 5, 'Maio'),
(1, 6, 'Junho'),
(1, 7, 'Julho'),
(1, 8, 'Agosto'),
(1, 9, 'Setembro'),
(1, 10, 'Outubro'),
(1, 11, 'Novembro'),
(1, 12, 'Dezembro');
