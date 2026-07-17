from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """سریالایزر اطلاعات کامل کاربر"""
    name = serializers.CharField(source='full_name', allow_blank=True)
    phone = serializers.CharField(source='phone_number', read_only=True)
    registeredAt = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'phone', 'email', 'registeredAt']
        read_only_fields = ['id', 'phone', 'registeredAt']


class OTPRequestSerializer(serializers.Serializer):
    """سریالایزر درخواست ارسال کد تایید"""
    phone_number = serializers.CharField(max_length=11)

    def validate_phone_number(self, value):
        # بررسی فرمت صحیح شماره موبایل ایران
        import re
        if not re.match(r'^09\d{9}$', value):
            raise serializers.ValidationError("شماره موبایل نامعتبر است. فرمت صحیح: 09123456789")
        return value


class OTPVerifySerializer(serializers.Serializer):
    """سریالایزر تایید کد یکبار مصرف"""
    phone_number = serializers.CharField(max_length=11)
    code = serializers.CharField(max_length=6)

    def validate_phone_number(self, value):
        import re
        if not re.match(r'^09\d{9}$', value):
            raise serializers.ValidationError("شماره موبایل نامعتبر است.")
        return value
