CREATE TABLE `przilla_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `przilla_score` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wod_id` text NOT NULL,
	`score_value` text NOT NULL,
	`score_date` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wod_id`) REFERENCES `przilla_wod`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_wod_movement` (
	`wod_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`wod_id`, `movement_id`),
	FOREIGN KEY (`wod_id`) REFERENCES `przilla_wod`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movement_id`) REFERENCES `przilla_movement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_wod` (
	`id` text PRIMARY KEY NOT NULL,
	`wod_url` text,
	`wod_name` text NOT NULL,
	`description` text,
	`benchmarks` text,
	`category` text,
	`tags` text,
	`difficulty` text,
	`difficulty_explanation` text,
	`count_likes` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_movement_name_unique` ON `przilla_movement` (`name`);--> statement-breakpoint
CREATE INDEX `movement_name_idx` ON `przilla_movement` (`name`);--> statement-breakpoint
CREATE INDEX `score_user_id_idx` ON `przilla_score` (`user_id`);--> statement-breakpoint
CREATE INDEX `score_wod_id_idx` ON `przilla_score` (`wod_id`);--> statement-breakpoint
CREATE INDEX `score_date_idx` ON `przilla_score` (`score_date`);--> statement-breakpoint
CREATE INDEX `wm_wod_id_idx` ON `przilla_wod_movement` (`wod_id`);--> statement-breakpoint
CREATE INDEX `wm_movement_id_idx` ON `przilla_wod_movement` (`movement_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_wod_wod_url_unique` ON `przilla_wod` (`wod_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_wod_wod_name_unique` ON `przilla_wod` (`wod_name`);--> statement-breakpoint
CREATE INDEX `wod_name_idx` ON `przilla_wod` (`wod_name`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `przilla_wod` (`category`);
