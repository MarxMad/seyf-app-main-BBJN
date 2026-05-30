"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { TrendingUp, AlertCircle } from "lucide-react";
import { formatMXN } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export type YieldSeriesPoint = {
  date: string;
  accrued_mxn: number;
};

export type YieldTrendChartProps = {
  data?: YieldSeriesPoint[];
  isLoading?: boolean;
  error?: Error | null;
  principal?: number;
};

/**
 * Pure SVG yield-over-time chart for dashboard.
 * Shows smooth line + area chart of accrued yield during active cycle.
 * - Supports light/dark theme via CSS variables
 * - Keyboard accessible: focus + arrow keys to navigate points
 * - Single-point cycles show friendly placeholder
 * - Respects prefers-reduced-motion for pulse animation
 */
export function YieldTrendChart({
  data,
  isLoading = false,
  error = null,
  principal = 0,
}: YieldTrendChartProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const shouldReduce = useReducedMotion();

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!data || data.length === 0) return;

      if (e.key === "ArrowRight" && focusedIndex !== null) {
        e.preventDefault();
        setFocusedIndex(Math.min(focusedIndex + 1, data.length - 1));
      } else if (e.key === "ArrowLeft" && focusedIndex !== null) {
        e.preventDefault();
        setFocusedIndex(Math.max(focusedIndex - 1, 0));
      } else if (e.key === "ArrowRight" && focusedIndex === null) {
        e.preventDefault();
        setFocusedIndex(0);
      }
    },
    [focusedIndex, data],
  );

  if (isLoading) {
    return (
      <div
        data-component="yield-trend-chart"
        className="space-y-2 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Rendimiento en el ciclo</h3>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-component="yield-trend-chart"
        className="rounded-lg border border-border bg-card p-4"
      >
        <Empty className="border-0 p-0">
          <EmptyMedia variant="icon">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </EmptyMedia>
          <EmptyHeader>
            <h3 className="text-sm font-semibold">Error al cargar</h3>
            <p className="text-xs text-muted-foreground">
              No pudimos mostrar tu rendimiento. Intenta más tarde.
            </p>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Single point or no data: show placeholder
  if (!data || data.length < 2) {
    return (
      <div
        data-component="yield-trend-chart"
        className="rounded-lg border border-dashed border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Rendimiento en el ciclo</h3>
        </div>
        <Empty className="border-0 p-0">
          <EmptyMedia variant="icon">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <p className="text-sm text-muted-foreground">
              Vuelve mañana para ver tu primer punto
            </p>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  const resolved = resolvedTheme || theme || "light";
  const isDark = resolved === "dark";

  // SVG dimensions
  const width = 350;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxAccrued = Math.max(...data.map((p) => p.accrued_mxn), 1);
  const xScale = chartWidth / (data.length - 1 || 1);
  const yScale = chartHeight / maxAccrued;

  // Generate path for line
  const points = data.map((point, idx) => ({
    x: padding.left + idx * xScale,
    y: padding.top + chartHeight - point.accrued_mxn * yScale,
    ...point,
  }));

  // Smooth curve path using cubic Bézier
  const pathD = points
    .map((pt, idx) => {
      if (idx === 0) {
        return `M ${pt.x} ${pt.y}`;
      }
      const prev = points[idx - 1];
      const cpx1 = (prev.x + pt.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = (prev.x + pt.x) / 2;
      const cpy2 = pt.y;
      return `C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${pt.x} ${pt.y}`;
    })
    .join(" ");

  // Area path (line + baseline)
  const areaD = `${pathD} L ${padding.left + (data.length - 1) * xScale} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [0, maxAccrued / 2, maxAccrued].map((val) => ({
    value: val,
    label: formatMXN(val),
    y: padding.top + chartHeight - val * yScale,
  }));

  const yTickStyle = "text-xs text-muted-foreground";
  const lineColor = isDark
    ? "rgb(134 239 172)" // green-400
    : "rgb(34 197 94)"; // green-600
  const areaColor = isDark
    ? "rgba(134 239 172 0.1)" // green-400 with opacity
    : "rgba(34 197 94 0.1)"; // green-600 with opacity
  const gridColor = isDark ? "rgb(55 65 81)" : "rgb(229 231 235)"; // gray-700 / gray-200

  const lastPoint = points[points.length - 1];

  return (
    <div
      data-component="yield-trend-chart"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Rendimiento en el ciclo</h3>
        </div>
        {principal > 0 && (
          <span className="text-xs text-muted-foreground">
            Capital: {formatMXN(principal)}
          </span>
        )}
      </div>

      <div
        className="relative rounded-md bg-muted/30 p-2 overflow-x-auto"
        style={
          {
            "--color-yield": lineColor,
            "--color-yield-light": areaColor,
            "--color-grid": gridColor,
          } as React.CSSProperties
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="w-full h-auto max-w-full"
          role="region"
          aria-label="Gráfico de rendimiento durante este ciclo"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Grid lines */}
          {yTicks.map((tick, idx) => (
            <line
              key={`grid-${idx}`}
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke={gridColor}
              strokeDasharray="4 4"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding.left - 4}
            y1={padding.top}
            x2={padding.left - 4}
            y2={padding.top + chartHeight}
            stroke={gridColor}
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {yTicks.map((tick, idx) => (
            <text
              key={`y-label-${idx}`}
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="12"
              fill={isDark ? "rgb(156 163 175)" : "rgb(107 114 128)"}
              className={yTickStyle}
            >
              {tick.label}
            </text>
          ))}

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight + 4}
            x2={width - padding.right}
            y2={padding.top + chartHeight + 4}
            stroke={gridColor}
            strokeWidth="1"
          />

          {/* X-axis labels (first, middle, last) */}
          {data.map((point, idx) => {
            // Show labels for first, middle, and last points
            const shouldShow =
              idx === 0 ||
              idx === data.length - 1 ||
              idx === Math.floor(data.length / 2);
            if (!shouldShow) return null;

            const pt = points[idx];
            const dayNum = idx + 1;
            return (
              <text
                key={`x-label-${idx}`}
                x={pt.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill={isDark ? "rgb(156 163 175)" : "rgb(107 114 128)"}
              >
                Día {dayNum}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={areaColor} />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point circles (focusable) */}
          {points.map((pt, idx) => {
            const isLast = idx === points.length - 1;
            const isFocused = focusedIndex === idx;
            const isHovered = hoveredIndex === idx;
            const isActive = isFocused || isHovered;

            return (
              <g key={`point-${idx}`}>
                {/* Invisible larger circle for hover/focus target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="8"
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => {
                    setHoveredIndex(idx);
                    setTooltipPos({ x: pt.x, y: pt.y });
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setTooltipPos(null);
                  }}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  tabIndex={idx === 0 ? 0 : -1}
                  role="button"
                  aria-label={`Día ${idx + 1}: ${formatMXN(pt.accrued_mxn)} acumulado`}
                />

                {/* Visible point circle */}
                {isLast ? (
                  // Final point with pulse animation
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 5 : 3.5}
                    fill={lineColor}
                    animate={
                      shouldReduce
                        ? {}
                        : {
                            scale: [1, 1.3, 1],
                          }
                    }
                    transition={
                      shouldReduce
                        ? {}
                        : {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                  />
                ) : (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 4 : 2.5}
                    fill={lineColor}
                    style={{
                      transition: "r 0.2s ease-out",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {(focusedIndex !== null || hoveredIndex !== null) && (
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-10 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md",
              "transition-opacity duration-150 ease-out",
            )}
            style={{
              left: `${(points[focusedIndex ?? hoveredIndex!].x / width) * 100}%`,
              top: `${(points[focusedIndex ?? hoveredIndex!].y / height) * 100 - 10}%`,
              transform: "translate(-50%, -100%)",
              opacity: focusedIndex !== null || hoveredIndex !== null ? 1 : 0,
            }}
          >
            <div>Día {(focusedIndex ?? hoveredIndex ?? 0) + 1}</div>
            <div className="font-bold">
              {formatMXN(data[focusedIndex ?? hoveredIndex ?? 0].accrued_mxn)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
            <span>Rendimiento acumulado</span>
          </div>
        </div>
        {data.length > 1 && (
          <span className="text-xs">
            {data.length - 1} días (Día 1 - Día {data.length})
          </span>
        )}
      </div>
    </div>
  );
}
