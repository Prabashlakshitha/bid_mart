"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms) {
  if (ms <= 0) return "Ended";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export default function CountdownBadge({ endTime, status }) {
  const [remaining, setRemaining] = useState(() => new Date(endTime).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(new Date(endTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (status !== "active" || remaining <= 0) {
    const soldLabel = status === "ended_sold" ? "Sold" : status === "ended_unsold" ? "Unsold" : "Ended";
    return (
      <span className="inline-flex items-center gap-1.5 bg-ink-800 text-paper text-xs font-medium px-2.5 py-1 rounded-full font-mono">
        {soldLabel}
      </span>
    );
  }

  const isEndingSoon = remaining < 60 * 60 * 1000; // under 1 hour

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full font-mono ${
        isEndingSoon ? "bg-signal-warn text-white" : "bg-white/90 text-ink-800"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isEndingSoon ? "bg-white animate-pulse" : "bg-signal-go"}`} />
      {formatRemaining(remaining)}
    </span>
  );
}
