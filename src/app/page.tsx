'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

import type { ChartOptions, ChartData } from 'chart.js';

interface Point {
  timestamp: string;
  count: number;
}

export default function Home() {
  const [live, setLive] = useState<number | null>(null);
  const [history, setHistory] = useState<Point[]>([]);

  // Load stored history once
  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data: Point[]) => setHistory(data))
      .catch(console.error);
  }, []);

  // Poll live count and append to history
  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch('/api/scrape');
        const { viewCount } = await res.json();
        if (cancelled || typeof viewCount !== 'number') return;
        setLive(viewCount);
        setHistory((h) => [
          ...h,
          { timestamp: new Date().toISOString(), count: viewCount },
        ]);
      } catch (err) {
        console.error(err);
      }
    }

    fetchCount();
    const id = setInterval(fetchCount, 5_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Chart.js data & options
  const data: ChartData<'line', { x: string; y: number }[]> = {
    datasets: [
      {
        label: 'View Count',
        data: history.map((p) => ({ x: p.timestamp, y: p.count })),
        fill: false,
        tension: 0.2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Live View Count</h1>
      <p style={{ fontSize: '3rem', textAlign: 'center' }}>
        {live === null ? 'Loading…' : live.toLocaleString()}
      </p>
      <div style={{ maxWidth: 800, margin: '2rem auto' }}>
        <Line data={data} options={options} />
      </div>
    </main>
  );
}
