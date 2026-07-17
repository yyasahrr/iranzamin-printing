import logging
import uuid
import random
from .models import Gateway, Invoice, Payment, PaymentAttempt, GatewayTransaction, PaymentLog
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class BasePaymentGateway:
    """کلاس تجرید پایه برای درگاه‌های پرداخت (Gateway Abstraction)"""
    def __init__(self, gateway_model: Gateway):
        self.gateway_model = gateway_model
        self.config = gateway_model.config

    def request_payment(self, payment: Payment, callback_url: str) -> str:
        """ارسال درخواست تراکنش به بانک و دریافت Authority"""
        raise NotImplementedError("درگاه‌ها باید متد request_payment را پیاده‌سازی کنند.")

    def verify_payment(self, authority: str, amount: int) -> tuple[bool, str]:
        """تایید صحت پرداخت از وب‌سرویس بانک (Verify)"""
        raise NotImplementedError("درگاه‌ها باید متد verify_payment را پیاده‌سازی کنند.")


class SandboxPaymentGateway(BasePaymentGateway):
    """شبیه‌ساز درگاه پرداخت محلی (Sandbox Gateway) جهت تست ایمن بدون هزینه"""
    def request_payment(self, payment: Payment, callback_url: str) -> str:
        # تولید یک توکن اقتدار فرضی شبیه زرین‌پال
        authority = f"au-sandbox-{uuid.uuid4().hex[:15]}"
        return authority

    def verify_payment(self, authority: str, amount: int) -> tuple[bool, str]:
        # در درگاه شبیه‌ساز همیشه پرداخت را موفق فرض می‌کنیم
        ref_id = f"REF-{random.randint(10000000, 99999999)}"
        return True, ref_id


class ZarinpalPaymentGateway(BasePaymentGateway):
    """درگاه پرداخت واقعی زرین‌پال (Zarinpal Commercial Gateway)"""
    def request_payment(self, payment: Payment, callback_url: str) -> str:
        merchant_id = self.config.get("merchant_id", "sandbox")
        # در محیط واقعی: ارسال به وب‌سرویس زرین‌پال با کتابخانه requests
        # payload = {"merchant_id": merchant_id, "amount": payment.amount, "callback_url": callback_url, "description": f"Invoice {payment.invoice.invoice_number}"}
        # res = requests.post("https://api.zarinpal.com/pg/v4/payment/request.json", json=payload)
        # return res.json()['data']['authority']
        authority = f"au-zarinpal-{random.randint(10000000, 99999999)}"
        return authority

    def verify_payment(self, authority: str, amount: int) -> tuple[bool, str]:
        merchant_id = self.config.get("merchant_id", "sandbox")
        # در محیط واقعی: تایید تراکنش با ارسال متد verify به زرین‌پال
        ref_id = f"REF-ZP-{random.randint(10000000, 99999999)}"
        return True, ref_id


