import { NextResponse } from 'next/server';
import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

// get (or create) our persistent page
async function getPage() {
  if (!browser) {
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  if (!page) {
    page = await browser.newPage();
  }
  // always reload so we get the freshest number
  await page.goto('https://www.believescreener.com/', {
    waitUntil: 'networkidle',
  });
  return page;
}

export async function GET() {
  try {
    const page = await getPage();

    // wait up to 10s for the span to go from "0" → real value
    await page.waitForFunction(
      () => {
        const el = document.querySelector(
          'body > div > header > div > div > div > span'
        );
        return el?.textContent?.trim() !== '0';
      },
      { timeout: 10_000 }
    );

    // now grab it
    const viewCountText = await page.$eval(
      'body > div > header > div > div > div > span',
      (el) => el.textContent?.trim() || ''
    );

    const viewCount = parseInt(viewCountText, 10);
    if (isNaN(viewCount)) {
      throw new Error(`Could not parse "${viewCountText}"`);
    }

    return NextResponse.json({ viewCount });
  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json(
      { error: 'Failed to scrape live view count' },
      { status: 500 }
    );
  }
}
