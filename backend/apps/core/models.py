from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid


class SoftDeleteQuerySet(models.QuerySet):
    """کوئری‌ست اختصاصی برای پشتیبانی از حذف نرم (Soft Delete)"""
    def delete(self):
        return super().update(deleted_at=timezone.now(), is_active=False)

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    """مدیر هوشمند دیتابیس برای فیلتر خودکار کارهای حذف شده"""
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def get_all_queryset(self):
        """دریافت تمام رکوردها شامل حذف‌شده‌ها برای سیستم‌های گزارش‌گیری و اودیت"""
        return SoftDeleteQuerySet(self.model, using=self._db)


class BaseModel(models.Model):
    """
    کلاس مدل اصلی (Abstract Base Model)
    طبق پیوست فاز چهارم PRD، تمام مدل‌های پلتفرم از این کلاس ارث‌بری می‌کنند.
    """
    id = models.BigAutoField(primary_key=True, verbose_name="شناسه عددی")
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name="شناسه یکتای UUID")
    
    is_active = models.BooleanField(default=True, verbose_name="فعال؟")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ ویرایش")
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)s_set",
        verbose_name="ایجاد کننده"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_%(class)s_set",
        verbose_name="ویرایش کننده"
    )
    
    deleted_at = models.DateTimeField(null=True, blank=True, editable=False, verbose_name="زمان حذف نرم")

    # مدیرهای مدل جهت پشتیبانی پیش‌فرض از Soft Delete
    objects = SoftDeleteManager()
    all_objects = models.Manager() # مدیر خام جنگو بدون فیلتر حذفیات

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        """پیاده‌سازی حذف نرم به جای حذف فیزیکی از هارد دیسک دیتابیس"""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active'])

    def hard_delete(self, *args, **kwargs):
        """حذف قطعی و فیزیکی از حافظه سخت دیتابیس در صورت نیاز ویژه سیستم"""
        super().delete(*args, **kwargs)
