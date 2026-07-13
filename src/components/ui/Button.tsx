"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles = {
  primary: "bg-[#1565C0] hover:bg-[#0d4a9a] text-white shadow-sm",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  danger: "bg-[#C8102E] hover:bg-[#9e0c24] text-white shadow-sm",
  ghost: "hover:bg-gray-100 text-gray-600",
  outline: "border border-gray-200 hover:bg-gray-50 text-gray-700 bg-white",
  gold: "bg-[#F5A623] hover:bg-[#c9871a] text-white shadow-sm",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export function Button({ variant = "primary", size = "md", loading, icon, iconRight, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {iconRight && !loading && iconRight}
    </button>
  );
}
