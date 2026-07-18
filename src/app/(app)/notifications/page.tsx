"use client";

import { useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { NOTIFICATION_KEYS, NOTIFICATION_LABELS, useSettingsStore } from "@/lib/store/settingsStore";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const notifications = useSettingsStore((s) => s.notifications);
  const toggleNotification = useSettingsStore((s) => s.toggleNotification);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("FitFusion AI", { body: "Notifications enabled — we'll remind you to stay on track." });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Choose what FitFusion AI should remind you about.</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white">
              {permission === "granted" ? <BellRing size={18} /> : <Bell size={18} />}
            </div>
            <div>
              <p className="text-sm font-semibold">Browser Notifications</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {permission === "granted" && "Enabled on this device"}
                {permission === "denied" && "Blocked — enable in your browser settings"}
                {permission === "default" && "Not enabled yet"}
                {permission === "unsupported" && "Not supported on this browser"}
              </p>
            </div>
          </div>
          {permission !== "granted" && permission !== "unsupported" && (
            <button onClick={requestPermission} className="btn-primary !py-2 text-sm">
              Enable
            </button>
          )}
          {permission === "granted" && (
            <span className="chip"><Check size={12} /> On</span>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Reminder Preferences</h3>
        <div className="flex flex-col gap-3">
          {NOTIFICATION_KEYS.map((key) => {
            const active = notifications[key];
            return (
              <button
                key={key}
                onClick={() => toggleNotification(key)}
                className="solid-card flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{NOTIFICATION_LABELS[key].title}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{NOTIFICATION_LABELS[key].desc}</p>
                </div>
                <span
                  className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors")}
                  style={{ background: active ? "var(--primary)" : "var(--ring-track)" }}
                >
                  <span
                    className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", active ? "translate-x-[22px]" : "translate-x-0.5")}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
