"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SalesAreaChartProps {
  labels: string[];
  revenue: number[];
  orders: number[];
  height?: number;
  currency?: string;
}

export default function SalesAreaChart({
  labels,
  revenue,
  orders,
  height = 300,
  currency = "$",
}: SalesAreaChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const hasData = revenue.some((v) => v > 0) || orders.some((v) => v > 0);

  if (!mounted) {
    return <div style={{ height }} className="w-full rounded-xl bg-[var(--background-soft)] animate-pulse" />;
  }

  const primaryColor = isDark ? "#60a5fa" : "#2563eb";
  const secondaryColor = isDark ? "#fbbf24" : "#f59e0b";
  const foreColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  const options = {
    chart: {
      type: "line" as const,
      fontFamily: "inherit",
      foreColor,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [primaryColor, secondaryColor],
    stroke: {
      curve: "smooth" as const,
      width: [2, 2],
    },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: "11px", colors: foreColor },
        rotate: 0,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: [
      {
        title: { text: "Revenue", style: { fontSize: "11px", color: foreColor } },
        labels: {
          style: { fontSize: "11px", colors: foreColor },
          formatter: (val: number) => `${currency}${new Intl.NumberFormat("en-US").format(Math.round(val))}`,
        },
      },
      {
        opposite: true,
        title: { text: "Orders", style: { fontSize: "11px", color: foreColor } },
        labels: {
          style: { fontSize: "11px", colors: foreColor },
          formatter: (val: number) => `${Math.round(val)}`,
        },
        forceNiceScale: true,
        min: 0,
      },
    ],
    legend: {
      show: true,
      position: "top" as const,
      horizontalAlign: "right" as const,
      fontSize: "12px",
      labels: { colors: isDark ? "#cbd5e1" : "#475569" },
      markers: { size: 6 },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: {
        formatter: (val: number, opts: { seriesIndex: number }) =>
          opts.seriesIndex === 0
            ? `${currency}${new Intl.NumberFormat("en-US").format(val)}`
            : `${val} orders`,
      },
    },
  };

  const series = [
    { name: "Revenue", type: "area", data: revenue },
    { name: "Orders", type: "line", data: orders },
  ];

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl bg-[var(--background-soft)] flex items-center justify-center text-sm text-[var(--foreground-muted)]"
      >
        No sales yet for this period
      </div>
    );
  }

  return <ApexChart options={options} series={series} type="line" height={height} />;
}