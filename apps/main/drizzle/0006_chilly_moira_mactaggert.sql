ALTER TABLE `condition` ADD `project_id` text NOT NULL REFERENCES project(id);--> statement-breakpoint
CREATE INDEX `condition_project_id_idx` ON `condition` (`project_id`);