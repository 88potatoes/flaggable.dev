CREATE TABLE `user_onboarding` (
	`user_id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`current_step` text,
	`sdk_setup_acknowledged_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
