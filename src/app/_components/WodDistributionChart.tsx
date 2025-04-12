"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type WodTag, type WodCategory } from "~/types/wodTypes";

type WodDistributionChartProps = {
  tagData: { name: WodTag; value: number }[];
  categoryData: { name: WodCategory; value: number }[];
  isDemo?: boolean;
};

export default function WodDistributionChart({
  tagData,
  categoryData,
  isDemo = false,
}: WodDistributionChartProps) {
  return (
    <div className={`h-[400px] ${isDemo ? "opacity-80" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={tagData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
