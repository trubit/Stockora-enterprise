/**
 * useAlert.ts
 * Centralized Stockora Enterprise Pro notification & alert hook.
 *
 * Provides a single, unified, enterprise-grade interface for:
 * - Success notifications
 * - Error notifications (with safe error normalization, preventing React child crashes)
 * - Warning notifications
 * - Info notifications
 * - Loading / progress notifications
 * - Destructive and non-destructive confirmation dialogs
 */

import { notify, toast, normalizeErrorMessage } from '../utils/notify.ts';
import { useConfirm, type ConfirmOptions } from '../context/ConfirmDialogContext.tsx';

export interface AlertHook {
  /** Centralized toast notifier */
  notify: typeof notify;
  /** Toast instance with safe string normalization */
  toast: typeof toast;
  /** Trigger a success toast */
  success: (message: unknown, options?: Parameters<typeof notify.success>[1]) => string;
  /** Trigger a normalized error toast (safe against raw Error objects or Axios responses) */
  error: (errOrMessage: unknown, options?: Parameters<typeof notify.error>[1]) => string;
  /** Trigger a warning toast */
  warning: (message: unknown, options?: Parameters<typeof notify.warning>[1]) => string;
  /** Trigger an informational toast */
  info: (message: unknown, options?: Parameters<typeof notify.info>[1]) => string;
  /** Trigger an indeterminate loading toast */
  loading: (message: unknown, options?: Parameters<typeof notify.loading>[1]) => string;
  /** Dismiss an active toast by ID */
  dismiss: (id?: string) => void;
  /** Display a modal confirmation dialog */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Safe error normalizer utility */
  normalizeError: typeof normalizeErrorMessage;
}

export function useAlert(): AlertHook {
  const confirm = useConfirm();

  return {
    notify,
    toast,
    success: notify.success,
    error: notify.error,
    warning: notify.warning,
    info: notify.info,
    loading: notify.loading,
    dismiss: notify.dismiss,
    confirm,
    normalizeError: normalizeErrorMessage,
  };
}

export default useAlert;
