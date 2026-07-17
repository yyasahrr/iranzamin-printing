import React from "react";

export type BadgeStatus =
  | "pending"
  | "processing"
  | "printing"
  | "ready"
  | "shipped"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "refunded";

interface AppBadgeProps {
  status: BadgeStatus;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; bg: string; color: string }
> = {
  pending: {
    label: "در انتظار بررسی",
    bg: "rgba(245, 158, 11, 0.08)",
    color: "#f59e0b",
  },
  processing: {
    label: "در حال طراحی",
    bg: "rgba(56, 189, 248, 0.08)",
    color: "#38bdf8",
  },
  printing: {
    label: "در حال چاپ",
    bg: "rgba(192, 132, 252, 0.08)",
    color: "#c084fc",
  },
  ready: {
    label: "آماده تحویل",
    bg: "rgba(16, 185, 129, 0.08)",
    color: "#10b981",
  },
  shipped: {
    label: "ارسال شده",
    bg: "rgba(59, 130, 246, 0.08)",
    color: "#3b82f6",
  },
  cancelled: {
    label: "لغو شده",
    bg: "rgba(239, 68, 68, 0.08)",
    color: "#ef4444",
  },
  paid: {
    label: "تسویه شده",
    bg: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
  },
  unpaid: {
    label: "پرداخت نشده",
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
  },
  refunded: {
    label: "مرجوع شده",
    bg: "rgba(245, 158, 11, 0.12)",
    color: "#f59e0b",
  },
};

export default function AppBadge({
  status,
  className = "",
  style,
}: AppBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    bg: "var(--surface-soft)",
    color: "var(--text)",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: config.bg,
    color: config.color,
    border: `1px solid ${config.color}20`,
    ...style,
  };

  return (
    <span style={badgeStyle} className={`app-badge status-${status} ${className}`}>
      {config.label}
    </span>
  );
}
