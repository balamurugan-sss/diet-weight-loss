CREATE TABLE `exercise_media` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt` text NOT NULL,
	`operation` text,
	`data` blob,
	`mime` text,
	`bytes` integer,
	`error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX `exercise_media_exercise_idx` ON `exercise_media` (`exercise_id`,`status`);