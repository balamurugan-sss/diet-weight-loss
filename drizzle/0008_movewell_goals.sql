CREATE TABLE `recipe_feedback` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`liked` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `health_days` ADD `active_kcal` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `step_goal` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `active_kcal_goal` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `sleep_goal_min` integer;--> statement-breakpoint
ALTER TABLE `workout_profiles` ADD `weekdays` text;