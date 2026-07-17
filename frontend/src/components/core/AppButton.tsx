import React from "react";
import { Loader } from "lucide-react";

type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "outline" 
  | "ghost" 
  | "danger" 
  | "success" 
  | "warning";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function AppButton({
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  children,
  className = "",
  style,
  ...props
}: AppButtonProps) {
  // نقشه رنگی بر اساس تم‌های فعلی سیستم بدون هاردکد کردن رنگ فیزیکی (C3-Design Tokens)
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "var(--accent-ink)",
      border: "0",
    },
    secondary: {
      background: "var(--surface-soft)",
      color: "var(--text)",
      border: "1px solid var(--line)",
    },
    outline: {
      background: "transparent",
      color: "var(--text)",
      border: "1px solid var(--line)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-muted, var(--muted))",
      border: "0",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.2)",
    },
    success: {
      background: "rgba(16, 185, 129, 0.1)",
      color: "#10b981",
      border: "1px solid rgba(16, 185, 129, 0.2)",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.1)",
      color: "var(--color-accent-amber, #f59e0b)",
      border: "1px solid rgba(245, 158, 11, 0.2)",
    },
  };

  const buttonStyle: React.CSSProperties = {
    minHeight: "46px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 20px",
    borderRadius: "6px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 200ms ease",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled || loading}
      className={`app-button btn-${variant} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader size={16} className="spin-icon" style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
