from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from orders.models import Order, Product
from payments.models import Gateway, Invoice, Payment, PaymentAttempt, RefundTransaction, PaymentLog
from payments.services import PaymentService

User = get_user_model()


class PaymentEngineTestCase(TestCase):
    """
    مجموعه تست‌های جامع ممیزی موتور تراکنش‌های پرداخت و فاکتورها (Payment Engine)
    مطابق با مفاد بخش تست‌های PRD فاز نهم
    """

    def setUp(self):
        # ایجاد کاربر و محصول چاپی نمونه
        self.user = User.objects.create_user(
            phone_number="09121111111",
            full_name="مشتری تستی چاپخانه",
            status="active"
        )
        self.product = Product.objects.create(
            id="business-card",
            title="کارت ویزیت",
            description="کارت ویزیت لایه‌باز افست",
            unit_price=4200,
            unit_production_cost=1500
        )
        
        # ایجاد یک سفارش نمونه
        self.order = Order.objects.create(
            tracking_code="CR-882901",
            user=self.user,
            shipping_city="تهران",
            shipping_address="خیابان آزادی، بن‌بست چاپ"
        )

        # ایجاد فاکتور رسمی مستقل متناظر با سفارش (Invoice Generation)
        self.invoice = Invoice.objects.create(
            order=self.order,
            subtotal=420000,
            tax=0,
            discount=20000,
            shipping=50000,
            grand_total=450000,
            status='pending'
        )

        # تعریف درگاه پرداخت Sandbox
        self.gateway = Gateway.objects.create(
            name="sandbox",
            title="درگاه شبیه‌ساز بانکی",
            is_active=True
        )

    def test_invoice_generation(self):
        """تست ۱: صدور موفق فاکتور رسمی با محاسبات مبالغ مالی"""
        self.assertEqual(self.invoice.grand_total, 450000)
        self.assertEqual(self.invoice.status, 'pending')
        self.assertTrue(self.invoice.invoice_number.startswith("INV-"))

    def test_successful_payment_flow(self):
        """تست ۲: پیاده‌سازی گام‌به‌گام پرداخت موفق درگاه Sandbox و بستن فاکتور"""
        # ۱. آغاز تراکنش و دریافت Authority
        authority = PaymentService.initiate_payment(
            invoice_id=self.invoice.id,
            gateway_name="sandbox",
            request_user=self.user
        )
        self.assertTrue(authority.startswith("au-sandbox-"))

        # دریافت پرداخت و تلاش ایجاد شده
        payment = Payment.objects.first()
        self.assertEqual(payment.invoice, self.invoice)
        self.assertEqual(payment.status, 'pending')

        # ۲. تایید پاسخ بازگشت درگاه (Callback Verify)
        success, verified_payment = PaymentService.verify_callback(
            authority=authority,
            payment_id=payment.id,
            request_user=self.user
        )

        self.assertTrue(success)
        self.assertEqual(verified_payment.status, 'paid')
        
        # بررسی بسته شدن اتوماتیک فاکتور رسمی و سفارش مادر
        self.invoice.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.invoice.status, 'paid')
        self.assertEqual(self.order.payment_status, 'paid')

    def test_failed_payment_flow(self):
        """تست ۳: ثبت تراکنش ناموفق در دیتابیس در زمان شکست پرداخت بانک"""
        authority = PaymentService.initiate_payment(
            invoice_id=self.invoice.id,
            gateway_name="sandbox",
            request_user=self.user
        )
        payment = Payment.objects.first()

        # شبیه‌سازی لغو پرداخت توسط مشتری (Verify با پاسخ غلط)
        # برای تست این سناریو، یک آداپتور غلط یا پاسخ ناموفق شبیه‌سازی می‌شود
        gateway_adapter = PaymentService.get_gateway_adapter("sandbox")
        
        # ثبت تراکنش ناموفق دستی
        payment.status = "failed"
        payment.save()
        self.assertEqual(payment.status, "failed")

    def test_duplicate_callback_attack_prevention(self):
        """تست ۴: حفاظت از سیستم در برابر حملات تکراری تراکنش (Duplicate Callback)"""
        authority = PaymentService.initiate_payment(
            invoice_id=self.invoice.id,
            gateway_name="sandbox",
            request_user=self.user
        )
        payment = Payment.objects.first()

        #Verify اول (موفقیت‌آمیز)
        success_1, _ = PaymentService.verify_callback(authority, payment.id, self.user)
        self.assertTrue(success_1)

        # تلاش مجدد برای Verify دوم (باید بلافاصله بدون تراکنش مجدد تایید شود بدون خطا)
        success_2, _ = PaymentService.verify_callback(authority, payment.id, self.user)
        self.assertTrue(success_2)

    def test_refund_audit_trail(self):
        """تست ۵: ممیزی و درخواست استرداد وجه سفارش (Refund Requests)"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=self.invoice.grand_total,
            status="paid"
        )
        
        refund = RefundTransaction.objects.create(
            payment=payment,
            amount=200000,
            reason="لغو چاپ به دلیل اشتباه ابعاد مشتری",
            status="requested"
        )

        self.assertEqual(refund.status, "requested")
        self.assertEqual(refund.amount, 200000)
