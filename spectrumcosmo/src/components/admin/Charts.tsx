// components/admin/Charts.tsx
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export function MonthlySalesChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 10 }} 
          tickMargin={5}
          interval={0}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
          width={40}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `MK${value/1000}k`}
          width={40}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--background-card)',
            borderColor: 'var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'var(--foreground)' }}
        />
        <Legend 
          wrapperStyle={{ 
            fontSize: '11px',
            paddingTop: '8px',
          }}
          iconSize={10}
          iconType="circle"
          verticalAlign="bottom"
          align="center"
          height={36}
        />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="orders" 
          stroke="#F97316" 
          name="Orders" 
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="revenue" 
          stroke="#3B82F6" 
          name="Revenue (MK)" 
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
