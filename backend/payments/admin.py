from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import Gateway, Invoice, Payment, PaymentAttempt, GatewayTransaction, RefundTransaction, PaymentLog


class PaymentAttemptInline(admin.TabularInline):
    model = PaymentAttempt
    extra = 0
    fields = ('gateway', 'authority', 'amount', 'status', 'transaction_id')
    readonly_fields = ('gateway', 'authority', 'amount', 'status', 'transaction_id')
    can_delete = False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ('amount', 'payment_method', 'status', 'created_at')
    readonly_fields = ('amount', 'payment_method', 'status', 'created_at')
    can_delete = False


@admin.register(Gateway)
class GatewayAdmin(admin.ModelAdmin):
    list_display = ('title', 'name', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('title', 'name')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number_styled', 'order_link', 'grand_total_formatted', 'status', 'issue_date', 'due_date')
    list_filter = ('status', 'issue_date')
    search_fields = ('invoice_number', 'order__tracking_code')
    list_editable = ('status',)
    readonly_fields = ('invoice_number', 'grand_total', 'issue_date')
    inlines = [PaymentInline]

    def invoice_number_styled(self, obj):
        return format_html('<span style="font-family: monospace; font-weight: bold; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">{}</span>', obj.invoice_number)
    invoice_number_styled.short_description = "شماره فاکتور"

    def order_link(self, obj):
        return format_html('<a href="/admin/orders/order/{}/change/" style="font-weight: bold; color: #0284c7;">{}</a>', obj.order.id, obj.order.tracking_code)
    order_link.short_description = "سفارش مالی مادر"

    def grand_total_formatted(self, obj):
        return format_html('<strong style="color: #16a34a;">{:,} تومان</strong>', obj.grand_total)
    grand_total_formatted.short_description = "مبلغ نهایی فاکتور"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice_link', 'amount_formatted', 'payment_method', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('id', 'invoice__invoice_number')
    list_editable = ('status',)
    readonly_fields = ('invoice', 'amount', 'created_at')
    inlines = [PaymentAttemptInline]

    def invoice_link(self, obj):
        return format_html('<a href="/admin/payments/invoice/{}/change/" style="font-weight: bold; color: #0284c7;">{}</a>', obj.invoice.id, obj.invoice.invoice_number)
    invoice_link.short_description = "فاکتور مربوطه"

    def amount_formatted(self, obj):
        return f"{obj.amount:,} تومان"
    amount_formatted.short_description = "مبلغ پرداختی"

    def status_badge(self, obj):
        colors = {
            'pending': ('#fee2e2', '#dc2626', 'در انتظار پرداخت'),
            'paid': ('#dcfce7', '#15803d', 'پرداخت موفق'),
            'failed': ('#f3f4f6', '#4b5563', 'پرداخت ناموفق'),
            'refunded': ('#fef3c7', '#d97706', 'مرجوع شده'),
        }
        bg, text, label = colors.get(obj.status, ('#f3f4f6', '#4b5563', obj.status))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            bg, text, label
        )
    status_badge.short_description = "وضعیت پرداخت"


@admin.register(PaymentAttempt)
class PaymentAttemptAdmin(admin.ModelAdmin):
    list_display = ('authority_styled', 'payment', 'gateway', 'amount_formatted', 'status', 'transaction_id', 'created_at')
    list_filter = ('status', 'gateway', 'created_at')
    search_fields = ('authority', 'transaction_id')
    readonly_fields = ('payment', 'gateway', 'authority', 'amount', 'status', 'transaction_id', 'response_log')

    def authority_styled(self, obj):
        return format_html('<code style="font-size: 11px;">{}</code>', obj.authority)
    authority_styled.short_description = "Authority"

    def amount_formatted(self, obj):
        return f"{obj.amount:,} تومان"
    amount_formatted.short_description = "مبلغ درگاه"


@admin.register(RefundTransaction)
class RefundTransactionAdmin(admin.ModelAdmin):
    list_display = ('payment', 'amount_formatted', 'status', 'operator', 'created_at')
    list_filter = ('status', 'created_at')
    list_editable = ('status',)
    search_fields = ('payment__invoice__invoice_number', 'reason')

    def amount_formatted(self, obj):
        return f"{obj.amount:,} تومان"
    amount_formatted.short_description = "مبلغ مرجوعی"


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ('payment', 'user', 'action', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at')
    readonly_fields = ('payment', 'user', 'action', 'details', 'ip_address', 'browser_agent', 'created_at')
    search_fields = ('payment__invoice__invoice_number', 'details', 'ip_address')
