"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";

type TimelineDataPoint = {
  month: string;
  count: number;
  averageLevel: number;
};

type WodTimelineChartProps = {
  frequencyData: { month: string; count: number }[];
  performanceData: { month: string; averageLevel: number }[];
  isDemo?: boolean;
};

export default function WodTimelineChart({
  frequencyData,
  performanceData,
  isDemo = false,
}: WodTimelineChartProps) {
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === "dark" ? "#cbd5e1" : "#4b5563";

  // Combine data for the chart
  const chartData = frequencyData.map((freqItem) => {
    const perfItem = performanceData.find((p) => p.month === freqItem.month);
    return {
      month: freqItem.month,
      count: freqItem.count,
      averageLevel: perfItem?.averageLevel ?? 0,
    };
  });

  return (
    <div className={`h-[400px] ${isDemo ? "opacity-80" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" stroke={textColor} tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            stroke="#8884d8"
            label={{
              value: "Workouts",
              angle: -90,
              position: "insideLeft",
              fill: textColor,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            domain={[0, 4]}
            label={{
              value: "Performance",
              angle: 90,
              position: "insideRight",
              fill: textColor,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
              borderColor: resolvedTheme === "dark" ? "#374151" : "#e5e7eb",
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="count"
            name="Workouts"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="averageLevel"
            name="Performance Level"
            stroke="#82ca9d"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
