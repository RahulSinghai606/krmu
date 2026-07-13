"use client";
import React from "react";
import { getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, dot = true }: BadgeProps) {
  const colors = getStatusColor(status);
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  return (
    <span className={`badge ${colors.bg} ${colors.text}`}>
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
      {displayLabel}
    </span>
  );
}

interface SimpleBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "gold";
  size?: "sm" | "md";
}

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-blue-50 text-blue-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
  gold: "bg-amber-50 text-amber-800",
};

export function Badge({ children, variant = "default", size = "md" }: SimpleBadgeProps) {
  const sizeStyle = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`badge font-medium rounded-md ${variantStyles[variant]} ${sizeStyle}`}>
      {children}
    </span>
  );
}
