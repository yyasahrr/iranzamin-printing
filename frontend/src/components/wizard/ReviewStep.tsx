import { Check } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  unitPrice: number;
  icon: any;
};

type OrderDetails = {
  quantity: number;
  material: string;
  size: string;
  printSide: string;
  finishes: string[];
};

type ReviewStepProps = {
  product: Product;
  details: OrderDetails;
  customer: { name: string; phone: string; note: string };
  fileName: string;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);

export default function ReviewStep({
  product,
  details,
  customer,
  fileName,
}: ReviewStepProps) {
  const rows = [
    ["محصول", product.title],
    ["تیراژ", `${formatPrice(details.quantity)} عدد`],
    ["متریال", details.material],
    ["ابعاد", details.size],
    ["نوع چاپ", details.printSide],
    ["فایل", fileName || "پس از تماس ارسال می‌شود"],
    ["نام سفارش‌دهنده", customer.name],
    ["شماره تماس", customer.phone],
  ];

  return (
    <div>
      <div className="step-title">
        <span>مرحله آخر</span>
        <h3>همه‌چیز درست است؟</h3>
        <p>پس از ثبت، کارشناس ما فایل و قیمت نهایی را با شما بررسی می‌کند.</p>
      </div>
      <dl className="review-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <label className="review-confirm">
        <input type="checkbox" defaultChecked required />
        <span><Check size={13} /></span>
        با ثبت این درخواست، موافقت می‌کنم کارشناس چاپ برای نهایی‌سازی سفارش با من تماس بگیرد.
      </label>
    </div>
  );
}
