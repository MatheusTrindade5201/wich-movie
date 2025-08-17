CREATE TABLE `recommended_movies` (
	`id` integer PRIMARY KEY NOT NULL,
	`movie_id` integer NOT NULL,
	`title` text NOT NULL,
	`poster` text,
	`genres` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `watched_movies` (
	`id` integer PRIMARY KEY NOT NULL,
	`movie_id` integer NOT NULL,
	`title` text NOT NULL,
	`poster` text,
	`genres` text,
	`created_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tmdb_api_key` (
	`id` integer PRIMARY KEY NOT NULL,
	`api_key` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tmdb_api_key`("id", "api_key") SELECT "id", "api_key" FROM `tmdb_api_key`;--> statement-breakpoint
DROP TABLE `tmdb_api_key`;--> statement-breakpoint
ALTER TABLE `__new_tmdb_api_key` RENAME TO `tmdb_api_key`;--> statement-breakpoint
PRAGMA foreign_keys=ON;