CREATE TABLE `audio_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`voice` text NOT NULL,
	`lang` text NOT NULL,
	`mime` text NOT NULL,
	`data` blob NOT NULL,
	`chars` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cooking_sessions` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`step_index` integer DEFAULT 0 NOT NULL,
	`completed_steps` text DEFAULT '[]' NOT NULL,
	`servings` real NOT NULL,
	`plan_item_id` text,
	`finished_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favourites` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `image_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`step_index` integer NOT NULL,
	`status` text NOT NULL,
	`kind` text NOT NULL,
	`provider` text NOT NULL,
	`model` text,
	`prompt` text,
	`mime` text NOT NULL,
	`data` blob NOT NULL,
	`bytes` integer NOT NULL,
	`created_by` text,
	`reports` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `img_lookup_idx` ON `image_assets` (`recipe_id`,`step_index`,`status`);--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ta` text,
	`name_ml` text,
	`category` text NOT NULL,
	`diet_class` text NOT NULL,
	`avoid_tags` text DEFAULT '[]' NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fibre_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`sugar_alcohol_g` real DEFAULT 0 NOT NULL,
	`allergens` text DEFAULT '[]' NOT NULL,
	`hidden_carb_note` text,
	`cost_per_kg_inr` real NOT NULL,
	`unit_weights` text DEFAULT '{}' NOT NULL,
	`shop_unit` text DEFAULT 'g' NOT NULL,
	`shop_pack` real,
	`density_g_per_ml` real,
	`pantry_staple` integer DEFAULT false NOT NULL,
	`nutrition_source` text NOT NULL,
	`validation_status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`slot` text NOT NULL,
	`recipe_id` text,
	`plan_item_id` text,
	`title` text NOT NULL,
	`portion` real NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`net_carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`fibre_g` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `meal_logs_user_date_idx` ON `meal_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `meal_plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`slot` text NOT NULL,
	`recipe_id` text NOT NULL,
	`portion` real NOT NULL,
	`swaps` text DEFAULT '[]' NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`plan_id`) REFERENCES `meal_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `items_plan_day_idx` ON `meal_plan_items` (`plan_id`,`day_index`);--> statement-breakpoint
CREATE TABLE `meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`days` integer NOT NULL,
	`start_date` text NOT NULL,
	`plan_style` text NOT NULL,
	`targets` text NOT NULL,
	`status` text NOT NULL,
	`is_favourite` integer DEFAULT false NOT NULL,
	`seed` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plans_user_idx` ON `meal_plans` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`date_of_birth` text,
	`age_years` integer,
	`sex_for_equation` text,
	`height_cm` real,
	`weight_kg` real,
	`target_weight_kg` real,
	`activity_level` text,
	`diet_preference` text,
	`cuisines` text DEFAULT '[]' NOT NULL,
	`regional_notes` text,
	`allergies` text DEFAULT '[]' NOT NULL,
	`avoid_foods` text DEFAULT '[]' NOT NULL,
	`conditions` text DEFAULT '[]' NOT NULL,
	`pregnancy_status` text,
	`medical_notes` text,
	`cooking_time_min` integer,
	`equipment` text DEFAULT '[]' NOT NULL,
	`budget_inr` integer,
	`budget_period` text,
	`meal_slots` text DEFAULT '[]' NOT NULL,
	`plan_style` text,
	`net_carb_limit_g` integer,
	`pace` text,
	`household_size` integer DEFAULT 1 NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`transliteration` integer DEFAULT false NOT NULL,
	`voice_id` text,
	`narration_rate` real DEFAULT 1 NOT NULL,
	`units` text DEFAULT 'kitchen' NOT NULL,
	`water_goal_ml` integer,
	`keep_awake` integer DEFAULT true NOT NULL,
	`voice_commands` integer DEFAULT false NOT NULL,
	`onboarding_completed_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recent_views` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`viewed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`position` integer NOT NULL,
	`ingredient_id` text NOT NULL,
	`grams` real NOT NULL,
	`measure_text` text,
	`prep_note` text,
	`optional` integer DEFAULT false NOT NULL,
	`to_taste` integer DEFAULT false NOT NULL,
	`group_name` text,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ri_recipe_idx` ON `recipe_ingredients` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `ri_ingredient_idx` ON `recipe_ingredients` (`ingredient_id`);--> statement-breakpoint
CREATE TABLE `recipe_steps` (
	`recipe_id` text NOT NULL,
	`step_index` integer NOT NULL,
	`title` text NOT NULL,
	`text` text NOT NULL,
	`kind` text NOT NULL,
	`timer_sec` integer,
	`temp_c` integer,
	`heat` text,
	`uses` text DEFAULT '[]' NOT NULL,
	`visual` text NOT NULL,
	`equipment` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`recipe_id`, `step_index`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe_substitutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`substitute_id` text,
	`ratio` real DEFAULT 1 NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`substitute_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rs_recipe_idx` ON `recipe_substitutions` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `recipe_translations` (
	`recipe_id` text NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`content_hash` text NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`recipe_id`, `lang`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`cuisine` text NOT NULL,
	`region` text,
	`meal_types` text NOT NULL,
	`course` text NOT NULL,
	`diet_type` text NOT NULL,
	`tags` text NOT NULL,
	`servings` integer NOT NULL,
	`prep_min` integer NOT NULL,
	`cook_min` integer NOT NULL,
	`rest_min` integer DEFAULT 0 NOT NULL,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`equipment` text NOT NULL,
	`storage` text,
	`reheating` text,
	`allergens` text NOT NULL,
	`serving_grams` real NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fibre_g` real NOT NULL,
	`net_carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`cost_per_serving_inr` real NOT NULL,
	`nutrition_source` text NOT NULL,
	`nutrition_status` text NOT NULL,
	`is_keto` integer NOT NULL,
	`is_low_carb` integer NOT NULL,
	`is_high_protein` integer NOT NULL,
	`provenance` text NOT NULL,
	`validation_status` text NOT NULL,
	`validation_notes` text DEFAULT '[]' NOT NULL,
	`content_hash` text NOT NULL,
	`search_text` text NOT NULL,
	`palette` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipes_diet_idx` ON `recipes` (`diet_type`);--> statement-breakpoint
CREATE INDEX `recipes_cuisine_idx` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE INDEX `recipes_status_idx` ON `recipes` (`validation_status`);--> statement-breakpoint
CREATE INDEX `recipes_kcal_idx` ON `recipes` (`kcal`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `shopping_state` (
	`plan_id` text NOT NULL,
	`week_index` integer NOT NULL,
	`ingredient_id` text NOT NULL,
	`have_at_home` integer DEFAULT false NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`plan_id`, `week_index`, `ingredient_id`),
	FOREIGN KEY (`plan_id`) REFERENCES `meal_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage_counters` (
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`day` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `feature`, `day`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`password_hash` text,
	`display_name` text,
	`is_guest` integer DEFAULT true NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`premium_until` integer,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_active_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `water_logs` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`ml` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weight_user_date_uq` ON `weight_logs` (`user_id`,`date`);