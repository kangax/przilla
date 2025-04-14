-- Drop old auth tables first
DROP TABLE IF EXISTS `przilla_verification_token`;
DROP TABLE IF EXISTS `przilla_session`;
DROP TABLE IF EXISTS `przilla_account`;
DROP TABLE IF EXISTS `przilla_user`;

-- Create new Better Auth tables (adapted for SQLite)
CREATE TABLE `przilla_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL, -- boolean
	`image` text,
	`created_at` integer NOT NULL, -- timestamp
	`updated_at` integer NOT NULL -- timestamp
);
--> statement-breakpoint
CREATE TABLE `przilla_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL, -- timestamp
	`token` text NOT NULL,
	`created_at` integer NOT NULL, -- timestamp
	`updated_at` integer NOT NULL, -- timestamp
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer, -- timestamp
	`refresh_token_expires_at` integer, -- timestamp
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL, -- timestamp
	`updated_at` integer NOT NULL, -- timestamp
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL, -- timestamp
	`created_at` integer, -- timestamp
	`updated_at` integer -- timestamp
);

-- Create indexes for new tables
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `przilla_account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `przilla_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `przilla_verification` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_session_token_unique` ON `przilla_session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_user_email_unique` ON `przilla_user` (`email`);
