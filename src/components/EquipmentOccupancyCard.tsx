import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface EquipmentOccupancyCardProps {
  name: string;
  occupiedDays: number;
  year: number;
}

function daysInYear(year: number): number {
  const y = Number(year);
  const leap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  return leap ? 366 : 365;
}

const COLORS = ['#2563eb', '#e5e7eb']; // azul ocupado, cinza livre

export const EquipmentOccupancyCard: React.FC<EquipmentOccupancyCardProps> = ({
  name,
  occupiedDays,
  year,
}) => {
  const total = daysInYear(year);
  const free = Math.max(0, total - occupiedDays);
  const pct = total ? Math.round((occupiedDays / total) * 100) : 0;

  const data = [
    { label: 'Ocupado', value: occupiedDays },
    { label: 'Livre', value: free },
  ];

  return (
    <div className="occ-card">
      <div className="occ-title">{name}</div>
      <div className="occ-chart">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              isAnimationActive={false}
            >
              <Cell fill={COLORS[0]} />
              <Cell fill={COLORS[1]} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="occ-center">
          <div className="occ-pct">{pct}%</div>
          <div className="occ-sub">
            {occupiedDays}/{total} dias
          </div>
        </div>
      </div>
    </div>
  );
};
