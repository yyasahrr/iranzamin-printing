import { Check, type LucideIcon } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  unitPrice: number;
  icon: LucideIcon;
};

type ProductStepProps = {
  selectedProduct: string;
  onSelect: (id: string) => void;
  products: Product[];
};

export default function ProductStep({
  selectedProduct,
  onSelect,
  products,
}: ProductStepProps) {
  return (
    <div>
      <div className="step-title">
        <span>مرحله اول</span>
        <h3>چه چیزی می‌خواهید چاپ کنید؟</h3>
        <p>نزدیک‌ترین گزینه به سفارش خود را انتخاب کنید.</p>
      </div>
      <div className="product-options">
        {products.map((item) => {
          const Icon = item.icon;
          const selected = selectedProduct === item.id;
          return (
            <button
              className={selected ? "selected" : ""}
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-pressed={selected}
            >
              <Icon />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <i>{selected && <Check size={15} />}</i>
            </button>
          );
        })}
      </div>
    </div>
  );
}
