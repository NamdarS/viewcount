import { NextResponse } from 'next/server';
import kv from '../../../lib/kv';

export async function GET() {
  // newest-first
  const raw = (await kv.lrange('views', 0, -1)) as {
    timestamp: string;
    count: number;
  }[];

  // reverse → oldest-first
  const data = raw.reverse();

  return NextResponse.json(data);
}
