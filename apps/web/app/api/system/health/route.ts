import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000';
  try {
    const result = await fetch(new URL('/health/ready', base), { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    const data = await result.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'offline', service: 'api', dependencies: { postgres: 'unavailable', redis: 'unavailable', worker: 'unavailable' } }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
