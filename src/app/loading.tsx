"use client";

import { Progress } from "@/components/shadcnui/progress";
import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(10);
  const [message, setMessage] = useState("Initializing...");

  const messages = [
    { at: 10, msg: "Initializing..." },
    { at: 25, msg: "Loading modules..." },
    { at: 40, msg: "Establishing connection..." },
    { at: 55, msg: "Verifying credentials..." },
    { at: 70, msg: "Preparing dashboard..." },
    { at: 85, msg: "Almost ready..." },
    { at: 100, msg: "Complete!" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.random() * 15, 100);
        const msg = messages.find((m) => next >= m.at);
        if (msg) setMessage(msg.msg);
        return next;
      });
    }, 300);

    const timeout = setTimeout(() => {
      setProgress(10);
      setMessage("Initializing...");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          {message}
        </h2>
        <Progress value={progress}>
          <span className="text-sm">{Math.round(progress)}%</span>
        </Progress>
      </div>
    </div>
  );
}
