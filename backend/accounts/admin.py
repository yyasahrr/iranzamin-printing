from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    OTPRequest,
    Organization,
    Department,
    Team,
    Role,
    TeamMembership,
    UserActiveSession,
    SecurityAuditLog
)

User = get_user_model()


class TeamMembershipInline(admin.TabularInline):
    """مدیریت عضویت تیمی کارمندان به صورت اینلاین در صفحه تیم"""
    model = TeamMembership
    extra = 1
    fields = ('user', 'role')


class DepartmentInline(admin.TabularInline):
    """مدیریت دپارتمان‌های یک سازمان به صورت اینلاین"""
    model = Department
    extra = 1
    fields = ('name',)


@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    """مدیریت شناسنامه هویتی کاربران و سطوح دسترسی امنیت سایبری (IAM)"""
    list_display = ('avatar_tag', 'phone_number', 'full_name', 'email', 'status_badge', 'is_staff', 'date_joined')
    list_filter = ('status', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('phone_number', 'full_name', 'email')
    ordering = ('-date_joined',)
    
    fieldsets = (
        ('۱. اطلاعات احراز هویت اصلی', {'fields': ('phone_number', 'password')}),
        ('۲. اطلاعات شخصی و اولویت‌ها (Identity Profile)', {'fields': ('full_name', 'email', 'avatar', 'language', 'timezone', 'preferences')}),
        ('۳. وضعیت هویت و تاییدهای امنیت', {'fields': ('status', 'is_email_verified', 'is_phone_verified')}),
        ('۴. سطوح دسترسی سایبری ادمین', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('۵. حفاظت درگاه (محدودسازی ورود ناموفق)', {'fields': ('failed_login_attempts', 'last_failed_login')}),
        ('۶. تاریخچه‌ها', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined', 'last_failed_login')

    def avatar_tag(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />', obj.avatar.url)
        first_char = (obj.full_name or obj.phone_number)[0]
        return format_html(
            '<div style="width: 30px; height: 30px; background: #0284c7; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">{}</div>',
            first_char
        )
    avatar_tag.short_description = "پروفایل"

    def status_badge(self, obj):
        colors = {
            'active': ('#dcfce7', '#15803d', 'فعال'),
            'pending': ('#fef3c7', '#d97706', 'در انتظار تایید'),
            'suspended': ('#fee2e2', '#dc2626', 'تعلیق شده'),
            'blocked': ('#fee2e2', '#dc2626', 'مسدود امنیتی'),
            'archived': ('#f3f4f6', '#4b5563', 'بایگانی شده'),
        }
        bg, text, label = colors.get(obj.status, ('#f3f4f6', '#4b5563', obj.status))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            bg, text, label
        )
    status_badge.short_description = "وضعیت حساب"


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'code', 'created_at', 'expires_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('phone_number', 'code')
    readonly_fields = ('phone_number', 'code', 'created_at', 'expires_at')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """مدیریت سازمان‌ها و هلدینگ‌های B2B"""
    list_display = ('name', 'registration_number', 'tax_id', 'owner', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'registration_number', 'tax_id', 'owner__phone_number')
    inlines = [DepartmentInline]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization')
    list_filter = ('organization',)
    search_fields = ('name', 'organization__name')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    """مدیریت تیم‌های کاری پرسنل کارگاه"""
    list_display = ('name', 'department', 'description')
    list_filter = ('department__organization', 'department')
    search_fields = ('name', 'description')
    inlines = [TeamMembershipInline]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """مدیریت پویای نقش‌های پرسنل (Role Builder)"""
    list_display = ('name', 'description')
    search_fields = ('name', 'description')
    filter_horizontal = ('permissions',)


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role')
    list_filter = ('team', 'role')
    search_fields = ('user__phone_number', 'user__full_name', 'role__name')


@admin.register(UserActiveSession)
class UserActiveSessionAdmin(admin.ModelAdmin):
    """مدیریت نشست‌های فعال مانیتورینگ امنیتی"""
    list_display = ('user', 'ip_address', 'last_active', 'browser_agent')
    readonly_fields = ('user', 'ip_address', 'browser_agent', 'last_active')
    search_fields = ('user__phone_number', 'ip_address')


@admin.register(SecurityAuditLog)
class SecurityAuditLogAdmin(admin.ModelAdmin):
    """اودیت تریل و مانیتورینگ نفوذهای امنیتی کارگاه چاپی"""
    list_display = ('user', 'event_type', 'ip_address', 'created_at', 'details')
    list_filter = ('event_type', 'created_at')
    readonly_fields = ('user', 'event_type', 'ip_address', 'browser_agent', 'details', 'created_at')
    search_fields = ('user__phone_number', 'ip_address', 'details')
