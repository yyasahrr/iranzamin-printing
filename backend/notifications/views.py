from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NotificationTemplate, NotificationQueue, NotificationPreference
from .serializers import (
    NotificationTemplateSerializer,
    NotificationQueueSerializer,
    NotificationPreferenceSerializer
)


class NotificationListView(generics.ListAPIView):
    """دریافت صندوق اعلان‌های درون‌برنامه‌ای کاربر جاری (Notification Center)"""
    serializer_class = NotificationQueueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # فقط اعلان‌های In-App که آرشیو نشده‌اند را برمی‌گرداند
        return NotificationQueue.objects.filter(
            user=self.request.user,
            channel='in_app',
            is_archived=False
        )


class NotificationUnreadCountView(APIView):
    """دریافت تعداد اعلان‌های خوانده نشده کاربر (Unread Counter)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationQueue.objects.filter(
            user=request.user,
            channel='in_app',
            is_read=False,
            is_archived=False
        ).count()
        return Response({"success": True, "unread_count": count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """علامت‌گذاری اعلان به عنوان خوانده شده یا آرشیو و حذف"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get("notification_id")
        action = request.data.get("action", "read") # read, archive, delete

        if not notification_id:
            return Response({"success": False, "message": "شناسه اعلان الزامی است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            notification = NotificationQueue.objects.get(pk=notification_id, user=request.user)
            
            if action == "read":
                notification.is_read = True
                notification.save(update_fields=['is_read'])
                message = "اعلان با موفقیت خوانده شد."
            elif action == "archive":
                notification.is_archived = True
                notification.save(update_fields=['is_archived'])
                message = "اعلان با موفقیت بایگانی شد."
            elif action == "delete":
                notification.delete()
                message = "اعلان با موفقیت حذف گردید."
            else:
                return Response({"success": False, "message": "اکشن نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"success": True, "message": message}, status=status.HTTP_200_OK)

        except NotificationQueue.DoesNotExist:
            return Response({"success": False, "message": "اعلان معتبر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)


class NotificationPreferenceView(APIView):
    """دریافت و بروزرسانی ترجیحات دریافت اعلان کاربر (Preferences)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs = NotificationPreference.get_for_user(request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        prefs = NotificationPreference.get_for_user(request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "تنظیمات دریافت نوتیفیکیشن با موفقیت بروزرسانی شد.",
                "preferences": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationTemplateListView(generics.ListAPIView):
    """لیست الگوهای پیام‌ها و اعلانات فعال سیستمی"""
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]
