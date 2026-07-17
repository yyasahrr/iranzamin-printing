from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, Permission
from django.utils import timezone
from apps.core.models import BaseModel
import datetime
import random
import uuid


class UserManager(BaseUserManager):
    """مدیریت کاربران با استفاده از شماره موبایل به عنوان شناسه اصلی"""
    
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('شماره موبایل الزامی است.')
        phone_number = self.normalize_phone(phone_number)
        extra_fields.setdefault('username', phone_number)
        extra_fields.setdefault('is_active', True)
        user = self.model(phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone_number, password, **extra_fields)

    def normalize_phone(self, phone_number):
        phone = ''.join(filter(str.isdigit, str(phone_number)))
        if phone.startswith('98'):
            phone = '0' + phone[2:]
        elif not phone.startswith('0') and len(phone) == 10:
            phone = '0' + phone
        return phone


class User(AbstractUser):
    """مدل کاربر سفارشی مجهز به مشخصات کامل هویتی (Identity)"""
    STATUS_CHOICES = [
        ('active', 'فعال و تایید شده (Active)'),
        ('pending', 'در انتظار تایید (Pending)'),
        ('suspended', 'تعلیق شده موقت (Suspended)'),
        ('blocked', 'مسدود شده امنیتی (Blocked)'),
        ('archived', 'بایگانی شده (Archived)'),
    ]

    phone_number = models.CharField(
        max_length=11, 
        unique=True, 
        verbose_name="شماره موبایل",
        help_text="فرمت: 09123456789"
    )
    full_name = models.CharField(
        max_length=150, 
        blank=True, 
        verbose_name="نام و نام خانوادگی"
    )
    
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True,
        verbose_name="نام کاربری"
    )

    # فیلدهای تایید هویت و امنیت کاربری (IAM Verification)
    is_email_verified = models.BooleanField(default=False, verbose_name="ایمیل تایید شده؟")
    is_phone_verified = models.BooleanField(default=False, verbose_name="شماره همراه تایید شده؟")
    
    # مشخصات تکمیلی هویت و اولویت‌ها (Identity Profile)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True, verbose_name="آواتار کاربر")
    language = models.CharField(max_length=10, default="fa", verbose_name="زبان پیش‌فرض")
    timezone = models.CharField(max_length=50, default="Asia/Tehran", verbose_name="منطقه زمانی")
    preferences = models.JSONField(default=dict, blank=True, verbose_name="تنظیمات برگزیده")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت حساب")
    
    # سیستم حفاظتی قفل حساب در برابر تلاش‌های ناموفق (Failed Login Protection)
    failed_login_attempts = models.PositiveIntegerField(default=0, verbose_name="دفعات ورود ناموفق متوالی")
    last_failed_login = models.DateTimeField(null=True, blank=True, verbose_name="آخرین تلاش ناموفق")

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران پلتفرم'

    def __str__(self):
        return f"{self.full_name or 'کاربر بدون نام'} ({self.phone_number})"

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.phone_number
        super().save(*args, **kwargs)


class OTPRequest(models.Model):
    """مدل درخواست کد تایید OTP"""
    phone_number = models.CharField(max_length=11, verbose_name="شماره موبایل")
    code = models.CharField(max_length=6, verbose_name="کد تایید")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    expires_at = models.DateTimeField(verbose_name="تاریخ انقضا")
    is_used = models.BooleanField(default=False, verbose_name="استفاده شده؟")

    class Meta:
        verbose_name = 'درخواست کد تایید'
        verbose_name_plural = 'درخواست‌های کد تایید'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phone_number} - {self.code}"

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    @classmethod
    def generate_otp(cls, phone_number):
        code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + datetime.timedelta(minutes=3)
        return cls.objects.create(
            phone_number=phone_number,
            code=code,
            expires_at=expires_at
        )


# ==========================================================================
#              ساب‌سیستم‌های پیشرفته مدیریت دسترسی و نقش‌ها (IAM)
# ==========================================================================

class Organization(BaseModel):
    """مدل سازمان‌ها و شرکت‌های حقوقی طرف قرارداد (B2B Multi-Tenant)"""
    name = models.CharField(max_length=255, verbose_name="نام رسمی سازمان / شرکت")
    registration_number = models.CharField(max_length=50, verbose_name="شماره ثبت")
    tax_id = models.CharField(max_length=50, verbose_name="شناسه ملی حقوقی")
    economic_code = models.CharField(max_length=50, blank=True, verbose_name="کد اقتصادی")
    address = models.TextField(verbose_name="آدرس قانونی شرکت")
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name="owned_organizations", verbose_name="مالک حقوقی حساب")

    class Meta:
        verbose_name = "سازمان حقوقی"
        verbose_name_plural = "۲۴. سازمان‌ها و هلدینگ‌های همکار (B2B)"

    def __str__(self):
        return self.name


