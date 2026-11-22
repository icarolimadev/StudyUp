
CREATE TABLE IF NOT EXISTS sessoes (
    session_id VARCHAR(128)
        COLLATE utf8mb4_bin NOT NULL,
    dados TEXT NOT NULL,
    expira_em BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (session_id),
    INDEX idx_sessoes_expiracao (expira_em)
);
