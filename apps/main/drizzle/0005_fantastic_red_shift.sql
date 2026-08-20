CREATE TABLE `internal_key` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text DEFAULT 'Internal API Key' NOT NULL,
	`key_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `internal_key_project_id_idx` ON `internal_key` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `internal_key_hash_unique` ON `internal_key` (`key_hash`);