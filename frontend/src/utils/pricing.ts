/**
 * محاسبه قیمت برآورد شده سفارش چاپی بر اساس فرمول مصوب با اعمال تخفیف تیراژ
 * @param unitPrice قیمت پایه هر واحد محصول
 * @param quantity تیراژ انتخابی
 * @param printSide نوع چاپ (یک رو رنگی یا دو رو رنگی)
 * @param finishesList لیست خدمات تکمیلی انتخابی
 * @param finishesConfig کل خدمات تکمیلی تعریف شده در سامانه
 */
export function calculateEstimatedPrice(
  unitPrice: number,
  quantity: number,
  printSide: string,
  finishesList: string[],
  finishesConfig: Array<{ id: string; factor: number }>
): number {
  const finishFactor = finishesList.reduce((sum, finishId) => {
    const found = finishesConfig.find((item) => item.id === finishId);
    return sum + (found ? found.factor : 0);
  }, 0);

  const sideFactor = printSide === "دو رو رنگی" ? 1.16 : 1.0;
  
  // اعمال تخفیف واقعی بر اساس تیراژ (الگوبرداری از تخفیف‌های پلکانی ووکامرس)
  let qtyDiscount = 1.0;
  if (quantity === 500) {
    qtyDiscount = 0.90; // ۱۰٪ تخفیف
  } else if (quantity >= 1000) {
    qtyDiscount = 0.78; // ۲۲٪ تخفیف
  }

  const price = unitPrice * quantity * (1.0 + finishFactor) * sideFactor * qtyDiscount;

  // رند کردن به نزدیک‌ترین ده هزار تومان
  return Math.round(price / 10000.0) * 10000;
}
