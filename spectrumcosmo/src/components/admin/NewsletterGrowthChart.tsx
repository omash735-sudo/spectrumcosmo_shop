'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function NewsletterGrowthChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/admin/newsletter/stats')
      .then(res => res.json())
      .then(json => setData(json.growth || []))
      .catch(console.error);
  }, []);
  if (data.length === 0) return <p className="text-gray-400">Loading chart...</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="new" fill="#F97316" />
      </BarChart>
    </ResponsiveContainer>
  );
    }
