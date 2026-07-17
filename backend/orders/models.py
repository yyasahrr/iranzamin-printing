from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import BaseModel
import random

# ==========================================================================
# ۱. ساب‌سیستم پیکربندی عمومی چاپخانه
# ==========================================================================

class GlobalConfiguration(models.Model):
    """مدل پیکربندی عمومی و تنظیمات پویای فرمول محاسبات مالی و حمل و نقل"""
    title = models.CharField(max_length=100, default="تنظیمات پیش‌فرض چاپخانه", verbose_name="عنوان پیکربندی")
    double_side_factor = models.FloatField(default=1.16, verbose_name="ضریب چاپ دورو رنگی")
    rounding_threshold = models.IntegerField(default=10000, verbose_name="مبنای رند کردن قیمت (تومان)")
    vat_percentage = models.PositiveIntegerField(default=0, verbose_name="درصد مالیات بر ارزش افزوده (VAT)")
    base_shipping_cost = models.IntegerField(default=50000, verbose_name="هزینه ثابت حمل و نقل (تومان)")
    free_shipping_threshold = models.IntegerField(default=3000000, verbose_name="حداقل مبلغ سفارش برای ارسال رایگان (تومان)")
    is_active = models.BooleanField(default=True, verbose_name="فعال؟ (فقط یک پیکربندی فعال است)")

    class Meta:
        verbose_name = "تنظیمات عمومی فرمول و ارسال"
        verbose_name_plural = " تنظیمات عمومی فرمول و حمل و نقل"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.is_active:
            GlobalConfiguration.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_config(cls):
        config = cls.objects.filter(is_active=True).first()
        if not config:
            config = cls.objects.create(
                title="تنظیمات پیش‌فرض چاپخانه",
                double_side_factor=1.16,
                rounding_threshold=10000,
                vat_percentage=0,
                base_shipping_cost=50000,
                free_shipping_threshold=3000000,
                is_active=True
            )
        return config


# ==========================================================================
# ۲. ساب‌سیستم پیمانکاران، محصولات و خدمات تکمیلی
# ==========================================================================

class Supplier(models.Model):
    """مدل پیمانکاران و چاپخانه‌های همکار (سیستم برون‌سپاری)"""
    name = models.CharField(max_length=150, verbose_name="نام پیمانکار / کارگاه")
    specialty = models.CharField(max_length=100, verbose_name="تخصص اصلی")
    phone = models.CharField(max_length=15, verbose_name="شماره تماس")
    address = models.TextField(blank=True, verbose_name="آدرس کارگاه")
    rating = models.PositiveIntegerField(default=5, verbose_name="امتیاز کیفیت کار (از ۵)")

    class Meta:
        verbose_name = "پیمانکار همکار"
        verbose_name_plural = "۶. پیمانکاران و کارگاه‌های همکار"

    def __str__(self):
        return f"{self.name} ({self.specialty})"


class Product(models.Model):
    """مدل محصول برای سیستم چاپ"""
    CATEGORY_CHOICES = [
        ('stationary', 'اوراق اداری و کارت ویزیت'),
        ('advertising', 'تبلیغات و نمایشگاهی'),
        ('packaging', 'بسته‌بندی و جعبه'),
        ('label', 'لیبل و استیکر'),
        ('other', 'سایر موارد اختصاصی'),
    ]

    id = models.CharField(max_length=50, primary_key=True, verbose_name="شناسه یکتا (انگلیسی)")
    title = models.CharField(max_length=100, verbose_name="عنوان محصول")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='stationary', verbose_name="دسته‌بندی")
    description = models.TextField(verbose_name="توضیحات کوتاه")
    unit_price = models.IntegerField(verbose_name="قیمت فروش پایه هر واحد (تومان)")
    unit_production_cost = models.IntegerField(default=1500, verbose_name="هزینه خام تولید هر واحد (تومان)")
    delivery_days = models.PositiveIntegerField(default=5, verbose_name="زمان تقریبی تحویل (روز)")
    default_supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name="products", verbose_name="پیمانکار پیش‌فرض")
    is_active = models.BooleanField(default=True, verbose_name="فعال؟")

    class Meta:
        verbose_name = "محصول و تعرفه"
        verbose_name_plural = "۱. محصولات و تعرفه‌ها"
        ordering = ['title']

    def __str__(self):
        return f"{self.title} (قیمت پایه: {self.unit_price:,} تومان)"


