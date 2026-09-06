"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DonutChartProps {
  labels: string[];
  series: number[];
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS_LIGHT = ["#2563eb", "#f59e0b", "#10b981", "#ef4444"];
const DEFAULT_COLORS_DARK = ["#60a5fa", "#fbbf24", "#34d399", "#f87171"];

export default function DonutChart({ labels, series, colors, height = 240 }: DonutChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const total = series.reduce((a, b) => a + b, 0);

  const hasData = total > 0;
  const displayLabels = hasData ? labels : ["No data"];
  const displaySeries = hasData ? series : [1];
  const palette = hasData
    ? colors ?? (isDark ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT)
    : [isDark ? "#334155" : "#e2e8f0"];

  if (!mounted) {
    return <div style={{ height }} className="w-full rounded-xl bg-[var(--background-soft)] animate-pulse" />;
  }

  const options = {
    chart: {
      type: "donut" as const,
      fontFamily: "inherit",
      foreColor: isDark ? "#94a3b8" : "#64748b",
    },
    labels: displayLabels,
    colors: palette,
    stroke: { show: false },
    dataLabels: {
      enabled: hasData,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: { fontSize: "11px", fontWeight: 700 },
      dropShadow: { enabled: false },
    },
    legend: {
      show: hasData,
      position: "bottom" as const,
      fontSize: "12px",
      labels: { colors: isDark ? "#cbd5e1" : "#475569" },
      markers: { size: 6 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: hasData ? "Total" : "No data",
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: "11px",
              fontWeight: 700,
              formatter: () => (hasData ? new Intl.NumberFormat("en-US").format(total) : "—"),
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 800,
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
          },
        },
      },
    },
    tooltip: { enabled: hasData, theme: isDark ? "dark" : "light" },
  };

  return <ApexChart options={options} series={displaySeries} type="donut" height={height} />;
}