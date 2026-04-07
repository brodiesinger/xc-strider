import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({
  icon: IconComponent = Inbox,
  title,
  description,
  action,
  actionLabel,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {IconComponent && (
        <div className="mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button onClick={action} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}