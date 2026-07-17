from rest_framework import serializers
from .models import Product, Finish, Order, CallbackRequest, PortfolioProject, PortfolioImage
from django.contrib.auth import get_user_model

User = get_user_model()

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'category', 'description', 'unit_price', 'delivery_days', 'is_active']


class FinishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finish
        fields = ['id', 'label', 'factor', 'is_active']


class OrderReadSerializer(serializers.ModelSerializer):
    """سریالایزر برای خواندن اطلاعات سفارش با جزئیات کامل مشابه ووکامرس"""
    product = ProductSerializer(read_only=True)
    finishes = FinishSerializer(many=True, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    id = serializers.CharField(source='tracking_code', read_only=True)
    details = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    fileName = serializers.CharField(source='file_name_display', read_only=True)
    estimatedPrice = serializers.IntegerField(source='estimated_price', read_only=True)
    paymentStatus = serializers.CharField(source='payment_status', read_only=True)
    paymentMethod = serializers.CharField(source='payment_method', read_only=True)
    transactionId = serializers.CharField(source='transaction_id', read_only=True)
    shippingCity = serializers.CharField(source='shipping_city', read_only=True)
    shippingAddress = serializers.CharField(source='shipping_address', read_only=True)
    postalCode = serializers.CharField(source='postal_code', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'product', 
            'details', 
            'customer', 
            'fileName', 
            'estimatedPrice', 
            'status', 
            'paymentStatus',
            'paymentMethod',
            'transactionId',
            'shippingCity',
            'shippingAddress',
            'postalCode',
            'createdAt'
        ]

    def get_details(self, obj):
        return {
            "quantity": obj.quantity,
            "material": obj.material,
            "size": obj.size,
            "printSide": obj.print_side,
            "finishes": [f.id for f in obj.finishes.all()]
        }

    def get_customer(self, obj):
        return {
            "name": obj.customer_name,
            "phone": obj.customer_phone,
            "note": obj.customer_note
        }


class OrderWriteSerializer(serializers.ModelSerializer):
    """سریالایزر برای ایجاد سفارش جدید از طرف فرانت‌اند (ویزارد) با آدرس و ارسال"""
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    finishes = serializers.PrimaryKeyRelatedField(queryset=Finish.objects.filter(is_active=True), many=True, required=False)
    quantity = serializers.IntegerField(required=True)
    material = serializers.CharField(max_length=100, required=True)
    size = serializers.CharField(max_length=100, required=True)
    print_side = serializers.CharField(max_length=100, required=True)
    
    customer_name = serializers.CharField(max_length=100, required=True)
    customer_phone = serializers.CharField(max_length=11, required=True)
    customer_note = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    file = serializers.FileField(required=False, allow_null=True)
    file_name_display = serializers.CharField(max_length=255, required=False, allow_blank=True)

    # اطلاعات آدرس و ارسال (مشابه ووکامرس)
    shipping_city = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default='online')

    class Meta:
        model = Order
        fields = [
            'product', 
            'finishes', 
            'quantity', 
            'material', 
            'size', 
            'print_side', 
            'file', 
            'file_name_display',
            'customer_name', 
            'customer_phone', 
            'customer_note',
            'shipping_city',
            'shipping_address',
            'postal_code',
            'payment_method'
        ]

    def validate_customer_phone(self, value):
        import re
        if not re.match(r'^09\d{9}$', value):
            raise serializers.ValidationError("شماره موبایل نامعتبر است.")
        return value

    def create(self, validated_data):
        finishes_data = validated_data.pop('finishes', [])
        
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        if not user:
            phone = validated_data.get('customer_phone')
            user_exist = User.objects.filter(phone_number=phone).first()
            if user_exist:
                user = user_exist
                
        order = Order.objects.create(user=user, **validated_data)
        
        if finishes_data:
            order.finishes.set(finishes_data)
            
        order.recalculate_price()
        order.save()
        
        return order


class PriceEstimationSerializer(serializers.Serializer):
    """سریالایزر برای محاسبه قیمت زنده در بک‌اند"""
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    quantity = serializers.IntegerField(min_value=1)
    print_side = serializers.CharField(max_length=100)
    finishes = serializers.PrimaryKeyRelatedField(queryset=Finish.objects.filter(is_active=True), many=True, required=False)


class CallbackRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallbackRequest
        fields = ['id', 'name', 'org', 'phone', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ['id', 'image', 'order_index']


class PortfolioProjectListSerializer(serializers.ModelSerializer):
    """سریالایزر سبک برای نمایش کلی نمونه کارها در کارت‌های صفحه اصلی"""
    class Meta:
        model = PortfolioProject
        fields = ['slug', 'title', 'client', 'category', 'cover_image']


class PortfolioProjectDetailSerializer(serializers.ModelSerializer):
    """سریالایزر جامع برای نمایش کامل یک نمونه کار به همراه اسلایدر تصاویر گالری"""
    gallery_images = PortfolioImageSerializer(many=True, read_only=True)
    testimonial = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioProject
        fields = [
            'slug', 
            'title', 
            'client', 
            'category', 
            'description', 
            'cover_image', 
            'testimonial', 
            'gallery_images',
            'created_at'
        ]

    def get_testimonial(self, obj):
        if obj.testimonial_text:
            return {
                "text": obj.testimonial_text,
                "author": obj.testimonial_author,
                "role": obj.testimonial_role
            }
        return None
