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

  // 1) Load history once
  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data: Point[]) => setHistory(data))
      .catch(console.error);
  }, []);

  // 2) Poll live + append to history
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

  // 3) Build Chart.js data + options
  const data: ChartData<'line', { x: string; y: number }[]> = {
    datasets: [
      {
        label: 'View Count',
        data: history.map((p) => ({ x: p.timestamp, y: p.count })),
        borderColor: 'rgba(33, 150, 243, 1)', // bright blue line
        backgroundColor: 'rgba(33, 150, 243, 0.2)', // translucent fill under line
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointRadius: 4, // make dots visible
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Views' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  return (
    <main
      style={{ padding: '2rem', background: '#f0f2f5', minHeight: '100vh' }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Live View Count
      </h1>
      <p
        style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '2rem' }}
      >
        {live === null ? 'Loading…' : live.toLocaleString()}
      </p>

      <div
        style={{
          maxWidth: 900,
          height: 500,
          margin: '0 auto',
          background: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Line data={data} options={options} />
      </div>
    </main>
  );
}
