import { useRef, useCallback, useMemo } from 'react';

export interface UseModalFocusOptions {
  /** Optional fallback selector or element to focus if trigger is detached or disabled */
  fallbackSelector?: string;
  /** Function returning true if this modal is handing off directly to another modal */
  isHandoff?: () => boolean;
}

/**
 * useModalFocus — Deterministic Accessibility & Focus Lifecycle Management for Modal Dialogs.
 *
 * Implements strict WAI-ARIA Authoring Practices 1.2 for modal dialogs:
 * 1. Safe Focus Handoff on Open: Captures trigger reference and clears focus from #root
 *    before MUI ModalManager applies `aria-hidden="true"` to #root, preventing Chromium's
 *    "Blocked aria-hidden on an element because its descendant retained focus" violation.
 * 2. Guaranteed In-Modal Focus: Ensures focus moves to designated target or first tabbable
 *    element inside the dialog upon mount/enter.
 * 3. Deterministic Lifecycle Restoration on Exit: Restores focus to the trigger element
 *    strictly after the exit transition completes (onExited) when MUI has already removed
 *    `aria-hidden="true"` from #root. Validates element connectivity and non-disabled state.
 * 4. Fallback Protection: If trigger is unmounted or disabled, redirects focus to a valid
 *    logical landmark or container.
 */
export function useModalFocus<T extends HTMLElement = HTMLButtonElement>(
  options: UseModalFocusOptions = {}
) {
  const triggerRef = useRef<T | null>(null);

  /**
   * Must be called synchronously in the user interaction handler (onClick, onKeyDown)
   * before setting modal open state to true.
   */
  const prepareOpen = useCallback((eventOrElement?: React.SyntheticEvent | T | null) => {
    let el: T | null = null;
    if (eventOrElement && 'currentTarget' in eventOrElement) {
      el = eventOrElement.currentTarget as unknown as T;
    } else if (eventOrElement instanceof HTMLElement) {
      el = eventOrElement as T;
    } else if (typeof document !== 'undefined') {
      el = document.activeElement as unknown as T | null;
    }

    triggerRef.current = el;

    // Safely transfer focus out of #root before React commit and ModalManager aria-hidden attachment
    if (
      document.activeElement &&
      typeof (document.activeElement as HTMLElement).blur === 'function'
    ) {
      (document.activeElement as HTMLElement).blur();
    }
  }, []);

  /**
   * Attached to Dialog TransitionProps.onEnter
   */
  const onEnter = useCallback((node: HTMLElement) => {
    // Check if an inner element has native autoFocus or is marked initial focus
    const autoFocusTarget = node.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
    if (autoFocusTarget && typeof autoFocusTarget.focus === 'function') {
      autoFocusTarget.focus();
      return;
    }

    // Otherwise find the first interactive, enabled form element
    const firstTabbable = node.querySelector<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
    );
    if (firstTabbable && typeof firstTabbable.focus === 'function') {
      firstTabbable.focus();
      return;
    }

    // Fallback: focus the dialog container safely
    if (node.focus) {
      if (!node.hasAttribute('tabindex')) {
        node.setAttribute('tabindex', '-1');
      }
      node.focus();
    }
  }, []);

  /**
   * Attached to Dialog TransitionProps.onExited
   */
  const onExited = useCallback(() => {
    // If transitioning directly to a secondary modal, suppress trigger restoration
    if (options.isHandoff?.()) {
      return;
    }

    const trigger = triggerRef.current;
    if (
      trigger &&
      trigger.isConnected &&
      !trigger.hasAttribute('disabled') &&
      !trigger.closest('[aria-hidden="true"]')
    ) {
      try {
        trigger.focus();
        return;
      } catch {
        // Fallback below
      }
    }

    // Fallback focus to designated container or main region
    if (typeof document !== 'undefined') {
      const fallbackTarget = options.fallbackSelector
        ? document.querySelector<HTMLElement>(options.fallbackSelector)
        : document.querySelector<HTMLElement>('#pos-cart-panel, [role="main"], main');
      fallbackTarget?.focus();
    }
  }, [options]);

  const transitionProps = useMemo(
    () => ({
      onEnter,
      onExited,
    }),
    [onEnter, onExited]
  );

  return {
    triggerRef,
    prepareOpen,
    transitionProps,
    onEnter,
    onExited,
  };
}
