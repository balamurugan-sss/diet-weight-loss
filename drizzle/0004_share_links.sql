CREATE TABLE `share_links` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `share_links_user_idx` ON `share_links` (`user_id`);