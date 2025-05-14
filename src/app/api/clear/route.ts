import { NextResponse } from 'next/server';
import kv from '../../../lib/kv';

export async function GET() {
  await kv.del('views');
  return NextResponse.json({ ok: true });
}

