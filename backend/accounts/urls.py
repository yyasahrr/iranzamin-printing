from django.urls import path
from .views import OTPRequestView, OTPVerifyView, UserProfileView

urlpatterns = [
    path('otp/request/', OTPRequestView.as_view(), name='otp_request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]
