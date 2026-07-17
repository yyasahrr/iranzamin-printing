from django.urls import path
from .views import (
    NotificationListView,
    NotificationUnreadCountView,
    NotificationMarkReadView,
    NotificationPreferenceView,
    NotificationTemplateListView
)

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification_list'),
    path('unread/count/', NotificationUnreadCountView.as_view(), name='notification_unread_count'),
    path('mark/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('preferences/', NotificationPreferenceView.as_view(), name='notification_preferences'),
    path('templates/', NotificationTemplateListView.as_view(), name='notification_templates'),
]
