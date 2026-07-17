import React, { useMemo } from "react";
import { FileImage, UploadCloud, AlertCircle, ShieldAlert } from "lucide-react";

type ContactStepProps = {
  customer: { name: string; phone: string; note: string };
  setCustomer: React.Dispatch<React.SetStateAction<{ name: string; phone: string; note: string }>>;
  fileName: string;
  setFileName: (name: string) => void;
  setFileBlob: (file: File | null) => void;
  error: string;
};

export default function ContactStep({
  customer,
  setCustomer,
  fileName,
  setFileName,
  setFileBlob,
  error,
}: ContactStepProps) {

  // راهنمای اعتبارسنجی ابعاد و هشدار پیش‌پرواز (Pre-Flight Analyzer)
  const fileWarning = useMemo(() => {
    if (!fileName) return null;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png'].includes(ext)) {
      return {
        text: "توجه: برای کارهای چاپی، خروجی PDF با کیفیت ۳۰۰ DPI تضمین‌کننده بهترین کیفیت و شفافیت است.",
        isAlert: false
      };
    }
    return null;
  }, [fileName]);

  return (
    <div>
      <div className="step-title">
        <span>مرحله سوم</span>
        <h3>فایل و راه ارتباطی</h3>
        <p>آپلود طرح به همراه راهنمای حاشیه امن برش کاغذ.</p>
      </div>

      <label className="file-upload">
        <input
          type="file"
          accept=".pdf,.ai,.psd,.tif,.tiff,.jpg,.jpeg,.png"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setFileName(file ? file.name : "");
            setFileBlob(file);
          }}
        />
        {fileName ? <FileImage /> : <UploadCloud />}
        <span>
          <strong>{fileName || "فایل طراحی را اینجا انتخاب کنید"}</strong>
          <small>{fileName ? "برای تغییر فایل دوباره کلیک کنید" : "PDF، AI، PSD یا JPG تا ۵۰ مگابایت"}</small>
        </span>
      </label>

      {/* هشدار هوشمند پیش‌پرواز فایل (Pre-Flight Guide) */}
      {fileWarning && (
        <div style={{
          display: "flex", 
          gap: "10px", 
          alignItems: "center", 
          padding: "12px", 
          background: "rgba(245, 158, 11, 0.08)", 
          border: "1px dashed rgba(245, 158, 11, 0.3)", 
          borderRadius: "8px",
          marginTop: "12px",
          fontSize: "12px",
          color: "var(--color-accent-amber)",
          lineHeight: "1.6"
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{fileWarning.text}</span>
        </div>
      )}

      {/* راهنمای گرافیکی حاشیه امن و خط برش واقعی (Bleed Safe Zone) - الگوبرداری از VistaPrint */}
      <div className="bleed-guide-container">
        <p style={{ fontSize: "12px", fontWeight: "bold", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          📐 راهنمای کالیبراسیون و برش دقیق کاغذ:
        </p>
        <div className="bleed-visual-box">
          <div className="bleed-label-cut">✂️ خط قرمز: لبه برش نهایی کاغذ</div>
          <div className="bleed-safe-zone">
            <div className="bleed-label-safe">✅ کادر سبز: محدوده امن قرارگیری متون و لوگوها</div>
            طرح شما باید تا لبه قرمز کشیده شود ولی متون داخل کادر سبز باشند.
          </div>
        </div>
        <div className="bleed-info-list">
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /> ۳ میلی‌متر حاشیه خط برش</span>
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> رزولوشن استاندارد ۳۰۰ DPI</span>
        </div>
      </div>

      <div className="form-grid contact-fields" style={{ marginTop: "24px" }}>
        <label>
          <span>نام و نام خانوادگی *</span>
          <input
            type="text"
            value={customer.name}
            onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
            placeholder="مثلاً سارا احمدی"
          />
        </label>
        <label>
          <span>شماره موبایل *</span>
          <input
            type="tel"
            dir="ltr"
            value={customer.phone}
            onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
            placeholder="09123456789"
          />
        </label>
        <label className="full-field">
          <span>توضیحات سفارش</span>
          <textarea
            value={customer.note}
            onChange={(event) => setCustomer((current) => ({ ...current, note: event.target.value }))}
            placeholder="اگر نکته یا زمان‌بندی خاصی دارید، بنویسید..."
          />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
