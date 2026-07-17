from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class NotificationTemplate(BaseModel):
    """مدل الگوهای نوتیفیکیشن و پیامک (Notification Templates)"""
    CHANNEL_CHOICES = [
        ('email', 'پست الکترونیکی (Email)'),
        ('sms', 'پیامک متنی (SMS)'),
        ('in_app', 'اعلان درون‌برنامه‌ای (In-App)'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name="شناسه الگو (انگلیسی)", help_text="مثال: welcome_email")
    title = models.CharField(max_length=150, verbose_name="عنوان فارسی الگو")
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, verbose_name="کانال ارسال")
    subject = models.CharField(max_length=255, blank=True, verbose_name="موضوع ایمیل")
    body = models.TextField(verbose_name="متن الگو", help_text="پشتیبانی از متغیرهایی مثل {{customer_name}} و {{tracking_code}}")
    is_active = models.BooleanField(default=True, verbose_name="فعال؟")

    class Meta:
        verbose_name = "الگوی اعلان"
        verbose_name_plural = "۱. الگوهای اعلانات و پیام‌ها"

    def __str__(self):
        return f"{self.title} ({self.get_channel_display()})"


class NotificationQueue(BaseModel):
    """مدل صف ارسال نوتیفیکیشن و ایمیل (Notification Queue Engine)"""
    STATUS_CHOICES = [
        ('pending', 'در انتظار ارسال (Pending)'),
        ('processing', 'در حال پردازش (Processing)'),
        ('sent', 'با موفقیت ارسال شد (Sent)'),
        ('failed', 'ناموفق / خطا (Failed)'),
        ('retry', 'تلاش مجدد (Retry)'),
    ]

    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="queued_notifications", 
        verbose_name="کاربر گیرنده"
    )
    template = models.ForeignKey(
        NotificationTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="الگوی پیام"
    )
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, verbose_name="کانال")
    recipient = models.CharField(max_length=255, verbose_name="آدرس گیرنده", help_text="شماره همراه یا ایمیل")
    
    subject = models.CharField(max_length=255, blank=True, verbose_name="موضوع اعلان")
    body = models.TextField(verbose_name="متن نهایی پیام")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت ارسال")
    retry_count = models.PositiveIntegerField(default=0, verbose_name="تعداد تلاش‌های مجدد")
    max_retries = models.PositiveIntegerField(default=3, verbose_name="حداکثر دفعات تلاش مجدد")
    error_log = models.TextField(blank=True, verbose_name="لاگ خطای ارسال")
    
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده؟ (مخصوص In-App)")
    is_archived = models.BooleanField(default=False, verbose_name="بایگانی شده؟")
    
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان ارسال موفق")

    class Meta:
        verbose_name = "اعلان صف ارسال"
        verbose_name_plural = "۲. صف اعلانات و پیام‌ها (Queue)"
        ordering = ['-created_at']

    def __str__(self):
        return f"اعلان {self.get_channel_display()} به {self.recipient} ({self.get_status_display()})"


class NotificationPreference(BaseModel):
    """مدل اولویت‌ها و تنظیمات اعلانات کاربران (Notification Preferences)"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="notification_preferences", 
        verbose_name="کاربر"
    )
    receive_email = models.BooleanField(default=True, verbose_name="دریافت پست الکترونیکی (Email)")
    receive_sms = models.BooleanField(default=True, verbose_name="دریافت پیامک متنی (SMS)")
    receive_marketing = models.BooleanField(default=True, verbose_name="دریافت پیام‌های بازاریابی")
    receive_system_alerts = models.BooleanField(default=True, verbose_name="دریافت هشدارهای سیستمی فوری")
    receive_promotions = models.BooleanField(default=True, verbose_name="دریافت کمپین‌ها و تخفیف‌ها")

    class Meta:
        verbose_name = "تنظیمات دریافت اعلان"
        verbose_name_plural = "۳. تنظیمات دریافت اعلانات کاربران"

    def __str__(self):
        return f"تنظیمات نوتیفیکیشن کاربر {self.user.phone_number}"

    @classmethod
    def get_for_user(cls, user):
        """دریافت یا ایجاد خودکار ترجیحات نوتیفیکیشن کاربر"""
        prefs, _ = cls.objects.get_or_create(user=user)
        return prefs
