"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-xl border shadow-lg",
        },
      }}
    />
  );
}
