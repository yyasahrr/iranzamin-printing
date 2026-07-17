import React from "react";

type CardVariant = "default" | "elevated" | "flat" | "interactive" | "statistic";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  onClick?: () => void;
}

export default function AppCard({
  variant = "default",
  children,
  style,
  className = "",
  onClick,
  ...props
}: AppCardProps) {
  
  // سیستم استایل‌دهی ماورای توکن‌های طراحی فعلی (Design Tokens)
  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      background: "var(--surface)",
      border: "1px solid var(--line)",
      boxShadow: "none",
    },
    elevated: {
      background: "var(--surface)",
      border: "1px solid var(--line)",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.25)",
    },
    flat: {
      background: "var(--surface-soft)",
      border: "0",
      boxShadow: "none",
    },
    interactive: {
      background: "var(--surface)",
      border: "1px solid var(--line)",
      cursor: "pointer",
      transition: "transform 220ms ease, box-shadow 220ms ease",
    },
    statistic: {
      background: "var(--surface)",
      border: "1px solid var(--line)",
      textAlign: "center",
      padding: "24px",
    },
  };

  const cardStyle: React.CSSProperties = {
    padding: "20px",
    borderRadius: "8px",
    position: "relative",
    overflow: "hidden",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <div
      style={cardStyle}
      className={`app-card card-${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
