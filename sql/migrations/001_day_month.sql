-- Migration 001: replace the `date` string (D/M or DD/MM) with `day` and `month` columns,
-- and make `user_id` unique.
--
-- Run it on a copy of the production database first, and take a backup before running it on production.
-- MySQL commits each ALTER TABLE on its own, so the steps are ordered to fail before any data is lost:
-- the old `date` column is only dropped (step 5) once the new columns are filled and constrained (step 4).
-- If a step fails, fix the reported rows and run the remaining steps again.

-- ---------------------------------------------------------------------------
-- Step 1: pre-checks. Each query must return no rows before you continue.
-- ---------------------------------------------------------------------------

-- 1a. Duplicate users. Keep one row per user_id and delete the others.
SELECT user_id, COUNT(*) AS n
FROM birthdays
GROUP BY user_id
HAVING n > 1;

-- 1b. Dates that are missing or not in D/M or DD/MM format. Fix or delete these rows.
SELECT user_id, date
FROM birthdays
WHERE date IS NULL OR date NOT REGEXP '^[0-9]{1,2}/[0-9]{1,2}$';

-- 1c. Dates that do not exist (29/02 is allowed). Fix or delete these rows.
SELECT user_id, date
FROM birthdays
WHERE date REGEXP '^[0-9]{1,2}/[0-9]{1,2}$'
  AND (
    CAST(SUBSTRING_INDEX(date, '/', -1) AS UNSIGNED) NOT BETWEEN 1 AND 12
    OR CAST(SUBSTRING_INDEX(date, '/', 1) AS UNSIGNED)
       NOT BETWEEN 1 AND ELT(CAST(SUBSTRING_INDEX(date, '/', -1) AS UNSIGNED),
                             31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
  );

-- ---------------------------------------------------------------------------
-- Step 2: add the new columns (nullable while they are filled).
-- ---------------------------------------------------------------------------
ALTER TABLE birthdays
  ADD COLUMN day TINYINT UNSIGNED NULL AFTER user_id,
  ADD COLUMN month TINYINT UNSIGNED NULL AFTER day;

-- ---------------------------------------------------------------------------
-- Step 3: convert the existing rows.
-- ---------------------------------------------------------------------------
UPDATE birthdays
SET day = CAST(SUBSTRING_INDEX(date, '/', 1) AS UNSIGNED),
    month = CAST(SUBSTRING_INDEX(date, '/', -1) AS UNSIGNED)
WHERE date REGEXP '^[0-9]{1,2}/[0-9]{1,2}$';

-- ---------------------------------------------------------------------------
-- Step 4: make the new columns mandatory and add the constraints.
-- This fails (and changes nothing) if a row was not converted or is out of range.
-- ---------------------------------------------------------------------------
ALTER TABLE birthdays
  MODIFY COLUMN day TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN month TINYINT UNSIGNED NOT NULL,
  ADD CONSTRAINT chk_birthdays_day CHECK (day BETWEEN 1 AND 31),
  ADD CONSTRAINT chk_birthdays_month CHECK (month BETWEEN 1 AND 12),
  ADD KEY idx_birthdays_month_day (month, day);

-- 4b. Uniqueness of user_id. Run SHOW CREATE TABLE birthdays first:
-- - if it already shows PRIMARY KEY (`user_id`), user_id is already unique: skip this statement;
-- - otherwise, run it (it fails if step 1a still returns rows).
-- ALTER TABLE birthdays ADD UNIQUE KEY uq_birthdays_user_id (user_id);

-- ---------------------------------------------------------------------------
-- Step 5: check the result, then drop the old column.
-- ---------------------------------------------------------------------------

-- 5a. Must return no rows: every converted value matches the old string.
SELECT user_id, date, day, month
FROM birthdays
WHERE CAST(SUBSTRING_INDEX(date, '/', 1) AS UNSIGNED) <> day
   OR CAST(SUBSTRING_INDEX(date, '/', -1) AS UNSIGNED) <> month;

ALTER TABLE birthdays DROP COLUMN date;
