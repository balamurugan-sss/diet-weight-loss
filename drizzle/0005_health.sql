CREATE TABLE `health_connections` (
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` integer NOT NULL,
	`scope` text NOT NULL,
	`connected_at` integer NOT NULL,
	`last_sync_at` integer,
	`last_error` text,
	PRIMARY KEY(`user_id`, `provider`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_days` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`steps` integer,
	`active_minutes` integer,
	`resting_hr` integer,
	`sleep_minutes` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`, `source`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