class Finish(models.Model):
    """مدل خدمات تکمیلی چاپ (مانند طلاکوب، روکش مات، برجسته‌سازی)"""
    id = models.CharField(max_length=50, primary_key=True, verbose_name="شناسه یکتا (انگلیسی)")
    label = models.CharField(max_length=100, verbose_name="نام خدمت تکمیلی")
    factor = models.FloatField(verbose_name="ضریب قیمت")
    is_active = models.BooleanField(default=True, verbose_name="فعال؟")

    class Meta:
        verbose_name = "خدمت تکمیلی"
        verbose_name_plural = "۲. خدمات تکمیلی چاپی"
        ordering = ['label']

    def __str__(self):
        return f"{self.label} (+{int(self.factor * 100)}٪)"


# ==========================================================================
# ۳. ساب‌سیستم شیت‌های عمومی و سفارشات مالی (Order)
# ==========================================================================

class PrintingSheet(models.Model):
    """مدل فرم عمومی چاپی (سیستم بهینه‌سازی چیدمان کارت ویزیت و تراکت)"""
    SHEET_STATUS_CHOICES = [
        ('collecting', 'در حال جمع‌آوری کارت‌ها (باز)'),
        ('full', 'تکمیل شده - در انتظار ارسال به لیتوگرافی'),
        ('printing', 'در حال چاپ در چاپخانه'),
        ('finished', 'برش‌خورده و پایان‌یافته'),
    ]

    title = models.CharField(max_length=150, verbose_name="عنوان فرم عمومی")
    material = models.CharField(max_length=100, verbose_name="جنس مشترک فرم")
    max_capacity = models.PositiveIntegerField(default=80, verbose_name="حداکثر ظرفیت فرم (تعداد کارت)")
    status = models.CharField(max_length=20, choices=SHEET_STATUS_CHOICES, default='collecting', verbose_name="وضعیت فرم چاپی")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد فرم")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ بسته‌شدن و تکمیل فرم")

    class Meta:
        verbose_name = "فرم عمومی چاپی"
        verbose_name_plural = "۷. شیت‌ها و فرم‌های عمومی چاپخانه"

    def __str__(self):
        return f"فرم {self.title} - وضعیت: {self.get_status_display()} ({self.jobs.count() if hasattr(self, 'jobs') else 0}/{self.max_capacity})"


class Order(models.Model):
    """مدل فاکتور/سفارش مشتری (Order)"""
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'پرداخت نشده'),
        ('paid', 'پرداخت شده و موفق'),
        ('failed', 'پرداخت ناموفق'),
        ('refunded', 'مرجوع شده (سفارش لغو شده)'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('online', 'پرداخت آنلاین بانکی (درگاه مستقیم)'),
        ('card_transfer', 'کارت به کارت (تایید ادمین)'),
        ('manual', 'تسویه حساب حضوری / اعتباری'),
    ]

    tracking_code = models.CharField(
        max_length=20, 
        unique=True, 
        verbose_name="کد رهگیری فاکتور", 
        db_index=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="orders", 
        verbose_name="کاربر ثبت‌کننده"
    )
    
    shipping_city = models.CharField(max_length=50, blank=True, verbose_name="شهر مقصد")
    shipping_address = models.TextField(blank=True, verbose_name="آدرس دقیق پستی")
    postal_code = models.CharField(max_length=10, blank=True, verbose_name="کد پستی ۱۰ رقمی")
    
    shipping_cost = models.IntegerField(default=0, verbose_name="هزینه حمل و نقل (تومان)")
    total_payable = models.IntegerField(default=0, verbose_name="کل مبلغ نهایی فاکتور (تومان)")
    
    payment_status = models.CharField(
        max_length=20, 
        choices=PAYMENT_STATUS_CHOICES, 
        default='unpaid', 
        verbose_name="وضعیت پرداخت فاکتور"
    )
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHOD_CHOICES, 
        default='online', 
        verbose_name="درگاه پرداخت"
    )
    transaction_id = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name="کد پیگیری بانکی (RefID)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت سفارش")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        verbose_name = "سفارش مشتری"
        verbose_name_plural = "۳. سفارشات ثبت شده چاپی"
        ordering = ['-created_at']

    def __str__(self):
        return f"سفارش {self.tracking_code} ({self.get_payment_status_display()})"

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            timestamp = str(int(timezone.now().timestamp() * 1000))[-7:]
            self.tracking_code = f"CR-{timestamp}"
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        jobs_price = sum([job.estimated_price for job in self.jobs.all()])
        config = GlobalConfiguration.get_active_config()
        
        if jobs_price >= config.free_shipping_threshold or jobs_price == 0:
            self.shipping_cost = 0
        else:
            self.shipping_cost = config.base_shipping_cost
            
        self.total_payable = jobs_price + self.shipping_cost
        Order.objects.filter(pk=self.pk).update(
            shipping_cost=self.shipping_cost,
            total_payable=self.total_payable
        )


