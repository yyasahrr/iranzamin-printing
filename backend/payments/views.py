from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import redirect
from .models import Gateway, Invoice, Payment, PaymentAttempt, RefundTransaction, PaymentLog
from .serializers import (
    GatewaySerializer,
    InvoiceSerializer,
    PaymentSerializer,
    PaymentAttemptSerializer,
    RefundTransactionSerializer
)
from .services import PaymentService


class InvoiceListView(generics.ListAPIView):
    """لیست کامل فاکتورهای صادر شده برای کاربر جاری"""
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(order__user=self.request.user)


class PaymentListView(generics.ListAPIView):
    """تاریخچه تمام تراکنش‌های پرداخت کاربر جاری"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(invoice__order__user=self.request.user)


class PaymentInitiateView(APIView):
    """
    آغاز پروسه تسویه حساب فاکتور (Redirect to Gateway)
    دریافت شناسه فاکتور و نام درگاه پرداخت و هدایت کاربر به بانک
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        invoice_id = request.data.get("invoice_id")
        gateway_name = request.data.get("gateway", "sandbox")

        if not invoice_id:
            return Response({"success": False, "message": "شناسه فاکتور الزامی است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # کلاینت هدرهای امنیتی
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
            agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
            
            authority = PaymentService.initiate_payment(
                invoice_id=invoice_id,
                gateway_name=gateway_name,
                request_user=request.user,
                ip=ip,
                agent=agent
            )

            # درگاه Sandbox بلافاصله آدرس تایید را بازمی‌گرداند
            # در درگاه واقعی، کاربر به آدرس درگاه زرین‌پال هدایت (Redirect) می‌شود
            redirect_url = f"http://localhost:8000/api/payments/callback/?payment_id={Invoice.objects.get(pk=invoice_id).payments.first().id}&Authority={authority}"

            return Response({
                "success": True,
                "authority": authority,
                "redirect_url": redirect_url,
                "message": "تراکنش آغاز شد."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentCallbackView(APIView):
    """
    کال‌بک درگاه بانکی (Callback Handler)
    اعتبارسنجی تراکنش، بستن فاکتور مالی و انتقال کارهای سفارش به صف تولید کارگاه
    """
    permission_classes = [AllowAny]

    def get(self, request):
        authority = request.GET.get("Authority")
        payment_id = request.GET.get("payment_id")

        if not authority or not payment_id:
            return redirect("http://localhost:5173/profile?payment_status=failed")

        try:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
            agent = request.META.get('HTTP_USER_AGENT', 'Unknown')

            success, payment = PaymentService.verify_callback(
                authority=authority,
                payment_id=int(payment_id),
                ip=ip,
                agent=agent
            )

            if success:
                # انتقال کاربر به صفحه پروفایل فرانت‌اند با پیام موفقیت
                return redirect(f"http://localhost:5173/profile?payment_status=success&ref_id={payment.attempts.first().transaction_id}")
            else:
                return redirect("http://localhost:5173/profile?payment_status=failed")

        except Exception as e:
            logger.error(f"Error handling payment callback: {str(e)}")
            return redirect("http://localhost:5173/profile?payment_status=failed")


class RefundRequestView(APIView):
    """ثبت درخواست استرداد وجه برای یک فاکتور پرداخت شده"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        amount = request.data.get("amount")
        reason = request.data.get("reason", "")

        if not payment_id or not amount:
            return Response({"success": False, "message": "شناسه پرداخت و مبلغ الزامی است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(pk=payment_id, invoice__order__user=request.user)
            
            refund = RefundTransaction.objects.create(
                payment=payment,
                amount=int(amount),
                reason=reason,
                status='requested'
            )

            serializer = RefundTransactionSerializer(refund)
            return Response({
                "success": True,
                "message": "درخواست استرداد وجه شما ثبت شد و در صف ممیزی مالی قرار گرفت.",
                "refund": serializer.data
            }, status=status.HTTP_201_CREATED)

        except Payment.DoesNotExist:
            return Response({"success": False, "message": "تراکنش پرداخت معتبر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
