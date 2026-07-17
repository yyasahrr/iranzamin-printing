from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import OTPRequest
from .serializers import (
    UserSerializer, 
    OTPRequestSerializer, 
    OTPVerifySerializer
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class OTPRequestView(APIView):
    """
    درخواست ارسال کد یکبار مصرف (OTP)
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            
            # ایجاد کد OTP در دیتابیس
            otp_obj = OTPRequest.generate_otp(phone_number)
            
            # در یک پروژه واقعی، اینجا پیامک فرستاده می‌شود.
            # برای راحتی تست و دمو، کد را در پاسخ برمی‌گردانیم و در لاگ چاپ می‌کنیم.
            logger.info(f"OTP Code generated for {phone_number}: {otp_obj.code}")
            
            return Response({
                "success": True,
                "message": "کد تایید ارسال شد.",
                "demo_code": otp_obj.code, # برای دمو و راحتی تست
                "expires_in_seconds": 180
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPVerifyView(APIView):
    """
    تایید کد OTP و ورود/ثبت‌نام کاربر
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']
            
            # پیدا کردن آخرین درخواست معتبر و استفاده نشده
            otp_req = OTPRequest.objects.filter(
                phone_number=phone_number,
                code=code,
                is_used=False
            ).first()
            
            if not otp_req or not otp_req.is_valid():
                return Response({
                    "success": False,
                    "message": "کد وارد شده نامعتبر یا منقضی شده است."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # علامت‌گذاری به عنوان استفاده شده
            otp_req.is_used = True
            otp_req.save()
            
            # پیدا کردن یا ثبت نام کاربر جدید با این شماره موبایل
            user, created = User.objects.get_or_create(
                phone_number=phone_number,
                defaults={
                    'username': phone_number,
                    'full_name': '',
                    'is_active': True
                }
            )
            
            # ایجاد یا دریافت توکن احراز هویت
            token, _ = Token.objects.get_or_create(user=user)
            
            user_serializer = UserSerializer(user)
            
            return Response({
                "success": True,
                "token": token.key,
                "user": user_serializer.data,
                "is_new_user": created,
                "message": "ورود با موفقیت انجام شد."
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    دریافت و ویرایش اطلاعات پروفایل کاربر لاگین شده
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "پروفایل با موفقیت بروزرسانی شد.",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
