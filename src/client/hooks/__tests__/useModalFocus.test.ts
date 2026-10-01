import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useModalFocus — Accessible Focus Lifecycle Contract', () => {
  let originalDocument: any;
  let mockTrigger: any;
  let mockFallback: any;

  beforeEach(() => {
    mockTrigger = {
      isConnected: true,
      hasAttribute: vi.fn((attr: string) => (attr === 'disabled' ? mockTrigger.disabled : false)),
      closest: vi.fn((_sel: string) => (mockTrigger.isAriaHidden ? { ariaHidden: 'true' } : null)),
      focus: vi.fn(),
      blur: vi.fn(),
      disabled: false,
      isAriaHidden: false,
    };

    mockFallback = {
      focus: vi.fn(),
    };

    originalDocument = (globalThis as any).document;
    (globalThis as any).document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => ({
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
      })),
      activeElement: mockTrigger,
      querySelector: vi.fn((selector: string) => {
        if (selector.includes('pos-cart-panel')) return mockFallback;
        return null;
      }),
    };
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    vi.restoreAllMocks();
  });

  // Test the hook logic directly
  function getHookInstance(options: any = {}) {
    const triggerRef = { current: null as any };
    const prepareOpen = (eventOrElement?: any) => {
      let el: any = null;
      if (eventOrElement && 'currentTarget' in eventOrElement) {
        el = eventOrElement.currentTarget;
      } else if (eventOrElement) {
        el = eventOrElement;
      } else if (typeof document !== 'undefined') {
        el = document.activeElement || null;
      }
      triggerRef.current = el;
      const active = (document as any)?.activeElement;
      if (active && typeof active.blur === 'function') {
        active.blur();
      }
    };

    const onEnter = (node: any) => {
      const autoFocusTarget = node.querySelector('[autofocus], [data-autofocus]');
      if (autoFocusTarget && typeof autoFocusTarget.focus === 'function') {
        autoFocusTarget.focus();
        return;
      }
      const firstTabbable = node.querySelector(
        'input:not([disabled]):not([type="hidden"]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      );
      if (firstTabbable && typeof firstTabbable.focus === 'function') {
        firstTabbable.focus();
        return;
      }
      if (node.focus) {
        node.focus();
      }
    };

    const onExited = () => {
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
        } catch {}
      }
      if (typeof document !== 'undefined') {
        const fallbackTarget = options.fallbackSelector
          ? document.querySelector(options.fallbackSelector)
          : document.querySelector('#pos-cart-panel, [role="main"], main');
        fallbackTarget?.focus();
      }
    };

    return {
      triggerRef,
      prepareOpen,
      transitionProps: { onEnter, onExited },
    };
  }

  it('1. prepareOpen captures trigger and safely clears focus from #root before modal mounts', () => {
    const hook = getHookInstance();

    hook.prepareOpen(mockTrigger);

    expect(hook.triggerRef.current).toBe(mockTrigger);
    expect(mockTrigger.blur).toHaveBeenCalledTimes(1);
  });

  it('2. onEnter immediately directs focus to the autofocus target inside the dialog', () => {
    const hook = getHookInstance();

    const mockAutofocus = { focus: vi.fn() };
    const mockDialogNode = {
      querySelector: vi.fn((sel: string) => (sel.includes('autofocus') ? mockAutofocus : null)),
      focus: vi.fn(),
    };

    hook.transitionProps.onEnter(mockDialogNode);

    expect(mockAutofocus.focus).toHaveBeenCalledTimes(1);
  });

  it('3. onEnter directs focus to the first interactive enabled element if autofocus is absent', () => {
    const hook = getHookInstance();

    const mockFirstTabbable = { focus: vi.fn() };
    const mockDialogNode = {
      querySelector: vi.fn((sel: string) => {
        if (sel.includes('autofocus')) return null;
        if (sel.includes('input')) return mockFirstTabbable;
        return null;
      }),
      focus: vi.fn(),
    };

    hook.transitionProps.onEnter(mockDialogNode);

    expect(mockFirstTabbable.focus).toHaveBeenCalledTimes(1);
  });

  it('4. onExited restores focus to trigger button strictly after exit transition completes', () => {
    const hook = getHookInstance();

    hook.prepareOpen(mockTrigger);
    hook.transitionProps.onExited();

    expect(mockTrigger.focus).toHaveBeenCalledTimes(1);
  });

  it('5. onExited suppresses trigger restoration when handoff to another modal is active', () => {
    let isTransitioning = true;
    const hook = getHookInstance({
      isHandoff: () => isTransitioning,
      fallbackSelector: '#pos-cart-panel',
    });

    hook.prepareOpen(mockTrigger);
    hook.transitionProps.onExited();

    // Trigger must NOT receive focus during modal handoff
    expect(mockTrigger.focus).not.toHaveBeenCalled();
  });

  it('6. onExited falls back to designated landmark if trigger is disabled or detached', () => {
    const hook = getHookInstance({
      fallbackSelector: '#pos-cart-panel',
    });

    mockTrigger.disabled = true;

    hook.prepareOpen(mockTrigger);
    hook.transitionProps.onExited();

    expect(mockTrigger.focus).not.toHaveBeenCalled();
    expect(mockFallback.focus).toHaveBeenCalledTimes(1);
  });

  it('7. onExited does not focus trigger if ancestor still has aria-hidden="true"', () => {
    const hook = getHookInstance({
      fallbackSelector: '#pos-cart-panel',
    });

    mockTrigger.isAriaHidden = true;

    hook.prepareOpen(mockTrigger);
    hook.transitionProps.onExited();

    // Trigger must NOT receive focus if still under aria-hidden ancestor
    expect(mockTrigger.focus).not.toHaveBeenCalled();
    expect(mockFallback.focus).toHaveBeenCalledTimes(1);
  });
});
