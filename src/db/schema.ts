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
  vehicleInterest: text('vehicle_interest'),
  budgetRange: text('budget_range'),
  assignedTo: integer('assigned_to').references(() => employees.id, { onDelete: 'set null' }),
  priority: text('priority').notNull().default('medium'),
  lastContacted: text('last_contacted'),
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

// RBAC Tables
export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
});

export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
});

export const userRoles = sqliteTable('user_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id'),
  department: text('department'),
  createdAt: integer('created_at').notNull(),
});

export const rolePermissions = sqliteTable('role_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
});

// Test Drive Module
export const testDrives = sqliteTable('test_drives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  requestedDate: text('requested_date').notNull(),
  slotTime: text('slot_time').notNull(),
  status: text('status').notNull(),
  driverLicenseVerified: integer('driver_license_verified', { mode: 'boolean' }).notNull(),
  feedback: text('feedback'),
  rating: integer('rating'),
  assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const testDriveDocuments = sqliteTable('test_drive_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  testDriveId: integer('test_drive_id').notNull().references(() => testDrives.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),
  documentUrl: text('document_url').notNull(),
  verifiedBy: text('verified_by').references(() => user.id, { onDelete: 'set null' }),
  verifiedAt: integer('verified_at'),
  createdAt: integer('created_at').notNull(),
});

