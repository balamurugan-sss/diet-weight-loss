CREATE TABLE `cardio_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`activity` text NOT NULL,
	`intensity` text NOT NULL,
	`minutes` integer NOT NULL,
	`kcal` integer NOT NULL,
	`net_kcal` integer NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cardio_user_date_idx` ON `cardio_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `cardio_external_uq` ON `cardio_logs` (`user_id`,`source`,`external_id`);