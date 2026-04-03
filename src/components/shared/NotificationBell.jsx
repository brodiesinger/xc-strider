import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCheck } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const TYPE_DOT = {
  info: "bg-primary",
  warning: "bg-orange-500",
  success: "bg-green-500",
  ai: "bg-purple-500",
};

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!userEmail) return;
    const data = await base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 30);
    setNotifications(data);
  }, [userEmail]);

  useEffect(() => { load(); }, [load]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!userEmail) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        load();
      }
    });
    return unsubscribe;
  }, [userEmail, load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await Promise.all(unreadIds.map((id) => base44.entities.Notification.update(id, { read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm text-foreground">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={cn("px-4 py-3 flex gap-3 group", !n.read && "bg-primary/5")}>
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", !n.read ? (TYPE_DOT[n.type] || "bg-primary") : "bg-transparent")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    {n.created_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(() => { try { return formatDistanceToNow(parseISO(n.created_date), { addSuffix: true }); } catch { return ""; } })()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}