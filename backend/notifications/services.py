import re
import logging
from django.utils import timezone
from .models import NotificationTemplate, NotificationQueue, NotificationPreference
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationService:
    """موتور پردازش، کامپایل و ارسال خودکار اعلانات و پیامک‌ها (Notification & Communication Engine)"""

    @classmethod
    def compile_template(cls, body: str, variables: dict) -> str:
        """جایگذاری متغیرها در بدنه الگو با استفاده از ریجکس (Template Compiler)"""
        compiled_body = body
        for key, value in variables.items():
            placeholder = f"{{{{{key}}}}}"
            compiled_body = compiled_body.replace(placeholder, str(value))
        return compiled_body

    @classmethod
    def queue_notification(cls, user_id: int, template_name: str, variables: dict) -> NotificationQueue | None:
        """کامپایل طرح و قرار دادن اعلان در صف ارسال (Queue System)"""
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} not found. Cannot queue notification.")
            return None

        try:
            template = NotificationTemplate.objects.get(name=template_name, is_active=True)
        except NotificationTemplate.DoesNotExist:
            logger.error(f"NotificationTemplate with name '{template_name}' not found or inactive.")
            return None

        # بررسی تنظیمات شخصی کاربر (Preferences Validation)
        prefs = NotificationPreference.get_for_user(user)
        if template.channel == 'email' and not prefs.receive_email:
            logger.info(f"User {user.phone_number} opted out of email notifications. Skipping.")
            return None
        if template.channel == 'sms' and not prefs.receive_sms:
            logger.info(f"User {user.phone_number} opted out of SMS notifications. Skipping.")
            return None

        # تعیین آدرس گیرنده
        recipient = user.email if template.channel == 'email' else user.phone_number
        if not recipient:
            logger.warning(f"User {user.phone_number} does not have valid {template.channel} address. Skipping.")
            return None

        # کامپایل بدنه متن پیامک/ایمیل
        compiled_body = cls.compile_template(template.body, variables)
        compiled_subject = cls.compile_template(template.subject, variables) if template.subject else ""

        # ایجاد رکورد صف ارسال
        notification = NotificationQueue.objects.create(
            user=user,
            template=template,
            channel=template.channel,
            recipient=recipient,
            subject=compiled_subject,
            body=compiled_body,
            status='pending'
        )

        logger.info(f"Notification queued: ID {notification.id} - Channel: {template.channel}")
        
        # در فاز دمو فورا ارسال را شبیه‌سازی می‌کنیم
        cls.send_notification(notification)
        
        return notification

    @classmethod
    def send_notification(cls, notification: NotificationQueue) -> bool:
        """ارسال واقعی یا شبیه‌سازی شده تراکنش پیامک/ایمیل با مکانیزم بازتلاش (Retry System)"""
        notification.status = 'processing'
        notification.save(update_fields=['status'])

        try:
            # شبیه‌سازی موفقیت ارسال وب‌سرویس‌ها
            # در پروژه واقعی:
            # if notification.channel == 'email': send_mail(notification.subject, ...)
            # if notification.channel == 'sms': kavenegar.send(...)
            
            logger.info(f"Sending {notification.channel} to {notification.recipient}...")
            
            # تراکنش با موفقیت به اتمام رسید
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save(update_fields=['status', 'sent_at'])
            return True

        except Exception as e:
            # مکانیزم بازتلاش خودکار (Retry logic with configurable attempts)
            notification.retry_count += 1
            notification.error_log = str(e)
            
            if notification.retry_count < notification.max_retries:
                notification.status = 'retry'
                logger.warning(f"Failed sending ID {notification.id}. Retrying ({notification.retry_count}/{notification.max_retries}). Error: {str(e)}")
            else:
                notification.status = 'failed'
                logger.error(f"Notification ID {notification.id} failed permanently after {notification.retry_count} retries. Error: {str(e)}")
            
            notification.save(update_fields=['status', 'retry_count', 'error_log'])
            return False

    @classmethod
    def retry_failed_notifications(cls):
        """بازتلاش جمعی اعلانات ناموفق صف (Scheduled/Tasks helper)"""
        failed_queued = NotificationQueue.objects.filter(status__in=['failed', 'retry'])
        logger.info(f"Attempting batch retry on {failed_queued.count()} failed notifications.")
        for item in failed_queued:
            cls.send_notification(item)
