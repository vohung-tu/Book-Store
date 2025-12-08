import * as crypto from 'crypto';

export function generateSignature(data: any, checksumKey: string): string {
  const sortedKeys = Object.keys(data).sort();
  const signData = sortedKeys.map((key) => `${key}=${data[key]}`).join('&');

  return crypto
    .createHmac('sha256', checksumKey)
    .update(signData)
    .digest('hex');
}