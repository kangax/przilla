// src/utils/placeholderData.ts

// Type definitions matching chart components
type ChartDataPoint = {
  name: string;
  value: number;
};

type FrequencyDataPoint = {
  month: string; // YYYY-MM format
  count: number;
};

type PerformanceDataPoint = {
  month: string; // YYYY-MM format
  averageLevel: number; // 0-4 scale
};

/**
 * Generates placeholder data for the WodDistributionChart (Radar Chart).
 * @param names - An array of strings (e.g., tag names or category names).
 * @param minVal - Minimum random value.
 * @param maxVal - Maximum random value.
 * @returns An array of ChartDataPoint objects with random values.
 */
export function generatePlaceholderDistributionData(
  names: string[],
  minVal = 5,
  maxVal = 50,
): ChartDataPoint[] {
  return names.map((name) => ({
    name,
    // Generate a random integer between minVal and maxVal
    value: Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal,
  }));
}

/**
 * Generates placeholder data for the WodTimelineChart.
 * @param monthsCount - Number of past months to generate data for.
 * @returns An object containing frequencyData and performanceData arrays.
 */
export function generatePlaceholderTimelineData(monthsCount = 24): {
  frequencyData: FrequencyDataPoint[];
  performanceData: PerformanceDataPoint[];
} {
  const frequencyData: FrequencyDataPoint[] = [];
  const performanceData: PerformanceDataPoint[] = [];
  const today = new Date();
  let currentLevel = 1.5; // Start level (Beginner+)

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthString = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;

    // --- Frequency Data ---
    // Random count between 0 and 15
    const randomCount = Math.floor(Math.random() * 16);
    frequencyData.push({ month: monthString, count: randomCount });

    // --- Performance Data ---
    // Simulate gradual increase with noise, capped at 4.0
    // Increase base level slightly over time
    const baseIncrease = (monthsCount - i) * (1.5 / monthsCount); // Gradual increase towards +1.5 over the period
    // Add random fluctuation (-0.3 to +0.3)
    const noise = (Math.random() - 0.5) * 0.6;
    currentLevel = Math.max(
      1.0, // Minimum level
      Math.min(4.0, 1.5 + baseIncrease + noise), // Apply increase and noise, cap at 4.0
    );

    performanceData.push({ month: monthString, averageLevel: currentLevel });
  }

  return { frequencyData, performanceData };
}
