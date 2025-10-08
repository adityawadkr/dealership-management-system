import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vin: text('vin').notNull().unique(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  category: text('category').notNull(),
  color: text('color').notNull(),
  price: integer('price').notNull(),
  stock: integer('stock').notNull(),
  reorderPoint: integer('reorder_point').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  source: text('source').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const quotations = sqliteTable('quotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  number: text('number').notNull().unique(),
  customer: text('customer').notNull(),
  vehicle: text('vehicle').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customer: text('customer').notNull(),
  vehicle: text('vehicle').notNull(),
  quotationNo: text('quotation_no').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customer: text('customer').notNull(),
  vehicle: text('vehicle').notNull(),
  date: text('date').notNull(),
  serviceType: text('service_type').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const jobCards = sqliteTable('job_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobNo: text('job_no').notNull().unique(),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  technician: text('technician').notNull(),
  partsUsed: text('parts_used'),
  notes: text('notes'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const serviceHistory = sqliteTable('service_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customer: text('customer').notNull(),
  vehicle: text('vehicle').notNull(),
  jobNo: text('job_no').notNull(),
  date: text('date').notNull(),
  amount: text('amount').notNull(),
  createdAt: integer('created_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});