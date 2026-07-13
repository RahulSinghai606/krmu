"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = pathname === "/"; // custom cursor only on landing/main page

  // Toggle native-cursor hiding via <html> class.
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add("cursor-custom");
    else root.classList.remove("cursor-custom");
    return () => root.classList.remove("cursor-custom");
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let mx = -100, my = -100;
    let cx = -100, cy = -100;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = mx + "px";
        dotRef.current.style.top = my + "px";
      }
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      cx = lerp(cx, mx, 0.12);
      cy = lerp(cy, my, 0.12);
      if (ringRef.current) {
        ringRef.current.style.left = cx + "px";
        ringRef.current.style.top = cy + "px";
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const interactive = t.closest("a, button, [role=button], .cursor-hover, input, select, textarea, label");
      if (interactive && dotRef.current) dotRef.current.classList.add("hovered");
    };

    const onLeave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const interactive = t.closest("a, button, [role=button], .cursor-hover, input, select, textarea, label");
      if (interactive && dotRef.current) dotRef.current.classList.remove("hovered");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onEnter);
    window.addEventListener("mouseout", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onEnter);
      window.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
