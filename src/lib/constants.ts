/**
 * Application-wide constants
 */

// Roles
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SALES: "sales_executive",
  SERVICE: "service_advisor",
  FINANCE: "finance_manager",
  INVENTORY: "inventory_manager",
  HR: "hr_manager",
} as const

// Lead statuses
export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  PROPOSAL: "proposal",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
} as const

// Booking statuses
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const

// Vehicle conditions
export const VEHICLE_CONDITION = {
  NEW: "new",
  USED: "used",
  CERTIFIED: "certified_pre_owned",
} as const

// Service appointment statuses
export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

// Payment methods
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
  CHEQUE: "cheque",
  EMI: "emi",
} as const

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const

// Invoice statuses
export const INVOICE_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const

// Loan statuses
export const LOAN_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DISBURSED: "disbursed",
} as const

// Campaign types
export const CAMPAIGN_TYPE = {
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  PHONE: "phone_call",
} as const

// Campaign statuses
export const CAMPAIGN_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

// Employee statuses
export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
} as const

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  LEAVE: "leave",
} as const

// QA checkpoint statuses
export const CHECKPOINT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

// Modules
export const MODULES = {
  SALES: "sales",
  SERVICE: "service",
  INVENTORY: "inventory",
  FINANCE: "finance",
  CRM: "crm",
  HR: "hr",
  REPORTS: "reports",
  QA: "qa",
} as const

// Date formats
export const DATE_FORMATS = {
  SHORT: "DD/MM/YYYY",
  LONG: "DD MMM YYYY",
  FULL: "dddd, DD MMMM YYYY",
  WITH_TIME: "DD/MM/YYYY HH:mm",
} as const

// Currency
export const CURRENCY = {
  CODE: "INR",
  SYMBOL: "₹",
  LOCALE: "en-IN",
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    DOCUMENT: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    SPREADSHEET: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  },
} as const

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  VEHICLE_NUMBER_REGEX: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  GST_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
} as const

// API endpoints base paths
export const API_ENDPOINTS = {
  LEADS: "/api/leads",
  TEST_DRIVES: "/api/test-drives",
  QUOTATIONS: "/api/quotations",
  BOOKINGS: "/api/bookings",
  DELIVERIES: "/api/deliveries",
  APPOINTMENTS: "/api/appointments",
  JOB_CARDS: "/api/job-cards",
  SERVICE_QUOTATIONS: "/api/service-quotations",
  SERVICE_HISTORY: "/api/service-history",
  VEHICLES: "/api/vehicles",
  SPARE_PARTS: "/api/spare-parts",
  PURCHASE_ORDERS: "/api/purchase-orders",
  INVOICES: "/api/invoices",
  PAYMENTS: "/api/payments",
  LOANS: "/api/loans",
  LEDGER: "/api/ledger-entries",
  CUSTOMERS: "/api/customers",
  INTERACTIONS: "/api/customer-interactions",
  CAMPAIGNS: "/api/campaigns",
  LOYALTY: "/api/loyalty-programs",
  EMPLOYEES: "/api/employees",
  PAYROLL: "/api/payroll",
  ATTENDANCE: "/api/attendance",
  REPORTS: "/api/reports",
  QA_CHECKPOINTS: "/api/qa-checkpoints",
  AUDIT_LOGS: "/api/audit-logs",
} as const