def order_file_upload_path(instance, filename):
    return f"orders/{instance.tracking_code or 'temp'}/{filename}"


def job_file_upload_path(instance, filename):
    return f"orders/{instance.order.tracking_code}/jobs/{instance.id or 'temp'}/{filename}"


# ==========================================================================
# ۴. ساب‌سیستم منابع کارگاهی (Resource Allocation)
# ==========================================================================

class Resource(BaseModel):
    """مدل منابع تجاری و تولیدی چاپخانه (Resource-Centric Architecture)"""
    RESOURCE_TYPE_CHOICES = [
        ('machine', 'ماشین‌آلات و دستگاه‌های چاپ فیزیکی'),
        ('designer', 'پرسنل و طراحان ناظر آتلیه'),
        ('operator', 'اپراتور و کادر کارگاه فنی'),
        ('cutter', 'میز و دستگاه‌های برش‌کاری'),
        ('laminator', 'دستگاه‌های روکش و سلفون‌کشی'),
        ('vehicle', 'خودروهای ارسال و ناوگان حمل و نقل'),
        ('shift', 'شیفت‌های کاری و سالن‌های تولید'),
        ('other', 'سایر منابع متفرقه کارگاه'),
    ]

    name = models.CharField(max_length=150, verbose_name="نام منبع")
    resource_type = models.CharField(max_length=30, choices=RESOURCE_TYPE_CHOICES, verbose_name="نوع منبع")
    capacity_hours = models.PositiveIntegerField(default=8, verbose_name="کل ظرفیت روزانه (ساعت کار)")
    used_hours = models.FloatField(default=0.0, verbose_name="ظرفیت اشغال شده امروز (ساعت)")

    class Meta:
        verbose_name = "منبع کارگاه"
        verbose_name_plural = "۱۹. مدیریت منابع و ماشین‌آلات (Resources)"

    def __str__(self):
        return f"{self.name} ({self.get_resource_type_display()})"


# ==========================================================================
# ۵. ساب‌سیستم کارهای تولیدی کارگاهی (Job)
# ==========================================================================

