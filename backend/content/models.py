from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import BaseModel


class Category(BaseModel):
    """مدل دسته‌بندی‌های وبلاگ و آکادمی (Categories)"""
    name = models.CharField(max_length=100, verbose_name="نام دسته‌بندی")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="آدرس متنی (Slug)")
    description = models.TextField(blank=True, verbose_name="توضیحات کوتاه")

    class Meta:
        verbose_name = "دسته‌بندی محتوا"
        verbose_name_plural = "۱. دسته‌بندی‌های محتوایی"

    def __str__(self):
        return self.name


class Tag(BaseModel):
    """مدل برچسب‌های وبلاگ (Tags)"""
    name = models.CharField(max_length=100, verbose_name="نام برچسب")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="آدرس متنی (Slug)")

    class Meta:
        verbose_name = "برچسب محتوا"
        verbose_name_plural = "۲. برچسب‌های وبلاگ"

    def __str__(self):
        return self.name


class MediaFile(BaseModel):
    """مدل رسانه‌ها و کتابخانه چندرسانه‌ای (Media Library)"""
    FILE_TYPE_CHOICES = [
        ('image', 'تصویر (Image)'),
        ('pdf', 'کتابچه پی‌دی‌اف (PDF)'),
        ('video', 'ویدیو آموزشی (Video)'),
        ('document', 'سند اداری (Doc/Zip)'),
    ]

    file = models.FileField(upload_to="media_library/", verbose_name="فایل")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='image', verbose_name="نوع رسانه")
    file_size = models.PositiveIntegerField(default=0, verbose_name="حجم فایل (بایت)")
    usage_count = models.PositiveIntegerField(default=0, verbose_name="تعداد دفعات استفاده در مقالات")

    class Meta:
        verbose_name = "فایل رسانه‌ای"
        verbose_name_plural = "۳. کتابخانه چندرسانه‌ای (Media Library)"

    def __str__(self):
        return f"فایل {self.file.name.split('/')[-1]} ({self.get_file_type_display()})"


class Post(BaseModel):
    """مدل مقالات وبلاگ تخصصی (Blog Posts)"""
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('review', 'در انتظار بازبینی'),
        ('published', 'منتشر شده'),
        ('archived', 'بایگانی شده'),
    ]

    title = models.CharField(max_length=255, verbose_name="عنوان مقاله")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="آدرس متنی (Slug)")
    summary = models.TextField(verbose_name="خلاصه مقاله")
    content = models.TextField(verbose_name="متن کامل مقاله")
    
    featured_image = models.ForeignKey(MediaFile, on_delete=models.SET_NULL, null=True, blank=True, related_name="posts", verbose_name="تصویر شاخص")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="posts", verbose_name="دسته‌بندی")
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts", verbose_name="برچسب‌ها")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="وضعیت انتشار")
    publish_date = models.DateTimeField(default=timezone.now, verbose_name="زمان انتشار (ساعت‌بندی)")
    
    # آمار مانیتورینگ
    reading_time = models.PositiveIntegerField(default=5, verbose_name="زمان مطالعه (دقیقه)")
    view_count = models.PositiveIntegerField(default=0, verbose_name="تعداد بازدید کل")

    # سئو پیشرفته پلتفرم چاپی (SEO Rules)
    meta_title = models.CharField(max_length=150, blank=True, verbose_name="Meta Title")
    meta_description = models.TextField(blank=True, verbose_name="Meta Description")
    canonical_url = models.URLField(blank=True, verbose_name="Canonical URL")

    class Meta:
        verbose_name = "مقاله وبلاگ"
        verbose_name_plural = "۴. مقالات وبلاگ چاپی"
        ordering = ['-publish_date']

    def __str__(self):
        return self.title


class Page(BaseModel):
    """مدل صفحات ایستا و صفحات فرود بازاریابی (Static & Landing Pages)"""
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('published', 'منتشر شده'),
    ]

    PAGE_TYPE_CHOICES = [
        ('static', 'صفحه ایستای عمومی (Static)'),
        ('landing', 'صفحه فرود تبلیغاتی (Landing)'),
    ]

    title = models.CharField(max_length=255, verbose_name="عنوان صفحه")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="آدرس متنی (Slug)")
    content = models.TextField(verbose_name="محتوای HTML/متنی صفحه")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="وضعیت انتشار")
    page_type = models.CharField(max_length=20, choices=PAGE_TYPE_CHOICES, default='static', verbose_name="نوع صفحه")
    version = models.PositiveIntegerField(default=1, verbose_name="نسخه صفحه (Versioning)")

    # سئو
    meta_title = models.CharField(max_length=150, blank=True, verbose_name="Meta Title")
    meta_description = models.TextField(blank=True, verbose_name="Meta Description")

    class Meta:
        verbose_name = "صفحه سیستم"
        verbose_name_plural = "۵. صفحات ایستا و فرود (CMS)"

    def __str__(self):
        return f"{self.title} ({self.get_page_type_display()})"


class FAQ(BaseModel):
    """مدل سوالات متداول مشتریان (FAQ Engine)"""
    question = models.CharField(max_length=255, verbose_name="پرسش")
    answer = models.TextField(verbose_name="پاسخ کوتاه کارگاه")
    order_index = models.PositiveIntegerField(default=1, verbose_name="ترتیب نمایش")

    class Meta:
        verbose_name = "سوال متداول"
        verbose_name_plural = "۶. سوالات متداول مشتریان (FAQ)"
        ordering = ['order_index']

    def __str__(self):
        return self.question


class Comment(BaseModel):
    """مدل نظرات مقالات و فاکتورها (آماده‌سازی بک‌اند جهت فازهای آینده)"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments", verbose_name="مقاله")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="کاربر")
    text = models.TextField(verbose_name="متن نظر")
    is_approved = models.BooleanField(default=False, verbose_name="تایید شده؟")

    class Meta:
        verbose_name = "نظر کاربر"
        verbose_name_plural = "نظرات و دیدگاه‌های کاربران"
        ordering = ['-created_at']


# ==========================================================================
#              جدول‌های جدید اختصاصی پرتال آموزشی آکادمی (Academy)
# ==========================================================================

class Course(BaseModel):
    """مدل دوره‌های آموزشی آکادمی چاپ روشن (Courses)"""
    title = models.CharField(max_length=255, verbose_name="عنوان دوره آموزشی")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="آدرس متنی (Slug)")
    summary = models.TextField(verbose_name="توضیحات کوتاه سرفصل")
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="taught_courses", verbose_name="مدرس دوره")
    cover_image = models.ForeignKey(MediaFile, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="تصویر کاور")

    class Meta:
        verbose_name = "دوره آموزشی"
        verbose_name_plural = "۷. دوره‌های آموزشی (Academy)"

    def __str__(self):
        return self.title


class Lesson(BaseModel):
    """مدل درس‌های هر دوره آموزشی (Lessons)"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons", verbose_name="دوره آموزشی")
    title = models.CharField(max_length=255, verbose_name="عنوان درس")
    slug = models.SlugField(max_length=255, verbose_name="آدرس متنی (Slug)")
    content = models.TextField(blank=True, verbose_name="محتوای متنی درس")
    video = models.ForeignKey(MediaFile, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="ویدیو آموزشی")
    order_index = models.PositiveIntegerField(default=1, verbose_name="ترتیب درس")

    class Meta:
        verbose_name = "درس دوره"
        verbose_name_plural = "درس‌های دوره‌های آموزشی"
        ordering = ['order_index']

    def __str__(self):
        return f"{self.title} (دوره: {self.course.title})"
