import React from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    className:
      "bg-teal/20 border-teal/40 text-teal",
  },
  error: {
    icon: AlertCircle,
    className:
      "bg-red-900/30 border-red-400/40 text-red-300",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "bg-amber-900/30 border-amber-400/40 text-amber-300",
  },
  info: {
    icon: Info,
    className:
      "bg-blue/20 border-blue/40 text-blue",
  },
};

export default function BannerNotification({ notifications, onDismiss }) {
  if (!notifications?.length) return null;

  return (
    <div className="w-full flex flex-col gap-2 px-4 pt-4 pb-0 shrink-0">
      {notifications.map((notification) => {
        const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={notification.id}
            role="alert"
            className={`animate-slide-down flex items-center gap-3 w-full rounded-xl border px-4 py-3 ${config.className}`}
          >
            <Icon className="shrink-0" size={20} />
            <p className="flex-1 text-sm font-medium min-w-0">
              {notification.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
