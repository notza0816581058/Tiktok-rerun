import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const cookieName = 'live_hub_session';
const secret = () =>
  process.env.SESSION_SECRET || 'local-development-only-change-me-before-deploying';
export function makeSession(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 86400000 })).toString(
    'base64url',
  );
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
export async function currentUser() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() && data.username === (process.env.APP_USERNAME || 'demo')
      ? (data.username as string)
      : null;
  } catch {
    return null;
  }
}
export { cookieName };
