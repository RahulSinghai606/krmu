"use client";

export function Skeleton({ w = "100%", h = 16, r = 6, style }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) {
  return <span className="skeleton" style={{ display: "block", width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(10,22,40,0.04)" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} h={14} w={j === 0 ? "70%" : "55%"} />
          ))}
        </div>
      ))}
    </div>
  );
}
