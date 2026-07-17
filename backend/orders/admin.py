from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import (
    Product, 
    Finish, 
    Order, 
    Job,
    CallbackRequest, 
    PortfolioProject, 
    PortfolioImage, 
    GlobalConfiguration, 
    Supplier, 
    PrintingSheet, 
    SMSNotificationLog,
    DraftOrder,
    CustomerAddress,
    CompanyProfile,
    SupportTicket,
    TicketReply,
    OrderChatMessage,
    UserNotification,
    CustomerProfile,
    CompanyContact,
    Expense,
    Refund,
    Coupon,
    Resource,
    AutomationRule,
    AutomationLog,
    Wizard,
    WizardStep,
    WizardField,
    WizardConditionalRule
)
from accounts.models import (
    Team,
    TeamMembership,
    UserActiveSession,
    SecurityAuditLog,
    Role,
    Organization,
    Department
)

# سفارشی‌سازی عناوین پنل مدیریت جنگو به زبان فارسی
admin.site.site_header = "پنل مدیریت هوشمند چاپخانه روشن"
admin.site.site_title = "مدیریت چاپ روشن"
admin.site.index_title = "داشبورد کنترل سفارشات و فرآیندهای چاپی"


@admin.register(GlobalConfiguration)
class GlobalConfigurationAdmin(admin.ModelAdmin):
    """مدیریت پیکربندی عمومی فرمول قیمت‌گذاری و حمل و نقل"""
    list_display = (
        'title', 
        'double_side_factor_percent', 
        'rounding_threshold_formatted', 
        'base_shipping_cost_formatted', 
        'free_shipping_threshold_formatted', 
        'is_active'
    )
    list_editable = ('is_active',)
    search_fields = ('title',)

    def double_side_factor_percent(self, obj):
        return f"+{int((obj.double_side_factor - 1.0) * 100)}٪ (ضریب: {obj.double_side_factor})"
    double_side_factor_percent.short_description = "اضافه‌بهای چاپ دورو"

    def rounding_threshold_formatted(self, obj):
        return f"{obj.rounding_threshold:,} تومان"
    rounding_threshold_formatted.short_description = "مبنای رند کردن"

    def base_shipping_cost_formatted(self, obj):
        return f"{obj.base_shipping_cost:,} تومان"
    base_shipping_cost_formatted.short_description = "هزینه ثابت حمل و نقل"

    def free_shipping_threshold_formatted(self, obj):
        return f"{obj.free_shipping_threshold:,} تومان"
    free_shipping_threshold_formatted.short_description = "آستانه ارسال رایگان"


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """مدیریت پیمانکاران همکار"""
    list_display = ('name', 'specialty', 'phone', 'rating_stars')
    list_filter = ('rating', 'specialty')
    search_fields = ('name', 'specialty', 'phone')

    def rating_stars(self, obj):
        return format_html('<span style="color: #fbbf24; font-weight: bold;">{}</span>', '★' * obj.rating)
    rating_stars.short_description = "امتیاز کیفیت"


class JobInlineForSheet(admin.TabularInline):
    """نمایش سفارشات نسبت داده شده به یک شیت عمومی"""
    model = Job
    extra = 0
    verbose_name = "کارت ویزیت / تراکت شیت"
    verbose_name_plural = "لیست کارهای قرار گرفته روی این شیت عمومی"
    fields = ('id', 'product', 'quantity', 'customer_name', 'customer_phone', 'status')
    readonly_fields = ('id', 'product', 'quantity', 'customer_name', 'customer_phone', 'status')
    can_delete = False


@admin.register(PrintingSheet)
class PrintingSheetAdmin(admin.ModelAdmin):
    """مدیریت شیت‌ها و فرم‌های عمومی چاپخانه"""
    list_display = ('title', 'material', 'capacity_bar', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'material')
    list_editable = ('status',)
    inlines = [JobInlineForSheet]

    def capacity_bar(self, obj):
        count = obj.jobs.count()
        percent = int((count / obj.max_capacity) * 100)
        color = "#10b981" if percent >= 100 else "#fbbf24"
        return format_html(
            '<div style="width: 100px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 10px;">'
            '  <div style="width: {}px; height: 10px; background: {};"></div>'
            '</div>'
            '<span style="font-weight: bold;">{}/{} ({}٪)</span>',
            min(percent, 100), color, count, obj.max_capacity, percent
        )
    capacity_bar.short_description = "درصد پرشدن ظرفیت شیت"


