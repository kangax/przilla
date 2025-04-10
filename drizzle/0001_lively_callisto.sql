ALTER TABLE `przilla_score` ADD `time_seconds` integer;--> statement-breakpoint
ALTER TABLE `przilla_score` ADD `reps` integer;--> statement-breakpoint
ALTER TABLE `przilla_score` ADD `load` integer;--> statement-breakpoint
ALTER TABLE `przilla_score` ADD `rounds_completed` integer;--> statement-breakpoint
ALTER TABLE `przilla_score` ADD `partial_reps` integer;--> statement-breakpoint
ALTER TABLE `przilla_score` DROP COLUMN `score_value`;