DROP INDEX `flag_project_key_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `flag_project_name_unique` ON `flag` (`project_id`,`name`);--> statement-breakpoint
ALTER TABLE `flag` DROP COLUMN `key`;