class PortfolioImageInline(admin.TabularInline):
    """افزودن چندین عکس به صورت همزمان به اسلایدر نمونه کارها"""
    model = PortfolioImage
    extra = 1
    verbose_name = "تصویر گالری"
    verbose_name_plural = "گالری تصاویر اسلایدر جزئیات"


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'category', 'is_published', 'created_at', 'cover_tag')
    list_filter = ('is_published', 'category', 'created_at')
    search_fields = ('title', 'client', 'description', 'testimonial_text')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PortfolioImageInline]

    def cover_tag(self, obj):
        if obj.cover_image:
            return format_html('<img src="{}" style="width: 50px; height: 35px; border-radius: 4px; object-fit: cover;" />', obj.cover_image.url)
        return "بدون تصویر"
    cover_tag.short_description = "تصویر شاخص"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'id', 'category', 'unit_price_formatted', 'unit_production_cost_formatted', 'default_supplier', 'delivery_days', 'is_active')
    list_filter = ('is_active', 'category', 'default_supplier')
    search_fields = ('title', 'id', 'description')
    list_editable = ('is_active', 'delivery_days')

    def unit_price_formatted(self, obj):
        return f"{obj.unit_price:,} تومان"
    unit_price_formatted.short_description = "قیمت پایه هر واحد"

    def unit_production_cost_formatted(self, obj):
        return f"{obj.unit_production_cost:,} تومان"
    unit_production_cost_formatted.short_description = "هزینه خام ملزومات"


