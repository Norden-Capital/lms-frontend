"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { intFmt } from "../chartFormatters";

export interface TooltipRow {
  color: string;
  label: string;
  value: string | number;
}

export interface TooltipContentProps {
  title?: string;
  rows: TooltipRow[];
  /** Optional additional content (e.g., markers) */
  children?: ReactNode;
}

export interface TooltipHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Popover-style header row: medium-weight label separated from the body by a
 * full-width border. Use it at the top of custom `ChartTooltip` `content`.
 */
export function TooltipHeader({ children, className }: TooltipHeaderProps) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-left font-mono font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}

TooltipHeader.displayName = "TooltipHeader";

export function TooltipContent({ title, rows, children }: TooltipContentProps) {
  const hasBody = rows.length > 0 || Boolean(children);
  return (
    <div>
      {title && <TooltipHeader>{title}</TooltipHeader>}
      {hasBody && (
        // LMS: the rows are the white card; the date sits above it on the grey shell.
        <div className="rounded-md border bg-card px-2.5 py-2">
          {rows.length > 0 && (
            <div className="space-y-1">
              {rows.map((row) => (
                <div
                  className="flex items-center justify-between gap-4"
                  key={`${row.label}-${row.color}`}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate text-chart-tooltip-muted text-xs">
                      {row.label}
                    </span>
                  </div>
                  <span className="text-right font-medium text-chart-tooltip-foreground text-xs tabular-nums">
                    {typeof row.value === "number"
                      ? intFmt(row.value)
                      : row.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {children && (
            <div
              className={
                rows.length > 0
                  ? "mt-2 transition-opacity duration-200 ease-out"
                  : "transition-opacity duration-200 ease-out"
              }
            >
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

TooltipContent.displayName = "TooltipContent";

export default TooltipContent;
