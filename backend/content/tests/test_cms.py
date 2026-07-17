from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from content.models import Category, Tag, MediaFile, Post, Page, FAQ

User = get_user_model()


class CMSEngineTestCase(TestCase):
    """
    مجموعه تست‌های جامع پلتفرم تولید محتوا و وبلاگ (Content CMS Engine)
    مطابق با مفاد بخش تست‌های PRD فاز یازدهم
    """

    def setUp(self):
        # ایجاد کاربر ادمین نمونه
        self.admin_user = User.objects.create_superuser(
            phone_number="09121111111",
            full_name="سرپرست وبلاگ",
            status="active"
        )

        # ایجاد دسته‌بندی و برچسب
        self.category = Category.objects.create(
            name="آموزش طراحی گرافیک",
            slug="design-tutorials",
            description="راهنماهای کاربردی کالیبره برش و ابعاد"
        )
        self.tag = Tag.objects.create(
            name="کارت ویزیت",
            slug="business-card"
        )

        # تعریف تصویر شاخص تستی در مدیا لایبرری
        self.media = MediaFile.objects.create(
            file="media_library/test_cover.jpg",
            file_type="image",
            file_size=10240
        )

    def test_blog_post_crud(self):
        """تست ۱: ایجاد، خواندن، ویرایش و ممیزی مقالات وبلاگ (Blog CRUD)"""
        # ایجاد مقاله (Create)
        post = Post.objects.create(
            title="راهنمای کامل حاشیه امن خط برش",
            slug="complete-bleed-safe-zone-guide",
            summary="یاد بگیرید چطور از بریده شدن متون خود در برش جلوگیری کنید...",
            content="متن اصلی مقاله پیرامون حاشیه‌های ۳ میلی‌متری کاغذ...",
            category=self.category,
            featured_image=self.media,
            status="published",
            reading_time=6
        )
        post.tags.add(self.tag)

        self.assertEqual(Post.objects.count(), 1)
        self.assertEqual(post.status, "published")
        self.assertEqual(post.reading_time, 6)
        self.assertIn(self.tag, post.tags.all())

        # خواندن و افزایش خودکار شمارنده بازدید (Read & Track view_count)
        post.view_count += 1
        post.save()
        self.assertEqual(post.view_count, 1)

    def test_seo_tags_on_pages(self):
        """تست ۲: ثبت و تایید فیلدهای سئو پیشرفته (SEO Meta Title/Description)"""
        page = Page.objects.create(
            title="قوانین و مقررات چاپخانه",
            slug="terms-and-conditions",
            content="متن قوانین چاپی...",
            page_type="static",
            status="published",
            meta_title="قوانین سفارش آنلاین چاپ روشن | ایران زمین",
            meta_description="شرح کامل قوانین خط برش، تیراژ و مرجوعی‌های فاکتور رسمی چاپخانه"
        )

        self.assertEqual(page.version, 1)
        self.assertEqual(page.meta_title, "قوانین سفارش آنلاین چاپ روشن | ایران زمین")
        self.assertTrue(len(page.meta_description) > 10)

    def test_search_posts_and_faq(self):
        """تست ۳: ممیزی و تست مکانیزم سرور برای موتور سرچ مرکزی (Global Search)"""
        # ایجاد سوال متداول
        faq = FAQ.objects.create(
            question="حداقل تیراژ کارت ویزیت چقدر است؟",
            answer="حداقل تیراژ برای کارهای فرم عمومی ۱۰۰ عدد می‌باشد.",
            order_index=1
        )

        # شبیه‌سازی سرچ کلمات متداول
        query = "تیراژ"
        faq_results = FAQ.objects.filter(question__icontains=query)
        self.assertEqual(faq_results.count(), 1)
        self.assertEqual(faq_results.first(), faq)
