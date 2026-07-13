"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Modal } from "./Modal";

interface ConfirmOpts {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

const Ctx = createContext<((o: ConfirmOpts) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOpts) => {
    setOpts(o);
    return new Promise<boolean>(res => setResolver(() => res));
  }, []);

  const close = (val: boolean) => {
    resolver?.(val);
    setOpts(null);
    setResolver(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onClose={() => close(false)}
        title={opts?.title}
        width={420}
        footer={
          <>
            <button onClick={() => close(false)} className="btn btn-ghost cursor-hover">{opts?.cancelLabel || "Cancel"}</button>
            <button onClick={() => close(true)} className={`btn cursor-hover ${opts?.danger ? "btn-red" : "btn-primary"}`}>{opts?.confirmLabel || "Confirm"}</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "#525252", lineHeight: 1.55 }}>{opts?.message}</p>
      </Modal>
    </Ctx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
