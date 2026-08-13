CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`song_key` text NOT NULL,
	`song_title` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	`object_key` text,
	`content_type` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminder_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` text NOT NULL,
	`recipient` text NOT NULL,
	`window` text NOT NULL,
	`channel` text NOT NULL,
	`sent_at` text NOT NULL
);