class Department(BaseModel):
    """مدل دپارتمان‌های اداری داخل سازمان (Departments)"""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="departments", verbose_name="سازمان مربوطه")
    name = models.CharField(max_length=150, verbose_name="نام دپارتمان")

    class Meta:
        verbose_name = "دپارتمان سازمان"
        verbose_name_plural = "۲۵. دپارتمان‌های داخل سازمانی"

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class Team(BaseModel):
    """مدل تیم‌های کاری و لجستیکی چاپخانه روشن (Teams)"""
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="teams", verbose_name="دپارتمان اداری")
    name = models.CharField(max_length=150, verbose_name="نام تیم کاری")
    description = models.TextField(blank=True, verbose_name="شرح وظایف تیم")

    class Meta:
        verbose_name = "تیم کاری"
        verbose_name_plural = "۲۶. تیم‌های کاری کارگاه (Teams)"

    def __str__(self):
        return self.name


class Role(BaseModel):
    """مدل نقش‌های سفارشی پلتفرم (Role Builder)"""
    name = models.CharField(max_length=100, unique=True, verbose_name="عنوان نقش", help_text="مثال: Senior Designer")
    description = models.TextField(blank=True, verbose_name="توضیحات و مسئولیت‌ها")
    permissions = models.ManyToManyField(Permission, blank=True, related_name="custom_roles", verbose_name="مجوزهای دسترسی سیستم")

    class Meta:
        verbose_name = "نقش سفارشی"
        verbose_name_plural = "۲۷. نقش‌های پلتفرم (Role Builder)"

    def __str__(self):
        return self.name


class TeamMembership(BaseModel):
    """مدل انتساب هوشمند کارمندان به تیم‌ها و نقش‌ها (Role + Permission + Team Assignment)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="team_memberships", verbose_name="کاربر")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships", verbose_name="تیم کاری")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="memberships", verbose_name="نقش تخصصی")

    class Meta:
        verbose_name = "عضویت تیم"
        verbose_name_plural = "۲۸. عضویت کارمندان در تیم‌ها و نقش‌ها"

    def __str__(self):
        return f"{self.user.phone_number} - {self.role.name} ({self.team.name})"


class UserActiveSession(BaseModel):
    """مدل مانیتورینگ نشست‌های فعال امنیتی و ورودهای مجاز (Session Management)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="active_sessions", verbose_name="کاربر")
    ip_address = models.GenericIPAddressField(verbose_name="آدرس IP ورود")
    browser_agent = models.CharField(max_length=255, verbose_name="دستگاه و مرورگر (User Agent)")
    last_active = models.DateTimeField(auto_now=True, verbose_name="آخرین فعالیت")

    class Meta:
        verbose_name = "نشست فعال امنیتی"
        verbose_name_plural = "۲۹. مانیتورینگ نشست‌های فعال امنیتی (Sessions)"
        ordering = ['-last_active']

    def __str__(self):
        return f"نشست {self.user.phone_number} - IP: {self.ip_address}"


class SecurityAuditLog(BaseModel):
    """دفتر اودیت و لاگ مانیتورینگ کامل رویدادهای امنیتی چاپخانه (Audit Trail)"""
    EVENT_TYPE_CHOICES = [
        ('login', 'ورود موفق به سیستم (Login)'),
        ('logout', 'خروج موفق از سیستم (Logout)'),
        ('password_change', 'تغییر رمز عبور (Password Change)'),
        ('failed_login', 'ورود ناموفق و مشکوک (Failed Login)'),
        ('impersonation', 'ورود شبیه‌سازی شده ادمین جای کاربر (Impersonation)'),
        ('permission_change', 'تغییر سطوح دسترسی (Permission Change)'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="security_logs", verbose_name="کاربر مربوطه")
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES, verbose_name="نوع رویداد امنیتی")
    ip_address = models.GenericIPAddressField(verbose_name="آدرس IP رویداد")
    browser_agent = models.CharField(max_length=255, verbose_name="مرورگر و دستگاه")
    details = models.TextField(blank=True, verbose_name="شرح کامل لاگ امنیتی")

    class Meta:
        verbose_name = "لاگ مانیتورینگ امنیتی"
        verbose_name_plural = "۳۰. دفتر اودیت و لاگ‌های امنیتی (Audit Log)"
        ordering = ['-created_at']

    def __str__(self):
        return f"رویداد {self.get_event_type_display()} در {self.created_at.strftime('%Y-%m-%d %H:%M')}"
