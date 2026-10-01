/**
 * sanitizePrintHtml.ts
 *
 * Ultra-secure, zero-dependency HTML entity encoder for POS print documents.
 * Prevents DOM injection, cross-site scripting (XSS), and parser termination
 * in raw HTML thermal receipts and invoices.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes unsafe characters in customer-facing and tenant strings.
 */
export function sanitizePrintHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_MAP[match] || match);
}

/**
 * Safely parses and formats currency / numeric totals.
 */
export function sanitizeNumber(val: unknown, fallback = 0): number {
  const num = Number(val);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}
