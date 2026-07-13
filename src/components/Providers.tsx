"use client";
import type { ReactNode } from "react";
import { AppProvider } from "@/lib/store";
import { CustomCursor } from "@/components/ui/Cursor";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/Confirm";
import { CommandPalette } from "@/components/ui/CommandPalette";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        <ConfirmProvider>
          <CustomCursor />
          <CommandPalette />
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </AppProvider>
  );
}
