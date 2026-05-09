-- Add deptId and rankId columns to fdo_users (safe: adds only if not already present)

SET @dept_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fdo_users'
      AND COLUMN_NAME = 'deptId'
);

SET @dept_sql := IF(
    @dept_exists = 0,
    'ALTER TABLE `fdo_users` ADD COLUMN `deptId` INTEGER NULL',
    'SELECT 1'
);
PREPARE stmt_dept FROM @dept_sql;
EXECUTE stmt_dept;
DEALLOCATE PREPARE stmt_dept;

SET @rank_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fdo_users'
      AND COLUMN_NAME = 'rankId'
);

SET @rank_sql := IF(
    @rank_exists = 0,
    'ALTER TABLE `fdo_users` ADD COLUMN `rankId` INTEGER NULL',
    'SELECT 1'
);
PREPARE stmt_rank FROM @rank_sql;
EXECUTE stmt_rank;
DEALLOCATE PREPARE stmt_rank;