class Job(BaseModel):
    """مدل کار تولیدی (Job) - قلب تپنده پلتفرم چاپی فاز چهارم"""
    STATUS_CHOICES = [
        ('created', 'ثبت شده / آماده بررسی فایل'),
        ('review', 'در حال بررسی فنی فایل توسط ناظر'),
        ('design', 'در حال طراحی / اصلاحات رنگ آتلیه'),
        ('printing', 'در حال تولید در چاپخانه فیزیکی'),
        ('packaging', 'بسته‌بندی و کنترل کیفیت'),
        ('shipping', 'تحویل پست / ارسال شده'),
        ('delivered', 'تحویل شده به مشتری'),
        ('cancelled', 'لغو شده'),
    ]

    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name="jobs", 
        verbose_name="سفارش فاکتور مالی"
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.PROTECT, 
        related_name="jobs", 
        verbose_name="محصول"
    )
    
    quantity = models.PositiveIntegerField(verbose_name="تیراژ (تعداد)")
    material = models.CharField(max_length=100, verbose_name="جنس کاغذ/مقوا")
    size = models.CharField(max_length=100, verbose_name="ابعاد")
    print_side = models.CharField(max_length=100, verbose_name="نوع چاپ (یک‌رو / دورو)")
    finishes = models.ManyToManyField(Finish, blank=True, verbose_name="خدمات تکمیلی")
    
    file = models.FileField(
        upload_to=job_file_upload_path, 
        null=True, 
        blank=True, 
        verbose_name="فایل طراحی اختصاصی"
    )
    file_name_display = models.CharField(
        max_length=255, 
        blank=True, 
        verbose_name="نام فایل ارسالی"
    )
    customer_name = models.CharField(max_length=100, verbose_name="نام کار روی شیت")
    customer_phone = models.CharField(max_length=11, verbose_name="شماره تماس پیگیری")
    customer_note = models.TextField(blank=True, null=True, verbose_name="توضیحات سفارش")
    
    estimated_price = models.IntegerField(verbose_name="مبلغ فروش این کار (تومان)")
    production_cost = models.IntegerField(default=0, verbose_name="کل هزینه خام تولید این کار (تومان)")
    net_profit = models.IntegerField(default=0, verbose_name="سود خالص این کار (تومان)")
    
    is_sample_pack = models.BooleanField(default=False, verbose_name="درخواست پک نمونه رایگان؟")
    printing_sheet = models.ForeignKey(
        PrintingSheet, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="jobs", 
        verbose_name="شیت چاپی مربوطه"
    )
    
    assigned_supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="assigned_jobs", 
        verbose_name="کارگاه پیمانکار همکار"
    )
    supplier_cost = models.IntegerField(default=0, verbose_name="هزینه فاکتور پیمانکار (تومان)")
    
    assigned_designer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_jobs",
        verbose_name="طراح ناظر فایل"
    )

    assigned_resources = models.ManyToManyField(
        Resource, 
        blank=True, 
        related_name="jobs", 
        verbose_name="منابع کارگاهی تخصیص یافته"
    )

    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='created', 
        verbose_name="وضعیت تولید فیزیکی این کار"
    )

    class Meta:
        verbose_name = "کار تولیدی (Job)"
        verbose_name_plural = " کارهای تولیدی کارگاه (Jobs)"
        ordering = ['id']

    def __str__(self):
        return f"کار #{self.id} - {self.product.title} (سفارش {self.order.tracking_code})"

    def save(self, *args, **kwargs):
        self.recalculate_price()
        super().save(*args, **kwargs)
        self.order.recalculate_totals()
        
        if not self.printing_sheet and self.product.id in ["business-card", "sticker"] and not self.is_sample_pack:
            material_key = f"{self.material} - {self.product.title}"
            sheet, _ = PrintingSheet.objects.get_or_create(
                status='collecting',
                material=material_key,
                defaults={"title": f"شیت عمومی {self.product.title} ({self.material})"}
            )
            self.printing_sheet = sheet
            Job.objects.filter(pk=self.pk).update(printing_sheet=sheet)
            sheet.check_capacity()

    def recalculate_price(self):
        if self.is_sample_pack:
            self.estimated_price = 0
            self.production_cost = 25000
            self.net_profit = -25000
            return

        config = GlobalConfiguration.get_active_config()
        
        finish_factor = 0.0
        if self.pk:
            for f in self.finishes.all():
                finish_factor += f.factor
        
        side_factor = config.double_side_factor if self.print_side == "دو رو رنگی" else 1.0
        
        qty_discount = 1.0
        if self.quantity == 500:
            qty_discount = 0.90
        elif self.quantity >= 1000:
            qty_discount = 0.78
            
        price = self.product.unit_price * self.quantity * (1.0 + finish_factor) * side_factor * qty_discount
        self.estimated_price = int(round(price / float(config.rounding_threshold)) * config.rounding_threshold)
        
        base_cost = self.product.unit_production_cost * self.quantity
        self.production_cost = base_cost + self.supplier_cost
        self.net_profit = self.estimated_price - self.production_cost


# ==========================================================================
# ۶. ساب‌سیستم‌های عمومی و متفرقه کارگاه
# ==========================================================================

class CallbackRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار تماس'),
        ('called', 'تماس گرفته شد'),
        ('failed', 'ناموفق / عدم پاسخگویی'),
    ]

    name = models.CharField(max_length=100, verbose_name="نام و نام خانوادگی")
    org = models.CharField(max_length=150, verbose_name="نام سازمان / شرکت")
    phone = models.CharField(max_length=11, verbose_name="شماره تماس")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending', 
        verbose_name="وضعیت بررسی"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت درخواست")

    class Meta:
        verbose_name = "درخواست مشاوره سازمانی"
        verbose_name_plural = "۴. درخواست‌های مشاوره همکاران"
        ordering = ['-created_at']

    def __str__(self):
        return f"مشاوره {self.name} ({self.org}) - {self.phone}"