@admin.register(Finish)
class FinishAdmin(admin.ModelAdmin):
    list_display = ('label', 'id', 'factor_percentage', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('label', 'id')
    list_editable = ('is_active',)

    def factor_percentage(self, obj):
        return f"+{int(obj.factor * 100)}٪"
    factor_percentage.short_description = "ضریب تاثیر روی قیمت"


class ChatMessageInline(admin.TabularInline):
    model = OrderChatMessage
    extra = 1
    verbose_name = "پیام گفتگو"
    verbose_name_plural = "گفتگوهای زنده کارگاه و مشتری بر روی این سفارش"
    fields = ('sender', 'message', 'image', 'file', 'is_read', 'created_at')
    readonly_fields = ('created_at',)


class JobInline(admin.StackedInline):
    """نمایش و ویرایش کارهای تولیدی ذیل یک سفارش مالی"""
    model = Job
    extra = 1
    verbose_name = "کار تولیدی (Job)"
    verbose_name_plural = "کارهای تولیدی این سفارش فاکتور (Jobs)"
    filter_horizontal = ('finishes', 'assigned_resources')
    readonly_fields = ('estimated_price', 'production_cost', 'net_profit')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """مدل ادمین فاکتورهای مالی سفارشات گیرندگان مشابه ووکامرس"""
    list_display = (
        'tracking_code_styled', 
        'user', 
        'total_payable_toman', 
        'payment_status_badge',
        'payment_method_display',
        'created_at_formatted'
    )
    list_filter = ('payment_status', 'payment_method', 'created_at')
    search_fields = ('tracking_code', 'user__phone_number', 'transaction_id')
    readonly_fields = ('tracking_code', 'shipping_cost', 'total_payable', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    inlines = [JobInline, ChatMessageInline]
    
    actions = [
        'mark_as_paid',
        'mark_as_unpaid',
        'mark_as_refunded'
    ]

    fieldsets = (
        ('۱. مشخصات کلی سیستم فاکتور', {
            'fields': ('tracking_code', 'user', 'created_at', 'updated_at'),
        }),
        ('۲. آدرس و اطلاعات پستی مشتری (مشابه ووکامرس)', {
            'fields': ('shipping_city', 'shipping_address', 'postal_code'),
        }),
        ('۳. تسویه حساب و درگاه پرداخت (مشابه ووکامرس)', {
            'fields': ('payment_status', 'payment_method', 'transaction_id', 'shipping_cost', 'total_payable'),
        }),
    )

    def tracking_code_styled(self, obj):
        return format_html('<span style="font-family: monospace; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px;">{}</span>', obj.tracking_code)
    tracking_code_styled.short_description = "کد رهگیری فاکتور"

    def total_payable_toman(self, obj):
        return format_html('<span style="font-weight: bold; color: #16a34a;">{:,} تومان</span>', obj.total_payable)
    total_payable_toman.short_description = "کل فاکتور با کرایه"

    def payment_method_display(self, obj):
        return dict(Order.PAYMENT_METHOD_CHOICES).get(obj.payment_method, obj.payment_method)
    payment_method_display.short_description = "درگاه پرداخت"

    def payment_status_badge(self, obj):
        colors = {
            'unpaid': ('#fee2e2', '#dc2626', 'پرداخت نشده'),
            'paid': ('#dcfce7', '#15803d', 'پرداخت شده و موفق'),
            'failed': ('#f3f4f6', '#4b5563', 'پرداخت ناموفق'),
            'refunded': ('#fef3c7', '#d97706', 'مرجوع شده'),
        }
        bg, text, label = colors.get(obj.payment_status, ('#f3f4f6', '#4b5563', obj.payment_status))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            bg, text, label
        )
    payment_status_badge.short_description = "تسویه حساب"

    def created_at_formatted(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")
    created_at_formatted.short_description = "تاریخ ثبت فاکتور"

    def mark_as_paid(self, request, queryset):
        queryset.update(payment_status='paid')
        self.message_user(request, "فاکتورهای انتخاب شده به عنوان پرداخت موفق علامت‌گذاری شدند.")
    mark_as_paid.short_description = "تسویه فاکتور: پرداخت شده و موفق"

    def mark_as_unpaid(self, request, queryset):
        queryset.update(payment_status='unpaid')
        self.message_user(request, "فاکتورهای انتخاب شده به عنوان پرداخت نشده علامت‌گذاری شدند.")
    mark_as_unpaid.short_description = "تسویه فاکتور: پرداخت نشده"

    def mark_as_refunded(self, request, queryset):
        queryset.update(payment_status='refunded')
        self.message_user(request, "فاکتورهای انتخاب شده به عنوان مرجوع شده علامت‌گذاری شدند.")
    mark_as_refunded.short_description = "تسویه فاکتور: مرجوع شده (Refunded)"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # ۱. مجموع کل درآمدهای تسویه شده (موفق)
        paid_earnings = Order.objects.filter(payment_status='paid').aggregate(total=Sum('total_payable'))['total'] or 0
        extra_context['paid_earnings'] = f"{paid_earnings:,} تومان"
        
        # ۲. مجموع هزینه خام ملزومات کارهای تسویه شده
        paid_costs = Job.objects.filter(order__payment_status='paid').aggregate(total=Sum('production_cost'))['total'] or 0
        paid_costs_formatted = f"{paid_costs:,} تومان"
        
        # ۳. مجموع سود خالص چاپخانه از کارهای موفق
        paid_net_profit = Job.objects.filter(order__payment_status='paid').aggregate(total=Sum('net_profit'))['total'] or 0
        extra_context['paid_net_profit'] = f"{paid_net_profit:,} تومان"
        
        pending_count = Job.objects.filter(order__payment_status='paid', status='created').count()
        
        admin_notice = format_html(
            '<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; padding: 22px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); border-right: 5px solid #10b981;">'
            '  <div style="text-align: center;">'
            '    <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #94a3b8; font-weight: normal;">💰 کل فروش ناخالص (تسویه شده)</h4>'
            '    <span style="font-size: 24px; font-weight: bold; color: #38bdf8;">{}</span>'
            '  </div>'
            '  <div style="width: 1px; height: 50px; background: #334155;"></div>'
            '  <div style="text-align: center;">'
            '    <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #94a3b8; font-weight: normal;">📉 هزینه خام کاغذ و ملزومات کارها</h4>'
            '    <span style="font-size: 24px; font-weight: bold; color: #f87171;">{}</span>'
            '  </div>'
            '  <div style="width: 1px; height: 50px; background: #334155;"></div>'
            '  <div style="text-align: center;">'
            '    <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #38bdf8; font-weight: normal;">💵 سود خالص چاپخانه (Paid Net Profit)</h4>'
            '    <span style="font-size: 24px; font-weight: bold; color: #4ade80;">{}</span>'
            '  </div>'
            '  <div style="width: 1px; height: 50px; background: #334155;"></div>'
            '  <div style="text-align: center;">'
            '    <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #94a3b8; font-weight: normal;">📥 کارهای جدید منتظر بررسی</h4>'
            '    <span style="font-size: 24px; font-weight: bold; color: #fbbf24;">{} کار تولیدی</span>'
            '  </div>'
            '</div>',
            extra_context['paid_earnings'],
            paid_costs_formatted,
            extra_context['paid_net_profit'],
            pending_count
        )
        extra_context['admin_notice'] = admin_notice
        
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """مدل ادمین صف تولید کارگاهی (Job Queue Management)"""
    list_display = (
        'id', 
        'order_link', 
        'product', 
        'quantity', 
        'estimated_price_toman', 
        'net_profit_toman',
        'status', 
        'assigned_designer', 
        'assigned_supplier'
    )
    list_filter = ('status', 'product', 'is_sample_pack')
    search_fields = ('id', 'order__tracking_code', 'customer_name', 'customer_phone')
    list_editable = ('status', 'assigned_designer', 'assigned_supplier')
    readonly_fields = ('estimated_price', 'production_cost', 'net_profit')
    filter_horizontal = ('assigned_resources',)

    def order_link(self, obj):
        return format_html(
            '<a href="/admin/orders/order/{}/change/" style="font-weight: bold; color: #0284c7;">{}</a>',
            obj.order.id, obj.order.tracking_code
        )
    order_link.short_description = "سفارش مالی"

    def estimated_price_toman(self, obj):
        return f"{obj.estimated_price:,} تومان"
    estimated_price_toman.short_description = "قیمت کار"

    def net_profit_toman(self, obj):
        color = "#10b981" if obj.net_profit > 0 else "#ef4444"
        return format_html('<span style="font-weight: bold; color: {};">{:,} تومان</span>', color, obj.net_profit)
    net_profit_toman.short_description = "سود خالص کار"


@admin.register(SMSNotificationLog)
class SMSNotificationLogAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'message_text_preview', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('phone_number', 'message_text')
    readonly_fields = ('phone_number', 'message_text', 'status', 'created_at')

    def message_text_preview(self, obj):
        return obj.message_text[:60] + "..." if len(obj.message_text) > 60 else obj.message_text
    message_text_preview.short_description = "متن پیامک"


@admin.register(DraftOrder)
class DraftOrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'product_id', 'current_step', 'updated_at')
    list_filter = ('product_id', 'updated_at')
    search_fields = ('user__phone_number', 'product_id')


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'address_type', 'city', 'is_default')
    list_filter = ('address_type', 'city', 'is_default')
    search_fields = ('user__phone_number', 'title', 'address')


