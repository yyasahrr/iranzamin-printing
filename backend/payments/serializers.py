from rest_framework import serializers
from .models import Gateway, Invoice, Payment, PaymentAttempt, RefundTransaction
from orders.serializers import OrderReadSerializer


class GatewaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Gateway
        fields = ['id', 'uuid', 'name', 'title', 'is_active']


class InvoiceSerializer(serializers.ModelSerializer):
    order = OrderReadSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    issueDate = serializers.DateTimeField(source='issue_date', read_only=True)
    dueDate = serializers.DateTimeField(source='due_date', read_only=True)
    invoiceNumber = serializers.CharField(source='invoice_number', read_only=True)
    grandTotal = serializers.IntegerField(source='grand_total', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 
            'uuid', 
            'invoiceNumber', 
            'order', 
            'subtotal', 
            'tax', 
            'discount', 
            'shipping', 
            'grandTotal', 
            'status', 
            'status_display', 
            'issueDate', 
            'dueDate'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    invoice = InvoiceSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 
            'uuid', 
            'invoice', 
            'amount', 
            'payment_method', 
            'status', 
            'status_display', 
            'createdAt'
        ]


class PaymentAttemptSerializer(serializers.ModelSerializer):
    gateway = GatewaySerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PaymentAttempt
        fields = [
            'id', 
            'uuid', 
            'payment', 
            'gateway', 
            'authority', 
            'amount', 
            'status', 
            'status_display', 
            'transaction_id'
        ]


class RefundTransactionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_amount = serializers.IntegerField(source='payment.amount', read_only=True)

    class Meta:
        model = RefundTransaction
        fields = [
            'id', 
            'uuid', 
            'payment', 
            'payment_amount', 
            'amount', 
            'reason', 
            'status', 
            'status_display'
        ]
        read_only_fields = ['id', 'uuid', 'status', 'status_display']
