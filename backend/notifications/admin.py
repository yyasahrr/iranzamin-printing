from django.contrib import admin
from django.utils.html import format_html
from .models import NotificationTemplate, NotificationQueue, NotificationPreference


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'name', 'channel_tag', 'subject', 'is_active')
    list_filter = ('channel', 'is_active')
    search_fields = ('title', 'name', 'subject', 'body')
    list_editable = ('is_active',)

    def channel_tag(self, obj):
        colors = {
            'email': '#38bdf8',
            'sms': '#fbbf24',
            'in_app': '#10b981'
        }
        color = colors.get(obj.channel, 'var(--text)')
        return format_html('<strong style="color: {};">{}</strong>', color, obj.get_channel_display())
    channel_tag.short_description = "کانال ارسال"


@admin.register(NotificationQueue)
class NotificationQueueAdmin(admin.ModelAdmin):
    list_display = ('recipient_styled', 'user', 'channel_display', 'status_badge', 'is_read_badge', 'created_at')
    list_filter = ('status', 'channel', 'is_read', 'created_at')
    search_fields = ('recipient', 'subject', 'body', 'user__phone_number')
    readonly_fields = ('user', 'template', 'channel', 'recipient', 'subject', 'body', 'status', 'retry_count', 'max_retries', 'error_log', 'is_read', 'is_archived', 'sent_at')

    def recipient_styled(self, obj):
        return format_html('<code style="font-size: 11px;">{}</code>', obj.recipient)
    recipient_styled.short_description = "آدرس گیرنده"

    def channel_display(self, obj):
        return obj.get_channel_display()
    channel_display.short_description = "کانال"

    def is_read_badge(self, obj):
        if obj.is_read:
            return format_html('<span style="color: #94a3b8;">خوانده شده</span>')
        return format_html('<strong style="color: var(--accent);">خوانده نشده 🔵</strong>')
    is_read_badge.short_description = "وضعیت خوانده شدن"

    def status_badge(self, obj):
        colors = {
            'pending': ('#fee2e2', '#dc2626', 'در انتظار'),
            'processing': ('#e0f2fe', '#0284c7', 'ارسال...'),
            'sent': ('#dcfce7', '#15803d', 'ارسال موفق'),
            'failed': ('#fee2e2', '#dc2626', 'خطا در ارسال'),
            'retry': ('#fef3c7', '#d97706', 'بازتلاش مجدد'),
        }
        bg, text, label = colors.get(obj.status, ('#f3f4f6', '#4b5563', obj.status))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            bg, text, label
        )
    status_badge.short_description = "وضعیت صف ارسال"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'receive_email', 'receive_sms', 'receive_marketing', 'receive_system_alerts', 'receive_promotions')
    list_filter = ('receive_email', 'receive_sms', 'receive_marketing')
    search_fields = ('user__phone_number', 'user__full_name')
