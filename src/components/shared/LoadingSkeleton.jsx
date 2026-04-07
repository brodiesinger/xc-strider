import React from "react";
import { cn } from "@/lib/utils";

/** Animated shimmer skeleton block */
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
    />
  );
}

/** Full-page centered spinner */
export function PageSpinner({ label = "Loading..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Inline centered spinner (for embedded sections) */
export function InlineSpinner({ label, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-10", className)}>
      <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}

/** Empty state placeholder */
export function EmptyState({ message = "No data available.", icon, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-10 text-center", className)}>
      {icon && <div className="text-3xl mb-1">{icon}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Error fallback */
export function ErrorState({ message = "Something went wrong.", onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-center", className)}>
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Skeleton card row (generic) */
export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-1/2" : "w-3/4"}`} />
      ))}
    </div>
  );
}

/** Skeleton list of cards */
export function SkeletonList({ count = 3, lines = 2 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}