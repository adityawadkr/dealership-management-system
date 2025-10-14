import { VALIDATION } from "./constants"

/**
 * Validation utility functions
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: "Email is required" }
  }
  
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: "Invalid email format" }
  }
  
  return { isValid: true }
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" }
  }
  
  const cleaned = phone.replace(/\D/g, "")
  
  if (!VALIDATION.PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: "Invalid phone number. Must be 10 digits starting with 6-9" }
  }
  
  return { isValid: true }
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" }
  }
  
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters` }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" }
  }
  
  return { isValid: true }
}

/**
 * Validate vehicle registration number
 */
export function validateVehicleNumber(regNumber: string): ValidationResult {
  if (!regNumber) {
    return { isValid: false, error: "Vehicle number is required" }
  }
  
  const cleaned = regNumber.replace(/\s+/g, "").toUpperCase()
  
  if (!VALIDATION.VEHICLE_NUMBER_REGEX.test(cleaned)) {
    return { isValid: false, error: "Invalid vehicle number format (e.g., DL01AB1234)" }
  }
  
  return { isValid: true }
}

/**
 * Validate PAN number
 */
export function validatePAN(pan: string): ValidationResult {
  if (!pan) {
    return { isValid: false, error: "PAN is required" }
  }
  
  if (!VALIDATION.PAN_REGEX.test(pan.toUpperCase())) {
    return { isValid: false, error: "Invalid PAN format (e.g., ABCDE1234F)" }
  }
  
  return { isValid: true }
}

/**
 * Validate GST number
 */
export function validateGST(gst: string): ValidationResult {
  if (!gst) {
    return { isValid: false, error: "GST number is required" }
  }
  
  if (!VALIDATION.GST_REGEX.test(gst.toUpperCase())) {
    return { isValid: false, error: "Invalid GST format" }
  }
  
  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = "Field"): ValidationResult {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  return { isValid: true }
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = "Value"
): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a number` }
  }
  
  if (value < min || value > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` }
  }
  
  return { isValid: true }
}

/**
 * Validate date is in future
 */
export function validateFutureDate(date: Date | string, fieldName: string = "Date"): ValidationResult {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: "Invalid date" }
  }
  
  if (dateObj <= now) {
    return { isValid: false, error: `${fieldName} must be in the future` }
  }
  
  return { isValid: true }
}

/**
 * Validate date is in past
 */
export function validatePastDate(date: Date | string, fieldName: string = "Date"): ValidationResult {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: "Invalid date" }
  }
  
  if (dateObj >= now) {
    return { isValid: false, error: `${fieldName} must be in the past` }
  }
  
  return { isValid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = 5 * 1024 * 1024): ValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2)
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }
  
  return { isValid: true }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Invalid file type" }
  }
  
  return { isValid: true }
}