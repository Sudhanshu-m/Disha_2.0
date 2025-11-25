CREATE TABLE `application_guidance` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scholarship_id` text NOT NULL,
	`essay_tips` text,
	`checklist` text,
	`improvement_suggestions` text,
	`created_at` text DEFAULT datetime('now') NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `student_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scholarship_id`) REFERENCES `scholarships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scholarship_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scholarship_id` text NOT NULL,
	`match_score` integer NOT NULL,
	`ai_reasoning` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT datetime('now') NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `student_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scholarship_id`) REFERENCES `scholarships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`organization` text NOT NULL,
	`amount` text NOT NULL,
	`deadline` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`tags` text NOT NULL,
	`type` text NOT NULL,
	`eligibility_gpa` text,
	`eligible_fields` text,
	`eligible_levels` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT datetime('now') NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`education_level` text NOT NULL,
	`field_of_study` text NOT NULL,
	`gpa` text,
	`graduation_year` text NOT NULL,
	`skills` text,
	`activities` text,
	`financial_need` text NOT NULL,
	`location` text NOT NULL,
	`created_at` text DEFAULT datetime('now') NOT NULL,
	`updated_at` text DEFAULT datetime('now') NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);