// Enhanced Booking & Delivery
export const deliverySchedule = sqliteTable('delivery_schedule', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingId: integer('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  rtoStatus: text('rto_status').notNull(),
  rtoNumber: text('rto_number'),
  insuranceStatus: text('insurance_status').notNull(),
  insurancePolicyNumber: text('insurance_policy_number'),
  vehicleQcStatus: text('vehicle_qc_status').notNull(),
  qcCheckedBy: text('qc_checked_by').references(() => user.id, { onDelete: 'set null' }),
  qcNotes: text('qc_notes'),
  handoverDate: text('handover_date'),
  handoverCompleted: integer('handover_completed', { mode: 'boolean' }).notNull(),
  deliveryExecutive: text('delivery_executive').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insuranceApplications = sqliteTable('insurance_applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingId: integer('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  policyType: text('policy_type').notNull(),
  premiumAmount: integer('premium_amount').notNull(),
  status: text('status').notNull(),
  applicationDate: text('application_date').notNull(),
  approvedDate: text('approved_date'),
  createdAt: integer('created_at').notNull(),
});

// Spare Parts Module
export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  paymentTerms: text('payment_terms').notNull(),
  rating: integer('rating'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const spareParts = sqliteTable('spare_parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  partNumber: text('part_number').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  unitPrice: integer('unit_price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  reorderPoint: integer('reorder_point').notNull(),
  vendorId: integer('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  location: text('location').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poNumber: text('po_number').notNull().unique(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull(),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  orderDate: text('order_date').notNull(),
  expectedDeliveryDate: text('expected_delivery_date').notNull(),
  receivedDate: text('received_date'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poId: integer('po_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  sparePartId: integer('spare_part_id').notNull().references(() => spareParts.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
  receivedQuantity: integer('received_quantity'),
  createdAt: integer('created_at').notNull(),
});

// Service Quotations
export const serviceQuotations = sqliteTable('service_quotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationNumber: text('quotation_number').notNull().unique(),
  customerId: integer('customer_id'),
  vehicleRegistration: text('vehicle_registration').notNull(),
  serviceType: text('service_type').notNull(),
  laborCharges: integer('labor_charges').notNull(),
  partsCharges: integer('parts_charges').notNull(),
  totalAmount: integer('total_amount').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  grandTotal: integer('grand_total').notNull(),
  status: text('status').notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const serviceQuotationItems = sqliteTable('service_quotation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id').notNull().references(() => serviceQuotations.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  itemType: text('item_type').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
  sparePartId: integer('spare_part_id').references(() => spareParts.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

// Finance & Accounting
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  serviceQuotationId: integer('service_quotation_id').references(() => serviceQuotations.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  invoiceType: text('invoice_type').notNull(),
  subtotal: integer('subtotal').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  discount: integer('discount'),
  grandTotal: integer('grand_total').notNull(),
  paymentStatus: text('payment_status').notNull(),
  dueDate: text('due_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paymentId: text('payment_id').notNull().unique(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'restrict' }),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  transactionId: text('transaction_id'),
  paymentDate: text('payment_date').notNull(),
  receivedBy: text('received_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

export const loanApplications = sqliteTable('loan_applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingId: integer('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  loanAmount: integer('loan_amount').notNull(),
  bankName: text('bank_name').notNull(),
  interestRate: integer('interest_rate').notNull(),
  tenureMonths: integer('tenure_months').notNull(),
  status: text('status').notNull(),
  applicationDate: text('application_date').notNull(),
  approvedDate: text('approved_date'),
  createdAt: integer('created_at').notNull(),
});

export const ledgerEntries = sqliteTable('ledger_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryDate: text('entry_date').notNull(),
  accountHead: text('account_head').notNull(),
  transactionType: text('transaction_type').notNull(),
  amount: integer('amount').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: integer('reference_id').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

// CRM & Loyalty
export const customerProfiles = sqliteTable('customer_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  customerCode: text('customer_code').notNull().unique(),
  phone: text('phone').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  dob: text('dob'),
  anniversaryDate: text('anniversary_date'),
  preferredContactMethod: text('preferred_contact_method'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const customerInteractions = sqliteTable('customer_interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customerProfiles.id, { onDelete: 'cascade' }),
  interactionType: text('interaction_type').notNull(),
  subject: text('subject').notNull(),
  notes: text('notes'),
  interactionDate: text('interaction_date').notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  followUpDate: text('follow_up_date'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const marketingCampaigns = sqliteTable('marketing_campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignName: text('campaign_name').notNull(),
  campaignType: text('campaign_type').notNull(),
  targetSegment: text('target_segment'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  budget: integer('budget'),
  status: text('status').notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

export const loyaltyPoints = sqliteTable('loyalty_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customerProfiles.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  transactionType: text('transaction_type').notNull(),
  referenceType: text('reference_type'),
  referenceId: integer('reference_id'),
  description: text('description'),
  transactionDate: text('transaction_date').notNull(),
  createdAt: integer('created_at').notNull(),
});

// Audit & Compliance
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: integer('resource_id'),
  oldValues: text('old_values', { mode: 'json' }),
  newValues: text('new_values', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at').notNull(),
});

export const complianceCheckpoints = sqliteTable('compliance_checkpoints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkpointName: text('checkpoint_name').notNull(),
  module: text('module').notNull(),
  description: text('description'),
  required: integer('required', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull(),
});

export const complianceRecords = sqliteTable('compliance_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkpointId: integer('checkpoint_id').notNull().references(() => complianceCheckpoints.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull(),
  recordId: integer('record_id').notNull(),
  status: text('status').notNull(),
  checkedBy: text('checked_by').references(() => user.id, { onDelete: 'set null' }),
  checkedAt: integer('checked_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
});

// HR & Admin
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  employeeCode: text('employee_code').notNull().unique(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  reportingTo: integer('reporting_to').references(() => employees.id, { onDelete: 'set null' }),
  dateOfJoining: text('date_of_joining').notNull(),
  employmentType: text('employment_type').notNull(),
  salary: integer('salary').notNull(),
  bankAccount: text('bank_account'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  checkInTime: text('check_in_time'),
  checkOutTime: text('check_out_time'),
  workHours: integer('work_hours'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const payroll = sqliteTable('payroll', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  basicSalary: integer('basic_salary').notNull(),
  allowances: integer('allowances'),
  deductions: integer('deductions'),
  netSalary: integer('net_salary').notNull(),
  paymentStatus: text('payment_status').notNull(),
  paymentDate: text('payment_date'),
  createdAt: integer('created_at').notNull(),
});

export const leaveApplications = sqliteTable('leave_applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveType: text('leave_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  daysCount: integer('days_count').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  appliedDate: text('applied_date').notNull(),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  approvedDate: text('approved_date'),
  createdAt: integer('created_at').notNull(),
});

// Enhanced Modules
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull(),
  link: text('link'),
  createdAt: integer('created_at').notNull(),
});

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  referenceType: text('reference_type').notNull(),
  referenceId: integer('reference_id').notNull(),
  documentName: text('document_name').notNull(),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

export const reportsConfig = sqliteTable('reports_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportName: text('report_name').notNull(),
  reportType: text('report_type').notNull(),
  module: text('module').notNull(),
  parameters: text('parameters', { mode: 'json' }),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});