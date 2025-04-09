CREATE TABLE `przilla_account` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_session` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `przilla_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `przilla_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT (unixepoch()),
	`image` text
);
--> statement-breakpoint
CREATE TABLE `przilla_verification_token` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `przilla_account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `przilla_session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `przilla_verification_token_token_unique` ON `przilla_verification_token` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `vt_token_idx` ON `przilla_verification_token` (`token`);
