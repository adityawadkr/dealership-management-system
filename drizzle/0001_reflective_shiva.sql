CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer` text NOT NULL,
	`vehicle` text NOT NULL,
	`date` text NOT NULL,
	`service_type` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer` text NOT NULL,
	`vehicle` text NOT NULL,
	`quotation_no` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_no` text NOT NULL,
	`appointment_id` integer,
	`technician` text NOT NULL,
	`parts_used` text,
	`notes` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_cards_job_no_unique` ON `job_cards` (`job_no`);--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`customer` text NOT NULL,
	`vehicle` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotations_number_unique` ON `quotations` (`number`);--> statement-breakpoint
CREATE TABLE `service_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer` text NOT NULL,
	`vehicle` text NOT NULL,
	`job_no` text NOT NULL,
	`date` text NOT NULL,
	`amount` text NOT NULL,
	`created_at` integer NOT NULL
);
