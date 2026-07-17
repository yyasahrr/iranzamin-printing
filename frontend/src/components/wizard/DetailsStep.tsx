import React, { useMemo } from "react";
import { Check, Sparkles, HelpCircle } from "lucide-react";

type OrderDetails = {
  quantity: number;
  material: string;
  size: string;
  printSide: string;
  finishes: string[];
};

type Finish = {
  id: string;
  label: string;
  factor: number;
};

type DetailsStepProps = {
  details: OrderDetails;
  setDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  toggleFinish: (id: string) => void;
  finishes: Finish[];
};

export default function DetailsStep({
  details,
  setDetails,
  toggleFinish,
  finishes,
}: DetailsStepProps) {
  
  // محاسبه میزان تخفیف پلکانی زنده (الگوبرداری از PrintRunner)
  const discountTip = useMemo(() => {
    if (details.quantity <= 250) {
      return {
        text: "با ارتقای تیراژ به ۵۰۰ عدد، ۱۰٪ روی کل سفارش تخفیف بگیرید!",
        percent: 30,
        color: "var(--color-accent-amber)"
      };
    } else if (details.quantity === 500) {
      return {
        text: "انتخاب تیراژ ۱۰۰۰ عددی قیمت واحد را ۲۲٪ ارزان‌تر کرده و ارسال شما را ۱۰۰٪ رایگان می‌کند!",
        percent: 65,
        color: "var(--color-accent)"
      };
    } else if (details.quantity === 1000) {
      return {
        text: "شما برترین تخفیف تیراژ بالا (۳۰٪) به همراه ارسال رایگان را دریافت کرده‌اید! 🌟",
        percent: 100,
        color: "#10b981"
      };
    }
    return null;
  }, [details.quantity]);

  // چک کردن وجود افکت طلاکوب یا یووی برای نمایش سه بعدی
  const hasFoil = details.finishes.includes("foil");
  const hasUV = details.finishes.includes("uv");

  return (
    <div>
      <div className="step-title">
        <span>مرحله دوم</span>
        <h3>مشخصات چاپ را انتخاب کنید</h3>
        <p>قیمت و تخفیف‌ها به صورت آنی تغییر می‌کنند.</p>
      </div>

      {/* بخش پیش‌نمایش سه بعدی افکت‌های لوکس چاپی (الگوبرداری از Moo.com) */}
      <div className="premium-preview-container">
        <div className={`premium-card-preview ${hasFoil ? "shimmer-foil" : ""} ${hasUV ? "shimmer-uv" : ""}`}>
          <div className="preview-logo">
            <Sparkles size={16} />
            <span>چاپ روشن</span>
          </div>
          <div className="preview-specs">
            <span>{details.material}</span>
            <span>&bull;</span>
            <span>{details.printSide}</span>
          </div>
          {hasFoil && <div className="foil-layer">افکت طلاکوب داغ</div>}
          {hasUV && <div className="uv-layer">پوشش یووی براق</div>}
        </div>
        <p className="preview-help-text">
          {hasFoil || hasUV ? (
            <span style={{ color: "var(--color-accent-amber)", fontWeight: "bold" }}>
              ✨ پیش‌نمایش افکت لوکس فعال شد! موس را روی کارت تکان دهید.
            </span>
          ) : (
            "برای فعال‌سازی افکت طلاکوب یا یووی زنده، تیک خدمات تکمیلی را بزنید."
          )}
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>تیراژ سفارش *</span>
          <select
            value={details.quantity}
            onChange={(event) => setDetails((current) => ({ ...current, quantity: Number(event.target.value) }))}
          >
            <option value={100}>۱۰۰ عدد</option>
            <option value={250}>۲۵۰ عدد</option>
            <option value={500}>۵۰۰ عدد</option>
            <option value={1000}>۱٬۰۰۰ عدد</option>
            <option value={2000}>۲٬۰۰۰ عدد</option>
          </select>
        </label>
        <label>
          <span>جنس کاغذ یا متریال</span>
          <select
            value={details.material}
            onChange={(event) => setDetails((current) => ({ ...current, material: event.target.value }))}
          >
            <option>گلاسه ۳۰۰ گرم</option>
            <option>کتان ۳۰۰ گرم</option>
            <option>کرافت ۲۸۰ گرم</option>
            <option>تحریر ۱۲۰ گرم</option>
            <option>نیاز به مشاوره دارم</option>
          </select>
        </label>
        <label>
          <span>ابعاد برش</span>
          <select
            value={details.size}
            onChange={(event) => setDetails((current) => ({ ...current, size: event.target.value }))}
          >
            <option>استاندارد</option>
            <option>A4</option>
            <option>A5</option>
            <option>مربع</option>
            <option>ابعاد اختصاصی</option>
          </select>
        </label>
        <label>
          <span>نوع چاپ رنگی</span>
          <select
            value={details.printSide}
            onChange={(event) => setDetails((current) => ({ ...current, printSide: event.target.value }))}
          >
            <option>دو رو رنگی</option>
            <option>یک رو رنگی</option>
            <option>یک رو تک‌رنگ</option>
          </select>
        </label>
      </div>

      {/* نوار تخفیف پلکانی پویا (الگوبرداری از PrintRunner) */}
      {discountTip && (
        <div className="discount-progress-bar">
          <div className="discount-bar-label">
            <span>{discountTip.text}</span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill" 
              style={{ width: `${discountTip.percent}%`, backgroundColor: discountTip.color }}
            />
          </div>
        </div>
      )}

      <fieldset className="finish-options">
        <legend>خدمات تکمیلی و پوشش‌ها</legend>
        {finishes.map((finish) => (
          <label key={finish.id}>
            <input
              type="checkbox"
              checked={details.finishes.includes(finish.id)}
              onChange={() => toggleFinish(finish.id)}
            />
            <span><Check size={13} /></span>
            {finish.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