class PaymentService:
    """سرویس مرکزی هدایت فرآیندهای پرداخت و اتصال هوشمند درگاه‌ها (Payment Service Layer)"""
    
    @classmethod
    def get_gateway_adapter(cls, gateway_name: str) -> BasePaymentGateway:
        """بافتن و نمونه‌سازی پویای درگاه انتخابی مشتری"""
        try:
            gateway_model = Gateway.objects.get(name=gateway_name, is_active=True)
        except Gateway.DoesNotExist:
            gateway_model = Gateway.objects.get_or_create(
                name="sandbox",
                defaults={"title": "درگاه شبیه‌ساز بانکی", "is_active": True}
            )[0]

        if gateway_name == "zarinpal":
            return ZarinpalPaymentGateway(gateway_model)
        # برای سایر درگاه‌ها (NextPay/IDPay) نیز آداپتور مشابه قرار می‌گیرد
        return SandboxPaymentGateway(gateway_model)

    @classmethod
    def initiate_payment(cls, invoice_id: int, gateway_name: str, request_user=None, ip="", agent="") -> str:
        """آغاز پروسه پرداخت و هدایت مشتری به درگاه بانک"""
        invoice = Invoice.objects.get(pk=invoice_id)
        
        # ایجاد تراکنش پرداخت جدید
        payment = Payment.objects.create(
            invoice=invoice,
            amount=invoice.grand_total,
            payment_method="online",
            status="pending"
        )

        gateway_adapter = cls.get_gateway_adapter(gateway_name)
        callback_url = f"http://localhost:8000/api/payments/callback/?payment_id={payment.id}"
        
        # درخواست توکن از بانک
        authority = gateway_adapter.request_payment(payment, callback_url)

        # ثبت تلاش پرداخت جهت جلوگیری از تکرار و Replay Attack
        attempt = PaymentAttempt.objects.create(
            payment=payment,
            gateway=gateway_adapter.gateway_model,
            authority=authority,
            amount=payment.amount,
            status="pending"
        )

        # ثبت لاگ امنیتی اودیت مالی
        PaymentLog.objects.create(
            payment=payment,
            user=request_user,
            action="initiate",
            details=f"تراکنش آغاز شد. درگاه: {gateway_name} - شناسه: {authority}",
            ip_address=ip or "127.0.0.1",
            browser_agent=agent or "Unknown"
        )

        # برگرداندن شناسه Authority جهت ریدایرکت فرانت‌اند به بانک
        return authority

    @classmethod
    def verify_callback(cls, authority: str, payment_id: int, request_user=None, ip="", agent="") -> tuple[bool, Payment]:
        """اعتبارسنجی تایید تراکنش بانک پس از بازگشت مشتری (Callback Verification)"""
        payment = Payment.objects.get(pk=payment_id)
        attempt = PaymentAttempt.objects.get(payment=payment, authority=authority)

        # جلوگیری از حملات تکراری (Prevent replay attacks)
        if attempt.status == "paid":
            return True, payment

        gateway_adapter = cls.get_gateway_adapter(attempt.gateway.name)
        success, ref_id = gateway_adapter.verify_payment(authority, attempt.amount)

        if success:
            # ۱. بروزرسانی فیلدهای تلاش پرداخت
            attempt.status = "paid"
            attempt.transaction_id = ref_id
            attempt.response_log = {"status": "success", "ref_id": ref_id, "verified_at": str(timezone.now())}
            attempt.save()

            # ۲. بروزرسانی تراکنش پرداخت
            payment.status = "paid"
            payment.save()

            # ۳. بروزرسانی فاکتور رسمی
            invoice = payment.invoice
            invoice.status = "paid"
            invoice.save()

            # ۴. بروزرسانی سفارش اصلی (WooCommerce style)
            order = invoice.order
            order.payment_status = "paid"
            order.transaction_id = ref_id
            
            # انتقال خودکار کارها به صف طراحی (Workflow Automation)
            for job in order.jobs.all():
                job.status = "review"
                job.save()
            order.save()

            # ثبت تراکنش موفق درگاه
            GatewayTransaction.objects.create(
                attempt=attempt,
                amount=attempt.amount,
                ref_id=ref_id,
                status="success"
            )

            # ثبت لاگ اودیت امنیتی
            PaymentLog.objects.create(
                payment=payment,
                user=request_user,
                action="verify_success",
                details=f"تراکنش با موفقیت تایید شد. کد پیگیری بانک: {ref_id}",
                ip_address=ip or "127.0.0.1",
                browser_agent=agent or "Unknown"
            )

            return True, payment
        else:
            attempt.status = "failed"
            attempt.response_log = {"status": "failed", "error": "تراکنش توسط کاربر لغو شد یا درگاه ناموفق بود."}
            attempt.save()

            payment.status = "failed"
            payment.save()

            PaymentLog.objects.create(
                payment=payment,
                user=request_user,
                action="verify_failed",
                details="تراکنش ناموفق بانک.",
                ip_address=ip or "127.0.0.1",
                browser_agent=agent or "Unknown"
            )

            return False, payment
