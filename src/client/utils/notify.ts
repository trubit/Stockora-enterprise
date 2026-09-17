import { toast as rawToast, type ToastOptions, type Renderable } from 'react-hot-toast';

// Cache recent toast messages to prevent duplicate spam within a window (1500ms)
const recentNotifications = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 1500;

function shouldThrottle(message: string): boolean {
  const now = Date.now();
  const lastTime = recentNotifications.get(message);
  if (lastTime && now - lastTime < DEDUPLICATION_WINDOW_MS) {
    return true;
  }
  recentNotifications.set(message, now);
  if (recentNotifications.size > 100) {
    for (const [key, timestamp] of recentNotifications.entries()) {
      if (now - timestamp > DEDUPLICATION_WINDOW_MS * 2) {
        recentNotifications.delete(key);
      }
    }
  }
  return false;
}

/**
 * Normalizes any error object, string, or unknown value into a clean, safe, human-readable message.
 * Never exposes raw MongoDB errors, stack traces, or [object Object].
 */
export function normalizeErrorMessage(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!err) return fallbackMessage;

  if (typeof err === 'string') {
    const cleaned = err.trim();
    if (cleaned.startsWith('Error:')) {
      return cleaned.replace(/^Error:\s*/, '');
    }
    return cleaned || fallbackMessage;
  }

  // Axios or API error structures
  const axiosError = err as {
    response?: {
      status?: number;
      data?:
        | {
            error?:
              { message?: string; details?: unknown; code?: string; status?: number } | string;
            message?: string;
          }
        | string;
    };
    message?: string;
    error?: { message?: string } | string;
    status?: number;
    code?: string;
  };

  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    if (typeof data === 'string') {
      if (data.length < 300 && !data.includes('<!DOCTYPE')) {
        return data;
      }
    } else if (data && typeof data === 'object') {
      if (typeof data.error === 'string') {
        return data.error;
      }
      if (
        data.error &&
        typeof data.error === 'object' &&
        'message' in data.error &&
        typeof data.error.message === 'string'
      ) {
        return data.error.message;
      }
      if (typeof data.message === 'string') {
        return data.message;
      }
    }
  }

  // Direct object with { error: { message: ... } } or { error: string }
  if (axiosError.error) {
    if (typeof axiosError.error === 'string') {
      return axiosError.error;
    }
    if (typeof axiosError.error === 'object' && typeof axiosError.error.message === 'string') {
      return axiosError.error.message;
    }
  }

  // Standard JS Error object
  if (err instanceof Error) {
    if (
      err.message &&
      err.message !== '[object Object]' &&
      !err.message.includes('Network Error')
    ) {
      return err.message;
    }
  }

  // Object with a message property (e.g. { message, status, code, stack })
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
  }

  // Map common HTTP status codes if available
  const status = axiosError.response?.status || axiosError.status;
  if (status === 400) return 'Invalid request. Please verify your inputs.';
  if (status === 401) return 'Session expired or authentication failed. Please sign in again.';
  if (status === 403) return 'Access denied. You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'A conflict occurred. This record may already exist.';
  if (status === 422) return 'Validation failed. Please review your information and try again.';
  if (status === 429) return 'Too many requests. Please slow down and try again shortly.';
  if (status && status >= 500)
    return 'Server error encountered. Our team has been notified. Please try again later.';

  return fallbackMessage;
}

function ReactIsValidElement(obj: unknown): boolean {
  return obj !== null && typeof obj === 'object' && '$$typeof' in (obj as Record<string, unknown>);
}

/**
 * Safely converts any argument intended for toast into a renderable React string/element.
 * Guaranteed to never pass raw plain objects with {message, status, code, stack} into React child positions.
 */
function safeToastContent(message: unknown, fallback?: string): Renderable {
  if (ReactIsValidElement(message)) {
    return message as Renderable;
  }
  if (typeof message === 'string') {
    return message;
  }
  if (typeof message === 'number') {
    return String(message);
  }
  return normalizeErrorMessage(message, fallback);
}

/**
 * Production-ready notification system for Stockora Enterprise.
 * Provides accessible, deduplicated, theme-styled feedback.
 */
export const notify = {
  success: (message: unknown, options?: ToastOptions) => {
    const safeMsg = safeToastContent(message);
    const textKey = typeof safeMsg === 'string' ? safeMsg : 'success';
    if (shouldThrottle(textKey)) return '';
    return rawToast.success(safeMsg, {
      duration: 3500,
      ariaProps: { role: 'status', 'aria-live': 'polite' },
      ...options,
    });
  },

  error: (errOrMessage: unknown, options?: ToastOptions & { fallback?: string }) => {
    const safeMsg = safeToastContent(errOrMessage, options?.fallback);
    const textKey = typeof safeMsg === 'string' ? safeMsg : 'error';
    if (shouldThrottle(textKey)) return '';
    return rawToast.error(safeMsg, {
      duration: 4500,
      ariaProps: { role: 'alert', 'aria-live': 'assertive' },
      ...options,
    });
  },

  warning: (message: unknown, options?: ToastOptions) => {
    const safeMsg = safeToastContent(message);
    const textKey = typeof safeMsg === 'string' ? safeMsg : 'warning';
    if (shouldThrottle(textKey)) return '';
    return rawToast(safeMsg, {
      icon: '⚠️',
      duration: 4000,
      style: {
        borderColor: 'rgba(245, 158, 11, 0.4)',
      },
      ariaProps: { role: 'status', 'aria-live': 'polite' },
      ...options,
    });
  },

  info: (message: unknown, options?: ToastOptions) => {
    const safeMsg = safeToastContent(message);
    const textKey = typeof safeMsg === 'string' ? safeMsg : 'info';
    if (shouldThrottle(textKey)) return '';
    return rawToast(safeMsg, {
      icon: 'ℹ️',
      duration: 3500,
      style: {
        borderColor: 'rgba(59, 130, 246, 0.4)',
      },
      ariaProps: { role: 'status', 'aria-live': 'polite' },
      ...options,
    });
  },

  loading: (message: unknown, options?: ToastOptions) => {
    const safeMsg = safeToastContent(message);
    return rawToast.loading(safeMsg, {
      ariaProps: { role: 'status', 'aria-live': 'polite' },
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    rawToast.dismiss(toastId);
  },
};

// Global monkey-patch / safe wrapper over rawToast to prevent any direct import from crashing React
const safeToast = (message: unknown, opts?: ToastOptions) => {
  return rawToast(safeToastContent(message), opts);
};

safeToast.error = (message: unknown, opts?: ToastOptions) => {
  return rawToast.error(safeToastContent(message), opts);
};

safeToast.success = (message: unknown, opts?: ToastOptions) => {
  return rawToast.success(safeToastContent(message), opts);
};

safeToast.loading = (message: unknown, opts?: ToastOptions) => {
  return rawToast.loading(safeToastContent(message), opts);
};

safeToast.dismiss = (toastId?: string) => {
  return rawToast.dismiss(toastId);
};

safeToast.custom = rawToast.custom;
safeToast.promise = rawToast.promise;
safeToast.remove = rawToast.remove;

export { safeToast as toast };
export default notify;
