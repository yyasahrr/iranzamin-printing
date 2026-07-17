from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Product, Finish, Order, CallbackRequest, PortfolioProject
from .serializers import (
    ProductSerializer,
    FinishSerializer,
    OrderReadSerializer,
    OrderWriteSerializer,
    PriceEstimationSerializer,
    CallbackRequestSerializer,
    PortfolioProjectListSerializer,
    PortfolioProjectDetailSerializer
)
import random

class ProductListView(generics.ListAPIView):
    """لیست محصولات فعال برای ویزارد سفارش"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class FinishListView(generics.ListAPIView):
    """لیست خدمات تکمیلی فعال برای ویزارد سفارش"""
    queryset = Finish.objects.filter(is_active=True)
    serializer_class = FinishSerializer
    permission_classes = [AllowAny]


class PriceEstimationView(APIView):
    """
    برآورد زنده قیمت سفارش بر اساس اطلاعات ارسال شده
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PriceEstimationSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.validated_data['product_id']
            quantity = serializer.validated_data['quantity']
            print_side = serializer.validated_data['print_side']
            finishes_list = serializer.validated_data.get('finishes', [])
            
            finish_factor = sum([f.factor for f in finishes_list])
            side_factor = 1.16 if print_side == "دو رو رنگی" else 1.0
            
            price = product.unit_price * quantity * (1.0 + finish_factor) * side_factor
            estimated_price = int(round(price / 10000.0) * 10000)
            
            return Response({
                "product_id": product.id,
                "quantity": quantity,
                "estimated_price": estimated_price
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderListCreateView(APIView):
    """
    ثبت سفارش جدید (توسط هر کاربر) و دریافت لیست سفارشات (توسط کاربر لاگین شده)
    """
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        user = request.user
        orders = Order.objects.filter(user=user) | Order.objects.filter(customer_phone=user.phone_number)
        orders = orders.distinct()
        
        serializer = OrderReadSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OrderWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            
            response_serializer = OrderReadSerializer(order)
            return Response({
                "success": True,
                "message": "سفارش شما با موفقیت ثبت شد.",
                "order": response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CallbackRequestCreateView(generics.CreateAPIView):
    """ثبت درخواست مشاوره و تماس همکاران بخش سازمان‌ها"""
    queryset = CallbackRequest.objects.all()
    serializer_class = CallbackRequestSerializer
    permission_classes = [AllowAny]


class PortfolioProjectListView(generics.ListAPIView):
    """دریافت لیست نمونه کارهای منتشر شده"""
    queryset = PortfolioProject.objects.filter(is_published=True)
    serializer_class = PortfolioProjectListSerializer
    permission_classes = [AllowAny]


class PortfolioProjectDetailView(generics.RetrieveAPIView):
    """دریافت اطلاعات کامل یک نمونه کار بر اساس اسلاگ متنی"""
    queryset = PortfolioProject.objects.filter(is_published=True)
    serializer_class = PortfolioProjectDetailSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class PaymentSimulationView(APIView):
    """
    شبیه‌ساز پرداخت آنلاین برای آماده‌سازی اتصال به درگاه واقعی (زرین‌پال / سداد)
    مشتری درخواست پرداخت سفارش می‌دهد و پس از شبیه‌سازی، سفارش به وضعیت پرداخت شده منتقل می‌شود.
    """
    permission_classes = [AllowAny] # در درگاه واقعی باید احراز هویت یا اعتبارسنجی صورت گیرد

    def post(self, request, tracking_code):
        try:
            order = Order.objects.get(tracking_code=tracking_code)
        except Order.DoesNotExist:
            return Response({
                "success": False,
                "message": "سفارش با کد رهگیری وارد شده یافت نشد."
            }, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == 'paid':
            return Response({
                "success": True,
                "message": "این سفارش قبلاً پرداخت شده است.",
                "transaction_id": order.transaction_id
            }, status=status.HTTP_200_OK)

        # شبیه‌سازی اتصال به درگاه بانک و دریافت کد پیگیری موفق
        ref_id = f"ZP-{random.randint(10000000, 99999999)}"
        
        # بروزرسانی وضعیت پرداخت و تسویه حساب مشابه ووکامرس
        order.payment_status = 'paid'
        order.transaction_id = ref_id
        order.status = 'processing' # ارجاع به بخش طراحی/آماده‌سازی به دلیل پرداخت موفق
        order.save()

        # در آینده برای درگاه واقعی زرین‌پال:
        # ۱. ابتدا درخواست پرداخت به زرین‌پال ارسال می‌شود (Request)
        # ۲. کاربر به درگاه بانک هدایت می‌شود (Redirect)
        # ۳. بانک پاسخ را به کال‌بک ما برمی‌گرداند و ما آن را با متد Verify تایید نهایی می‌کنیم.

        return Response({
            "success": True,
            "message": "پرداخت شبیه‌سازی شده با موفقیت انجام شد.",
            "tracking_code": order.tracking_code,
            "amount_paid": order.estimated_price,
            "transaction_id": ref_id,
            "payment_status": "paid",
            "order_status": "processing"
        }, status=status.HTTP_200_OK)
