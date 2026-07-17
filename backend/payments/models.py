from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import BaseModel
from orders.models import Order
import random


class Gateway(BaseModel):
    """مدل درگاه‌های پرداخت فعال (Zarinpal, NextPay, IDPay, Sandbox)"""
    name = models.CharField(max_length=50, unique=True, verbose_name="شناسه درگاه (انگلیسی)", help_text="مثال: zarinpal")
    title = models.CharField(max_length=100, verbose_name="عنوان فارسی درگاه", help_text="مثال: زرین‌پال")
    config = models.JSONField(default=dict, blank=True, verbose_name="تنظیمات فنی (API Keys / Credentials)")

    class Meta:
        verbose_name = "درگاه پرداخت"
        verbose_name_plural = "۱. درگاه‌های پرداخت"

    def __str__(self):
        return self.title


class Invoice(BaseModel):
    """سیستم فاکتور رسمی مستقل (Invoice System)"""
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس فاکتور'),
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده و موفق'),
        ('cancelled', 'لغو شده'),
        ('refunded', 'مرجوع شده'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, verbose_name="شماره فاکتور", db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="invoices", verbose_name="سفارش متناظر")
    
    # مبالغ و ریز فاکتور رسمی
    subtotal = models.IntegerField(verbose_name="مبلغ خام سفارش (تومان)")
    tax = models.IntegerField(default=0, verbose_name="مالیات بر ارزش افزوده (تومان)")
    discount = models.IntegerField(default=0, verbose_name="مبلغ تخفیف (تومان)")
    shipping = models.IntegerField(default=0, verbose_name="هزینه حمل و نقل (تومان)")
    grand_total = models.IntegerField(verbose_name="مبلغ نهایی فاکتور (تومان)")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت فاکتور")
    issue_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ صدور فاکتور")
    due_date = models.DateTimeField(verbose_name="مهلت پرداخت فاکتور")

    class Meta:
        verbose_name = "فاکتور رسمی"
        verbose_name_plural = "۲. فاکتورهای رسمی"
        ordering = ['-issue_date']

    def __str__(self):
        return f"فاکتور {self.invoice_number} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f"INV-{random.randint(100000, 999999)}"
        if not self.due_date:
            self.due_date = timezone.now() + timezone.timedelta(days=7) # مهلت پرداخت پیش‌فرض ۷ روز
        super().save(*args, **kwargs)


class Payment(BaseModel):
    """مدل کل پرداخت‌های سفارش (پشتیبانی از چند پرداختی Deposit / Split Payments)"""
    STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('waiting', 'معلق در درگاه'),
        ('authorized', 'تایید شده اولیه'),
        ('paid', 'پرداخت موفق و تسویه شده'),
        ('failed', 'پرداخت ناموفق'),
        ('cancelled', 'لغو شده'),
        ('expired', 'منقضی شده'),
        ('refunded', 'کل مبلغ مرجوع شد'),
        ('partially_refunded', 'مبلغی از تراکنش مرجوع شد'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('online', 'پرداخت آنلاین از درگاه'),
        ('bank_transfer', 'فیش واریزی / کارت‌به‌کارت'),
        ('cash', 'نقدی کارگاه'),
        ('manual', 'تسویه حساب دستی'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments", verbose_name="فاکتور متناظر")
    amount = models.IntegerField(verbose_name="مبلغ تراکنش (تومان)")
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='online', verbose_name="روش پرداخت")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت تراکنش")
    
    class Meta:
        verbose_name = "تراکنش پرداخت"
        verbose_name_plural = "۳. تراکنش‌های پرداخت سفارشات"
        ordering = ['-created_at']

    def __str__(self):
        return f"پرداخت #{self.id} بابت فاکتور {self.invoice.invoice_number} ({self.amount:,} تومان)"


class PaymentAttempt(BaseModel):
    """تلاش‌های پرداخت ایجاد شده در درگاه (برای جلوگیری از Replay Attack و ثبت رفرنس‌های بانک)"""
    STATUS_CHOICES = [
        ('pending', 'ایجاد شده در درگاه'),
        ('paid', 'پرداخت موفق بانک'),
        ('failed', 'ناموفق / لغو شده'),
    ]

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="attempts", verbose_name="پرداخت مربوطه")
    gateway = models.ForeignKey(Gateway, on_delete=models.PROTECT, related_name="attempts", verbose_name="درگاه پرداخت")
    
    authority = models.CharField(max_length=150, unique=True, verbose_name="شناسه توکن درگاه (Authority)")
    amount = models.IntegerField(verbose_name="مبلغ تراکنش به تومان")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت تراکنش")
    
    transaction_id = models.CharField(max_length=100, blank=True, verbose_name="شماره پیگیری بانک (RefID)")
    response_log = models.JSONField(default=dict, blank=True, verbose_name="پاسخ کامل وب‌سرویس درگاه")

    class Meta:
        verbose_name = "تلاش پرداخت درگاه"
        verbose_name_plural = "۴. تلاش‌های پرداخت بانک"

    def __str__(self):
        return f"تلاش {self.authority} - {self.get_status_display()}"


class GatewayTransaction(BaseModel):
    """مدل تاریخچه خام لاگ‌های درگاه (Gateway Traces)"""
    attempt = models.ForeignKey(PaymentAttempt, on_delete=models.CASCADE, related_name="transactions", verbose_name="تلاش پرداخت")
    amount = models.IntegerField(verbose_name="مبلغ تراکنش")
    ref_id = models.CharField(max_length=100, verbose_name="شماره پیگیری تراکنش")
    status = models.CharField(max_length=20, default="success", verbose_name="وضعیت")

    class Meta:
        verbose_name = "لاگ تراکنش درگاه"
        verbose_name_plural = "۵. آرشیو تراکنش‌های مستقیم درگاه"


class RefundTransaction(BaseModel):
    """مدل درخواست استرداد وجه مشتریان و تراکنش مرجوعی (Refunds)"""
    STATUS_CHOICES = [
        ('requested', 'درخواست شده (معلق)'),
        ('approved', 'تایید شده (در انتظار پرداخت)'),
        ('rejected', 'رد شده'),
        ('paid', 'پرداخت شده و تسویه موفق'),
    ]

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="refunds", verbose_name="تراکنش اصلی پرداخت")
    amount = models.IntegerField(verbose_name="مبلغ استرداد (تومان)")
    reason = models.TextField(verbose_name="علت مرجوعی")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested', verbose_name="وضعیت ممیزی")
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="سرپرست ممیزی مالی")

    class Meta:
        verbose_name = "درخواست مرجوعی"
        verbose_name_plural = "۶. درخواست‌های استرداد وجه (Refunds)"

    def __str__(self):
        return f"مرجوعی پرداخت #{self.payment.id}: {self.amount:,} تومان"


class PaymentLog(BaseModel):
    """لاگ مانیتورینگ و اودیت پرداخت‌ها (Security Audit Logs)"""
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs", verbose_name="پرداخت")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="کاربر")
    action = models.CharField(max_length=100, verbose_name="رویداد تراکنش (Action)")
    details = models.TextField(blank=True, verbose_name="جزئیات و پارامترها")
    ip_address = models.GenericIPAddressField(verbose_name="آدرس IP")
    browser_agent = models.CharField(max_length=255, verbose_name="مرورگر")

    class Meta:
        verbose_name = "لاگ مانیتورینگ مالی"
        verbose_name_plural = "۷. لاگ‌های اودیت پرداخت‌ها"
