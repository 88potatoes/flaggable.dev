CREATE TABLE `condition` (
	`id` text PRIMARY KEY NOT NULL,
	`flag_id` text NOT NULL,
	`position` integer NOT NULL,
	`enabled` integer NOT NULL,
	`property` text NOT NULL,
	`operator` text NOT NULL,
	`predicate_value` text NOT NULL,
	`result_value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`flag_id`) REFERENCES `flag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `condition_flag_id_idx` ON `condition` (`flag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `condition_flag_position_unique` ON `condition` (`flag_id`,`position`);--> statement-breakpoint
CREATE TABLE `flag` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`value_schema_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`enabled` integer NOT NULL,
	`fallback_value` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`value_schema_id`) REFERENCES `value_schema`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `flag_project_id_idx` ON `flag` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `flag_project_key_unique` ON `flag` (`project_id`,`key`);--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_owner_user_id_idx` ON `project` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `value_schema` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`schema_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `value_schema_project_id_idx` ON `value_schema` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `value_schema_project_name_unique` ON `value_schema` (`project_id`,`name`);