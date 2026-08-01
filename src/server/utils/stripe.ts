import crypto from 'crypto';

/**
 * Validates Stripe webhook signature using HMAC SHA256
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));

  if (!tPart || !v1Part) return false;

  const timestamp = tPart.split('=')[1];
  const signature = v1Part.split('=')[1];

  // Protect against replay attacks (e.g. 5 minutes tolerance limit)
  const tolerance = 300; // 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - Number(timestamp)) > tolerance) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const hash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  return hash === signature;
}
export default verifyStripeSignature;