class PortfolioProject(models.Model):
    slug = models.SlugField(max_length=100, unique=True, verbose_name="آدرس متنی یکتا")
    title = models.CharField(max_length=150, verbose_name="عنوان نمونه کار")
    client = models.CharField(max_length=100, verbose_name="نام مشتری / برند")
    category = models.CharField(max_length=100, verbose_name="دسته‌بندی نمونه کار")
    description = models.TextField(verbose_name="توضیحات و داستان پروژه")
    cover_image = models.ImageField(upload_to="portfolio/covers/", verbose_name="تصویر اصلی پروژه")
    testimonial_text = models.TextField(blank=True, verbose_name="متن نقل‌قول")
    testimonial_author = models.CharField(max_length=100, blank=True, verbose_name="نویسنده نقل‌قول")
    testimonial_role = models.CharField(max_length=100, blank=True, verbose_name="سمت نویسنده")
    is_published = models.BooleanField(default=True, verbose_name="منتشر شده؟")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ انتشار")

    class Meta:
        verbose_name = "نمونه کار"
        verbose_name_plural = "۵. گالری نمونه کارها"
        ordering = ['-created_at']

    def __str__(self):
        return f"نمونه کار: {self.title} ({self.client})"


class PortfolioImage(models.Model):
    project = models.ForeignKey(PortfolioProject, on_delete=models.CASCADE, related_name="gallery_images", verbose_name="پروژه مربوطه")
    image = models.ImageField(upload_to="portfolio/galleries/", verbose_name="تصویر گالری")
    order_index = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")

    class Meta:
        verbose_name = "تصویر گالری"
        verbose_name_plural = "تصاویر گالری نمونه کارها"
        ordering = ['order_index', 'id']


class SMSNotificationLog(models.Model):
    phone_number = models.CharField(max_length=11, verbose_name="شماره دریافت‌کننده")
    message_text = models.TextField(verbose_name="متن پیامک ارسال شده")
    status = models.CharField(max_length=20, default="sent", verbose_name="وضعیت دلیوری")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ارسال")

    class Meta:
        verbose_name = "لاگ پیامک ارسال شده"
        verbose_name_plural = "۸. لاگ‌های اطلاع‌رسانی پیامکی"
        ordering = ['-created_at']

    def __str__(self):
        return f"ارسال به {self.phone_number} در {self.created_at.strftime('%H:%M')}"

    @classmethod
    def log_sms(cls, phone_number, text):
        return cls.objects.create(phone_number=phone_number, message_text=text, status="delivered")


# ==========================================================================
# ۷. ساب‌سیستم‌های پنل کاربری مشتری (Dashboard & CRM)
# ==========================================================================

class DraftOrder(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="drafts", verbose_name="کاربر")
    product_id = models.CharField(max_length=50, verbose_name="شناسه محصول")
    current_step = models.PositiveIntegerField(default=1, verbose_name="آخرین مرحله ویزارد")
    specs_json = models.JSONField(verbose_name="تنظیمات ذخیره شده به فرمت JSON")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین زمان ذخیره‌سازی")

    class Meta:
        verbose_name = "پیش‌نویس سفارش"
        verbose_name_plural = "۹. سفارش‌های پیش‌نویس (Drafts)"
        ordering = ['-updated_at']


class CustomerAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses", verbose_name="کاربر")
    title = models.CharField(max_length=100, verbose_name="عنوان آدرس")
    address_type = models.CharField(max_length=20, choices=[('home', 'خانه'), ('office', 'شرکت'), ('warehouse', 'انبار')], default='office', verbose_name="نوع آدرس")
    city = models.CharField(max_length=100, verbose_name="شهر")
    address = models.TextField(verbose_name="آدرس دقیق پستی")
    postal_code = models.CharField(max_length=10, verbose_name="کد پستی ۱۰ رقمی")
    is_default = models.BooleanField(default=False, verbose_name="آدرس پیش‌فرض ارسال؟")

    class Meta:
        verbose_name = "آدرس مشتری"
        verbose_name_plural = "۱۰. دفترچه آدرس‌های مشتریان"

    def save(self, *args, **kwargs):
        if self.is_default:
            CustomerAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class CompanyProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="company_profile", verbose_name="کاربر رابط حقوقی")
    company_name = models.CharField(max_length=255, verbose_name="نام رسمی شرکت / سازمان")
    registration_number = models.CharField(max_length=50, verbose_name="شماره ثبت")
    tax_id = models.CharField(max_length=50, verbose_name="شناسه ملی حقوقی")
    economic_code = models.CharField(max_length=50, blank=True, verbose_name="کد اقتصادی")
    company_address = models.TextField(verbose_name="آدرس قانونی شرکت")

    class Meta:
        verbose_name = "پروفایل حقوقی شرکت"
        verbose_name_plural = "۱۱. پروفایل مشتریان حقوقی و سازمان‌ها"


