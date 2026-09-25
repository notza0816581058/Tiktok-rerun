import { NextResponse } from 'next/server';
import { cookieName, makeSession } from '@/lib/auth';
export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (
    username !== (process.env.APP_USERNAME || 'demo') ||
    password !== (process.env.APP_PASSWORD || 'demo1234')
  ) {
    return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, makeSession(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 86400,
  });
  return response;
}
