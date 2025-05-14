import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import kv from '../../../lib/kv';

let browser: Browser | null = null;
// const page: Page | null = null;

async function getPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  // always open a fresh page to avoid stale contexts
  const pg = await browser.newPage();
  await pg.goto('https://www.believescreener.com/', {
    waitUntil: 'networkidle',
  });
  return pg;
}

export async function GET() {
  try {
    const pg = await getPage();
    const selector = 'body > div > header > div > div > div > span';

    // 1) wait until the span text is no longer "0"
    await pg.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el?.textContent?.trim() !== '0';
      },
      selector,
      { timeout: 10_000 }
    );

    // 2) grab its real text
    const viewCountText = await pg.$eval(
      selector,
      (el) => el.textContent?.trim() || ''
    );
    const viewCount = parseInt(viewCountText, 10);
    if (isNaN(viewCount)) {
      throw new Error(`Could not parse "${viewCountText}"`);
    }

    // 3) persist only after we have a real number
    await kv.lpush('views', {
      timestamp: new Date().toISOString(),
      count: viewCount,
    });
    // if you want to cap the list length:
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