class CompanyContactInline(admin.TabularInline):
    """مدیریت چند مخاطب در حساب‌های سازمانی حقوقی (B2B Contacts)"""
    model = CompanyContact
    extra = 1
    fields = ('name', 'position', 'phone', 'email')


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'registration_number', 'tax_id')
    search_fields = ('company_name', 'user__phone_number', 'registration_number', 'tax_id')
    inlines = [CompanyContactInline]


class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 1
    fields = ('sender', 'message', 'attachment', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'subject', 'department', 'priority', 'status', 'updated_at')
    list_filter = ('department', 'priority', 'status', 'updated_at')
    list_editable = ('status', 'priority')
    search_fields = ('id', 'user__phone_number', 'subject')
    inlines = [TicketReplyInline]


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__phone_number', 'title', 'description')


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    """مدیریت جامع پرونده ۳۶۰ درجه و سیستم وفاداری مشتریان (CRM)"""
    list_display = (
        'customer_code_styled', 
        'user', 
        'is_vip', 
        'score_styled', 
        'credit_limit_toman', 
        'health_status', 
        'is_active'
    )
    list_filter = ('is_vip', 'health_status', 'loyalty_level')
    list_editable = ('is_vip', 'health_status')
    search_fields = ('customer_code', 'user__phone_number', 'user__full_name', 'tags', 'internal_notes')
    readonly_fields = ('customer_code', 'created_at', 'updated_at')

    def customer_code_styled(self, obj):
        return format_html('<strong style="font-family: monospace; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">{}</strong>', obj.customer_code)
    customer_code_styled.short_description = "کد مشتری"

    def score_styled(self, obj):
        color = "#10b981" if obj.score >= 80 else "#f59e0b" if obj.score >= 50 else "#ef4444"
        return format_html('<strong style="color: {};">{} / ۱۰۰</strong>', color, obj.score)
    score_styled.short_description = "امتیاز وفاداری"

    def credit_limit_toman(self, obj):
        return f"{obj.credit_limit:,} تومان"
    credit_limit_toman.short_description = "اعتبار B2B"


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    """ثبت هزینه‌های جاری کارگاه و ملزومات چاپخانه"""
    list_display = ('expense_type', 'amount_formatted', 'created_at', 'description')
    list_filter = ('expense_type', 'created_at')
    search_fields = ('description',)

    def amount_formatted(self, obj):
        return format_html('<span style="font-weight: bold; color: #ef4444;">-{:,} تومان</span>', obj.amount)
    amount_formatted.short_description = "مبلغ هزینه"


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """مدیریت ممیزی و تسویه مرجوعی وجه مشتریان"""
    list_display = ('order', 'amount_formatted', 'status', 'operator', 'created_at')
    list_filter = ('status', 'created_at')
    list_editable = ('status',)
    search_fields = ('order__tracking_code', 'reason', 'operator__phone_number')

    def amount_formatted(self, obj):
        return f"{obj.amount:,} تومان"
    amount_formatted.short_description = "مبلغ استرداد"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    """مدیریت موتور تخفیف هوشمند چاپخانه"""
    list_display = ('code', 'discount_formatted', 'minimum_amount_formatted', 'max_discount_formatted', 'usages_bar', 'expiration_date')
    search_fields = ('code',)

    def discount_formatted(self, obj):
        return f"{obj.discount_amount}{'٪' if obj.is_percentage else ' تومان'}"
    discount_formatted.short_description = "میزان تخفیف"

    def minimum_amount_formatted(self, obj):
        return f"{obj.minimum_amount:,} تومان"
    minimum_amount_formatted.short_description = "حداقل خرید"

    def max_discount_formatted(self, obj):
        return f"{obj.max_discount:,} تومان"
    max_discount_formatted.short_description = "سقف تخفیف"

    def usages_bar(self, obj):
        return f"{obj.used_count} از {obj.max_usages} مصرف"
    usages_bar.short_description = "تعداد مصرف"


