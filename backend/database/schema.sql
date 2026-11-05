-- Executar com usuário administrador no MySQL 8.4.
-- Não apaga dados existentes. IF NOT EXISTS não migra tabelas antigas.
CREATE DATABASE IF NOT EXISTS studyup
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE studyup;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  foto VARCHAR(500) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  CONSTRAINT ck_usuarios_nome CHECK (CHAR_LENGTH(TRIM(nome)) > 0)
) ENGINE=InnoDB;
SELECT VERSION();
CREATE TABLE IF NOT EXISTS disciplinas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(20) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disciplinas_dono_nome (usuario_id, nome),
  -- Chave composta permite impedir vínculos de tarefas com outro usuário.
  UNIQUE KEY uq_disciplinas_dono_id (usuario_id, id),
  CONSTRAINT fk_disciplinas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT ck_disciplinas_nome CHECK (CHAR_LENGTH(TRIM(nome)) > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tarefas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  disciplina_id INT UNSIGNED NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  -- Prazo em horário civil de Fortaleza; não converter implicitamente para Date.
  data_limite DATETIME NOT NULL,
  prioridade ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
  status ENUM('pendente', 'concluida') NOT NULL DEFAULT 'pendente',
  concluida_em DATETIME NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_tarefas_usuario_prazo (usuario_id, data_limite),
  KEY ix_tarefas_disciplina (usuario_id, disciplina_id),
  CONSTRAINT fk_tarefas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_tarefas_disciplina_dono FOREIGN KEY (usuario_id, disciplina_id)
    REFERENCES disciplinas (usuario_id, id) ON DELETE RESTRICT,
  CONSTRAINT ck_tarefas_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0),
  CONSTRAINT ck_tarefas_conclusao CHECK (
    (status = 'pendente' AND concluida_em IS NULL) OR
    (status = 'concluida' AND concluida_em IS NOT NULL)
  )
) ENGINE=InnoDB;
