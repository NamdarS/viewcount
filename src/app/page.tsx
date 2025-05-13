'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch('/api/scrape');
        const json = await res.json();
        if (!cancelled && typeof json.viewCount === 'number') {
          setCount(json.viewCount);
        }
      } catch (err) {
        console.error(err);
      }
    }

    // fetch immediately, then every 5s
    fetchCount();
    const id = setInterval(fetchCount, 5_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Live View Count</h1>
      {count === null ? (
        <p>Loading…</p>
      ) : (
        <p style={{ fontSize: '4rem', margin: '1rem 0' }}>{count}</p>
      )}
    </main>
  );
}
