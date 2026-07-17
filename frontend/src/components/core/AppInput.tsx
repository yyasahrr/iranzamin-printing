import React from "react";

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  textarea?: boolean;
  rows?: number;
}

export default function AppInput({
  label,
  error,
  icon,
  textarea = false,
  rows = 4,
  style,
  className = "",
  disabled = false,
  ...props
}: AppInputProps) {
  
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
    position: "relative",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: textarea ? "auto" : "44px",
    padding: icon ? "0 40px 0 12px" : "0 14px",
    background: "var(--bg, rgba(255, 255, 255, 0.02))",
    border: error ? "1px solid #ef4444" : "1px solid var(--line)",
    borderRadius: "6px",
    color: "var(--text)",
    outline: "none",
    fontSize: "13px",
    transition: "border-color 180ms ease",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "text",
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text)",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#ef4444",
    marginTop: "2px",
  };

  return (
    <div style={containerStyle} className={`app-input-container ${className}`}>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <span style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "grid",
            placeItems: "center",
            color: "var(--color-text-muted, var(--muted))"
          }}>
            {icon}
          </span>
        )}
        
        {textarea ? (
          <textarea
            style={{ ...inputStyle, padding: "12px" }}
            disabled={disabled}
            rows={rows}
            {...(props as any)}
          />
        ) : (
          <input
            style={inputStyle}
            disabled={disabled}
            {...props}
          />
        )}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