class SupportTicket(models.Model):
    PRIORITY_CHOICES = [('low', 'کم'), ('medium', 'متوسط'), ('high', 'فوری')]
    STATUS_CHOICES = [('open', 'باز'), ('answered', 'پاسخ داده شده'), ('closed', 'بسته شده')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets", verbose_name="کاربر")
    subject = models.CharField(max_length=200, verbose_name="موضوع تیکت")
    department = models.CharField(max_length=20, default='sales', verbose_name="دپارتمان")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name="اولویت")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', verbose_name="وضعیت تیکت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین تغییر")

    class Meta:
        verbose_name = "تیکت پشتیبانی"
        verbose_name_plural = "۱۲. تیکت‌های پشتیبانی مشتریان"
        ordering = ['-updated_at']


class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="replies", verbose_name="تیکت مربوطه")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="فرستنده")
    message = models.TextField(verbose_name="متن پاسخ")
    attachment = models.FileField(upload_to="support/attachments/", null=True, blank=True, verbose_name="فایل ضمیمه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        verbose_name = "پاسخ تیکت"
        verbose_name_plural = "پاسخ‌های تیکت‌های پشتیبانی"
        ordering = ['created_at']


class OrderChatMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="chats", verbose_name="سفارش مربوطه")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="فرستنده")
    message = models.TextField(blank=True, verbose_name="متن پیام")
    image = models.ImageField(upload_to="chats/images/", null=True, blank=True, verbose_name="تصویر ارسالی")
    file = models.FileField(upload_to="chats/files/", null=True, blank=True, verbose_name="فایل ضمیمه")
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده؟")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارسال")

    class Meta:
        verbose_name = "پیام سفارش چت"
        verbose_name_plural = "۱۳. گفتگوهای زنده کارگاه و مشتری"
        ordering = ['created_at']


class UserNotification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications", verbose_name="کاربر")
    notification_type = models.CharField(max_length=20, default='order', verbose_name="نوع اعلان")
    title = models.CharField(max_length=200, verbose_name="عنوان اعلان")
    description = models.TextField(verbose_name="توضیحات اعلان")
    action_url = models.CharField(max_length=255, blank=True, verbose_name="آدرس کلیک و ارجاع")
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده؟")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    class Meta:
        verbose_name = "اعلان کاربر"
        verbose_name_plural = "۱۴. اعلان‌های سیستم پنل کاربری"
        ordering = ['-created_at']


class CustomerProfile(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="crm_profile", verbose_name="کاربر")
    customer_code = models.CharField(max_length=20, unique=True, verbose_name="کد مشتری انحصاری", db_index=True)
    is_vip = models.BooleanField(default=False, verbose_name="آیا مشتری VIP است؟")
    score = models.PositiveIntegerField(default=100, verbose_name="امتیاز اعتباری مشتری (از ۱۰۰)")
    credit_limit = models.IntegerField(default=0, verbose_name="سقف اعتبار تجاری (تومان)")
    credit_settlement_days = models.PositiveIntegerField(default=30, verbose_name="مهلت تسویه حساب (روز)")
    health_status = models.CharField(max_length=20, default='healthy', verbose_name="وضعیت سلامت مشتری")
    internal_notes = models.TextField(blank=True, verbose_name="یادداشت‌های مخفی سرپرست فروش")
    tags = models.CharField(max_length=255, default="Loyal", verbose_name="تگ‌های مشتری")
    loyalty_points = models.PositiveIntegerField(default=0, verbose_name="امتیاز باشگاه مشتریان")
    loyalty_level = models.CharField(max_length=50, default="برنزی", verbose_name="سطح وفاداری")

    class Meta:
        verbose_name = "پروفایل مشتری CRM"
        verbose_name_plural = "۱۵. پرونده ۳۶۰ درجه مشتریان (CRM)"

    def save(self, *args, **kwargs):
        if not self.customer_code:
            self.customer_code = f"CU-{random.randint(10000, 99999)}"
        super().save(*args, **kwargs)


