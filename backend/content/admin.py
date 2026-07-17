from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Tag, MediaFile, Post, Page, FAQ, Comment, Course, Lesson


class LessonInline(admin.TabularInline):
    """مدیریت دروس هر سرفصل آکادمی به صورت اینلاین"""
    model = Lesson
    extra = 1
    fields = ('title', 'order_index')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ('preview_tag', 'file_name', 'file_type', 'file_size_kb', 'usage_count')
    list_filter = ('file_type',)
    search_fields = ('file',)
    readonly_fields = ('file_size', 'usage_count')

    def file_name(self, obj):
        return obj.file.name.split('/')[-1]
    file_name.short_description = "نام فایل"

    def file_size_kb(self, obj):
        return f"{round(obj.file_size / 1024, 2)} KB"
    file_size_kb.short_description = "حجم فایل"

    def preview_tag(self, obj):
        if obj.file_type == 'image' and obj.file:
            return format_html('<img src="{}" style="width: 45px; height: 35px; border-radius: 4px; object-fit: cover;" />', obj.file.url)
        return format_html('<div style="width: 45px; height: 35px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #475569;">{}</div>', obj.file_type.upper())
    preview_tag.short_description = "پیش‌نمایش"


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """مدیریت مقالات وبلاگ چاپی"""
    list_display = ('title', 'category', 'status', 'publish_date', 'view_count', 'reading_time', 'preview_img')
    list_filter = ('status', 'category', 'publish_date')
    search_fields = ('title', 'content', 'summary')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('status', 'reading_time')
    filter_horizontal = ('tags',)

    def preview_img(self, obj):
        if obj.featured_image and obj.featured_image.file:
            return format_html('<img src="{}" style="width: 45px; height: 35px; border-radius: 4px; object-fit: cover;" />', obj.featured_image.file.url)
        return "بدون عکس"
    preview_img.short_description = "تصویر شاخص"


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    """مدیریت صفحات ایستای قانونی و صفحات فرود"""
    list_display = ('title', 'slug', 'page_type', 'status', 'version')
    list_filter = ('page_type', 'status')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('status',)


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    """مدیریت ممیزی پرسش و پاسخ‌های متداول"""
    list_display = ('question', 'order_index')
    list_editable = ('order_index',)
    search_fields = ('question', 'answer')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """مدیریت دوره‌های آموزشی آکادمی"""
    list_display = ('title', 'instructor', 'lessons_count')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [LessonInline]

    def lessons_count(self, obj):
        return f"{obj.lessons.count()} درس"
    lessons_count.short_description = "تعداد کل دروس"
