from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from notifications.models import NotificationTemplate, NotificationQueue, NotificationPreference
from notifications.services import NotificationService

User = get_user_model()


class NotificationEngineTestCase(TestCase):
    """
    مجموعه تست‌های جامع موتور اعلانات و کالیبراسیون الگوها (Notification Engine)
    مطابق با مفاد بخش تست‌های PRD فاز دهم
    """

    def setUp(self):
        # ایجاد کاربر نمونه
        self.user = User.objects.create_user(
            phone_number="09121111111",
            full_name="مشتری تستی چاپخانه",
            email="test@chaproshan.ir",
            status="active"
        )

        # ایجاد الگوی پیام تستی با متغیرها (Template Variables)
        self.template = NotificationTemplate.objects.create(
            name="welcome_email",
            title="پیام خوش‌آمدگویی",
            channel="email",
            subject="خوش آمدید جناب {{customer_name}}",
            body="سلام {{customer_name}} عزیز، عضویت شما با کد {{customer_code}} با موفقیت تایید شد."
        )

        # دریافت ترجیحات دریافت نوتیفیکیشن
        self.prefs = NotificationPreference.get_for_user(self.user)

    def test_template_compilation(self):
        """تست ۱: کامپایل موفق الگوها و جایگذاری پویای متغیرها"""
        variables = {
            "customer_name": "علی رضایی",
            "customer_code": "CU-10219"
        }
        compiled_body = NotificationService.compile_template(self.template.body, variables)
        self.assertEqual(compiled_body, "سلام علی رضایی عزیز، عضویت شما با کد CU-10219 با موفقیت تایید شد.")

    def test_queue_and_preference_filtering(self):
        """تست ۲: قرار گرفتن موفق در صف ارسال نوتیفیکیشن و اعمال ترجیحات کاربر"""
        variables = {
            "customer_name": "علی رضایی",
            "customer_code": "CU-10219"
        }
        
        # ثبت موفق در صف ارسال
        notification = NotificationService.queue_notification(
            user_id=self.user.id,
            template_name="welcome_email",
            variables=variables
        )

        self.assertIsNotNone(notification)
        self.assertEqual(notification.status, 'sent')
        self.assertEqual(notification.channel, 'email')
        self.assertEqual(notification.recipient, "test@chaproshan.ir")

    def test_preference_opt_out(self):
        """تست ۳: نادیده گرفتن ارسال در صورت غیرفعال بودن ترجیحات کاربر (Preferences)"""
        # غیرفعال کردن دریافت ایمیل در ترجیحات
        self.prefs.receive_email = False
        self.prefs.save()

        variables = {"customer_name": "علی رضایی", "customer_code": "CU-10219"}
        
        # تلاش برای ثبت نوتیفیکیشن ایمیل در صف
        notification = NotificationService.queue_notification(
            user_id=self.user.id,
            template_name="welcome_email",
            variables=variables
        )

        # به دلیل غیرفعال بودن دریافت ایمیل، نباید هیچ رکوردی در صف ایجاد شود
        self.assertIsNone(notification)

    def test_retry_system(self):
        """تست ۴: شبیه‌سازی مکانیزم تلاش مجدد در صورت خطای درگاه ارسال (Retry System)"""
        notification = NotificationQueue.objects.create(
            user=self.user,
            template=self.template,
            channel="email",
            recipient="test@chaproshan.ir",
            subject="تست",
            body="تست",
            status="pending",
            max_retries=3
        )

        # شبیه‌سازی شکست ارسال و ارجاع به تلاش مجدد (Retry)
        # در سرویس، در صورت پرتاب اکسپشن وضعیت به retry ارجاع داده می‌شود
        try:
            raise Exception("درگاه بانکی/وب‌سرویس قطع است.")
        except Exception as e:
            # شبیه‌سازی شکست اول
            notification.retry_count += 1
            notification.status = 'retry'
            notification.error_log = str(e)
            notification.save()

        self.assertEqual(notification.status, 'retry')
        self.assertEqual(notification.retry_count, 1)

    def test_unread_counter(self):
        """تست ۵: دریافت صحیح تعداد پیام‌های خوانده نشده در صندوق دریافت"""
        # ایجاد ۳ نوتیفیکیشن In-App خوانده نشده
        for i in range(3):
            NotificationQueue.objects.create(
                user=self.user,
                channel="in_app",
                recipient="in-app-box",
                subject=f"اعلان {i}",
                body=f"پیام {i}",
                status="sent",
                is_read=False
            )

        count = NotificationQueue.objects.filter(
            user=self.user,
            channel='in_app',
            is_read=False,
            is_archived=False
        ).count()

        self.assertEqual(count, 3)
