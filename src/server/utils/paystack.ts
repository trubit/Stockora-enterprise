import crypto from 'crypto';

/**
 * Validates Paystack webhook signature using HMAC SHA512
 */
export function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
