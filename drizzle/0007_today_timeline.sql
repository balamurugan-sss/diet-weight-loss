CREATE TABLE `day_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`time` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_events_user_date_kind_uq` ON `day_events` (`user_id`,`date`,`kind`);--> statement-breakpoint
ALTER TABLE `health_days` ADD `avg_hr` integer;--> statement-breakpoint
ALTER TABLE `health_days` ADD `max_hr` integer;--> statement-breakpoint
ALTER TABLE `health_days` ADD `hr_hourly` text;--> statement-breakpoint
ALTER TABLE `health_days` ADD `in_bed_minutes` integer;--> statement-breakpoint
ALTER TABLE `health_days` ADD `deep_minutes` integer;--> statement-breakpoint
ALTER TABLE `health_days` ADD `rem_minutes` integer;--> statement-breakpoint
ALTER TABLE `health_days` ADD `sleep_start` text;--> statement-breakpoint
ALTER TABLE `health_days` ADD `wake_time` text;--> statement-breakpoint
ALTER TABLE `health_days` ADD `sleep_score` integer;