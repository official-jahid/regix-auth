"use client";

import { Toaster } from "@/components/shadcnui/sonner";

const ToastProvider = () => {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
    />
  );
};

export default ToastProvider;