class CompanyContact(BaseModel):
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name="contacts", verbose_name="شرکت مربوطه")
    name = models.CharField(max_length=150, verbose_name="نام مخاطب")
    position = models.CharField(max_length=100, verbose_name="سمت / دپارتمان")
    phone = models.CharField(max_length=15, verbose_name="شماره تماس")
    email = models.EmailField(blank=True, verbose_name="ایمیل مستقیم")

    class Meta:
        verbose_name = "مخاطب شرکت همکار"
        verbose_name_plural = "کارمندان و مخاطبین شرکت‌های حقوقی"


# ==========================================================================
# ۸. ساب‌سیستم‌های مالی، هزینه‌ها، مرجوعی‌ها و تخفیف‌ها (Finance ERP)
# ==========================================================================

class Expense(BaseModel):
    expense_type = models.CharField(max_length=30, verbose_name="نوع هزینه")
    amount = models.IntegerField(verbose_name="مبلغ هزینه (تومان)")
    description = models.TextField(blank=True, verbose_name="توضیحات و بابت هزینه")

    class Meta:
        verbose_name = "هزینه کارگاه"
        verbose_name_plural = "۱۶. دفتر ثبت هزینه‌های جاری (Expenses)"
        ordering = ['-created_at']


class Refund(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="refunds", verbose_name="سفارش فاکتور مالی")
    amount = models.IntegerField(verbose_name="مبلغ مرجوعی (تومان)")
    reason = models.TextField(verbose_name="دلیل استرداد وجه")
    status = models.CharField(max_length=20, default='requested', verbose_name="وضعیت استرداد")
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="اپراتور ممیزی")

    class Meta:
        verbose_name = "تراکنش مرجوعی"
        verbose_name_plural = "۱۷. درخواست‌های استرداد وجه (Refunds)"
        ordering = ['-created_at']


class Coupon(BaseModel):
    code = models.CharField(max_length=50, unique=True, verbose_name="کد تخفیف اختصاصی", db_index=True)
    is_percentage = models.BooleanField(default=True, verbose_name="تخفیف درصدی؟")
    discount_amount = models.IntegerField(verbose_name="میزان تخفیف (درصد یا تومان)")
    minimum_amount = models.IntegerField(default=0, verbose_name="حداقل خرید فعال‌سازی (تومان)")
    max_discount = models.IntegerField(default=1000000, verbose_name="حداکثر سقف تخفیف نقدی (تومان)")
    expiration_date = models.DateTimeField(verbose_name="تاریخ انقضا کوپن")
    max_usages = models.PositiveIntegerField(default=100, verbose_name="حداکثر دفعات مصرف کل")
    used_count = models.PositiveIntegerField(default=0, verbose_name="تعداد دفعات مصرف شده فعلی")

    class Meta:
        verbose_name = "کوپن تخفیف"
        verbose_name_plural = "۱۸. کدهای تخفیف و کوپن‌ها (Coupons)"


# ==========================================================================
# ۹. ساب‌سیستم‌های اتوماسیون کارگاه (Automation Rule Builder)
# ==========================================================================

class AutomationRule(BaseModel):
    TRIGGER_EVENT_CHOICES = [
        ('order_created', 'ثبت نهایی سفارش جدید (OrderCreated)'),
        ('payment_completed', 'تسویه حساب موفق فاکتور (PaymentCompleted)'),
        ('file_uploaded', 'آپلود فایل جدید طرح مشتری (FileUploaded)'),
        ('qc_failed', 'رد صلاحیت کیفی کار چاپی (QCFailed)'),
    ]

    ACTION_TYPE_CHOICES = [
        ('send_sms', 'ارسال پیامک اطلاع‌رسانی خودکار'),
        ('assign_designer', 'انتساب خودکار طراح ناظر آتلیه'),
        ('notify_finance', 'ارسال هشدار به واحد حسابداری'),
        ('change_status', 'تغییر خودکار وضعیت تولید کارگاهی'),
    ]

    title = models.CharField(max_length=150, verbose_name="عنوان قانون اتوماسیون")
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_EVENT_CHOICES, verbose_name="رویداد راه‌انداز")
    action_type = models.CharField(max_length=50, choices=ACTION_TYPE_CHOICES, verbose_name="نوع اکشن اتوماتیک")
    action_payload = models.TextField(blank=True, verbose_name="متن پیامک یا پارامترها")

    class Meta:
        verbose_name = "قانون اتوماسیون"
        verbose_name_plural = "۲۰. قوانین موتور اتوماسیون کارگاه (Automation)"


