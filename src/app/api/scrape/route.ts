import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import kv from '../../../lib/kv';

let browser: Browser | null = null;
let page: Page | null = null;

async function getPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  if (!page) {
    page = await browser.newPage();
  }
  await page.goto('https://www.believescreener.com/', {
    waitUntil: 'networkidle',
  });
  return page;
}

export async function GET() {
  try {
    const pg = await getPage();

    // wait for the span to appear
    await pg.waitForSelector('body > div > header > div > div > div > span', {
      timeout: 10_000,
    });
    // grab its text
    const raw = await pg.textContent(
      'body > div > header > div > div > div > span'
    );
    const viewCount = parseInt(raw?.trim() || '', 10);
    if (isNaN(viewCount)) {
      throw new Error(`Could not parse "${raw}"`);
    }

    // — Persist into KV as a plain object —
    await kv.lpush('views', {
      timestamp: new Date().toISOString(),
      count: viewCount,
    });
    // Optionally trim to last N points:
    // await kv.ltrim('views', 0, 17280)

    return NextResponse.json({ viewCount });
  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json(
      { error: 'Failed to scrape live view count' },
      { status: 500 }
    );
  }
}
