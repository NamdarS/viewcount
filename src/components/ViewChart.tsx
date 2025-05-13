// components/ViewChart.tsx
'use client';
import useSWR from 'swr';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const fetcher = (url: string | URL | Request) => fetch(url).then((r) => r.json());

export default function ViewChart() {
  const { data, error } = useSWR('/api/viewcount', fetcher, {
    refreshInterval: 5000, // re-fetch every 5s
  });

  if (error) return <p>Error loading view count.</p>;
  if (!data) return <p>Loading…</p>;
  if (data.count === null) return <p>Count not found.</p>;

  return (
    <Line
      data={{
        labels: [
          /* you could push timestamps here if you want */
        ],
        datasets: [
          {
            label: 'Current Views',
            data: [data.count], // for a rolling history, you'd manage local state
            fill: false,
          },
        ],
      }}
      options={{
        animation: false,
        scales: {
          x: { display: false },
          y: { beginAtZero: true },
        },
      }}
    />
  );
}