class AutomationLog(BaseModel):
    rule = models.ForeignKey(AutomationRule, on_delete=models.CASCADE, related_name="logs", verbose_name="قانون مربوطه")
    status = models.CharField(max_length=20, default='executed', verbose_name="وضعیت اجرا")
    details = models.TextField(blank=True, verbose_name="جزئیات و گزارش لاگ")

    class Meta:
        verbose_name = "لاگ اجرای اتوماسیون"
        verbose_name_plural = "۲۱. لاگ‌های مانیتورینگ اتوماسیون کارگاه"
        ordering = ['-created_at']


# ==========================================================================
# ۱۰. ساب‌سیستم‌های ویزارد پویای مبتنی بر دیتابیس (Dynamic Wizard Engine)
# ==========================================================================

class Wizard(BaseModel):
    name = models.CharField(max_length=150, verbose_name="نام ویزارد")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wizards", verbose_name="محصول متناظر")
    version = models.PositiveIntegerField(default=1, verbose_name="نسخه ویزارد")
    is_active = models.BooleanField(default=True, verbose_name="فعال؟")

    class Meta:
        verbose_name = "ویزارد پویا"
        verbose_name_plural = "۲۲. موتور ویزاردهای پویای چاپی (Wizard Engine)"


class WizardStep(BaseModel):
    wizard = models.ForeignKey(Wizard, on_delete=models.CASCADE, related_name="steps", verbose_name="ویزارد متناظر")
    title = models.CharField(max_length=150, verbose_name="عنوان مرحله")
    order_index = models.PositiveIntegerField(default=1, verbose_name="ترتیب نمایش مرحله")

    class Meta:
        verbose_name = "مرحله ویزارد"
        verbose_name_plural = "مراحل ویزاردهای پویا"
        ordering = ['order_index']


class WizardField(BaseModel):
    step = models.ForeignKey(WizardStep, on_delete=models.CASCADE, related_name="fields", verbose_name="مرحله متناظر")
    name = models.CharField(max_length=100, verbose_name="شناسه فیلد")
    label = models.CharField(max_length=150, verbose_name="برچسب فارسی فیلد")
    field_type = models.CharField(max_length=30, verbose_name="نوع فیلد")
    options_json = models.JSONField(default=list, blank=True, verbose_name="گزینه‌های فیلد")
    is_required = models.BooleanField(default=True, verbose_name="اجباری است؟")
    default_value = models.CharField(max_length=150, blank=True, verbose_name="مقدار پیش‌فرض فیلد")
    order_index = models.PositiveIntegerField(default=1, verbose_name="ترتیب نمایش")

    class Meta:
        verbose_name = "فیلد پویا"
        verbose_name_plural = "فیلدهای مراحل ویزارد"
        ordering = ['order_index']


class WizardConditionalRule(BaseModel):
    wizard = models.ForeignKey(Wizard, on_delete=models.CASCADE, related_name="conditional_rules", verbose_name="ویزارد متناظر")
    source_field_name = models.CharField(max_length=100, verbose_name="فیلد مبدا شرط")
    value = models.CharField(max_length=100, verbose_name="مقدار شرط")
    target_field_name = models.CharField(max_length=100, blank=True, verbose_name="فیلد هدف اکشن")
    action = models.CharField(max_length=30, verbose_name="اکشن اتوماتیک")
    price_factor = models.FloatField(default=0.0, verbose_name="ضریب تعدیل قیمت")

    class Meta:
        verbose_name = "قانون منطق شرطی"
        verbose_name_plural = "۲۳. موتور منطق شرطی و قوانین قیمت‌گذاری (Logic Engine)"

