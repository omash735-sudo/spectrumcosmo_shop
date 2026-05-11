'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function NewsletterStats() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/admin/newsletter/stats')
      .then(res => res.json())
      .then(setData);
  }, []);
  if (!data.length) return <p>Loading stats...</p>;
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
