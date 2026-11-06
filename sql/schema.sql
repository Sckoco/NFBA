-- Full schema for a fresh NFBA database (MySQL 8.0.16+, for enforced CHECK constraints).
-- An existing database must be upgraded with the files in sql/migrations/ instead.

CREATE TABLE IF NOT EXISTS birthdays (
  user_id VARCHAR(255) NOT NULL,
  day TINYINT UNSIGNED NOT NULL,
  month TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id),
  KEY idx_birthdays_month_day (month, day),
  CONSTRAINT chk_birthdays_day CHECK (day BETWEEN 1 AND 31),
  CONSTRAINT chk_birthdays_month CHECK (month BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
