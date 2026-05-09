'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export function MonthlySalesChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#F97316" name="Orders" />
        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue (MK)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
