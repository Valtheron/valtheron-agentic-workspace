// MFA (TOTP) Service — Phase 4 Security
import * as OTPAuth from 'otpauth';
import crypto from 'crypto';

const ISSUER = 'Valtheron';

export interface MFASetupResult {
  secret: string;
  uri: string;
  qrDataUrl: string;
  backupCodes: string[];
}

/** Generate a new TOTP secret and provisioning URI for a user. */
export async function generateMFASetup(username: string): Promise<MFASetupResult> {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  const uri = totp.toString();
  const secret = totp.secret.base32;

  // Generate QR code as data URL
  let qrDataUrl = '';
  try {
    const QRCode = await import('qrcode');
    qrDataUrl = await QRCode.toDataURL(uri);
  } catch {
    // QR generation is optional; the secret string is sufficient
  }

  // Generate 10 single-use backup codes
  const backupCodes = generateBackupCodes(10);

  return { secret, uri, qrDataUrl, backupCodes };
}

/** Validate a TOTP code against a stored secret. Window allows +-1 period drift. */
export function validateTOTP(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // delta is null when invalid, otherwise the time-step difference
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

/** Generate single-use backup codes (8-char hex strings). */
export function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/** Hash a backup code for safe storage. */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

/** Check whether a provided backup code matches any stored (hashed) code. Returns the index or -1. */
export function matchBackupCode(code: string, hashedCodes: string[]): number {
  const hashed = hashBackupCode(code);
  return hashedCodes.indexOf(hashed);
}
