from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from orders.models import Product, Finish, PortfolioProject, PortfolioImage, GlobalConfiguration
import urllib.request
import io

class Command(BaseCommand):
    help = 'ایجاد محصولات، خدمات تکمیلی، پیکربندی عمومی و نمونه کارها برای سامانه چاپ روشن'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('شروع فرآیند ایجاد داده‌های اولیه واقعی...'))

        # ۰. ایجاد پیکربندی عمومی فرمول محاسبات مالی و حمل و نقل
        config, created = GlobalConfiguration.objects.get_or_create(
            is_active=True,
            defaults={
                "title": "تنظیمات پیش‌فرض چاپخانه روشن",
                "double_side_factor": 1.16,
                "rounding_threshold": 10000,
                "vat_percentage": 0,
                "base_shipping_cost": 50000,
                "free_shipping_threshold": 3000000,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('تنظیمات عمومی محاسبات مالی و هزینه حمل و نقل با موفقیت ست شد.'))
        else:
            config.double_side_factor = 1.16
            config.rounding_threshold = 10000
            config.base_shipping_cost = 50000
            config.free_shipping_threshold = 3000000
            config.save()
            self.stdout.write(self.style.SUCCESS('تنظیمات عمومی محاسبات مالی بروزرسانی شد.'))

        # ۱. تعریف محصولات چاپی (مشابه تعرفه‌های ویزارد)
        initial_products = [
            {
                "id": "business-card",
                "title": "کارت ویزیت",
                "category": "stationary",
                "description": "افست، دیجیتال و کارت‌های خاص سلفون و لمینت",
                "unit_price": 4200,
                "delivery_days": 3
            },
            {
                "id": "catalog",
                "title": "کاتالوگ و بروشور",
                "category": "stationary",
                "description": "چاپ دقیق چند صفحه‌ای با صحافی چسب‌گرم و مفتول",
                "unit_price": 16800,
                "delivery_days": 7
            },
            {
                "id": "packaging",
                "title": "بسته‌بندی",
                "category": "packaging",
                "description": "جعبه، کارتن لمینتی و بسته‌بندی‌های کادویی سازمانی",
                "unit_price": 34500,
                "delivery_days": 10
            },
            {
                "id": "sticker",
                "title": "لیبل و استیکر",
                "category": "label",
                "description": "ضدآب، شیشه‌ای، سلفون براق و مات با برش نیم‌تیغ",
                "unit_price": 5800,
                "delivery_days": 2
            },
            {
                "id": "poster",
                "title": "پوستر و تراکت",
                "category": "advertising",
                "description": "چاپ تیراژ بالا، کاغذ گلاسه و تحریر با بهترین کیفیت افست",
                "unit_price": 7600,
                "delivery_days": 4
            },
            {
                "id": "custom",
                "title": "سفارش اختصاصی",
                "category": "other",
                "description": "برای محصولاتی که قالب یا متریال کاملا منحصربه‌فرد دارند",
                "unit_price": 12000,
                "delivery_days": 5
            }
        ]

        # ۲. تعریف خدمات تکمیلی چاپی (تعرفه‌ها)
        initial_finishes = [
            {
                "id": "matte",
                "label": "روکش مات",
                "factor": 0.12
            },
            {
                "id": "uv",
                "label": "یووی موضعی",
                "factor": 0.20
            },
            {
                "id": "foil",
                "label": "طلاکوب",
                "factor": 0.28
            },
            {
                "id": "emboss",
                "label": "برجسته‌سازی",
                "factor": 0.24
            }
        ]

        # ایجاد/بروزرسانی محصولات
        for prod_data in initial_products:
            product, created = Product.objects.get_or_create(
                id=prod_data["id"],
                defaults={
                    "title": prod_data["title"],
                    "category": prod_data["category"],
                    "description": prod_data["description"],
                    "unit_price": prod_data["unit_price"],
                    "delivery_days": prod_data["delivery_days"],
                    "is_active": True
                }
            )
            if not created:
                product.title = prod_data["title"]
                product.category = prod_data["category"]
                product.description = prod_data["description"]
                product.unit_price = prod_data["unit_price"]
                product.delivery_days = prod_data["delivery_days"]
                product.save()
            self.stdout.write(self.style.SUCCESS(f'محصول "{product.title}" ست شد.'))

        # ایجاد/بروزرسانی خدمات تکمیلی
        for finish_data in initial_finishes:
            finish, created = Finish.objects.get_or_create(
                id=finish_data["id"],
                defaults={
                    "label": finish_data["label"],
                    "factor": finish_data["factor"],
                    "is_active": True
                }
            )
            if not created:
                finish.label = finish_data["label"]
                finish.factor = finish_data["factor"]
                finish.save()
            self.stdout.write(self.style.SUCCESS(f'خدمت تکمیلی "{finish.label}" ست شد.'))


        # ۳. تعریف و ایجاد نمونه‌کارهای گالری (Portfolio)
        initial_portfolios = [
            {
                "slug": "cafe-rost",
                "title": "هویت چاپی کافه رُست",
                "client": "کافه رست",
                "category": "هویت بصری و ملزومات",
                "description": "برای کافه رُست، مجموعه کاملی از ملزومات چاپی هویت برند شامل منو، کارت ویزیت، لیبل محصولات و پاکت‌های کاغذی طراحی و چاپ شد. انتخاب کاغذ کرافت با بافت طبیعی، رنگ‌های گرم سفالی و مرکب تیره، حس صمیمی و خاکی کافه را در هر قطعه چاپی انعکاس می‌دهد. تمام ملزومات با چاپ افست تک‌رنگ و طلاکوب موضعی برای ایجاد عمق بصری اجرا شده است.",
                "testimonial_text": "کیفیت چاپ و دقت در اجرای جزئیات فراتر از انتظار بود. مشتری‌های کافه از منوهای جدید تعریف می‌کنند.",
                "testimonial_author": "علی رضایی",
                "testimonial_role": "مدیر کافه رست",
            },
            {
                "slug": "avishan-packaging",
                "title": "بسته‌بندی آویشن",
                "client": "آویشن (برند محصولات طبیعی)",
                "category": "جعبه و لیبل محصول",
                "description": "بسته‌بندی محصولات آویشن با هدف نمایش اصالت و طبیعی بودن محصول طراحی شد. از کاغذ کرافت با دستمال کاغذی بازیافتی، لیبل‌های چاپ دیجیتال با مرکب سبز زیتونی و جعبه‌های با روکش مات استفاده شده است. چاپ افست جعبه‌ها در تیراژ ۲۰۰۰ عددی انجام شد و لیبل‌ها با چاپ دیجیتال برای امکان شخصی‌سازی هر محصول چاپ شدند.",
                "testimonial_text": "بسته‌بندی‌های جدید فروش ما را ۳۵٪ افزایش داد. مشتری‌ها از ظاهر محصول تعریف می‌کنند.",
                "testimonial_author": "مریم حیدری",
                "testimonial_role": "مدیر برند آویشن",
            },
            {
                "slug": "foram-nov-catalog",
                "title": "کاتالوگ فرم نو",
                "client": "فرم نو (دفتر معماری)",
                "category": "چاپ و صحافی کاتالوگ",
                "description": "کاتالوگ پروژه‌های فرم نو با ۴۸ صفحه تمام رنگی، کاغذ گلاسه مات ۱۵ص صفحه داخلی و جلد سخت گالینگور چاپ شد. طراحی گرافیک با الهام از معماری مدرن، خطوط تمیز، فضاهای سفید گسترده و تایپوگرافی ساده دارد. جلد سخت با پارچه‌کشی و طلاکوب داغ، حس حرفه‌ای و ماندگاری را منتقل می‌کند.",
                "testimonial_text": "کاتالوگ ما در نمایشگاه معماری پاریس بسیار تحسین شد. کیفیت چاپ و صحافی در سطح بین‌المللی بود.",
                "testimonial_author": "امیر کاظمی",
                "testimonial_role": "معمار ارشد فرم نو",
            }
        ]

        dummy_image = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'

        for pf_data in initial_portfolios:
            project, created = PortfolioProject.objects.get_or_create(
                slug=pf_data["slug"],
                defaults={
                    "title": pf_data["title"],
                    "client": pf_data["client"],
                    "category": pf_data["category"],
                    "description": pf_data["description"],
                    "testimonial_text": pf_data["testimonial_text"],
                    "testimonial_author": pf_data["testimonial_author"],
                    "testimonial_role": pf_data["testimonial_role"],
                    "is_published": True
                }
            )
            
            if not project.cover_image:
                project.cover_image.save(f"{pf_data['slug']}_cover.gif", ContentFile(dummy_image))
            
            if not created:
                project.title = pf_data["title"]
                project.client = pf_data["client"]
                project.category = pf_data["category"]
                project.description = pf_data["description"]
                project.testimonial_text = pf_data["testimonial_text"]
                project.testimonial_author = pf_data["testimonial_author"]
                project.testimonial_role = pf_data["testimonial_role"]
                project.save()

            if project.gallery_images.count() == 0:
                for i in range(1, 3):
                    gal_img = PortfolioImage(project=project, order_index=i)
                    gal_img.image.save(f"{pf_data['slug']}_gal_{i}.gif", ContentFile(dummy_image))
                    gal_img.save()

            self.stdout.write(self.style.SUCCESS(f'نمونه کار چاپی "{project.title}" به همراه گالری تصاویر با موفقیت در دیتابیس منتشر شد.'))

        self.stdout.write(self.style.SUCCESS('کل داده‌های پایه چاپی، تعرفه‌ها، تنظیمات عمومی و نمونه‌کارها با موفقیت در دیتابیس ثبت شدند!'))
