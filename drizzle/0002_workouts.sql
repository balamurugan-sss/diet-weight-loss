CREATE TABLE `workout_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`location` text NOT NULL,
	`level` text NOT NULL,
	`goal` text NOT NULL,
	`days_per_week` integer NOT NULL,
	`equipment` text DEFAULT '[]' NOT NULL,
	`doctor_ack_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workout_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`split` text NOT NULL,
	`location` text NOT NULL,
	`level` text NOT NULL,
	`goal` text NOT NULL,
	`days_per_week` integer NOT NULL,
	`start_date` text NOT NULL,
	`days` text NOT NULL,
	`swaps` text DEFAULT '{}' NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_programs_user_idx` ON `workout_programs` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`duration_sec` integer,
	`kcal` integer,
	`net_kcal` integer,
	`exercises_done` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `workout_programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_user_date_idx` ON `workout_sessions` (`user_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `workout_sessions_program_day_uq` ON `workout_sessions` (`program_id`,`day_index`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`session_id` text NOT NULL,
	`slot` integer NOT NULL,
	`set_index` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`reps` integer,
	`seconds` integer,
	`weight_kg` real,
	`done` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`session_id`, `slot`, `set_index`),
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_sets_exercise_idx` ON `workout_sets` (`exercise_id`);