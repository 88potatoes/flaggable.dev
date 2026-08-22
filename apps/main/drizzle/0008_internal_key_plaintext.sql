ALTER TABLE `internal_key` ADD `key_plaintext` text;
DROP INDEX IF EXISTS `internal_key_hash_unique`;
ALTER TABLE `internal_key` DROP COLUMN `key_hash`;
