import { NextResponse } from 'next/server';
import kv from '../../../lib/kv';

export async function GET() {
  // newest-first
  const raw = await kv.lrange('views', 0, -1);
  // parse & reverse → oldest-first
  const data = (raw as string[])
    .map((s) => JSON.parse(s) as { timestamp: string; count: number })
    .reverse();
  return NextResponse.json(data);
}
