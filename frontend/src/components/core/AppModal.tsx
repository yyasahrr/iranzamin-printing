import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
}

const sizeWidths: Record<ModalSize, string> = {
  sm: "400px",
  md: "550px",
  lg: "750px",
  xl: "1000px",
  fullscreen: "100vw",
};

export default function AppModal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}: AppModalProps) {
  
  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: "0",
    background: "rgba(0, 0, 0, 0.75)",
    display: "grid",
    placeItems: "center",
    zIndex: "9999",
    backdropFilter: "blur(4px)",
  };

  const modalStyle: React.CSSProperties = {
    width: size === "fullscreen" ? "100%" : `min(${sizeWidths[size]}, calc(100% - 32px))`,
    height: size === "fullscreen" ? "100%" : "auto",
    maxHeight: size === "fullscreen" ? "100%" : "90vh",
    overflowY: "auto",
    background: "var(--surface)",
    border: size === "fullscreen" ? "0" : "1px solid var(--line)",
    borderRadius: size === "fullscreen" ? "0" : "14px",
    padding: "24px",
    position: "relative",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={backdropStyle} onClick={onClose} className="app-modal-backdrop">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={modalStyle}
            className={`app-modal size-${size}`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                left: "20px",
                top: "20px",
                background: "none",
                border: "0",
                color: "var(--color-text-muted, var(--muted))",
                cursor: "pointer",
              }}
              aria-label="بستن"
            >
              <X size={20} />
            </button>

            {title && (
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", color: "var(--text)" }}>
                {title}
              </h3>
            )}

            <div className="modal-content">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
