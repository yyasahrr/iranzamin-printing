from rest_framework import serializers
from .models import NotificationTemplate, NotificationQueue, NotificationPreference


class NotificationTemplateSerializer(serializers.ModelSerializer):
    channelDisplay = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = ['id', 'uuid', 'name', 'title', 'channel', 'channelDisplay', 'subject', 'body', 'is_active']


class NotificationQueueSerializer(serializers.ModelSerializer):
    template = NotificationTemplateSerializer(read_only=True)
    statusDisplay = serializers.CharField(source='get_status_display', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = NotificationQueue
        fields = [
            'id', 
            'uuid', 
            'template', 
            'channel', 
            'recipient', 
            'subject', 
            'body', 
            'status', 
            'statusDisplay', 
            'is_read', 
            'is_archived', 
            'createdAt', 
            'sent_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'receive_email', 
            'receive_sms', 
            'receive_marketing', 
            'receive_system_alerts', 
            'receive_promotions'
        ]
