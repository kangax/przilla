CREATE TABLE `przilla_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `przilla_user_favorite_wod` (
	`user_id` text NOT NULL,
	`wod_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `wod_id`),
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wod_id`) REFERENCES `przilla_wod`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_wod_movement` (
	`wod_id` text NOT NULL,
	`movement_id` text NOT NULL,
	PRIMARY KEY(`wod_id`, `movement_id`),
	FOREIGN KEY (`wod_id`) REFERENCES `przilla_wod`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movement_id`) REFERENCES `przilla_movement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX IF EXISTS `przilla_wod_wod_url_unique`;--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Set not null to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `przilla_wod` ADD `timecap` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_movement_name_unique` ON `przilla_movement` (`name`);--> statement-breakpoint
CREATE INDEX `movement_name_idx` ON `przilla_movement` (`name`);--> statement-breakpoint
CREATE INDEX `favorite_user_id_idx` ON `przilla_user_favorite_wod` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorite_wod_id_idx` ON `przilla_user_favorite_wod` (`wod_id`);--> statement-breakpoint
CREATE INDEX `wod_movement_wod_id_idx` ON `przilla_wod_movement` (`wod_id`);--> statement-breakpoint
CREATE INDEX `wod_movement_movement_id_idx` ON `przilla_wod_movement` (`movement_id`);