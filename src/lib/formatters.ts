/**
 * Format currency (INR by default)
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "INR",
  locale: string = "en-IN"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) return "₹0"
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Format date
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" | "full" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return "Invalid date"
  
  if (format === "short") {
    return dateObj.toLocaleDateString("en-IN")
  } else if (format === "long") {
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } else {
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: string | Date,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return "Invalid date"
  
  return dateObj.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

/**
 * Format phone number (Indian format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, "$1 $2")
  }
  
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{5})/, "+$1 $2 $3")
  }
  
  return phone
}

/**
 * Format vehicle registration number
 */
export function formatVehicleNumber(regNumber: string): string {
  const cleaned = regNumber.replace(/\s+/g, "").toUpperCase()
  
  // Format: XX 00 XX 0000
  if (cleaned.length >= 10) {
    return cleaned.replace(/([A-Z]{2})(\d{2})([A-Z]{2})(\d{4})/, "$1 $2 $3 $4")
  }
  
  return regNumber.toUpperCase()
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return `${text.substring(0, length)}...`
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format name (capitalize each word)
 */
export function formatName(name: string): string {
  return name
    .split(" ")
    .map(word => capitalize(word))
    .join(" ")
}