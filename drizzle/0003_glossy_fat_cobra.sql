CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` text NOT NULL,
	`check_in` text,
	`check_out` text,
	`status` text DEFAULT 'present' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`module` text NOT NULL,
	`record_id` integer,
	`record_type` text,
	`changes_json` text,
	`ip_address` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_segment` text,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`interaction_type` text NOT NULL,
	`notes` text,
	`contacted_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`pincode` text,
	`pan` text,
	`aadhar` text,
	`gstin` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` integer NOT NULL,
	`vehicle_vin` text,
	`rto_status` text DEFAULT 'pending' NOT NULL,
	`rto_number` text,
	`insurance_status` text DEFAULT 'pending' NOT NULL,
	`insurance_policy` text,
	`qc_status` text DEFAULT 'pending' NOT NULL,
	`qc_notes` text,
	`handover_date` text,
	`documents_json` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deliveries_booking_id_unique` ON `deliveries` (`booking_id`);--> statement-breakpoint
CREATE TABLE `diagnostics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_card_id` integer NOT NULL,
	`issue_description` text NOT NULL,
	`findings` text,
	`recommendations` text,
	`technician_id` integer,
	`completed_at` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_card_id`) REFERENCES `job_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`technician_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`employee_code` text NOT NULL,
	`name` text NOT NULL,
	`designation` text NOT NULL,
	`department` text NOT NULL,
	`branch` text,
	`date_of_joining` text NOT NULL,
	`salary` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_code_unique` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`type` text NOT NULL,
	`customer_id` integer,
	`reference_id` integer,
	`reference_type` text,
	`amount` integer NOT NULL,
	`tax_amount` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`due_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_date` text NOT NULL,
	`account_type` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`debit_amount` integer DEFAULT 0 NOT NULL,
	`credit_amount` integer DEFAULT 0 NOT NULL,
	`balance` integer NOT NULL,
	`reference_type` text,
	`reference_id` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`booking_id` integer,
	`bank_name` text NOT NULL,
	`loan_amount` integer NOT NULL,
	`interest_rate` integer NOT NULL,
	`tenure_months` integer NOT NULL,
	`emi_amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`applied_date` text NOT NULL,
	`approved_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `loyalty_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`tier` text DEFAULT 'silver' NOT NULL,
	`joined_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loyalty_programs_customer_id_unique` ON `loyalty_programs` (`customer_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`recipient_email` text,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`payment_date` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_mode` text NOT NULL,
	`transaction_id` text,
	`bank_name` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`basic_salary` integer NOT NULL,
	`allowances` integer NOT NULL,
	`deductions` integer NOT NULL,
	`net_salary` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_number` text NOT NULL,
	`vendor_id` integer NOT NULL,
	`items_json` text NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`ordered_date` text,
	`expected_delivery_date` text,
	`received_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_po_number_unique` ON `purchase_orders` (`po_number`);--> statement-breakpoint
CREATE TABLE `qa_checkpoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module` text NOT NULL,
	`checkpoint_name` text NOT NULL,
	`description` text,
	`is_mandatory` integer DEFAULT true NOT NULL,
	`display_order` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `service_quotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_number` text NOT NULL,
	`customer_id` integer,
	`vehicle_registration` text,
	`items_json` text NOT NULL,
	`parts_cost` integer NOT NULL,
	`labor_cost` integer NOT NULL,
	`tax_amount` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`valid_until` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_quotations_quotation_number_unique` ON `service_quotations` (`quotation_number`);--> statement-breakpoint
CREATE TABLE `spare_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`part_number` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`reorder_point` integer NOT NULL,
	`vendor_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`location` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spare_parts_part_number_unique` ON `spare_parts` (`part_number`);--> statement-breakpoint
CREATE TABLE `test_drives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`vehicle_id` integer,
	`scheduled_date` text NOT NULL,
	`time_slot` text NOT NULL,
	`license_number` text NOT NULL,
	`license_verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`feedback` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role_id` integer NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_code` text NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`email` text,
	`phone` text,
	`address` text,
	`gstin` text,
	`payment_terms` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_vendor_code_unique` ON `vendors` (`vendor_code`);--> statement-breakpoint
ALTER TABLE `leads` ADD `vehicle_interest` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `budget_range` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `assigned_to` integer REFERENCES employees(id);--> statement-breakpoint
ALTER TABLE `leads` ADD `priority` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `last_contacted` text;