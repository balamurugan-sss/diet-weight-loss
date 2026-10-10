ALTER TABLE `meal_plan_items` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes` ADD `avoid_tags` text DEFAULT '[]' NOT NULL;