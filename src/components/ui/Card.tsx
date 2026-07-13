"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className = "", padding = true, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100",
        padding && "p-5",
        hover && "stat-card cursor-pointer",
        className
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  accent?: string;
  subValue?: string;
}

export function StatCard({ label, value, icon, change, changeLabel, accent = "#1565C0", subValue }: StatCardProps) {
  return (
    <div className="stat-card bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}14`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-1 mt-2">
          {change !== undefined && (
            <span className={`text-xs font-semibold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? "+" : ""}{change}%
            </span>
          )}
          {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