# ==========================================================================
#     ثبت جدول‌های منابع و اتوماسیون فاز ششم در پنل ادمین (Business Engine)
# ==========================================================================

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    """مدیریت پویای ظرفیت منابع چاپی و شیفت‌های کارگاهی"""
    list_display = ('name', 'resource_type', 'capacity_hours', 'used_hours', 'is_active')
    list_filter = ('resource_type', 'is_active')
    search_fields = ('name',)
    list_editable = ('is_active',)


@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
    """ثبت قوانین بدون برنامه‌نویسی اتوماسیون (Rule Builder)"""
    list_display = ('title', 'trigger_event', 'action_type', 'is_active')
    list_filter = ('trigger_event', 'action_type', 'is_active')
    search_fields = ('title', 'action_payload')
    list_editable = ('is_active',)


@admin.register(AutomationLog)
class AutomationLogAdmin(admin.ModelAdmin):
    """لاگ‌های اودیت و اجرای کارهای اتوماتیک کارگاهی"""
    list_display = ('rule', 'status', 'created_at', 'details')
    list_filter = ('status', 'created_at')
    readonly_fields = ('rule', 'status', 'details', 'created_at')


# ==========================================================================
#     ثبت جدول‌های ویزارد پویای فاز هفتم در پنل ادمین (Dynamic Wizard)
# ==========================================================================

class WizardStepInline(admin.TabularInline):
    """ثبت مراحل درون ویزارد به صورت اینلاین"""
    model = WizardStep
    extra = 1
    fields = ('title', 'order_index')


class WizardFieldInline(admin.TabularInline):
    model = WizardField
    extra = 1
    fields = ('name', 'label', 'field_type', 'options_json', 'is_required', 'order_index')


@admin.register(Wizard)
class WizardAdmin(admin.ModelAdmin):
    """مدیریت ویزاردهای پویای چاپی فاز هفتم"""
    list_display = ('name', 'product', 'version', 'is_active', 'created_at')
    list_filter = ('is_active', 'product')
    search_fields = ('name',)
    list_editable = ('is_active',)
    inlines = [WizardStepInline]


@admin.register(WizardStep)
class WizardStepAdmin(admin.ModelAdmin):
    list_display = ('title', 'wizard', 'order_index')
    list_filter = ('wizard',)
    list_editable = ('order_index',)
    inlines = [WizardFieldInline]


@admin.register(WizardField)
class WizardFieldAdmin(admin.ModelAdmin):
    list_display = ('label', 'step', 'field_type', 'is_required', 'order_index')
    list_filter = ('field_type', 'is_required', 'step__wizard')
    search_fields = ('label', 'name')
    list_editable = ('order_index', 'is_required')


@admin.register(WizardConditionalRule)
class WizardConditionalRuleAdmin(admin.ModelAdmin):
    """مدیریت پویای موتور منطق شرطی و کالیبراسیون قیمت"""
    list_display = ('wizard', 'source_field_name', 'value', 'target_field_name', 'action', 'price_factor')
    list_filter = ('action', 'wizard')
    search_fields = ('source_field_name', 'target_field_name', 'value')
    list_editable = ('price_factor',)
