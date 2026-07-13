"use client";
import React from "react";

interface KRMULogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
  subtitle?: string;
}

/** Official K.R. Mangalam University emblem (public/krmu-logo.png) + optional wordmark. */
export function KRMULogo({ size = 40, showText = true, light = false, subtitle = "Enterprise Resource Platform" }: KRMULogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <img
        src="/krmu-logo.png"
        alt="K.R. Mangalam University"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, display: "block" }}
      />
      {showText && (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: "-0.03em", lineHeight: 1, color: light ? "#FFFFFF" : "#0A1628", whiteSpace: "nowrap" }}>
            K.R. Mangalam University
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: light ? "rgba(255,255,255,0.4)" : "#A0AEC0", marginTop: 3 }}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
