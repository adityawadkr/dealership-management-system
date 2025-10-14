import { toast } from "sonner"

/**
 * Centralized notification service using sonner
 */
export class NotificationService {
  /**
   * Show success notification
   */
  static success(message: string, description?: string): void {
    if (description) {
      toast.success(message, { description })
    } else {
      toast.success(message)
    }
  }

  /**
   * Show error notification
   */
  static error(message: string, description?: string): void {
    if (description) {
      toast.error(message, { description })
    } else {
      toast.error(message)
    }
  }

  /**
   * Show info notification
   */
  static info(message: string, description?: string): void {
    if (description) {
      toast.info(message, { description })
    } else {
      toast.info(message)
    }
  }

  /**
   * Show warning notification
   */
  static warning(message: string, description?: string): void {
    if (description) {
      toast.warning(message, { description })
    } else {
      toast.warning(message)
    }
  }

  /**
   * Show loading notification
   */
  static loading(message: string): string | number {
    return toast.loading(message)
  }

  /**
   * Dismiss a specific notification
   */
  static dismiss(toastId: string | number): void {
    toast.dismiss(toastId)
  }

  /**
   * Show promise-based notification
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ): Promise<T> {
    return toast.promise(promise, messages)
  }

  /**
   * Show notification with custom action
   */
  static withAction(
    message: string,
    action: {
      label: string
      onClick: () => void
    }
  ): void {
    toast(message, {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    })
  }
}

// Export convenience methods
export const notify = {
  success: NotificationService.success,
  error: NotificationService.error,
  info: NotificationService.info,
  warning: NotificationService.warning,
  loading: NotificationService.loading,
  dismiss: NotificationService.dismiss,
  promise: NotificationService.promise,
  withAction: NotificationService.withAction,
}