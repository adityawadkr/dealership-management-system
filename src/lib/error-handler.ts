import { toast } from "sonner"

export type ErrorType = 
  | "network"
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "server"
  | "unknown"

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  statusCode?: number
}

/**
 * Centralized error handler for the application
 */
export class ErrorHandler {
  /**
   * Handle API errors and display appropriate messages
   */
  static handleApiError(error: any, customMessage?: string): AppError {
    console.error("API Error:", error)

    // Network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const appError: AppError = {
        type: "network",
        message: customMessage || "Network error. Please check your connection.",
      }
      toast.error(appError.message)
      return appError
    }

    // HTTP errors
    if (error.status) {
      const statusCode = error.status
      let type: ErrorType = "unknown"
      let message = customMessage || "An error occurred"

      if (statusCode === 401) {
        type = "authentication"
        message = customMessage || "Please log in to continue"
      } else if (statusCode === 403) {
        type = "authorization"
        message = customMessage || "You don't have permission to perform this action"
      } else if (statusCode === 404) {
        type = "not_found"
        message = customMessage || "Resource not found"
      } else if (statusCode === 422) {
        type = "validation"
        message = customMessage || "Invalid data provided"
      } else if (statusCode >= 500) {
        type = "server"
        message = customMessage || "Server error. Please try again later."
      }

      const appError: AppError = {
        type,
        message,
        statusCode,
        details: error.data || error.message,
      }
      
      toast.error(appError.message)
      return appError
    }

    // Generic errors
    const appError: AppError = {
      type: "unknown",
      message: customMessage || error.message || "An unexpected error occurred",
      details: error,
    }
    
    toast.error(appError.message)
    return appError
  }

  /**
   * Handle form validation errors
   */
  static handleValidationError(errors: Record<string, string>): void {
    const firstError = Object.values(errors)[0]
    if (firstError) {
      toast.error(firstError)
    }
  }

  /**
   * Log errors for debugging (can be extended to send to monitoring service)
   */
  static logError(error: any, context?: string): void {
    console.error(`[${context || "Error"}]:`, error)
    
    // In production, you could send to monitoring service like Sentry
    // if (process.env.NODE_ENV === "production") {
    //   // Send to monitoring service
    // }
  }

  /**
   * Handle async operations with error handling
   */
  static async handleAsync<T>(
    promise: Promise<T>,
    errorMessage?: string
  ): Promise<[T | null, AppError | null]> {
    try {
      const data = await promise
      return [data, null]
    } catch (error) {
      const appError = this.handleApiError(error, errorMessage)
      return [null, appError]
    }
  }
}

/**
 * Wrapper for fetch with error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
  errorMessage?: string
): Promise<T> {
  try {
    const token = localStorage.getItem("bearer_token")
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error: any = new Error("HTTP error")
      error.status = response.status
      try {
        error.data = await response.json()
      } catch {
        error.data = await response.text()
      }
      throw error
    }

    return await response.json()
  } catch (error) {
    throw ErrorHandler.handleApiError(error, errorMessage)
  }
}