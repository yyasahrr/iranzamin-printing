import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="detail-page" dir="rtl">
      <div className="detail-error">
        <p className="eyebrow">۴۰۴</p>
        <h2>صفحه‌ای که دنبالش بودید پیدا نشد.</h2>
        <p>ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه دیگر وجود نداشته باشد.</p>
        <Link to="/" className="primary-button">
          بازگشت به خانه
          <ArrowLeft size={18} />
        </Link>
      </div>
    </div>
  );
}
